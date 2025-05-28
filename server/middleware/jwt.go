package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/config"
)

type Token struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func CheckToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		conf := config.GetInstance()

		if conf.Authentication == "disable" {
			c.Next()
			return
		}

		cookie, err := c.Cookie("nano-kvm-token")
		if err == nil {
			_, err = ParseJWT(cookie)
			if err == nil {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusUnauthorized, "unauthorized")
		c.Abort()
	}
}

func CheckAdminToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		conf := config.GetInstance()

		if conf.Authentication == "disable" {
			c.Next()
			return
		}

		cookie, err := c.Cookie("nano-kvm-token")
		if err == nil {
			_, err = ParseJWT(cookie)
			if err == nil {
				user, ok := config.GetInstance().Tokens[cookie]
				if ok && user.Group != "admin" {
					c.JSON(http.StatusForbidden, "unauthorized")
					c.Abort()
					return
				}

				c.Next()
				return
			}
		}

		c.JSON(http.StatusUnauthorized, "unauthorized")
		c.Abort()
	}
}

func GenerateJWT(username string) (string, error) {
	conf := config.GetInstance()

	expireDuration := time.Duration(conf.JWT.RefreshTokenDuration) * time.Second

	claims := Token{
		Username: username,
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
	} else {
		return nil, err
	}
}
