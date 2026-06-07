package main

import (
	"log"
	"os"

	"api-gateway/internal/router"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	pubKeyPEM := os.Getenv("JWT_PUBLIC_KEY")
	if pubKeyPEM == "" {
		log.Fatal("JWT_PUBLIC_KEY env var required")
	}
	pubKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(pubKeyPEM))
	if err != nil {
		log.Fatalf("failed to parse public key: %v", err)
	}

	r := router.Setup(pubKey)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("api-gateway starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
