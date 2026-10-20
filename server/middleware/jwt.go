package middleware

import (
	"context"
	"errors"
	"net/http"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	log "github.com/sirupsen/logrus"
)

const (
	principalContextKey = "principal"
	tokenContextKey     = "token"
	CookieName          = "nano-kvm-token"
	sessionRecheckDelay = 5 * time.Second
)

type Principal struct {
	Username    string
	Role        authn.Role
	Permissions []authn.Permission
}

// Has reports whether the principal effectively holds the permission.
// Administrators always do.
func (p Principal) Has(permission authn.Permission) bool {
	if p.Role == authn.RoleAdmin {
		return true
	}
	return authn.Has(p.Permissions, permission)
}

type Token struct {
	Username     string `json:"username"`
	TokenVersion uint64 `json:"tokenVersion"`
	jwt.RegisteredClaims
}

func CheckToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, token, ok := authenticate(c)
		if !ok {
			abortUnauthorized(c)
			return
		}

		c.Set(principalContextKey, principal)
		c.Set(tokenContextKey, token)
		if token == nil || token.ExpiresAt == nil {
			c.Next()
			return
		}

		requestContext, cancel := context.WithCancel(c.Request.Context())
		sessionHandle := newSessionHandle()
		requestContext = WithSessionHandle(requestContext, sessionHandle)
		c.Request = c.Request.WithContext(requestContext)
		unregister := activeSessions.register(
			principal.Username,
			cancel,
			sessionHandle,
			SessionChannelForPath(c.Request.URL.Path),
		)
		timer := time.AfterFunc(time.Until(token.ExpiresAt.Time), cancel)
		go watchSessionState(requestContext, cancel, principal.Username, token.TokenVersion, sessionRecheckDelay)
		defer func() {
			timer.Stop()
			unregister()
			cancel()
		}()

		c.Next()
	}
}

func watchSessionState(ctx context.Context, cancel context.CancelFunc, username string, tokenVersion uint64, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := authn.DefaultStore.ValidateToken(username, tokenVersion); err != nil {
				cancel()
				return
			}
		}
	}
}

func RequireRole(roles ...authn.Role) gin.HandlerFunc {
	allowed := make(map[authn.Role]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(c *gin.Context) {
		principal, ok := CurrentPrincipal(c)
		if !ok {
			abortUnauthorized(c)
			return
		}
		if _, ok = allowed[principal.Role]; !ok {
			abortForbidden(c)
			return
		}
		c.Next()
	}
}

// RequirePermission allows the request when the principal holds at least one
// of the listed permissions. Administrators implicitly hold every permission.
func RequirePermission(permissions ...authn.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, ok := CurrentPrincipal(c)
		if !ok {
			abortUnauthorized(c)
			return
		}
		allowed := false
		for _, permission := range permissions {
			if principal.Has(permission) {
				allowed = true
				break
			}
		}
		if !allowed {
			abortForbidden(c)
			return
		}
		c.Next()
	}
}

func CurrentPrincipal(c *gin.Context) (Principal, bool) {
	value, exists := c.Get(principalContextKey)
	if !exists {
		return Principal{}, false
	}
	principal, ok := value.(Principal)
	return principal, ok
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
		if allowByLoopbackInternalToken(c.Request) {
			c.Next()
			return
		}

		principal, token, ok := authenticate(c)
		if !ok {
			abortUnauthorized(c)
			return
		}
		c.Set(principalContextKey, principal)
		c.Set(tokenContextKey, token)
		c.Next()
	}
}

func authenticate(c *gin.Context) (Principal, *Token, bool) {
	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		return Principal{Username: "admin", Role: authn.RoleAdmin, Permissions: authn.PermissionIDs()}, nil, true
	}

	cookie, err := c.Cookie(CookieName)
	if err != nil {
		return Principal{}, nil, false
	}
	token, err := ParseJWT(cookie)
	if err != nil {
		return Principal{}, nil, false
	}
	user, err := authn.DefaultStore.ValidateToken(token.Username, token.TokenVersion)
	if err != nil {
		log.Debugf("validate session for %q: %s", token.Username, err)
		return Principal{}, nil, false
	}
	return Principal{
		Username:    user.Username,
		Role:        user.Role,
		Permissions: authn.EffectivePermissions(user),
	}, token, true
}

func abortUnauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, "unauthorized")
	c.Abort()
}

func abortForbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, "forbidden")
	c.Abort()
}

func GenerateJWT(username string, tokenVersion uint64) (string, error) {
	conf := config.GetInstance()
	now := time.Now()
	expireDuration := time.Duration(conf.JWT.RefreshTokenDuration) * time.Second
	claims := Token{
		Username:     username,
		TokenVersion: tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   username,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expireDuration)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(conf.JWT.SecretKey))
}

func ParseJWT(jwtToken string) (*Token, error) {
	conf := config.GetInstance()
	parsed, err := jwt.ParseWithClaims(
		jwtToken,
		&Token{},
		func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(conf.JWT.SecretKey), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		log.Debugf("parse jwt error: %s", err)
		return nil, err
	}
	claims, ok := parsed.Claims.(*Token)
	if !ok || !parsed.Valid || claims.Username == "" || claims.Subject != claims.Username || claims.TokenVersion == 0 {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}
