package testutil

import "review-service/internal/models"

type MockReviewRepo struct {
	ReturnError        error
	ReturnRatingCount  int64
	ReturnRatingAvg    float64
	ReturnComments     []models.Comment
	ReturnComment      *models.Comment
	ReturnCommentCount int64
	ReturnLikeCount    int64
	ReturnLiked        bool
	ReturnBulkSummary  map[uint]*models.SummaryResponse
	ReturnRating       *models.Rating
}

func (m *MockReviewRepo) UpsertRating(rating *models.Rating) error {
	return m.ReturnError
}

func (m *MockReviewRepo) GetRatingSummary(productID uint) (int64, float64, error) {
	return m.ReturnRatingCount, m.ReturnRatingAvg, m.ReturnError
}

func (m *MockReviewRepo) FindCommentsByProduct(productID uint) ([]models.Comment, error) {
	return m.ReturnComments, m.ReturnError
}

func (m *MockReviewRepo) FindCommentByUserAndProduct(userID, productID uint) (*models.Comment, error) {
	return m.ReturnComment, m.ReturnError
}

func (m *MockReviewRepo) CreateComment(comment *models.Comment) error {
	return m.ReturnError
}

func (m *MockReviewRepo) UpdateComment(comment *models.Comment) error {
	return m.ReturnError
}

func (m *MockReviewRepo) ListAllComments(page, pageSize int, search string) ([]models.Comment, int64, error) {
	return m.ReturnComments, m.ReturnCommentCount, m.ReturnError
}

func (m *MockReviewRepo) DeleteComment(commentID uint) error {
	return m.ReturnError
}

func (m *MockReviewRepo) CountComments(productID uint) (int64, error) {
	return m.ReturnCommentCount, m.ReturnError
}

func (m *MockReviewRepo) ToggleLike(productID, userID uint) (bool, error) {
	return m.ReturnLiked, m.ReturnError
}

func (m *MockReviewRepo) CountLikes(productID uint) (int64, error) {
	return m.ReturnLikeCount, m.ReturnError
}

func (m *MockReviewRepo) UserLiked(productID, userID uint) (bool, error) {
	return m.ReturnLiked, m.ReturnError
}

func (m *MockReviewRepo) BulkSummary(ids []uint, userID *uint) (map[uint]*models.SummaryResponse, error) {
	return m.ReturnBulkSummary, m.ReturnError
}