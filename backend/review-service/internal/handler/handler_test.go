package handler_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"review-service/internal/handler"
	"review-service/internal/models"
	"review-service/internal/service"
	"review-service/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newPublicRouter builds a test router for public (no-auth) endpoints.
func newPublicRouter(mock *testutil.MockReviewRepo) (*gin.Engine, *handler.ReviewHandler) {
	svc := service.NewReviewService(mock)
	h := handler.NewReviewHandler(svc)
	r := gin.New()
	r.GET("/:product_id/summary/", h.Summary)
	r.GET("/:product_id/comments/", h.ListComments)
	return r, h
}

// newAuthRouter builds a test router for authenticated endpoints.
func newAuthRouter(mock *testutil.MockReviewRepo, userID uint) *gin.Engine {
	svc := service.NewReviewService(mock)
	h := handler.NewReviewHandler(svc)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", &userID)
		c.Set("email", "test@test.com")
		c.Next()
	})
	r.POST("/:product_id/comments/create/", h.CreateComment)
	r.POST("/:product_id/toggle-like/", h.ToggleLike)
	r.POST("/:product_id/rating/", h.CreateOrUpdateRating)
	return r
}

// --- Summary ---

func TestSummary_HappyPath(t *testing.T) {
	mock := &testutil.MockReviewRepo{
		ReturnRatingCount: 5, ReturnRatingAvg: 4.0,
		ReturnCommentCount: 3, ReturnLikeCount: 12,
	}
	router, _ := newPublicRouter(mock)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/1/summary/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got models.SummaryResponse
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if got.TotalRatings != 5 {
		t.Errorf("expected total_ratings=5, got %d", got.TotalRatings)
	}
	if got.TotalLikes != 12 {
		t.Errorf("expected total_likes=12, got %d", got.TotalLikes)
	}
}

func TestSummary_InvalidProductID(t *testing.T) {
	router, _ := newPublicRouter(&testutil.MockReviewRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/abc/summary/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestSummary_RepoError(t *testing.T) {
	mock := &testutil.MockReviewRepo{ReturnError: errors.New("db error")}
	router, _ := newPublicRouter(mock)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/1/summary/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

// --- ListComments ---

func TestListComments_HappyPath(t *testing.T) {
	comments := []models.Comment{
		{ID: 1, Content: "Magnifique", UserEmail: "a@a.com"},
		{ID: 2, Content: "Top", UserEmail: "b@b.com"},
	}
	mock := &testutil.MockReviewRepo{ReturnComments: comments}
	router, _ := newPublicRouter(mock)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/5/comments/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got []models.Comment
	json.Unmarshal(w.Body.Bytes(), &got)
	if len(got) != 2 {
		t.Errorf("expected 2 comments, got %d", len(got))
	}
}

func TestListComments_InvalidProductID(t *testing.T) {
	router, _ := newPublicRouter(&testutil.MockReviewRepo{})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/xyz/comments/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- CreateComment ---

type seqMock struct {
	findErr error
	createErr error
}

func (m *seqMock) UpsertRating(r *models.Rating) error { return nil }
func (m *seqMock) GetRatingSummary(id uint) (int64, float64, error) { return 0, 0, nil }
func (m *seqMock) FindCommentsByProduct(id uint) ([]models.Comment, error) { return nil, nil }
func (m *seqMock) FindCommentByUserAndProduct(uid, pid uint) (*models.Comment, error) {
	return nil, m.findErr
}
func (m *seqMock) CreateComment(c *models.Comment) error    { return m.createErr }
func (m *seqMock) UpdateComment(c *models.Comment) error    { return nil }
func (m *seqMock) ListAllComments(p, ps int, s string) ([]models.Comment, int64, error) {
	return nil, 0, nil
}
func (m *seqMock) DeleteComment(id uint) error            { return nil }
func (m *seqMock) CountComments(id uint) (int64, error)   { return 0, nil }
func (m *seqMock) ToggleLike(pid, uid uint) (bool, error) { return true, nil }
func (m *seqMock) CountLikes(id uint) (int64, error)      { return 0, nil }
func (m *seqMock) UserLiked(pid, uid uint) (bool, error)  { return false, nil }
func (m *seqMock) BulkSummary(ids []uint, uid *uint) (map[uint]*models.SummaryResponse, error) {
	return nil, nil
}

func TestCreateComment_HappyPath(t *testing.T) {
	mock := &seqMock{findErr: errors.New("not found"), createErr: nil}
	svc := service.NewReviewService(mock)
	h := handler.NewReviewHandler(svc)
	uid := uint(1)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", &uid)
		c.Set("email", "alice@test.com")
		c.Next()
	})
	r.POST("/:product_id/comments/create/", h.CreateComment)

	body, _ := json.Marshal(map[string]string{"content": "Excellent produit!"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/10/comments/create/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateComment_MissingContent(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockReviewRepo{}, uid)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/10/comments/create/", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- ToggleLike ---

func TestToggleLike_HappyPath(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockReviewRepo{ReturnLiked: true}, uid)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/5/toggle-like/", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var body map[string]bool
	json.Unmarshal(w.Body.Bytes(), &body)
	if !body["liked"] {
		t.Error("expected liked=true")
	}
}

// --- Rating ---

func TestCreateOrUpdateRating_HappyPath(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockReviewRepo{}, uid)
	body, _ := json.Marshal(map[string]int{"value": 5})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/3/rating/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateOrUpdateRating_InvalidValue(t *testing.T) {
	uid := uint(1)
	router := newAuthRouter(&testutil.MockReviewRepo{}, uid)
	body, _ := json.Marshal(map[string]int{"value": 10})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/3/rating/", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for rating=10, got %d", w.Code)
	}
}