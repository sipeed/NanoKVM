package auth

import (
	"net/http"
	"strings"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// ReturnTokenHeader opts a non-browser automation client into receiving the
// session JWT in the login response. Keeping this opt-in prevents the normal
// browser login response from exposing its HttpOnly cookie value to JavaScript.
const ReturnTokenHeader = "X-NanoKVM-Return-Token"

func (s *Service) Login(c *gin.Context) {
	var req proto.LoginReq
	var rsp proto.Response
	// A successful automation login can carry a bearer credential, and browser
	// logins establish a session cookie. Neither response is safe to store or
	// reuse from a shared cache. Vary also documents the opt-in response shape
	// for intermediaries which inspect request headers despite no-store.
	c.Header("Cache-Control", "no-store")
	c.Header("Vary", ReturnTokenHeader)

	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		rsp.OkRsp(c)
		return
	}

	clientIP := GetClientIP(c)
	if locked, code, msg := CheckLoginAttempt(clientIP); locked {
		time.Sleep(3 * time.Second)
		rsp.ErrRsp(c, code, msg)
		return
	}
	if err := proto.ParseFormRequest(c, &req); err != nil {
		time.Sleep(3 * time.Second)
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	password, err := utils.DecodeDecrypt(req.Password)
	if err != nil || password == "" {
		s.loginFailed(c, clientIP, &rsp)
		return
	}
	user, ok, err := authn.DefaultStore.Authenticate(req.Username, password)
	if err != nil {
		log.Errorf("load account during login: %s", err)
		time.Sleep(2 * time.Second)
		rsp.ErrRsp(c, -3, "authentication unavailable")
		return
	}
	if !ok {
		s.loginFailed(c, clientIP, &rsp)
		return
	}

	ClearLoginAttempt(clientIP)
	token, err := middleware.GenerateJWT(user.Username, user.TokenVersion)
	if err != nil {
		time.Sleep(time.Second)
		rsp.ErrRsp(c, -3, "generate token failed")
		return
	}
	setSessionCookie(c, token)
	if strings.EqualFold(strings.TrimSpace(c.GetHeader(ReturnTokenHeader)), "true") {
		rsp.OkRspWithData(c, &proto.LoginRsp{Token: token})
	} else {
		rsp.OkRsp(c)
	}
	log.Infof("user logged in: %s", user.Username)
}

func (s *Service) loginFailed(c *gin.Context, clientIP string, rsp *proto.Response) {
	time.Sleep(2 * time.Second)
	if locked, code, msg := RecordLoginFailure(clientIP); locked {
		rsp.ErrRsp(c, code, msg)
		return
	}
	rsp.ErrRsp(c, -2, "invalid username or password")
}

func (s *Service) Logout(c *gin.Context) {
	var rsp proto.Response
	principal, ok := middleware.CurrentPrincipal(c)
	conf := config.GetInstance()
	if ok && conf.Authentication != "disable" && conf.JWT.RevokeTokensOnLogout {
		if _, err := authn.DefaultStore.Revoke(principal.Username); err != nil {
			rsp.ErrRsp(c, -1, "failed to revoke session")
			return
		}
		middleware.RevokeUserSessions(principal.Username)
		log.Infof("user logged out: %s", principal.Username)
	}
	clearSessionCookie(c)
	rsp.OkRsp(c)
}

func (s *Service) GetAccount(c *gin.Context) {
	var rsp proto.Response
	principal, ok := middleware.CurrentPrincipal(c)
	if !ok {
		rsp.ErrRsp(c, -1, "get account failed")
		return
	}
	rsp.OkRspWithData(c, &proto.GetAccountRsp{
		Username: principal.Username,
		Role:     string(principal.Role),
	})
}

func setSessionCookie(c *gin.Context, token string) {
	conf := config.GetInstance()
	_, scheme := middleware.ExternalRequestAddress(c.Request)
	secure := scheme == "https"
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		middleware.CookieName,
		token,
		int(conf.JWT.RefreshTokenDuration),
		"/",
		"",
		secure,
		true,
	)
}

func clearSessionCookie(c *gin.Context) {
	_, scheme := middleware.ExternalRequestAddress(c.Request)
	secure := scheme == "https"
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(middleware.CookieName, "", -1, "/", "", secure, true)
}
