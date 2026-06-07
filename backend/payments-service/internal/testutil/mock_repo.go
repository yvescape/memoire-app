package testutil

import "payments-service/internal/models"

type MockPaymentRepo struct {
	ReturnPayment  *models.Payment
	ReturnPayments []models.Payment
	ReturnCards    []models.SavedPrepaidCard
	ReturnError    error
}

func (m *MockPaymentRepo) Create(payment *models.Payment) error {
	return m.ReturnError
}

func (m *MockPaymentRepo) FindByTransactionRef(ref string) (*models.Payment, error) {
	return m.ReturnPayment, m.ReturnError
}

func (m *MockPaymentRepo) FindByUserOrders(orderIDs []uint) ([]models.Payment, error) {
	return m.ReturnPayments, m.ReturnError
}

func (m *MockPaymentRepo) FindAll() ([]models.Payment, error) {
	return m.ReturnPayments, m.ReturnError
}

func (m *MockPaymentRepo) FindByOrderPricingID(pricingID uint) ([]models.Payment, error) {
	return m.ReturnPayments, m.ReturnError
}

func (m *MockPaymentRepo) SaveCard(card *models.SavedPrepaidCard) error {
	return m.ReturnError
}

func (m *MockPaymentRepo) FindCardsByUser(userID uint) ([]models.SavedPrepaidCard, error) {
	return m.ReturnCards, m.ReturnError
}

func (m *MockPaymentRepo) DeleteCard(id, userID uint) error {
	return m.ReturnError
}