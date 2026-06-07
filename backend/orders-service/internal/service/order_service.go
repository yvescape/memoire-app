package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"orders-service/internal/models"
	"orders-service/internal/repository"
	"os"
	"time"
)

type OrderService struct {
	repo            repository.OrderRepo
	productsBaseURL string
}

func NewOrderService(repo repository.OrderRepo) *OrderService {
	url := os.Getenv("PRODUCTS_SERVICE_URL")
	if url == "" {
		url = "http://products:8002"
	}
	return &OrderService{repo: repo, productsBaseURL: url}
}

type productData struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Image string  `json:"image"`
	Size  string  `json:"size"`
}

// fetchProduct calls products-service and returns product details.
func (s *OrderService) fetchProduct(productID uint) (*productData, error) {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/%d/", s.productsBaseURL, productID))
	if err != nil {
		return nil, errors.New("products service unavailable")
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, errors.New("product not found")
	}
	if resp.StatusCode != http.StatusOK {
		io.Copy(io.Discard, resp.Body)
		return nil, errors.New("products service error")
	}
	var p productData
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, errors.New("failed to decode product")
	}
	return &p, nil
}

// --- Orders ---

func (s *OrderService) GetOrders(userID *uint, sessionID *string) ([]models.Order, error) {
	if userID != nil {
		return s.repo.FindByUserID(*userID)
	}
	if sessionID != nil {
		return s.repo.FindBySessionID(*sessionID)
	}
	return nil, errors.New("user_id or session_id required")
}

func (s *OrderService) GetOrder(id uint) (*models.Order, error) {
	order, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.Pricing == nil && len(order.Items) > 0 {
		if err := s.repo.RecalcPricing(order.ID); err != nil {
			log.Printf("RecalcPricing on load error for order %d: %v", order.ID, err)
		} else {
			order, err = s.repo.FindByID(id)
			if err != nil {
				return nil, errors.New("order not found")
			}
		}
	}
	return order, nil
}

func (s *OrderService) ConfirmOrder(id uint) (*models.Order, error) {
	order, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.Status != models.StatusPending {
		return nil, errors.New("only pending orders can be confirmed")
	}
	if len(order.Items) == 0 {
		return nil, errors.New("order has no items")
	}
	if order.Address == nil {
		return nil, errors.New("delivery address required")
	}
	if order.Address.FirstName == "" || order.Address.LastName == "" || order.Address.Mobile == "" {
		return nil, errors.New("address is incomplete")
	}
	if err := s.repo.UpdateStatus(id, models.StatusConfirmed); err != nil {
		return nil, err
	}
	order.Status = models.StatusConfirmed
	return order, nil
}

func (s *OrderService) CancelOrder(id uint) error {
	order, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("order not found")
	}
	if order.Status == models.StatusCancelled {
		return errors.New("order already cancelled")
	}
	return s.repo.UpdateStatus(id, models.StatusCancelled)
}

func (s *OrderService) ClaimGuestOrders(sessionID string, userID uint) error {
	return s.repo.ClaimGuestOrders(sessionID, userID)
}

func (s *OrderService) CartCount(userID *uint, sessionID *string) (int64, error) {
	return s.repo.CountCartItems(userID, sessionID)
}

// --- Items ---

type AddItemInput struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity"`
	SessionID *string `json:"session_id"`
}

func (s *OrderService) AddItem(userID *uint, input AddItemInput) (*models.OrderItem, error) {
	if input.Quantity < 1 {
		input.Quantity = 1
	}

	product, err := s.fetchProduct(input.ProductID)
	if err != nil {
		return nil, err
	}

	order, err := s.repo.FindCartOrder(userID, input.SessionID)
	if err != nil {
		order = &models.Order{
			UserID:    userID,
			SessionID: input.SessionID,
			Status:    models.StatusPending,
		}
		if err := s.repo.Create(order); err != nil {
			return nil, err
		}
	}

	existing, err := s.repo.FindItemByProductAndOrder(input.ProductID, order.ID)
	if err == nil {
		existing.Quantity += input.Quantity
		existing.Total = existing.Price * float64(existing.Quantity)
		if err := s.repo.SaveItem(existing); err != nil {
			return nil, err
		}
		if err := s.repo.RecalcPricing(order.ID); err != nil {
			log.Printf("RecalcPricing error for order %d: %v", order.ID, err)
		}
		return existing, nil
	}

	item := &models.OrderItem{
		OrderID:      order.ID,
		ProductID:    input.ProductID,
		ProductName:  product.Name,
		ProductImage: product.Image,
		ProductSize:  product.Size,
		Price:        product.Price,
		Quantity:     input.Quantity,
		Total:        product.Price * float64(input.Quantity),
	}
	if err := s.repo.SaveItem(item); err != nil {
		return nil, err
	}
	if err := s.repo.RecalcPricing(order.ID); err != nil {
		log.Printf("RecalcPricing error for order %d: %v", order.ID, err)
	}
	return item, nil
}

