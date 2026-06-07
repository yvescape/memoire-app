package service_test

import (
	"errors"
	"testing"

	"review-service/internal/models"
	"review-service/internal/service"
	"review-service/internal/testutil"
)

func TestGetSummary_HappyPath(t *testing.T) {
	mock := &testutil.MockReviewRepo{
		ReturnRatingCount:  10,
		ReturnRatingAvg:    4.2,
		ReturnCommentCount: 5,
		ReturnLikeCount:    20,
		ReturnLiked:        true,
	}
	svc := service.NewReviewService(mock)
	uid := uint(1)
	summary, err := svc.GetSummary(42, &uid)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if summary.ProductID != 42 {
		t.Errorf("expected product_id 42, got %d", summary.ProductID)
	}
	if summary.TotalRatings != 10 {
		t.Errorf("expected total_ratings=10, got %d", summary.TotalRatings)
	}
	if summary.AverageRating != 4.2 {
		t.Errorf("expected avg=4.2, got %v", summary.AverageRating)
	}
	if summary.TotalLikes != 20 {
		t.Errorf("expected likes=20, got %d", summary.TotalLikes)
	}
	if !summary.Liked {
		t.Error("expected liked=true")
	}
}

func TestGetSummary_RepoError(t *testing.T) {
	mock := &testutil.MockReviewRepo{ReturnError: errors.New("db error")}
	svc := service.NewReviewService(mock)
	_, err := svc.GetSummary(1, nil)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestGetSummary_NoUser(t *testing.T) {
	mock := &testutil.MockReviewRepo{ReturnRatingCount: 3, ReturnRatingAvg: 3.0}
	svc := service.NewReviewService(mock)
	summary, err := svc.GetSummary(5, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if summary.Liked {
		t.Error("expected liked=false when no user")
	}
}

func TestBulkGetSummary_Empty(t *testing.T) {
	mock := &testutil.MockReviewRepo{}
	svc := service.NewReviewService(mock)
	result, err := svc.BulkGetSummary([]uint{}, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected empty map, got %d entries", len(result))
	}
}

func TestBulkGetSummary_HappyPath(t *testing.T) {
	bulk := map[uint]*models.SummaryResponse{
		1: {ProductID: 1, TotalRatings: 5, AverageRating: 4.0},
		2: {ProductID: 2, TotalRatings: 2, AverageRating: 3.5},
	}
	mock := &testutil.MockReviewRepo{ReturnBulkSummary: bulk}
	svc := service.NewReviewService(mock)
	result, err := svc.BulkGetSummary([]uint{1, 2}, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 entries, got %d", len(result))
	}
}

func TestCreateComment_HappyPath(t *testing.T) {
	// ReturnComment=nil means no existing comment found → creation allowed
	mock := &testutil.MockReviewRepo{ReturnComment: nil, ReturnError: errors.New("not found")}
	svc := service.NewReviewService(mock)
	// Reset error after FindCommentByUserAndProduct check — tricky with shared ReturnError.
	// We need FindCommentByUserAndProduct to fail (no existing), then CreateComment to succeed.
	// Use a custom mock that tracks call order.
	mockSeq := &sequentialMockReview{errOnFirstCall: true}
	svc2 := service.NewReviewService(mockSeq)
	comment, err := svc2.CreateComment(1, "test@test.com", 10, "Great product!")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if comment.Content != "Great product!" {
		t.Errorf("expected content 'Great product!', got %s", comment.Content)
	}
	_ = svc // suppress unused
	_ = mock
}

// sequentialMockReview returns error on first FindCommentByUserAndProduct call, success on CreateComment.
type sequentialMockReview struct {
	errOnFirstCall bool
	called         bool
}

func (m *sequentialMockReview) UpsertRating(r *models.Rating) error { return nil }
func (m *sequentialMockReview) GetRatingSummary(id uint) (int64, float64, error) {
	return 0, 0, nil
}
func (m *sequentialMockReview) FindCommentsByProduct(id uint) ([]models.Comment, error) {
	return nil, nil
}
func (m *sequentialMockReview) FindCommentByUserAndProduct(uid, pid uint) (*models.Comment, error) {
	if m.errOnFirstCall && !m.called {
		m.called = true
		return nil, errors.New("not found")
	}
	return &models.Comment{}, nil
}
func (m *sequentialMockReview) CreateComment(c *models.Comment) error    { return nil }
func (m *sequentialMockReview) UpdateComment(c *models.Comment) error    { return nil }
func (m *sequentialMockReview) ListAllComments(p, ps int, s string) ([]models.Comment, int64, error) {
	return nil, 0, nil
}
func (m *sequentialMockReview) DeleteComment(id uint) error            { return nil }
func (m *sequentialMockReview) CountComments(id uint) (int64, error)   { return 0, nil }
func (m *sequentialMockReview) ToggleLike(pid, uid uint) (bool, error) { return true, nil }
func (m *sequentialMockReview) CountLikes(id uint) (int64, error)      { return 0, nil }
func (m *sequentialMockReview) UserLiked(pid, uid uint) (bool, error)  { return false, nil }
func (m *sequentialMockReview) BulkSummary(ids []uint, uid *uint) (map[uint]*models.SummaryResponse, error) {
	return nil, nil
}

func TestCreateComment_AlreadyCommented(t *testing.T) {
	existing := &models.Comment{ID: 1, Content: "Already here"}
	mock := &testutil.MockReviewRepo{ReturnComment: existing}
	svc := service.NewReviewService(mock)
	_, err := svc.CreateComment(1, "test@test.com", 10, "Duplicate")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "you already commented on this product" {
		t.Errorf("unexpected error message: %s", err.Error())
	}
}

func TestUpsertRating_InvalidValue(t *testing.T) {
	mock := &testutil.MockReviewRepo{}
	svc := service.NewReviewService(mock)
	_, err := svc.UpsertRating(1, 10, 6) // value > 5
	if err == nil {
		t.Fatal("expected error for rating > 5, got nil")
	}
	_, err = svc.UpsertRating(1, 10, 0) // value < 1
	if err == nil {
		t.Fatal("expected error for rating < 1, got nil")
	}
}

func TestUpsertRating_HappyPath(t *testing.T) {
	mock := &testutil.MockReviewRepo{}
	svc := service.NewReviewService(mock)
	rating, err := svc.UpsertRating(1, 10, 4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rating.Value != 4 {
		t.Errorf("expected value=4, got %d", rating.Value)
	}
	if rating.UserID != 1 {
		t.Errorf("expected user_id=1, got %d", rating.UserID)
	}
}

func TestGetComments_HappyPath(t *testing.T) {
	comments := []models.Comment{{ID: 1, Content: "Nice"}, {ID: 2, Content: "Love it"}}
	mock := &testutil.MockReviewRepo{ReturnComments: comments}
	svc := service.NewReviewService(mock)
	got, err := svc.GetComments(5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("expected 2 comments, got %d", len(got))
	}
}

func TestToggleLike_HappyPath(t *testing.T) {
	mock := &testutil.MockReviewRepo{ReturnLiked: true}
	svc := service.NewReviewService(mock)
	liked, err := svc.ToggleLike(10, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !liked {
		t.Error("expected liked=true")
	}
}

func TestDeleteComment_HappyPath(t *testing.T) {
	mock := &testutil.MockReviewRepo{}
	svc := service.NewReviewService(mock)
	if err := svc.DeleteComment(5); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}