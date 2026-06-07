package main

import (
	"log"
	"os"
	"users-service/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user_admin password=pass123 dbname=users_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.UserAuditLog{}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	email := "capeyves@gmail.com"
	username := "capeyves"
	password := "1234"

	var existing models.User
	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
		existing.IsStaff = true
		existing.IsActive = true
		existing.IsEmailVerified = true
		if err := db.Save(&existing).Error; err != nil {
			log.Fatalf("failed to update existing user: %v", err)
		}
		log.Printf("superuser already exists — mis à jour: %s (%s)", existing.Username, existing.Email)
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	admin := models.User{
		Email:           email,
		Username:        username,
		Password:        string(hashed),
		IsActive:        true,
		IsStaff:         true,
		IsEmailVerified: true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("failed to create superuser: %v", err)
	}

	log.Printf("superuser créé avec succès: %s (%s) [id=%d]", admin.Username, admin.Email, admin.ID)
}
