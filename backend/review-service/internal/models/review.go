package models

import "time"

type Rating struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_rating_user_product" json:"user_id"`
	ProductID uint      `gorm:"not null;uniqueIndex:idx_rating_user_product" json:"product_id"`
	Value     int       `gorm:"not null" json:"value"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	UserEmail string    `gorm:"not null" json:"user_email"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Like struct {
	ProductID uint      `gorm:"primaryKey;not null" json:"product_id"`
	UserID    uint      `gorm:"primaryKey;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// SummaryResponse is the shape returned by both /summary/ and /bulk-summary/
type SummaryResponse struct {
	ProductID     uint    `json:"product_id"`
	AverageRating float64 `json:"average_rating"`
	TotalRatings  int64   `json:"total_ratings"`
	TotalLikes    int64   `json:"total_likes"`
	CommentCount  int64   `json:"comment_count"`
	Liked         bool    `json:"liked"`
}