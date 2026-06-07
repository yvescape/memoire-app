package router

import (
	"api-gateway/internal/handler"
	"api-gateway/internal/middleware"
	"crypto/rsa"
	"os"

	"github.com/gin-gonic/gin"
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func Setup(pubKey *rsa.PublicKey) *gin.Engine {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Authorization,Content-Type,X-Internal-Token")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.Use(middleware.RateLimit())
	r.Use(middleware.ForwardJWT(pubKey))

	r.GET("/health/", handler.Health)

	usersURL := getEnv("USERS_SERVICE_URL", "http://users:8001")
	productsURL := getEnv("PRODUCTS_SERVICE_URL", "http://products:8002")
	ordersURL := getEnv("ORDERS_SERVICE_URL", "http://orders:8003")
	paymentsURL := getEnv("PAYMENTS_SERVICE_URL", "http://payments:8004")
	reviewsURL := getEnv("REVIEWS_SERVICE_URL", "http://reviews:8005")

	// Users service
	r.Any("/api/auth/*path", handler.ReverseProxy(usersURL))

	// Products service
	r.Any("/api/products/*path", handler.ReverseProxy(productsURL))

	// Orders service
	r.Any("/api/orders/*path", handler.ReverseProxy(ordersURL))

	// Payments service
	r.Any("/api/payments/*path", handler.ReverseProxy(paymentsURL))

	// Reviews service (both routes point to the same service)
	r.Any("/api/reviews/*path", handler.ReverseProxy(reviewsURL))
	r.Any("/api/interation/*path", handler.ReverseProxy(reviewsURL))

	return r
}
