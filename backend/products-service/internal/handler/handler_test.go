package handler_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"products-service/internal/handler"
	"products-service/internal/models"
	"products-service/internal/service"
	"products-service/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newRouter(mock *testutil.MockProductRepo) *gin.Engine {
	svc := service.NewProductService(mock)
	h := handler.NewProductHandler(svc)
	r := gin.New()
	r.GET("/products/", h.List)
	r.GET("/products/:id/", h.Detail)
	r.POST("/products/", h.Create)
	r.PUT("/products/:id/", h.Update)
	r.DELETE("/products/:id/", h.Delete)
	return r
}

// --- Detail ---

func TestDetail_HappyPath(t *testing.T) {
	product := &models.Product{ID: 1, Name: "Rose Noire", Category: "Floral", Family: "Oriental", Gender: "F", Price: 25}
	router := newRouter(&testutil.MockProductRepo{ReturnProduct: product})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products/1/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Product
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if got.ID != 1 {
		t.Errorf("expected id=1, got %d", got.ID)
	}
	if got.Name != "Rose Noire" {
		t.Errorf("expected Rose Noire, got %s", got.Name)
	}
}

func TestDetail_NotFound(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{ReturnError: errors.New("not found")})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products/99/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["detail"] == "" {
		t.Error("expected 'detail' field in error body")
	}
}

func TestDetail_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products/abc/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- List ---

func TestList_HappyPath(t *testing.T) {
	products := []models.Product{
		{ID: 1, Name: "Rose", Category: "Floral", Family: "Oriental", Gender: "F", Price: 10},
		{ID: 2, Name: "Oud", Category: "Oriental", Family: "Wood", Gender: "M", Price: 50},
	}
	router := newRouter(&testutil.MockProductRepo{ReturnProducts: products, ReturnTotal: 2})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	if _, ok := body["results"]; !ok {
		t.Error("expected 'results' key in response")
	}
	if body["count"].(float64) != 2 {
		t.Errorf("expected count=2, got %v", body["count"])
	}
}

// --- Create ---

func TestCreate_HappyPath(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{})
	payload := map[string]interface{}{
		"name":     "Oud Noir",
		"category": "Oriental",
		"family":   "Wood",
		"gender":   "M",
		"price":    49.99,
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/products/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var got models.Product
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Name != "Oud Noir" {
		t.Errorf("expected Oud Noir, got %s", got.Name)
	}
	if got.Price != 49.99 {
		t.Errorf("expected price 49.99, got %v", got.Price)
	}
}

func TestCreate_InvalidBody_MissingFields(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{})
	// Only name provided — category, family, gender, price are required
	body, _ := json.Marshal(map[string]string{"name": "Missing Fields"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/products/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreate_InvalidBody_NotJSON(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/products/", bytes.NewBufferString("not json"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- Update ---

func TestUpdate_HappyPath(t *testing.T) {
	existing := &models.Product{ID: 3, Name: "Old", Category: "C", Family: "F", Gender: "M", Price: 5}
	router := newRouter(&testutil.MockProductRepo{ReturnProduct: existing})
	payload := map[string]interface{}{
		"name": "Updated", "category": "Oriental", "family": "Wood", "gender": "M", "price": 60.0,
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, "/products/3/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUpdate_InvalidID(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{})
	body, _ := json.Marshal(map[string]interface{}{
		"name": "X", "category": "C", "family": "F", "gender": "M", "price": 1.0,
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, "/products/abc/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- Delete ---

func TestDelete_HappyPath(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{ReturnProduct: &models.Product{ID: 1}})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/products/1/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", w.Code)
	}
}

func TestDelete_NotFound(t *testing.T) {
	router := newRouter(&testutil.MockProductRepo{ReturnError: errors.New("not found")})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/products/99/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}