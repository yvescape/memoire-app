package router

import (
	"crypto/rsa"
	"os"
	"products-service/internal/handler"
	"products-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.ProductHandler, pubKey *rsa.PublicKey) *gin.Engine {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Authorization,Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	_ = os.Getenv // suppress unused import warning

	r.GET("/health/", handler.Health)

	// Public routes
	r.GET("/", h.List)
	r.GET("/:id/", h.Detail)

	// Admin routes (is_staff required)
	admin := r.Group("/")
	admin.Use(middleware.AdminRequired(pubKey))
	{
		admin.POST("/", h.Create)
		admin.PUT("/:id/", h.Update)
		admin.PATCH("/:id/", h.Update)
		admin.DELETE("/:id/", h.Delete)
	}

	return r
}
