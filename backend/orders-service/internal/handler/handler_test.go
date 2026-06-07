package handler_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"orders-service/internal/handler"
	"orders-service/internal/models"
	"orders-service/internal/service"
	"orders-service/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func ptr[T any](v T) *T { return &v }

// newRouter sets up a test router without auth middleware.
func newRouter(mock *testutil.MockOrderRepo) *gin.Engine {
	svc := service.NewOrderService(mock)
	h := handler.NewOrderHandler(svc)
	r := gin.New()
	r.GET("/orders/:id/", h.OrderDetail)
	r.PATCH("/orders/:id/confirm/", h.ConfirmOrder)
	r.PATCH("/orders/:id/cancel/", h.CancelOrder)
	r.GET("/cart/count/", h.CartCount)
	r.GET("/cart/items/", h.ListCartItems)
	r.POST("/cart/items/", h.AddCartItem)
	r.PATCH("/cart/items/:id/quantity/", h.UpdateItemQuantity)
	r.DELETE("/cart/items/:id/", h.DeleteCartItem)
	r.GET("/delivery-options/", h.ListDeliveryOptions)
	r.POST("/delivery-options/", h.CreateDeliveryOption)
	r.DELETE("/delivery-options/:id/", h.DeleteDeliveryOption)
	r.GET("/orders/:id/pricing/", h.GetPricing)
	return r
}

// --- OrderDetail ---

func TestOrderDetail_HappyPath(t *testing.T) {
	order := &models.Order{ID: 5, Status: models.StatusPending}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/orders/5/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Order
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.ID != 5 {
		t.Errorf("expected id=5, got %d", got.ID)
	}
}

func TestOrderDetail_NotFound(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{ReturnError: errors.New("record not found")})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/orders/99/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestOrderDetail_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/orders/abc/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- ConfirmOrder ---

func TestConfirmOrder_HappyPath(t *testing.T) {
	addr := &models.OrderAddress{FirstName: "Alice", LastName: "Doe", Mobile: "0601020304"}
	order := &models.Order{
		ID:      10,
		Status:  models.StatusPending,
		Items:   []models.OrderItem{{ID: 1}},
		Address: addr,
	}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/orders/10/confirm/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestConfirmOrder_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/orders/xyz/confirm/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestConfirmOrder_BusinessError(t *testing.T) {
	// Order with no items → service returns "order has no items"
	order := &models.Order{ID: 3, Status: models.StatusPending, Items: []models.OrderItem{}}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/orders/3/confirm/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- CancelOrder ---

func TestCancelOrder_HappyPath(t *testing.T) {
	order := &models.Order{ID: 7, Status: models.StatusPending}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/orders/7/cancel/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCancelOrder_AlreadyCancelled(t *testing.T) {
	order := &models.Order{ID: 8, Status: models.StatusCancelled}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/orders/8/cancel/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- CartCount ---

func TestCartCount_NoIdentifier(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{ReturnCount: 0})
	w := httptest.NewRecorder()
	// No user_id in context, no session_id query param → count=0
	req, _ := http.NewRequest(http.MethodGet, "/cart/count/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["count"] == nil {
		t.Error("expected 'count' field in response")
	}
}

func TestCartCount_WithSessionID(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{ReturnCount: 3})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/cart/count/?session_id=abc123", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["count"].(float64) != 3 {
		t.Errorf("expected count=3, got %v", body["count"])
	}
}

// --- Delivery options ---

func TestListDeliveryOptions_HappyPath(t *testing.T) {
	opts := []models.DeliveryOption{
		{ID: 1, Name: "Standard", Amount: 1500},
		{ID: 2, Name: "Express", Amount: 3000},
	}
	router := newRouter(&testutil.MockOrderRepo{ReturnDeliveryOpts: opts})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/delivery-options/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got []models.DeliveryOption
	json.Unmarshal(w.Body.Bytes(), &got)
	if len(got) != 2 {
		t.Errorf("expected 2 options, got %d", len(got))
	}
}

func TestCreateDeliveryOption_HappyPath(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	payload := map[string]interface{}{
		"name":   "Express",
		"amount": 3000.0,
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/delivery-options/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateDeliveryOption_InvalidBody(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	// Missing required 'amount'
	body, _ := json.Marshal(map[string]string{"name": "Only Name"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/delivery-options/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- UpdateItemQuantity ---

func TestUpdateItemQuantity_InvalidBody(t *testing.T) {
	item := &models.OrderItem{ID: 1, OrderID: 2, Quantity: 2, Price: 10}
	router := newRouter(&testutil.MockOrderRepo{ReturnItem: item})
	w := httptest.NewRecorder()
	// Missing "action" field
	req, _ := http.NewRequest(http.MethodPatch, "/cart/items/1/quantity/", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUpdateItemQuantity_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	body, _ := json.Marshal(map[string]string{"action": "increment"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPatch, "/cart/items/abc/quantity/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- GetPricing ---

func TestGetPricing_HappyPath(t *testing.T) {
	pricing := &models.OrderPricing{ID: 1, OrderID: 5, Total: 6500}
	order := &models.Order{ID: 5, Pricing: pricing}
	router := newRouter(&testutil.MockOrderRepo{ReturnOrder: order})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/orders/5/pricing/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetPricing_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockOrderRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/orders/abc/pricing/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}