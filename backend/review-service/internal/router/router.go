package router

import (
	"crypto/rsa"
	"review-service/internal/handler"
	"review-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.ReviewHandler, pubKey *rsa.PublicKey) *gin.Engine {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Authorization,Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health/", handler.Health)

	// Bulk summary — optional auth to include liked status
	bulk := r.Group("/bulk-summary")
	bulk.Use(middleware.JWTOptional(pubKey))
	bulk.POST("/", h.BulkSummary)

	public := r.Group("/:product_id")
	public.Use(middleware.JWTOptional(pubKey))
	{
		public.GET("/summary/", h.Summary)
		public.GET("/comments/", h.ListComments)
	}

	auth := r.Group("/:product_id")
	auth.Use(middleware.JWTRequired(pubKey))
	{
		auth.POST("/comments/create/", h.CreateComment)
		auth.PATCH("/comments/update/", h.UpdateComment)
		auth.POST("/toggle-like/", h.ToggleLike)
		auth.POST("/rating/", h.CreateOrUpdateRating)
	}

	admin := r.Group("/")
	admin.Use(middleware.AdminRequired(pubKey))
	{
		admin.GET("/reviews/", h.AdminListReviews)
		admin.DELETE("/:product_id/comments/delete/:id/", h.AdminDeleteComment)
	}

	return r
}