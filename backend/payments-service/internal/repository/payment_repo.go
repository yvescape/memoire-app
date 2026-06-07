package repository

import (
	"payments-service/internal/models"

	"gorm.io/gorm"
)

type PaymentRepo interface {
	Create(payment *models.Payment) error
	FindByTransactionRef(ref string) (*models.Payment, error)
	FindByUserOrders(orderIDs []uint) ([]models.Payment, error)
	FindAll() ([]models.Payment, error)
	FindByOrderPricingID(pricingID uint) ([]models.Payment, error)
	SaveCard(card *models.SavedPrepaidCard) error
	FindCardsByUser(userID uint) ([]models.SavedPrepaidCard, error)
	DeleteCard(id, userID uint) error
}

type PaymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(payment *models.Payment) error {
	return r.db.Create(payment).Error
}

func (r *PaymentRepository) FindByTransactionRef(ref string) (*models.Payment, error) {
	var p models.Payment
	err := r.db.Where("transaction_reference = ?", ref).First(&p).Error
	return &p, err
}

func (r *PaymentRepository) FindByUserOrders(orderIDs []uint) ([]models.Payment, error) {
	var payments []models.Payment
	err := r.db.Where("order_id IN ?", orderIDs).Order("created_at desc").Find(&payments).Error
	return payments, err
}

func (r *PaymentRepository) FindAll() ([]models.Payment, error) {
	var payments []models.Payment
	err := r.db.Order("created_at desc").Find(&payments).Error
	return payments, err
}

func (r *PaymentRepository) FindByOrderPricingID(pricingID uint) ([]models.Payment, error) {
	var payments []models.Payment
	err := r.db.Where("order_pricing_id = ?", pricingID).Order("created_at desc").Find(&payments).Error
	return payments, err
}

func (r *PaymentRepository) SaveCard(card *models.SavedPrepaidCard) error {
	return r.db.Create(card).Error
}

func (r *PaymentRepository) FindCardsByUser(userID uint) ([]models.SavedPrepaidCard, error) {
	var cards []models.SavedPrepaidCard
	err := r.db.Where("user_id = ?", userID).Find(&cards).Error
	return cards, err
}

func (r *PaymentRepository) DeleteCard(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.SavedPrepaidCard{}).Error
}
