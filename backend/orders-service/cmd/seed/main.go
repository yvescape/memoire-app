package main

import (
	"log"
	"os"
	"orders-service/internal/models"

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

	var count int64
	db.Model(&models.DeliveryOption{}).Count(&count)
	if count > 0 {
		log.Printf("seed skipped: %d delivery options already exist", count)
		return
	}

	options := []models.DeliveryOption{
		{
			Name:        "Livraison standard",
			Description: "3–5 jours ouvrés",
			Amount:      1500.00,
			Currency:    "XOF",
			Position:    1,
			IsActive:    true,
			IsDefault:   true,
		},
		{
			Name:        "Livraison express",
			Description: "24–48 heures ouvrées",
			Amount:      3000.00,
			Currency:    "XOF",
			Position:    2,
			IsActive:    true,
			IsDefault:   false,
		},
	}

	result := db.Create(&options)
	if result.Error != nil {
		log.Fatalf("seed failed: %v", result.Error)
	}

	log.Printf("seed completed: %d delivery options inserted", result.RowsAffected)
}
