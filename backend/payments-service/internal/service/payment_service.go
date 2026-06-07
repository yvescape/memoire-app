package service

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"payments-service/internal/models"
	"payments-service/internal/repository"
	"strings"
	"time"
)

type PaymentService struct {
	repo           repository.PaymentRepo
	ordersBaseURL  string
	internalToken  string
}

func NewPaymentService(repo repository.PaymentRepo) *PaymentService {
	url := os.Getenv("ORDERS_SERVICE_URL")
	if url == "" {
		url = "http://orders:8003"
	}
	return &PaymentService{
		repo:          repo,
		ordersBaseURL: url,
		internalToken: os.Getenv("INTERNAL_SERVICE_TOKEN"),
	}
}

type PaymentInput struct {
	OrderPricingID uint    `json:"order_pricing_id" binding:"required"`
	OrderID        uint    `json:"order_id" binding:"required"`
	Amount         float64 `json:"amount" binding:"required"`
	Currency       string  `json:"currency"`
	CardNumber     string  `json:"card_number" binding:"required"`
	CardHolder     string  `json:"card_holder" binding:"required"`
	ExpirationDate string  `json:"expiration_date" binding:"required"`
	CVV            string  `json:"cvv" binding:"required"`
	SaveCard       bool    `json:"save_card"`
}

func (s *PaymentService) ProcessPayment(input PaymentInput, userID *uint) (*models.Payment, error) {
	currency := input.Currency
	if currency == "" {
		currency = "FCFA"
	}

	status := models.PaymentFailed
	if models.SimulateCardValidation(input.CardNumber) {
		status = models.PaymentSuccess
	}

	payment := &models.Payment{
		OrderPricingID:       input.OrderPricingID,
		OrderID:              input.OrderID,
		Amount:               input.Amount,
		Currency:             currency,
		Status:               status,
		TransactionReference: models.GenerateTransactionRef(),
	}

	if err := s.repo.Create(payment); err != nil {
		return nil, err
	}

	if status == models.PaymentSuccess {
		if err := s.notifyOrdersConfirm(input.OrderID); err != nil {
			payment.Status = models.PaymentFailed
			_ = s.repo.Create(payment)
			return nil, errors.New("payment recorded but order confirmation failed")
		}
		if input.SaveCard && userID != nil {
			card := &models.SavedPrepaidCard{
				UserID:         *userID,
				CardHolder:     input.CardHolder,
				MaskedNumber:   models.MaskCardNumber(input.CardNumber),
				ExpirationDate: input.ExpirationDate,
			}
			_ = s.repo.SaveCard(card)
		}
	}

	return payment, nil
}

func (s *PaymentService) notifyOrdersConfirm(orderID uint) error {
	url := fmt.Sprintf("%s/internal/%d/confirm/", s.ordersBaseURL, orderID)
	req, err := http.NewRequest(http.MethodPatch, url, strings.NewReader("{}"))
	if err != nil {
		return err
	}
	req.Header.Set("X-Internal-Token", s.internalToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("orders service returned %d", resp.StatusCode)
	}
	return nil
}

func (s *PaymentService) GetPayment(ref string) (*models.Payment, error) {
	return s.repo.FindByTransactionRef(ref)
}

func (s *PaymentService) ListPayments(pricingID *uint) ([]models.Payment, error) {
	if pricingID != nil {
		return s.repo.FindByOrderPricingID(*pricingID)
	}
	return s.repo.FindAll()
}

func (s *PaymentService) GetSavedCards(userID uint) ([]models.SavedPrepaidCard, error) {
	return s.repo.FindCardsByUser(userID)
}

func (s *PaymentService) DeleteCard(cardID, userID uint) error {
	return s.repo.DeleteCard(cardID, userID)
}
