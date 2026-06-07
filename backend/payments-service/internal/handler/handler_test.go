package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"payments-service/internal/handler"
	"payments-service/internal/models"
	"payments-service/internal/service"
	"payments-service/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// invalidCard: not 16 digits — triggers PaymentFailed.
const invalidCard = "1234"

// validCard: exactly 16 digits — triggers PaymentSuccess.
const validCard = "1234567890123456"

func newPublicRouter(mock *testutil.MockPaymentRepo) *gin.Engine {
	svc := service.NewPaymentService(mock)
	h := handler.NewPaymentHandler(svc)
	r := gin.New()
	r.POST("/create/", h.CreatePayment)
	r.GET("/list/", h.ListPayments)
	r.GET("/:ref/", h.GetPayment)
	return r
}

func newAuthRouter(mock *testutil.MockPaymentRepo, userID uint) *gin.Engine {
	svc := service.NewPaymentService(mock)
	h := handler.NewPaymentHandler(svc)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", &userID)
		c.Next()
	})
	r.GET("/saved-cards/", h.ListCards)
	r.DELETE("/saved-cards/:id/", h.DeleteCard)
	return r
}

// --- CreatePayment ---

func TestCreatePayment_FailedCard(t *testing.T) {
	router := newPublicRouter(&testutil.MockPaymentRepo{})
	payload := map[string]interface{}{
		"order_pricing_id": 1,
		"order_id":         1,
		"amount":           5000,
		"card_number":      invalidCard,
		"card_holder":      "Alice",
		"expiration_date":  "12/26",
		"cvv":              "123",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/create/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	// Failed card returns 402 Payment Required
	if w.Code != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Payment
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Status != models.PaymentFailed {
		t.Errorf("expected PaymentFailed, got %s", got.Status)
	}
}

func TestCreatePayment_SuccessCard(t *testing.T) {
	// Start a mock orders service.
	mockOrders := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer mockOrders.Close()
	t.Setenv("ORDERS_SERVICE_URL", mockOrders.URL)

	router := newPublicRouter(&testutil.MockPaymentRepo{})
	payload := map[string]interface{}{
		"order_pricing_id": 1,
		"order_id":         1,
		"amount":           5000,
		"card_number":      validCard,
		"card_holder":      "Bob",
		"expiration_date":  "01/27",
		"cvv":              "456",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/create/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Payment
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Status != models.PaymentSuccess {
		t.Errorf("expected PaymentSuccess, got %s", got.Status)
	}
	if got.TransactionReference == "" {
		t.Error("expected non-empty transaction reference")
	}
}

func TestCreatePayment_InvalidBody(t *testing.T) {
	router := newPublicRouter(&testutil.MockPaymentRepo{})
	// Missing required fields (card_number, card_holder, etc.)
	body, _ := json.Marshal(map[string]int{"order_id": 1})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/create/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- GetPayment ---

func TestGetPayment_HappyPath(t *testing.T) {
	payment := &models.Payment{ID: 1, TransactionReference: "TXNABC123", Status: models.PaymentSuccess}
	router := newPublicRouter(&testutil.MockPaymentRepo{ReturnPayment: payment})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/TXNABC123/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Payment
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.TransactionReference != "TXNABC123" {
		t.Errorf("expected ref TXNABC123, got %s", got.TransactionReference)
	}
}

// --- ListPayments ---

func TestListPayments_All(t *testing.T) {
	payments := []models.Payment{
		{ID: 1, Status: models.PaymentSuccess},
		{ID: 2, Status: models.PaymentFailed},
	}
	router := newPublicRouter(&testutil.MockPaymentRepo{ReturnPayments: payments})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/list/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got []models.Payment
	json.Unmarshal(w.Body.Bytes(), &got)
	if len(got) != 2 {
		t.Errorf("expected 2 payments, got %d", len(got))
	}
}

func TestListPayments_ByPricingID(t *testing.T) {
	payments := []models.Payment{{ID: 3, Status: models.PaymentSuccess}}
	router := newPublicRouter(&testutil.MockPaymentRepo{ReturnPayments: payments})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/list/?order_pricing_id=7", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

// --- SavedCards ---

func TestListCards_HappyPath(t *testing.T) {
	cards := []models.SavedPrepaidCard{{ID: 1, CardHolder: "Alice"}}
	uid := uint(1)
	router := newAuthRouter(&testutil.MockPaymentRepo{ReturnCards: cards}, uid)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/saved-cards/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got []models.SavedPrepaidCard
	json.Unmarshal(w.Body.Bytes(), &got)
	if len(got) != 1 {
		t.Errorf("expected 1 card, got %d", len(got))
	}
}

func TestDeleteCard_HappyPath(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockPaymentRepo{}, uid)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/saved-cards/1/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", w.Code)
	}
}

func TestDeleteCard_InvalidID(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockPaymentRepo{}, uid)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/saved-cards/abc/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}