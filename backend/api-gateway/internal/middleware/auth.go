package middleware

import (
	"crypto/rsa"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ForwardJWT validates JWT if present and injects X-User-ID / X-User-Email for downstream services.
func ForwardJWT(pubKey *rsa.PublicKey) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.Next()
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return pubKey, nil
		}, jwt.WithValidMethods([]string{"RS256"}))
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "invalid token"})
			return
		}
		claims, _ := token.Claims.(jwt.MapClaims)
		if id, ok := claims["user_id"].(float64); ok {
			c.Request.Header.Set("X-User-ID", fmt.Sprintf("%d", uint(id)))
		}
		if email, ok := claims["email"].(string); ok {
			c.Request.Header.Set("X-User-Email", email)
		}
		c.Next()
	}
}
