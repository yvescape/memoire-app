package service_test

import (
	"errors"
	"testing"

	"orders-service/internal/models"
	"orders-service/internal/service"
	"orders-service/internal/testutil"
)

func ptr[T any](v T) *T { return &v }

func TestGetOrders_ByUserID(t *testing.T) {
	orders := []models.Order{{ID: 1, Status: models.StatusPending}, {ID: 2, Status: models.StatusConfirmed}}
	mock := &testutil.MockOrderRepo{ReturnOrders: orders}
	svc := service.NewOrderService(mock)
	got, err := svc.GetOrders(ptr(uint(1)), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("expected 2 orders, got %d", len(got))
	}
}

func TestGetOrders_NoIdentifier(t *testing.T) {
	mock := &testutil.MockOrderRepo{}
	svc := service.NewOrderService(mock)
	_, err := svc.GetOrders(nil, nil)
	if err == nil {
		t.Fatal("expected error for missing identifier, got nil")
	}
}

func TestGetOrder_HappyPath(t *testing.T) {
	// Order with empty items → RecalcPricing NOT triggered
	order := &models.Order{ID: 5, Status: models.StatusPending, Items: []models.OrderItem{}}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	got, err := svc.GetOrder(5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != 5 {
		t.Errorf("expected id=5, got %d", got.ID)
	}
}

func TestGetOrder_NotFound(t *testing.T) {
	mock := &testutil.MockOrderRepo{ReturnError: errors.New("record not found")}
	svc := service.NewOrderService(mock)
	_, err := svc.GetOrder(99)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "order not found" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestConfirmOrder_HappyPath(t *testing.T) {
	addr := &models.OrderAddress{FirstName: "Alice", LastName: "Doe", Mobile: "0601020304"}
	order := &models.Order{
		ID:      10,
		Status:  models.StatusPending,
		Items:   []models.OrderItem{{ID: 1}},
		Address: addr,
	}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	confirmed, err := svc.ConfirmOrder(10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if confirmed.Status != models.StatusConfirmed {
		t.Errorf("expected Confirmed, got %s", confirmed.Status)
	}
}

func TestConfirmOrder_NotFound(t *testing.T) {
	mock := &testutil.MockOrderRepo{ReturnError: errors.New("record not found")}
	svc := service.NewOrderService(mock)
	_, err := svc.ConfirmOrder(99)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestConfirmOrder_AlreadyConfirmed(t *testing.T) {
	order := &models.Order{ID: 3, Status: models.StatusConfirmed}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	_, err := svc.ConfirmOrder(3)
	if err == nil {
		t.Fatal("expected error for already-confirmed order")
	}
	if err.Error() != "only pending orders can be confirmed" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestConfirmOrder_NoItems(t *testing.T) {
	order := &models.Order{ID: 4, Status: models.StatusPending, Items: []models.OrderItem{}}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	_, err := svc.ConfirmOrder(4)
	if err == nil {
		t.Fatal("expected error for empty cart")
	}
	if err.Error() != "order has no items" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestConfirmOrder_NoAddress(t *testing.T) {
	order := &models.Order{
		ID:     6,
		Status: models.StatusPending,
		Items:  []models.OrderItem{{ID: 1}},
	}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	_, err := svc.ConfirmOrder(6)
	if err == nil {
		t.Fatal("expected error for missing address")
	}
	if err.Error() != "delivery address required" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestCancelOrder_HappyPath(t *testing.T) {
	order := &models.Order{ID: 7, Status: models.StatusPending}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	if err := svc.CancelOrder(7); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCancelOrder_AlreadyCancelled(t *testing.T) {
	order := &models.Order{ID: 8, Status: models.StatusCancelled}
	mock := &testutil.MockOrderRepo{ReturnOrder: order}
	svc := service.NewOrderService(mock)
	err := svc.CancelOrder(8)
	if err == nil {
		t.Fatal("expected error for already-cancelled order")
	}
	if err.Error() != "order already cancelled" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestCartCount_ByUserID(t *testing.T) {
	mock := &testutil.MockOrderRepo{ReturnCount: 3}
	svc := service.NewOrderService(mock)
	count, err := svc.CartCount(ptr(uint(1)), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if count != 3 {
		t.Errorf("expected count=3, got %d", count)
	}
}

func TestUpdateItemQuantity_Increment(t *testing.T) {
	item := &models.OrderItem{ID: 1, OrderID: 2, Quantity: 2, Price: 10.0}
	mock := &testutil.MockOrderRepo{ReturnItem: item}
	svc := service.NewOrderService(mock)
	updated, err := svc.UpdateItemQuantity(1, "increment")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated == nil || updated.Quantity != 3 {
		t.Errorf("expected quantity=3, got %v", updated)
	}
}

func TestUpdateItemQuantity_InvalidAction(t *testing.T) {
	item := &models.OrderItem{ID: 1, Quantity: 2}
	mock := &testutil.MockOrderRepo{ReturnItem: item}
	svc := service.NewOrderService(mock)
	_, err := svc.UpdateItemQuantity(1, "invalid")
	if err == nil {
		t.Fatal("expected error for invalid action")
	}
}

func TestGetDeliveryOptions_HappyPath(t *testing.T) {
	opts := []models.DeliveryOption{{ID: 1, Name: "Standard", Amount: 1500}}
	mock := &testutil.MockOrderRepo{ReturnDeliveryOpts: opts}
	svc := service.NewOrderService(mock)
	got, err := svc.GetDeliveryOptions()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 option, got %d", len(got))
	}
}

func TestCreateDeliveryOption_HappyPath(t *testing.T) {
	mock := &testutil.MockOrderRepo{}
	svc := service.NewOrderService(mock)
	opt, err := svc.CreateDeliveryOption(service.DeliveryOptionInput{
		Name: "Express", Amount: 3000, IsActive: true,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if opt.Name != "Express" {
		t.Errorf("expected Express, got %s", opt.Name)
	}
	if opt.Currency != "XOF" {
		t.Errorf("expected default currency XOF, got %s", opt.Currency)
	}
}