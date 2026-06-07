package main

import (
	"log"
	"os"
	"orders-service/internal/handler"
	"orders-service/internal/models"
	"orders-service/internal/repository"
	"orders-service/internal/router"
	"orders-service/internal/service"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user password=pass dbname=orders_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.DeliveryOption{},
		&models.Order{},
		&models.OrderItem{},
		&models.OrderAddress{},
		&models.OrderPricing{},
	); err != nil {
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

	repo := repository.NewOrderRepository(db)
	svc := service.NewOrderService(repo)
	h := handler.NewOrderHandler(svc)

	r := router.Setup(h, pubKey)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}
	log.Printf("orders-service starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
