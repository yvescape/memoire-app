package testutil

import "products-service/internal/models"

type MockProductRepo struct {
	ReturnProducts []models.Product
	ReturnProduct  *models.Product
	ReturnTotal    int64
	ReturnError    error
}

func (m *MockProductRepo) FindAll(page, pageSize int, search string) ([]models.Product, int64, error) {
	return m.ReturnProducts, m.ReturnTotal, m.ReturnError
}

func (m *MockProductRepo) FindByID(id uint) (*models.Product, error) {
	return m.ReturnProduct, m.ReturnError
}

func (m *MockProductRepo) Create(product *models.Product) error {
	return m.ReturnError
}

func (m *MockProductRepo) Update(product *models.Product) error {
	return m.ReturnError
}

func (m *MockProductRepo) Delete(id uint) error {
	return m.ReturnError
}
