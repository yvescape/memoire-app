package repository

import (
	"products-service/internal/models"

	"gorm.io/gorm"
)

type ProductRepo interface {
	FindAll(page, pageSize int, search string) ([]models.Product, int64, error)
	FindByID(id uint) (*models.Product, error)
	Create(product *models.Product) error
	Update(product *models.Product) error
	Delete(id uint) error
}

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) FindAll(page, pageSize int, search string) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	query := r.db.Model(&models.Product{})
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR category ILIKE ? OR family ILIKE ?", like, like, like)
	}
	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Find(&products).Error
	return products, total, err
}

func (r *ProductRepository) FindByID(id uint) (*models.Product, error) {
	var product models.Product
	err := r.db.First(&product, id).Error
	return &product, err
}

func (r *ProductRepository) Create(product *models.Product) error {
	return r.db.Create(product).Error
}

func (r *ProductRepository) Update(product *models.Product) error {
	return r.db.Save(product).Error
}

func (r *ProductRepository) Delete(id uint) error {
	return r.db.Delete(&models.Product{}, id).Error
}