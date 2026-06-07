package router

import (
	"crypto/rsa"
	"orders-service/internal/handler"
	"orders-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.OrderHandler, pubKey *rsa.PublicKey) *gin.Engine {
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

	r.GET("/health/", handler.Health)

	// Routes publiques (JWT optionnel — accepte authentifié et invité)
	public := r.Group("/")
	public.Use(middleware.JWTOptional(pubKey))
	{
		public.GET("/my/", h.ListOrders)
		public.GET("/:id/", h.OrderDetail)
		public.PATCH("/:id/confirm/", h.ConfirmOrder)
		public.PATCH("/:id/cancel/", h.CancelOrder)
		public.GET("/cart/count/", h.CartCount)

		public.GET("/orders_item/cart/items/", h.ListCartItems)
		public.POST("/orders_item/cart/items/", h.AddCartItem)
		public.GET("/orders_item/cart/items/:id/", h.GetCartItem)
		public.PATCH("/orders_item/cart/items/:id/quantity/", h.UpdateItemQuantity)
		public.DELETE("/orders_item/cart/items/:id/", h.DeleteCartItem)
		public.GET("/orders_item/check/:product_id/", h.CheckProductInCart)

		public.POST("/orders_address/", h.SaveAddress)
		public.PATCH("/orders_address/", h.SaveAddress)
		public.GET("/orders_address/:id/", h.GetAddress)
		public.DELETE("/orders_address/:id/", h.DeleteAddress)

		public.GET("/delivery-options/", h.ListDeliveryOptions)
		public.GET("/delivery-options/:id/", h.GetDeliveryOption)

		public.GET("/:id/pricing/", h.GetPricing)
		public.PATCH("/:id/pricing/delivery/", h.UpdateDelivery)
	}

	// Routes authentifiées
	authRequired := r.Group("/")
	authRequired.Use(middleware.JWTRequired(pubKey))
	{
		authRequired.PATCH("/claim/", h.ClaimOrders)
	}

	// Routes admin (is_staff)
	admin := r.Group("/admin")
	admin.Use(middleware.AdminRequired(pubKey))
	{
		admin.GET("/delivery-options/", h.AdminListDeliveryOptions)
		admin.POST("/delivery-options/", h.CreateDeliveryOption)
		admin.PUT("/delivery-options/:id/", h.UpdateDeliveryOption)
		admin.PATCH("/delivery-options/:id/", h.UpdateDeliveryOption)
		admin.DELETE("/delivery-options/:id/", h.DeleteDeliveryOption)
	}

	// Routes internes (X-Internal-Token)
	internal := r.Group("/internal")
	internal.Use(middleware.InternalTokenRequired())
	{
		internal.PATCH("/:id/confirm/", h.InternalConfirm)
		internal.PATCH("/:id/cancel/", h.InternalCancel)
	}

	return r
}
