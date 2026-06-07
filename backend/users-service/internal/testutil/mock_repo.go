package testutil

import "users-service/internal/models"

type MockUserRepo struct {
	ReturnUser      *models.User
	ReturnUsers     []models.User
	ReturnAuditLogs []models.UserAuditLog
	ReturnError     error
	EmailExistsVal  bool
	UsernameExistsVal bool
}

func (m *MockUserRepo) Create(user *models.User) error {
	return m.ReturnError
}

func (m *MockUserRepo) FindByEmail(email string) (*models.User, error) {
	return m.ReturnUser, m.ReturnError
}

func (m *MockUserRepo) FindByID(id uint) (*models.User, error) {
	return m.ReturnUser, m.ReturnError
}

func (m *MockUserRepo) EmailExists(email string) bool {
	return m.EmailExistsVal
}

func (m *MockUserRepo) UsernameExists(username string) bool {
	return m.UsernameExistsVal
}

func (m *MockUserRepo) Update(user *models.User) error {
	return m.ReturnError
}

func (m *MockUserRepo) FindAll() ([]models.User, error) {
	return m.ReturnUsers, m.ReturnError
}

func (m *MockUserRepo) ToggleActive(id uint) error {
	return m.ReturnError
}

func (m *MockUserRepo) CreateAuditLog(log *models.UserAuditLog) error {
	return m.ReturnError
}

func (m *MockUserRepo) FindAuditLogs() ([]models.UserAuditLog, error) {
	return m.ReturnAuditLogs, m.ReturnError
}