func (s *OrderService) GetCartItems(userID *uint, sessionID *string) ([]models.OrderItem, error) {
	order, err := s.repo.FindCartOrder(userID, sessionID)
	if err != nil {
		return []models.OrderItem{}, nil
	}
	return order.Items, nil
}

func (s *OrderService) UpdateItemQuantity(itemID uint, action string) (*models.OrderItem, error) {
	item, err := s.repo.FindItemByID(itemID)
	if err != nil {
		return nil, errors.New("item not found")
	}
	switch action {
	case "increment":
		item.Quantity++
	case "decrement":
		item.Quantity--
	default:
		return nil, errors.New("action must be increment or decrement")
	}
	if item.Quantity <= 0 {
		_ = s.repo.DeleteItem(itemID)
		order, _ := s.repo.FindByID(item.OrderID)
		if order != nil && len(order.Items) <= 1 {
			s.repo.Save(order)
		}
		if err := s.repo.RecalcPricing(item.OrderID); err != nil {
			log.Printf("RecalcPricing error for order %d: %v", item.OrderID, err)
		}
		return nil, nil
	}
	item.Total = item.Price * float64(item.Quantity)
	if err := s.repo.SaveItem(item); err != nil {
		return nil, err
	}
	if err := s.repo.RecalcPricing(item.OrderID); err != nil {
		log.Printf("RecalcPricing error for order %d: %v", item.OrderID, err)
	}
	return item, nil
}

func (s *OrderService) DeleteItem(itemID uint) error {
	item, err := s.repo.FindItemByID(itemID)
	if err != nil {
		return errors.New("item not found")
	}
	orderID := item.OrderID
	if err := s.repo.DeleteItem(itemID); err != nil {
		return err
	}
	if err := s.repo.RecalcPricing(orderID); err != nil {
		log.Printf("RecalcPricing error for order %d: %v", orderID, err)
	}
	return nil
}

type CartCheckResult struct {
	InCart   bool  `json:"in_cart"`
	Quantity int   `json:"quantity"`
	ItemID   *uint `json:"item_id"`
}

func (s *OrderService) CheckProductInCart(productID uint, userID *uint, sessionID *string) CartCheckResult {
	order, err := s.repo.FindCartOrder(userID, sessionID)
	if err != nil {
		return CartCheckResult{}
	}
	item, err := s.repo.FindItemByProductAndOrder(productID, order.ID)
	if err != nil {
		return CartCheckResult{}
	}
	return CartCheckResult{InCart: true, Quantity: item.Quantity, ItemID: &item.ID}
}

// --- Address ---

type AddressInput struct {
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	Email       string `json:"email"`
	Mobile      string `json:"mobile" binding:"required"`
	City        string `json:"city" binding:"required"`
	AddressLine string `json:"address_line"`
	SessionID   *string `json:"session_id"`
}

func (s *OrderService) SaveAddress(userID *uint, input AddressInput) (*models.OrderAddress, error) {
	order, err := s.repo.FindCartOrder(userID, input.SessionID)
	if err != nil {
		return nil, errors.New("no active cart found")
	}
	addr := order.Address
	if addr == nil {
		addr = &models.OrderAddress{OrderID: order.ID}
	}
	addr.FirstName = input.FirstName
	addr.LastName = input.LastName
	addr.Email = input.Email
	addr.Mobile = input.Mobile
	addr.City = input.City
	addr.AddressLine = input.AddressLine
	if err := s.repo.SaveAddress(addr); err != nil {
		return nil, err
	}
	return addr, nil
}

// --- Address ---

