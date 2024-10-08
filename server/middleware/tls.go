package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/unrolled/secure"
)

func Tls() gin.HandlerFunc {
	secureMiddleware := secure.New(secure.Options{
		SSLRedirect: true,
	})

	secureFunc := func(c *gin.Context) {
		err := secureMiddleware.Process(c.Writer, c.Request)
		if err != nil {
			c.Abort()
			return
		}

		if status := c.Writer.Status(); status > 300 && status < 399 {
			c.Abort()
		}
	}

	return secureFunc
}
