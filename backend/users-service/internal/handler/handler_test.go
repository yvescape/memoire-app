package handler_test

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"users-service/internal/handler"
	"users-service/internal/models"
	"users-service/internal/service"
	"users-service/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newTestKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("cannot generate RSA key: %v", err)
	}
	return key
}

func newRouter(mock *testutil.MockUserRepo, key *rsa.PrivateKey) *gin.Engine {
	svc := service.NewUserService(mock, key)
	h := handler.NewUserHandler(svc)
	r := gin.New()
	r.POST("/register/", h.Register)
	r.POST("/login/", h.Login)
	r.POST("/token/refresh/", h.RefreshToken)
	return r
}

func newAuthRouter(mock *testutil.MockUserRepo, key *rsa.PrivateKey, userID uint) *gin.Engine {
	svc := service.NewUserService(mock, key)
	h := handler.NewUserHandler(svc)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})
	r.GET("/me/", h.Me)
	r.PUT("/update/", h.UpdateMe)
	return r
}

// --- Register ---

func TestRegister_HappyPath(t *testing.T) {
	router := newRouter(&testutil.MockUserRepo{}, newTestKey(t))
	payload := map[string]string{
		"email":            "new@example.com",
		"username":         "newuser",
		"password":         "securepass123",
		"password_confirm": "securepass123",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var got models.User
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Email != "new@example.com" {
		t.Errorf("expected email new@example.com, got %s", got.Email)
	}
}

func TestRegister_MissingFields(t *testing.T) {
	router := newRouter(&testutil.MockUserRepo{}, newTestKey(t))
	body, _ := json.Marshal(map[string]string{"email": "missing@test.com"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	router := newRouter(&testutil.MockUserRepo{}, newTestKey(t))
	payload := map[string]string{
		"email":            "not-an-email",
		"username":         "testuser",
		"password":         "securepass123",
		"password_confirm": "securepass123",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid email, got %d", w.Code)
	}
}

func TestRegister_PasswordMismatch(t *testing.T) {
	router := newRouter(&testutil.MockUserRepo{}, newTestKey(t))
	payload := map[string]string{
		"email":            "test@example.com",
		"username":         "testuser",
		"password":         "pass1234",
		"password_confirm": "other4321",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for password mismatch, got %d", w.Code)
	}
}

// --- Login ---

func TestLogin_HappyPath(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("securepass123"), bcrypt.MinCost)
	user := &models.User{ID: 1, Email: "alice@example.com", IsActive: true, Password: string(hashed)}
	router := newRouter(&testutil.MockUserRepo{ReturnUser: user}, newTestKey(t))

	payload := map[string]string{"email": "alice@example.com", "password": "securepass123"}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got service.TokenPair
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Access == "" {
		t.Error("expected non-empty access token")
	}
}

func TestLogin_InvalidCredentials(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("correct"), bcrypt.MinCost)
	user := &models.User{ID: 1, Email: "alice@example.com", IsActive: true, Password: string(hashed)}
	router := newRouter(&testutil.MockUserRepo{ReturnUser: user}, newTestKey(t))

	payload := map[string]string{"email": "alice@example.com", "password": "wrong"}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestLogin_MissingBody(t *testing.T) {
	router := newRouter(&testutil.MockUserRepo{}, newTestKey(t))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login/", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- Me ---

func TestMe_HappyPath(t *testing.T) {
	user := &models.User{ID: 3, Email: "me@example.com", Username: "myuser"}
	key := newTestKey(t)
	router := newAuthRouter(&testutil.MockUserRepo{ReturnUser: user}, key, 3)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/me/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.User
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.Email != "me@example.com" {
		t.Errorf("expected me@example.com, got %s", got.Email)
	}
}

func TestMe_UserNotFound(t *testing.T) {
	key := newTestKey(t)
	router := newAuthRouter(&testutil.MockUserRepo{ReturnError: bcrypt.ErrHashTooShort}, key, 99)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/me/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

// --- UpdateMe ---

func TestUpdateMe_HappyPath(t *testing.T) {
	user := &models.User{ID: 2, FirstName: "Old", LastName: "Name"}
	key := newTestKey(t)
	router := newAuthRouter(&testutil.MockUserRepo{ReturnUser: user}, key, 2)

	payload := map[string]string{"first_name": "New", "last_name": "Surname"}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, "/update/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.User
	json.Unmarshal(w.Body.Bytes(), &got)
	if got.FirstName != "New" {
		t.Errorf("expected FirstName=New, got %s", got.FirstName)
	}
}