func (s *OrderService) GetAddressByID(id uint) (*models.OrderAddress, error) {
	return s.repo.FindAddressByID(id)
}

func (s *OrderService) DeleteAddress(id uint) error {
	return s.repo.DeleteAddress(id)
}

// --- Cart item ---

func (s *OrderService) GetCartItemByID(itemID uint) (*models.OrderItem, error) {
	return s.repo.FindItemByID(itemID)
}

// --- Delivery options ---

func (s *OrderService) GetDeliveryOptions() ([]models.DeliveryOption, error) {
	return s.repo.FindActiveDeliveryOptions()
}

func (s *OrderService) GetAllDeliveryOptions() ([]models.DeliveryOption, error) {
	return s.repo.FindAllDeliveryOptions()
}

func (s *OrderService) GetDeliveryOption(id uint) (*models.DeliveryOption, error) {
	return s.repo.FindDeliveryByID(id)
}

type DeliveryOptionInput struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount" binding:"required"`
	Currency    string  `json:"currency"`
	Position    int     `json:"position"`
	IsActive    bool    `json:"is_active"`
	IsDefault   bool    `json:"is_default"`
}

func (s *OrderService) CreateDeliveryOption(input DeliveryOptionInput) (*models.DeliveryOption, error) {
	currency := input.Currency
	if currency == "" {
		currency = "XOF"
	}
	opt := &models.DeliveryOption{
		Name:        input.Name,
		Description: input.Description,
		Amount:      input.Amount,
		Currency:    currency,
		Position:    input.Position,
		IsActive:    input.IsActive,
		IsDefault:   input.IsDefault,
	}
	if err := s.repo.CreateDeliveryOption(opt); err != nil {
		return nil, err
	}
	return opt, nil
}

func (s *OrderService) UpdateDeliveryOptionAdmin(id uint, input DeliveryOptionInput) (*models.DeliveryOption, error) {
	opt, err := s.repo.FindDeliveryByID(id)
	if err != nil {
		return nil, errors.New("delivery option not found")
	}
	opt.Name = input.Name
	opt.Description = input.Description
	opt.Amount = input.Amount
	if input.Currency != "" {
		opt.Currency = input.Currency
	}
	opt.Position = input.Position
	opt.IsActive = input.IsActive
	opt.IsDefault = input.IsDefault
	if err := s.repo.UpdateDeliveryOption(opt); err != nil {
		return nil, err
	}
	return opt, nil
}

func (s *OrderService) DeleteDeliveryOption(id uint) error {
	if _, err := s.repo.FindDeliveryByID(id); err != nil {
		return errors.New("delivery option not found")
	}
	return s.repo.DeleteDeliveryOption(id)
}

// --- Pricing ---

func (s *OrderService) GetPricing(orderID uint) (*models.OrderPricing, error) {
	order, err := s.repo.FindByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}
	return order.Pricing, nil
}

func (s *OrderService) UpdateDeliveryOption(orderID, deliveryID uint) (*models.OrderPricing, error) {
	delivery, err := s.repo.FindDeliveryByID(deliveryID)
	if err != nil {
		return nil, errors.New("delivery option not found")
	}
	order, err := s.repo.FindByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.Pricing == nil {
		if err := s.repo.RecalcPricing(orderID); err != nil {
			return nil, errors.New("failed to initialize pricing")
		}
		order, err = s.repo.FindByID(orderID)
		if err != nil {
			return nil, errors.New("order not found")
		}
	}
	pricing := order.Pricing
	if pricing == nil {
		pricing = &models.OrderPricing{OrderID: orderID, Currency: "FCFA"}
	}
	pricing.DeliveryOptionID = &delivery.ID
	pricing.DeliveryOption = delivery
	pricing.DeliveryPrice = delivery.Amount
	pricing.Total = pricing.Subtotal + delivery.Amount
	if err := s.repo.SavePricing(pricing); err != nil {
		return nil, err
	}
	return pricing, nil
}

// --- Internal (called by payments-service) ---

func (s *OrderService) InternalConfirm(orderID uint) error {
	return s.repo.UpdateStatus(orderID, models.StatusConfirmed)
}

func (s *OrderService) InternalCancel(orderID uint) error {
	return s.repo.UpdateStatus(orderID, models.StatusCancelled)
}
