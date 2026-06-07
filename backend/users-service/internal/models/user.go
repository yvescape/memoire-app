package models

import "time"

type User struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	Username        string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	FirstName       string    `gorm:"size:100" json:"first_name"`
	LastName        string    `gorm:"size:100" json:"last_name"`
	Password        string    `gorm:"not null" json:"-"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	IsStaff         bool      `gorm:"default:false" json:"is_staff"`
	IsEmailVerified bool      `gorm:"default:false" json:"is_email_verified"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserAuditLog struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Action    string    `gorm:"not null" json:"action"` // CREATE, UPDATE, DELETE, LOGIN
	IPAddress string    `json:"ip_address"`
	Timestamp time.Time `gorm:"autoCreateTime" json:"timestamp"`
}
