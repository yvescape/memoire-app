package router

import (
	"crypto/rsa"
	"users-service/internal/handler"
	"users-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.UserHandler, pubKey *rsa.PublicKey) *gin.Engine {
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

	r.GET("/health/", handler.Health)

	r.POST("/register/", h.Register)
	r.POST("/", h.Login)
	r.POST("/token/refresh/", h.RefreshToken)

	auth := r.Group("/")
	auth.Use(middleware.JWTRequired(pubKey))
	{
		auth.GET("/me/", h.Me)
		auth.PUT("/update/", h.UpdateMe)
		auth.PATCH("/update/", h.UpdateMe)
	}

	admin := r.Group("/")
	admin.Use(middleware.AdminRequired(pubKey))
	{
		admin.GET("/list/", h.ListUsers)
		admin.PATCH("/:id/toggle/", h.ToggleActive)
		admin.GET("/audit-logs/", h.AuditLogs)
	}

	return r
}
