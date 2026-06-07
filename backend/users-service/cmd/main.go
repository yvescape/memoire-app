package main

import (
	"log"
	"os"
	"users-service/internal/handler"
	"users-service/internal/models"
	"users-service/internal/repository"
	"users-service/internal/router"
	"users-service/internal/service"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user password=pass dbname=users_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.UserAuditLog{}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	privateKeyPEM := os.Getenv("JWT_PRIVATE_KEY")
	if privateKeyPEM == "" {
		log.Fatal("JWT_PRIVATE_KEY env var required")
	}
	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(privateKeyPEM))
	if err != nil {
		log.Fatalf("failed to parse private key: %v", err)
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo, privateKey)
	h := handler.NewUserHandler(svc)

	r := router.Setup(h, &privateKey.PublicKey)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}
	log.Printf("users-service starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
