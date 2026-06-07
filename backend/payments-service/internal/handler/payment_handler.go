package handler

import (
	"net/http"
	"payments-service/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	svc *service.PaymentService
}

func NewPaymentHandler(svc *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var input service.PaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	var userID *uint
	if uid, exists := c.Get("user_id"); exists && uid != nil {
		userID = uid.(*uint)
	}
	payment, err := h.svc.ProcessPayment(input, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	if payment.Status == "failed" {
		c.JSON(http.StatusPaymentRequired, payment)
		return
	}
	c.JSON(http.StatusCreated, payment)
}

func (h *PaymentHandler) GetPayment(c *gin.Context) {
	ref := c.Param("ref")
	payment, err := h.svc.GetPayment(ref)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "payment not found"})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func (h *PaymentHandler) ListPayments(c *gin.Context) {
	var pricingID *uint
	if raw := c.Query("order_pricing_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err == nil {
			uid := uint(id)
			pricingID = &uid
		}
	}
	payments, err := h.svc.ListPayments(pricingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payments)
}

func (h *PaymentHandler) ListCards(c *gin.Context) {
	userID := c.MustGet("user_id").(*uint)
	cards, err := h.svc.GetSavedCards(*userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cards)
}

func (h *PaymentHandler) DeleteCard(c *gin.Context) {
	userID := c.MustGet("user_id").(*uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.DeleteCard(uint(id), *userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "card not found"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "payments"})
}
