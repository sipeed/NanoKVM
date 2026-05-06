package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/config"
)

// Role constants mirrored here to avoid circular imports.
const (
	RoleAdmin    = "admin"
	RoleOperator = "operator"
	RoleViewer   = "viewer"
)

type Token struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// CheckToken allows any authenticated user.
func CheckToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, ok := parseTokenFromContext(c)
		if !ok {
			abortUnauthorized(c)
			return
		}
		// Store username and role for downstream handlers.
		c.Set("username", token.Username)
		c.Set("role", token.Role)
		c.Next()
	}
}

// RequireRole returns a middleware that only allows users with one of the given roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			abortForbidden(c)
			return
		}
		if !allowed[role.(string)] {
			abortForbidden(c)
			return
		}
		c.Next()
	}
}

func CheckLoopbackInternalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		if allowByLoopbackInternalToken(c.Request) {
			c.Next()
			return
		}
		abortUnauthorized(c)
	}
}

func CheckTokenOrLoopbackInternalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, ok := parseTokenFromContext(c)
		if ok {
			c.Set("username", token.Username)
			c.Set("role", token.Role)
			c.Next()
			return
		}
		if allowByLoopbackInternalToken(c.Request) {
			c.Next()
			return
		}
		abortUnauthorized(c)
	}
}

func parseTokenFromContext(c *gin.Context) (*Token, bool) {
	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		c.Set("username", "admin")
		c.Set("role", RoleAdmin)
		return &Token{Username: "admin", Role: RoleAdmin}, true
	}
	cookie, err := c.Cookie("nano-kvm-token")
	if err != nil {
		return nil, false
	}
	token, err := ParseJWT(cookie)
	if err != nil {
		return nil, false
	}
	return token, true
}

func abortUnauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, "unauthorized")
	c.Abort()
}

func abortForbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, "forbidden: insufficient permissions")
	c.Abort()
}

func GenerateJWT(username, role string) (string, error) {
	conf := config.GetInstance()
	expireDuration := time.Duration(conf.JWT.RefreshTokenDuration) * time.Second
	claims := Token{
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireDuration)),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(conf.JWT.SecretKey))
}

func ParseJWT(jwtToken string) (*Token, error) {
	conf := config.GetInstance()
	t, err := jwt.ParseWithClaims(jwtToken, &Token{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(conf.JWT.SecretKey), nil
	})
	if err != nil {
		log.Debugf("parse jwt error: %s", err)
		return nil, err
	}
	if claims, ok := t.Claims.(*Token); ok && t.Valid {
		return claims, nil
	}
	return nil, err
}
