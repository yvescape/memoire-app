package models

import "time"

type OrderStatus string

const (
	StatusPending   OrderStatus = "pending"
	StatusConfirmed OrderStatus = "confirmed"
	StatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID        uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    *uint       `json:"user_id"`
	SessionID *string     `gorm:"size:100" json:"session_id"`
	Status    OrderStatus `gorm:"default:pending" json:"status"`
	Items     []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	Address   *OrderAddress `gorm:"foreignKey:OrderID" json:"address"`
	Pricing   *OrderPricing `gorm:"foreignKey:OrderID" json:"pricing"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID      uint    `gorm:"not null" json:"order_id"`
	ProductID    uint    `gorm:"not null" json:"product_id"`
	ProductName  string  `gorm:"not null" json:"product_name"`
	ProductImage string  `json:"product_image"`
	ProductSize  string  `json:"product_size"`
	Price        float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	Quantity     int     `gorm:"not null;default:1" json:"quantity"`
	Total        float64 `gorm:"type:decimal(10,2)" json:"total"`
}

type OrderAddress struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID     uint   `gorm:"uniqueIndex;not null" json:"order_id"`
	FirstName   string `gorm:"not null" json:"first_name"`
	LastName    string `gorm:"not null" json:"last_name"`
	Email       string `json:"email"`
	Mobile      string `gorm:"not null" json:"mobile"`
	City        string `gorm:"not null" json:"city"`
	AddressLine string `json:"address_line"`
}

type OrderPricing struct {
	ID              uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID         uint            `gorm:"uniqueIndex;not null" json:"order_id"`
	DeliveryOptionID *uint          `json:"delivery_option_id"`
	DeliveryOption  *DeliveryOption `gorm:"foreignKey:DeliveryOptionID" json:"delivery_option"`
	Subtotal        float64         `gorm:"type:decimal(10,2)" json:"subtotal"`
	DeliveryPrice   float64         `gorm:"type:decimal(10,2)" json:"delivery_price"`
	Total           float64         `gorm:"type:decimal(10,2)" json:"total"`
	Currency        string          `gorm:"default:FCFA" json:"currency"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type DeliveryOption struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Amount      float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	Currency    string    `gorm:"default:XOF" json:"currency"`
	Position    int       `gorm:"default:0" json:"position"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
}