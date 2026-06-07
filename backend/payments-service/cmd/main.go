package main

import (
	"log"
	"os"
	"payments-service/internal/handler"
	"payments-service/internal/models"
	"payments-service/internal/repository"
	"payments-service/internal/router"
	"payments-service/internal/service"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user password=pass dbname=payments_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.Payment{}, &models.SavedPrepaidCard{}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	pubKeyPEM := os.Getenv("JWT_PUBLIC_KEY")
	if pubKeyPEM == "" {
		log.Fatal("JWT_PUBLIC_KEY env var required")
	}
	pubKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(pubKeyPEM))
	if err != nil {
		log.Fatalf("failed to parse public key: %v", err)
	}

	repo := repository.NewPaymentRepository(db)
	svc := service.NewPaymentService(repo)
	h := handler.NewPaymentHandler(svc)

	r := router.Setup(h, pubKey)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8004"
	}
	log.Printf("payments-service starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
