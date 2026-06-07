package main

import (
	"log"
	"os"
	"products-service/internal/handler"
	"products-service/internal/models"
	"products-service/internal/repository"
	"products-service/internal/router"
	"products-service/internal/service"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user password=pass dbname=products_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.Product{}); err != nil {
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

	repo := repository.NewProductRepository(db)
	svc := service.NewProductService(repo)
	h := handler.NewProductHandler(svc)

	r := router.Setup(h, pubKey)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}
	log.Printf("products-service starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
