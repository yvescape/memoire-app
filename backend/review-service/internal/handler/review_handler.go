package handler

import (
	"net/http"
	"review-service/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReviewHandler struct {
	svc *service.ReviewService
}

func NewReviewHandler(svc *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{svc: svc}
}

func parseProductID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("product_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid product_id"})
		return 0, false
	}
	return uint(id), true
}

func getUserID(c *gin.Context) *uint {
	val, exists := c.Get("user_id")
	if !exists {
		return nil
	}
	id, ok := val.(*uint)
	if !ok {
		return nil
	}
	return id
}

func (h *ReviewHandler) Summary(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	userID := getUserID(c)
	summary, err := h.svc.GetSummary(productID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *ReviewHandler) BulkSummary(c *gin.Context) {
	var body struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	userID := getUserID(c)
	summaries, err := h.svc.BulkGetSummary(body.IDs, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summaries)
}

func (h *ReviewHandler) ListComments(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	comments, err := h.svc.GetComments(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func (h *ReviewHandler) CreateComment(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	userID := c.MustGet("user_id").(*uint)
	email, _ := c.Get("email")
	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	emailStr, _ := email.(string)
	comment, err := h.svc.CreateComment(*userID, emailStr, productID, body.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, comment)
}

func (h *ReviewHandler) UpdateComment(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	userID := c.MustGet("user_id").(*uint)
	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	comment, err := h.svc.UpdateComment(*userID, productID, body.Content)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comment)
}

func (h *ReviewHandler) ToggleLike(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	userID := c.MustGet("user_id").(*uint)
	liked, err := h.svc.ToggleLike(productID, *userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": liked})
}

func (h *ReviewHandler) CreateOrUpdateRating(c *gin.Context) {
	productID, ok := parseProductID(c)
	if !ok {
		return
	}
	userID := c.MustGet("user_id").(*uint)
	var body struct {
		Value int `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	rating, err := h.svc.UpsertRating(*userID, productID, body.Value)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rating)
}

func (h *ReviewHandler) AdminListReviews(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	comments, total, err := h.svc.ListAllComments(page, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"results": comments, "count": total})
}

func (h *ReviewHandler) AdminDeleteComment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid id"})
		return
	}
	if err := h.svc.DeleteComment(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "reviews"})
}