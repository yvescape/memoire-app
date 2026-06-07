package middleware

import (
	"crypto/rsa"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

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
		c.Set("user_id", uint(claims["user_id"].(float64)))
		c.Set("email", claims["email"].(string))
		c.Set("is_staff", claims["is_staff"].(bool))
		c.Next()
	}
}

func AdminRequired(pubKey *rsa.PublicKey) gin.HandlerFunc {
	return func(c *gin.Context) {
		JWTRequired(pubKey)(c)
		if c.IsAborted() {
			return
		}
		isStaff, _ := c.Get("is_staff")
		if !isStaff.(bool) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"detail": "admin access required"})
			return
		}
		c.Next()
	}
}
