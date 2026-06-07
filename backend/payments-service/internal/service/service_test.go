package service_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"payments-service/internal/models"
	"payments-service/internal/service"
	"payments-service/internal/testutil"
)

// invalidCard: not 16 digits — triggers PaymentFailed without calling orders service.
const invalidCard = "1234"

// validCard: exactly 16 digits — triggers PaymentSuccess + notifyOrdersConfirm.
const validCard = "1234567890123456"

func TestProcessPayment_FailedCard(t *testing.T) {
	mock := &testutil.MockPaymentRepo{}
	svc := service.NewPaymentService(mock)
	input := service.PaymentInput{
		OrderPricingID: 1,
		OrderID:        1,
		Amount:         5000,
		CardNumber:     invalidCard,
		CardHolder:     "Alice",
		ExpirationDate: "12/26",
		CVV:            "123",
	}
	payment, err := svc.ProcessPayment(input, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if payment.Status != models.PaymentFailed {
		t.Errorf("expected PaymentFailed, got %s", payment.Status)
	}
}

func TestProcessPayment_SuccessCard(t *testing.T) {
	mockOrders := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer mockOrders.Close()
	t.Setenv("ORDERS_SERVICE_URL", mockOrders.URL)

	mock := &testutil.MockPaymentRepo{}
	svc := service.NewPaymentService(mock)
	input := service.PaymentInput{
		OrderPricingID: 1,
		OrderID:        1,
		Amount:         5000,
		CardNumber:     validCard,
		CardHolder:     "Bob",
		ExpirationDate: "01/27",
		CVV:            "456",
	}
	payment, err := svc.ProcessPayment(input, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if payment.Status != models.PaymentSuccess {
		t.Errorf("expected PaymentSuccess, got %s", payment.Status)
	}
	if payment.TransactionReference == "" {
		t.Error("expected non-empty transaction reference")
	}
}

func TestProcessPayment_FailedCard_NoOrdersCall(t *testing.T) {
	// Verify that a failed payment does NOT call the orders service.
	called := false
	mockOrders := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer mockOrders.Close()
	t.Setenv("ORDERS_SERVICE_URL", mockOrders.URL)

	mock := &testutil.MockPaymentRepo{}
	svc := service.NewPaymentService(mock)
	_, err := svc.ProcessPayment(service.PaymentInput{
		OrderPricingID: 2, OrderID: 2, Amount: 1000,
		CardNumber: invalidCard, CardHolder: "Carol", ExpirationDate: "06/25", CVV: "999",
	}, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if called {
		t.Error("orders service should not be called for a failed payment")
	}
}

func TestGetPayment_HappyPath(t *testing.T) {
	payment := &models.Payment{ID: 1, TransactionReference: "ABC123XYZ", Status: models.PaymentSuccess}
	mock := &testutil.MockPaymentRepo{ReturnPayment: payment}
	svc := service.NewPaymentService(mock)
	got, err := svc.GetPayment("ABC123XYZ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.TransactionReference != "ABC123XYZ" {
		t.Errorf("expected ref ABC123XYZ, got %s", got.TransactionReference)
	}
}

func TestListPayments_All(t *testing.T) {
	payments := []models.Payment{
		{ID: 1, Status: models.PaymentSuccess},
		{ID: 2, Status: models.PaymentFailed},
	}
	mock := &testutil.MockPaymentRepo{ReturnPayments: payments}
	svc := service.NewPaymentService(mock)
	got, err := svc.ListPayments(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("expected 2 payments, got %d", len(got))
	}
}

func TestListPayments_ByPricingID(t *testing.T) {
	payments := []models.Payment{{ID: 3, Status: models.PaymentSuccess}}
	mock := &testutil.MockPaymentRepo{ReturnPayments: payments}
	svc := service.NewPaymentService(mock)
	pid := uint(7)
	got, err := svc.ListPayments(&pid)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 payment, got %d", len(got))
	}
}

func TestGetSavedCards_HappyPath(t *testing.T) {
	cards := []models.SavedPrepaidCard{{ID: 1, CardHolder: "Alice"}}
	mock := &testutil.MockPaymentRepo{ReturnCards: cards}
	svc := service.NewPaymentService(mock)
	got, err := svc.GetSavedCards(1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 card, got %d", len(got))
	}
}

func TestDeleteCard_HappyPath(t *testing.T) {
	mock := &testutil.MockPaymentRepo{}
	svc := service.NewPaymentService(mock)
	if err := svc.DeleteCard(1, 1); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}