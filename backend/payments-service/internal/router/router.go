package router

import (
	"crypto/rsa"
	"payments-service/internal/handler"
	"payments-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.PaymentHandler, pubKey *rsa.PublicKey) *gin.Engine {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Authorization,Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health/", handler.Health)

	public := r.Group("/")
	public.Use(middleware.JWTOptional(pubKey))
	{
		public.POST("/create/", h.CreatePayment)
	}

	auth := r.Group("/")
	auth.Use(middleware.JWTRequired(pubKey))
	{
		auth.GET("/list/", h.ListPayments)
		auth.GET("/:ref/", h.GetPayment)
		auth.GET("/saved-cards/", h.ListCards)
		auth.DELETE("/saved-cards/:id/", h.DeleteCard)
	}

	return r
}
