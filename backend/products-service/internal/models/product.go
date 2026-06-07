package models

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"size:150;not null" json:"name"`
	Category    string    `gorm:"not null" json:"category"`
	Family      string    `gorm:"not null" json:"family"`
	Gender      string    `gorm:"not null" json:"gender"`
	Price       float64   `gorm:"type:decimal(10,2);not null" json:"price"`
	Size        string    `gorm:"size:20" json:"size"`
	Image       string    `json:"image"`
	Badge       string    `json:"badge"`
	NotesTop    string    `json:"notes_top"`
	NotesHeart  string    `json:"notes_heart"`
	NotesBase   string    `json:"notes_base"`
	Composition string    `gorm:"type:text" json:"composition"`
	Advice      string    `gorm:"type:text" json:"advice"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProductCard struct {
	ID       uint    `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Family   string  `json:"family"`
	Gender   string  `json:"gender"`
	Price    float64 `json:"price"`
	Size     string  `json:"size"`
	Image    string  `json:"image"`
	Badge    string  `json:"badge"`
	Notes    string  `json:"notes"`
}