package testutil

import "orders-service/internal/models"

type MockOrderRepo struct {
	ReturnOrder        *models.Order
	ReturnOrders       []models.Order
	ReturnItem         *models.OrderItem
	ReturnAddress      *models.OrderAddress
	ReturnDeliveryOpt  *models.DeliveryOption
	ReturnDeliveryOpts []models.DeliveryOption
	ReturnCount        int64
	ReturnError        error
}

func (m *MockOrderRepo) FindByUserID(userID uint) ([]models.Order, error) {
	return m.ReturnOrders, m.ReturnError
}

func (m *MockOrderRepo) FindBySessionID(sessionID string) ([]models.Order, error) {
	return m.ReturnOrders, m.ReturnError
}

func (m *MockOrderRepo) FindByID(id uint) (*models.Order, error) {
	return m.ReturnOrder, m.ReturnError
}

func (m *MockOrderRepo) Create(order *models.Order) error {
	return m.ReturnError
}

func (m *MockOrderRepo) Save(order *models.Order) error {
	return m.ReturnError
}

func (m *MockOrderRepo) UpdateStatus(id uint, status models.OrderStatus) error {
	return m.ReturnError
}

func (m *MockOrderRepo) ClaimGuestOrders(sessionID string, userID uint) error {
	return m.ReturnError
}

func (m *MockOrderRepo) FindCartOrder(userID *uint, sessionID *string) (*models.Order, error) {
	return m.ReturnOrder, m.ReturnError
}

func (m *MockOrderRepo) FindItemByID(itemID uint) (*models.OrderItem, error) {
	return m.ReturnItem, m.ReturnError
}

func (m *MockOrderRepo) FindItemByProductAndOrder(productID, orderID uint) (*models.OrderItem, error) {
	return m.ReturnItem, m.ReturnError
}

func (m *MockOrderRepo) SaveItem(item *models.OrderItem) error {
	return m.ReturnError
}

func (m *MockOrderRepo) DeleteItem(itemID uint) error {
	return m.ReturnError
}

func (m *MockOrderRepo) CountCartItems(userID *uint, sessionID *string) (int64, error) {
	return m.ReturnCount, m.ReturnError
}

func (m *MockOrderRepo) SaveAddress(addr *models.OrderAddress) error {
	return m.ReturnError
}

func (m *MockOrderRepo) FindAddressByID(id uint) (*models.OrderAddress, error) {
	return m.ReturnAddress, m.ReturnError
}

func (m *MockOrderRepo) DeleteAddress(id uint) error {
	return m.ReturnError
}

func (m *MockOrderRepo) FindActiveDeliveryOptions() ([]models.DeliveryOption, error) {
	return m.ReturnDeliveryOpts, m.ReturnError
}

func (m *MockOrderRepo) FindDefaultDelivery() (*models.DeliveryOption, error) {
	return m.ReturnDeliveryOpt, m.ReturnError
}

func (m *MockOrderRepo) FindDeliveryByID(id uint) (*models.DeliveryOption, error) {
	return m.ReturnDeliveryOpt, m.ReturnError
}

func (m *MockOrderRepo) CreateDeliveryOption(opt *models.DeliveryOption) error {
	return m.ReturnError
}

func (m *MockOrderRepo) UpdateDeliveryOption(opt *models.DeliveryOption) error {
	return m.ReturnError
}

func (m *MockOrderRepo) DeleteDeliveryOption(id uint) error {
	return m.ReturnError
}

func (m *MockOrderRepo) FindAllDeliveryOptions() ([]models.DeliveryOption, error) {
	return m.ReturnDeliveryOpts, m.ReturnError
}

func (m *MockOrderRepo) SavePricing(pricing *models.OrderPricing) error {
	return m.ReturnError
}

func (m *MockOrderRepo) RecalcPricing(orderID uint) error {
	return m.ReturnError
}