package middleware

import (
	"crypto/rsa"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTOptional(pubKey *rsa.PublicKey) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header != "" && strings.HasPrefix(header, "Bearer ") {
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return pubKey, nil
			}, jwt.WithValidMethods([]string{"RS256"}))
			if err == nil && token.Valid {
				claims, _ := token.Claims.(jwt.MapClaims)
				if idFloat, ok := claims["user_id"].(float64); ok {
					id := uint(idFloat)
					c.Set("user_id", &id)
				}
				if email, ok := claims["email"].(string); ok {
					c.Set("email", email)
				}
			}
		}
		c.Next()
	}
}

func JWTRequired(pubKey *rsa.PublicKey) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "authentication required"})
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
		id := uint(claims["user_id"].(float64))
		c.Set("user_id", &id)
		c.Set("email", claims["email"].(string))
		c.Next()
	}
}
