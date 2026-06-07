package models

import (
	"math/rand"
	"time"
)

type PaymentStatus string

const (
	PaymentSuccess PaymentStatus = "success"
	PaymentFailed  PaymentStatus = "failed"
)

type Payment struct {
	ID                   uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderPricingID       uint          `gorm:"not null" json:"order_pricing_id"`
	OrderID              uint          `gorm:"not null" json:"order_id"`
	Amount               float64       `gorm:"type:decimal(10,0);not null" json:"amount"`
	Currency             string        `gorm:"default:FCFA" json:"currency"`
	Status               PaymentStatus `gorm:"not null" json:"status"`
	TransactionReference string        `gorm:"uniqueIndex;not null" json:"transaction_reference"`
	CreatedAt            time.Time     `json:"created_at"`
}

type SavedPrepaidCard struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID         uint      `gorm:"not null" json:"user_id"`
	CardHolder     string    `gorm:"not null" json:"card_holder"`
	MaskedNumber   string    `gorm:"not null" json:"masked_card_number"` // e.g. "**** **** **** 1234"
	ExpirationDate string    `gorm:"not null" json:"expiration_date"`
	CreatedAt      time.Time `json:"created_at"`
}

func GenerateTransactionRef() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, 16)
	for i := range b {
		b[i] = chars[r.Intn(len(chars))]
	}
	return string(b)
}

func MaskCardNumber(number string) string {
	cleaned := ""
	for _, ch := range number {
		if ch >= '0' && ch <= '9' {
			cleaned += string(ch)
		}
	}
	if len(cleaned) < 4 {
		return "**** **** **** ****"
	}
	last4 := cleaned[len(cleaned)-4:]
	return "**** **** **** " + last4
}

// SimulateCardValidation: 16-digit card number = success, otherwise failed.
func SimulateCardValidation(cardNumber string) bool {
	digits := ""
	for _, ch := range cardNumber {
		if ch >= '0' && ch <= '9' {
			digits += string(ch)
		}
	}
	return len(digits) == 16
}
