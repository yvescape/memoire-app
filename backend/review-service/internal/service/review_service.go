package service

import (
	"errors"
	"review-service/internal/models"
	"review-service/internal/repository"
)

type ReviewService struct {
	repo repository.ReviewRepo
}

func NewReviewService(repo repository.ReviewRepo) *ReviewService {
	return &ReviewService{repo: repo}
}

func (s *ReviewService) GetSummary(productID uint, userID *uint) (*models.SummaryResponse, error) {
	ratingCount, ratingAvg, err := s.repo.GetRatingSummary(productID)
	if err != nil {
		return nil, err
	}
	commentCount, err := s.repo.CountComments(productID)
	if err != nil {
		return nil, err
	}
	likeCount, err := s.repo.CountLikes(productID)
	if err != nil {
		return nil, err
	}
	liked := false
	if userID != nil {
		liked, _ = s.repo.UserLiked(productID, *userID)
	}
	return &models.SummaryResponse{
		ProductID:     productID,
		AverageRating: ratingAvg,
		TotalRatings:  ratingCount,
		TotalLikes:    likeCount,
		CommentCount:  commentCount,
		Liked:         liked,
	}, nil
}

func (s *ReviewService) BulkGetSummary(ids []uint, userID *uint) (map[uint]*models.SummaryResponse, error) {
	if len(ids) == 0 {
		return map[uint]*models.SummaryResponse{}, nil
	}
	return s.repo.BulkSummary(ids, userID)
}

func (s *ReviewService) GetComments(productID uint) ([]models.Comment, error) {
	return s.repo.FindCommentsByProduct(productID)
}

func (s *ReviewService) CreateComment(userID uint, email string, productID uint, content string) (*models.Comment, error) {
	_, err := s.repo.FindCommentByUserAndProduct(userID, productID)
	if err == nil {
		return nil, errors.New("you already commented on this product")
	}
	comment := &models.Comment{
		UserID:    userID,
		UserEmail: email,
		ProductID: productID,
		Content:   content,
	}
	if err := s.repo.CreateComment(comment); err != nil {
		return nil, err
	}
	return comment, nil
}

func (s *ReviewService) UpdateComment(userID, productID uint, content string) (*models.Comment, error) {
	comment, err := s.repo.FindCommentByUserAndProduct(userID, productID)
	if err != nil {
		return nil, errors.New("comment not found")
	}
	comment.Content = content
	if err := s.repo.UpdateComment(comment); err != nil {
		return nil, err
	}
	return comment, nil
}

func (s *ReviewService) ToggleLike(productID, userID uint) (bool, error) {
	return s.repo.ToggleLike(productID, userID)
}

func (s *ReviewService) ListAllComments(page, pageSize int, search string) ([]models.Comment, int64, error) {
	return s.repo.ListAllComments(page, pageSize, search)
}

func (s *ReviewService) DeleteComment(commentID uint) error {
	return s.repo.DeleteComment(commentID)
}

func (s *ReviewService) UpsertRating(userID, productID uint, value int) (*models.Rating, error) {
	if value < 1 || value > 5 {
		return nil, errors.New("rating value must be between 1 and 5")
	}
	rating := &models.Rating{
		UserID:    userID,
		ProductID: productID,
		Value:     value,
	}
	if err := s.repo.UpsertRating(rating); err != nil {
		return nil, err
	}
	return rating, nil
}