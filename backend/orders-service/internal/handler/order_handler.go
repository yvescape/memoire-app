package handler

import (
	"net/http"
	"orders-service/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	svc *service.OrderService
}

func NewOrderHandler(svc *service.OrderService) *OrderHandler {
	return &OrderHandler{svc: svc}
}

func resolveIdentity(c *gin.Context) (userID *uint, sessionID *string) {
	if uid, exists := c.Get("user_id"); exists && uid != nil {
		userID = uid.(*uint)
	}
	if sid := c.Query("session_id"); sid != "" {
		sessionID = &sid
	}
	return
}

func (h *OrderHandler) ListOrders(c *gin.Context) {
	userID, sessionID := resolveIdentity(c)
	orders, err := h.svc.GetOrders(userID, sessionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) OrderDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	order, err := h.svc.GetOrder(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) ConfirmOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	order, err := h.svc.ConfirmOrder(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) CancelOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.CancelOrder(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"detail": "order cancelled"})
}

func (h *OrderHandler) ClaimOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var body struct {
		SessionID string `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	if err := h.svc.ClaimGuestOrders(body.SessionID, *userID.(*uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"detail": "orders claimed"})
}

func (h *OrderHandler) CartCount(c *gin.Context) {
	userID, sessionID := resolveIdentity(c)
	count, err := h.svc.CartCount(userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// --- Items ---

func (h *OrderHandler) ListCartItems(c *gin.Context) {
	userID, sessionID := resolveIdentity(c)
	items, err := h.svc.GetCartItems(userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *OrderHandler) AddCartItem(c *gin.Context) {
	userID, _ := resolveIdentity(c)
	var input service.AddItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	item, err := h.svc.AddItem(userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *OrderHandler) UpdateItemQuantity(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	var body struct {
		Action string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	item, err := h.svc.UpdateItemQuantity(uint(id), body.Action)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	if item == nil {
		c.JSON(http.StatusOK, gin.H{"detail": "item removed"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *OrderHandler) DeleteCartItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.DeleteItem(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *OrderHandler) CheckProductInCart(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("product_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid product_id"})
		return
	}
	userID, sessionID := resolveIdentity(c)
	result := h.svc.CheckProductInCart(uint(productID), userID, sessionID)
	c.JSON(http.StatusOK, result)
}

// --- Cart item by ID ---

func (h *OrderHandler) GetCartItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	item, err := h.svc.GetCartItemByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "item not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// --- Address ---

func (h *OrderHandler) GetAddress(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	addr, err := h.svc.GetAddressByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "address not found"})
		return
	}
	c.JSON(http.StatusOK, addr)
}

func (h *OrderHandler) DeleteAddress(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.DeleteAddress(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "address not found"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *OrderHandler) SaveAddress(c *gin.Context) {
	userID, _ := resolveIdentity(c)
	var input service.AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	addr, err := h.svc.SaveAddress(userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, addr)
}

// --- Delivery options (public) ---

func (h *OrderHandler) ListDeliveryOptions(c *gin.Context) {
	opts, err := h.svc.GetDeliveryOptions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, opts)
}

// --- Delivery options (admin) ---

func (h *OrderHandler) AdminListDeliveryOptions(c *gin.Context) {
	opts, err := h.svc.GetAllDeliveryOptions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, opts)
}

func (h *OrderHandler) CreateDeliveryOption(c *gin.Context) {
	var input service.DeliveryOptionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	opt, err := h.svc.CreateDeliveryOption(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, opt)
}

func (h *OrderHandler) UpdateDeliveryOption(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	var input service.DeliveryOptionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	opt, err := h.svc.UpdateDeliveryOptionAdmin(uint(id), input)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, opt)
}

func (h *OrderHandler) DeleteDeliveryOption(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.DeleteDeliveryOption(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *OrderHandler) GetDeliveryOption(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	opt, err := h.svc.GetDeliveryOption(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "delivery option not found"})
		return
	}
	c.JSON(http.StatusOK, opt)
}

// --- Pricing ---

func (h *OrderHandler) GetPricing(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid order_id"})
		return
	}
	pricing, err := h.svc.GetPricing(uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pricing)
}

func (h *OrderHandler) UpdateDelivery(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid order_id"})
		return
	}
	var body struct {
		DeliveryOptionID uint `json:"delivery_option_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	pricing, err := h.svc.UpdateDeliveryOption(uint(orderID), body.DeliveryOptionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pricing)
}

// --- Internal ---

func (h *OrderHandler) InternalConfirm(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.InternalConfirm(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"detail": "confirmed"})
}

func (h *OrderHandler) InternalCancel(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.InternalCancel(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"detail": "cancelled"})
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "orders"})
}
