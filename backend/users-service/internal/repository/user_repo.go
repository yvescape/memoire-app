package repository

import (
	"users-service/internal/models"

	"gorm.io/gorm"
)

type UserRepo interface {
	Create(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id uint) (*models.User, error)
	EmailExists(email string) bool
	UsernameExists(username string) bool
	Update(user *models.User) error
	FindAll() ([]models.User, error)
	ToggleActive(id uint) error
	CreateAuditLog(log *models.UserAuditLog) error
	FindAuditLogs() ([]models.UserAuditLog, error)
}

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) EmailExists(email string) bool {
	var count int64
	r.db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

func (r *UserRepository) UsernameExists(username string) bool {
	var count int64
	r.db.Model(&models.User{}).Where("username = ?", username).Count(&count)
	return count > 0
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) FindAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *UserRepository) ToggleActive(id uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		UpdateColumn("is_active", gorm.Expr("NOT is_active")).Error
}

func (r *UserRepository) CreateAuditLog(log *models.UserAuditLog) error {
	return r.db.Create(log).Error
}

func (r *UserRepository) FindAuditLogs() ([]models.UserAuditLog, error) {
	var logs []models.UserAuditLog
	err := r.db.Preload("User").Order("timestamp desc").Find(&logs).Error
	return logs, err
}
