package service_test

import (
	"errors"
	"testing"

	"products-service/internal/models"
	"products-service/internal/service"
	"products-service/internal/testutil"
)

func TestList_HappyPath(t *testing.T) {
	mock := &testutil.MockProductRepo{
		ReturnProducts: []models.Product{
			{ID: 1, Name: "Rose Noire", Category: "Floral", Family: "Oriental", Gender: "F", Price: 29.99},
		},
		ReturnTotal: 1,
	}
	svc := service.NewProductService(mock)
	cards, total, err := svc.List(1, 10, "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if total != 1 {
		t.Errorf("expected total=1, got %d", total)
	}
	if len(cards) != 1 {
		t.Errorf("expected 1 card, got %d", len(cards))
	}
	if cards[0].Name != "Rose Noire" {
		t.Errorf("expected Rose Noire, got %s", cards[0].Name)
	}
}

func TestList_RepoError(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnError: errors.New("db error")}
	svc := service.NewProductService(mock)
	_, _, err := svc.List(1, 10, "")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestGetByID_HappyPath(t *testing.T) {
	want := &models.Product{ID: 7, Name: "Oud", Category: "Oriental", Family: "Wood", Gender: "M", Price: 50}
	mock := &testutil.MockProductRepo{ReturnProduct: want}
	svc := service.NewProductService(mock)
	got, err := svc.GetByID(7)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != 7 {
		t.Errorf("expected id 7, got %d", got.ID)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnError: errors.New("record not found")}
	svc := service.NewProductService(mock)
	_, err := svc.GetByID(99)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestCreate_HappyPath(t *testing.T) {
	mock := &testutil.MockProductRepo{}
	svc := service.NewProductService(mock)
	input := service.ProductInput{
		Name: "Ambre Soleil", Category: "Oriental", Family: "Amber", Gender: "U", Price: 35.00,
	}
	p, err := svc.Create(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.Name != "Ambre Soleil" {
		t.Errorf("expected Ambre Soleil, got %s", p.Name)
	}
	if p.Price != 35.00 {
		t.Errorf("expected price 35, got %v", p.Price)
	}
}

func TestCreate_RepoError(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnError: errors.New("db constraint violation")}
	svc := service.NewProductService(mock)
	_, err := svc.Create(service.ProductInput{Name: "X", Category: "C", Family: "F", Gender: "M", Price: 1})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestUpdate_HappyPath(t *testing.T) {
	existing := &models.Product{ID: 3, Name: "Old Name", Category: "C", Family: "F", Gender: "M", Price: 10}
	mock := &testutil.MockProductRepo{ReturnProduct: existing}
	svc := service.NewProductService(mock)
	updated, err := svc.Update(3, service.ProductInput{
		Name: "New Name", Category: "Oriental", Family: "Wood", Gender: "M", Price: 55,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "New Name" {
		t.Errorf("expected New Name, got %s", updated.Name)
	}
	if updated.Price != 55 {
		t.Errorf("expected price 55, got %v", updated.Price)
	}
}

func TestUpdate_ProductNotFound(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnError: errors.New("record not found")}
	svc := service.NewProductService(mock)
	_, err := svc.Update(99, service.ProductInput{Name: "X", Category: "C", Family: "F", Gender: "M", Price: 1})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "product not found" {
		t.Errorf("expected 'product not found', got %q", err.Error())
	}
}

func TestDelete_HappyPath(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnProduct: &models.Product{ID: 2, Name: "Test"}}
	svc := service.NewProductService(mock)
	if err := svc.Delete(2); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDelete_ProductNotFound(t *testing.T) {
	mock := &testutil.MockProductRepo{ReturnError: errors.New("record not found")}
	svc := service.NewProductService(mock)
	err := svc.Delete(99)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "product not found" {
		t.Errorf("expected 'product not found', got %q", err.Error())
	}
}