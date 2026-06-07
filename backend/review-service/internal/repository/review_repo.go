package repository

import (
	"review-service/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ReviewRepo interface {
	UpsertRating(rating *models.Rating) error
	GetRatingSummary(productID uint) (int64, float64, error)
	FindCommentsByProduct(productID uint) ([]models.Comment, error)
	FindCommentByUserAndProduct(userID, productID uint) (*models.Comment, error)
	CreateComment(comment *models.Comment) error
	UpdateComment(comment *models.Comment) error
	ListAllComments(page, pageSize int, search string) ([]models.Comment, int64, error)
	DeleteComment(commentID uint) error
	CountComments(productID uint) (int64, error)
	ToggleLike(productID, userID uint) (bool, error)
	CountLikes(productID uint) (int64, error)
	UserLiked(productID, userID uint) (bool, error)
	BulkSummary(ids []uint, userID *uint) (map[uint]*models.SummaryResponse, error)
}

type ReviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

// --- Ratings ---

func (r *ReviewRepository) UpsertRating(rating *models.Rating) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "product_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(rating).Error
}

func (r *ReviewRepository) GetRatingSummary(productID uint) (int64, float64, error) {
	var count int64
	var avg float64
	r.db.Model(&models.Rating{}).Where("product_id = ?", productID).Count(&count)
	if count > 0 {
		r.db.Model(&models.Rating{}).Where("product_id = ?", productID).
			Select("AVG(value)").Scan(&avg)
	}
	return count, avg, nil
}

// --- Comments ---

func (r *ReviewRepository) FindCommentsByProduct(productID uint) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Where("product_id = ?", productID).Order("created_at desc").Find(&comments).Error
	return comments, err
}

func (r *ReviewRepository) FindCommentByUserAndProduct(userID, productID uint) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&comment).Error
	return &comment, err
}

func (r *ReviewRepository) CreateComment(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *ReviewRepository) UpdateComment(comment *models.Comment) error {
	return r.db.Save(comment).Error
}

func (r *ReviewRepository) ListAllComments(page, pageSize int, search string) ([]models.Comment, int64, error) {
	var comments []models.Comment
	var total int64
	query := r.db.Model(&models.Comment{})
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("content ILIKE ? OR user_email ILIKE ?", like, like)
	}
	query.Count(&total)
	err := query.Order("created_at desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&comments).Error
	return comments, total, err
}

func (r *ReviewRepository) DeleteComment(commentID uint) error {
	return r.db.Delete(&models.Comment{}, commentID).Error
}

func (r *ReviewRepository) CountComments(productID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Comment{}).Where("product_id = ?", productID).Count(&count).Error
	return count, err
}

// --- Likes ---

func (r *ReviewRepository) ToggleLike(productID, userID uint) (bool, error) {
	var like models.Like
	err := r.db.Where("product_id = ? AND user_id = ?", productID, userID).First(&like).Error
	if err == gorm.ErrRecordNotFound {
		newLike := models.Like{ProductID: productID, UserID: userID}
		return true, r.db.Create(&newLike).Error
	}
	if err != nil {
		return false, err
	}
	return false, r.db.Where("product_id = ? AND user_id = ?", productID, userID).Delete(&models.Like{}).Error
}

func (r *ReviewRepository) CountLikes(productID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("product_id = ?", productID).Count(&count).Error
	return count, err
}

func (r *ReviewRepository) UserLiked(productID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("product_id = ? AND user_id = ?", productID, userID).Count(&count).Error
	return count > 0, err
}

// --- Bulk summary (4 requêtes au lieu de N×3) ---

func (r *ReviewRepository) BulkSummary(ids []uint, userID *uint) (map[uint]*models.SummaryResponse, error) {
	result := make(map[uint]*models.SummaryResponse, len(ids))
	for _, id := range ids {
		result[id] = &models.SummaryResponse{ProductID: id}
	}

	var ratingRows []struct {
		ProductID uint
		Count     int64
		Avg       float64
	}
	r.db.Model(&models.Rating{}).
		Select("product_id, COUNT(*) as count, AVG(value) as avg").
		Where("product_id IN ?", ids).
		Group("product_id").
		Scan(&ratingRows)
	for _, row := range ratingRows {
		if s, ok := result[row.ProductID]; ok {
			s.TotalRatings = row.Count
			s.AverageRating = row.Avg
		}
	}

	var commentRows []struct {
		ProductID uint
		Count     int64
	}
	r.db.Model(&models.Comment{}).
		Select("product_id, COUNT(*) as count").
		Where("product_id IN ?", ids).
		Group("product_id").
		Scan(&commentRows)
	for _, row := range commentRows {
		if s, ok := result[row.ProductID]; ok {
			s.CommentCount = row.Count
		}
	}

	var likeRows []struct {
		ProductID uint
		Count     int64
	}
	r.db.Model(&models.Like{}).
		Select("product_id, COUNT(*) as count").
		Where("product_id IN ?", ids).
		Group("product_id").
		Scan(&likeRows)
	for _, row := range likeRows {
		if s, ok := result[row.ProductID]; ok {
			s.TotalLikes = row.Count
		}
	}

	if userID != nil {
		var likedIDs []uint
		r.db.Model(&models.Like{}).
			Where("product_id IN ? AND user_id = ?", ids, *userID).
			Pluck("product_id", &likedIDs)
		for _, id := range likedIDs {
			if s, ok := result[id]; ok {
				s.Liked = true
			}
		}
	}

	return result, nil
}