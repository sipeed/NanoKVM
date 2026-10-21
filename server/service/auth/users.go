package auth

import (
	"errors"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var errInvalidPassword = errors.New("invalid password")

// SessionNotifier pushes an account event to a user's live connections. It is
// wired to the websocket manager during router setup; kept as a hook so this
// package does not depend on the cgo-based HID stack.
var SessionNotifier func(username, event, data string)

// APIKeyRotator replaces the device-wide MCP API key. It is wired by the MCP
// router for the same reason as SessionNotifier.
var APIKeyRotator func() error

// rotateAPIKeyIfLost regenerates the MCP API key when the account no longer
// reaches it. The key outlives the web session, so revoking the grant without
// replacing the key would leave a copied key working.
func rotateAPIKeyIfLost(previous, current []authn.Permission) {
	if !authn.Has(previous, authn.PermMcp) || authn.Has(current, authn.PermMcp) {
		return
	}
	if APIKeyRotator == nil {
		return
	}
	if err := APIKeyRotator(); err != nil {
		log.Errorf("rotate MCP API key after revoking the mcp grant: %s", err)
		return
	}
	log.Infof("MCP API key rotated after the mcp grant was revoked")
}

func (s *Service) ListUsers(c *gin.Context) {
	var rsp proto.Response
	users, err := authn.DefaultStore.List()
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to load users")
		return
	}
	result := make([]proto.UserInfo, 0, len(users))
	for _, user := range users {
		result = append(result, proto.UserInfo{
			Username:      user.Username,
			Role:          string(user.Role),
			Enabled:       user.Enabled,
			Permissions:   permissionStrings(user.Permissions),
			SystemAccount: user.SystemAccount,
		})
	}
	rsp.OkRspWithData(c, &proto.ListUsersRsp{Users: result})
}

func (s *Service) ListPermissions(c *gin.Context) {
	var rsp proto.Response
	catalog := authn.Catalog()
	permissions := make([]proto.PermissionInfo, 0, len(catalog))
	for _, descriptor := range catalog {
		permissions = append(permissions, proto.PermissionInfo{
			ID:      string(descriptor.Permission),
			Group:   string(descriptor.Group),
			Risk:    string(descriptor.Risk),
			Implies: permissionStrings(descriptor.Implies),
		})
	}
	rsp.OkRspWithData(c, &proto.ListPermissionsRsp{Permissions: permissions})
}

func (s *Service) CreateUser(c *gin.Context) {
	var req proto.CreateUserReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	password, err := decodePassword(req.Password)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	permissions, err := parsePermissions(req.Permissions)
	if err != nil {
		rsp.ErrRsp(c, -3, err.Error())
		return
	}
	if err = authn.DefaultStore.Create(req.Username, password, authn.Role(req.Role), permissions...); err != nil {
		rsp.ErrRsp(c, -4, err.Error())
		return
	}
	rsp.OkRsp(c)
	log.Infof("user created: %s (%s)", req.Username, req.Role)
}

func (s *Service) UpdateUser(c *gin.Context) {
	var req proto.UpdateUserReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil || (req.Role == nil && req.Enabled == nil && req.Permissions == nil) {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	principal, _ := middleware.CurrentPrincipal(c)
	patch := authn.UserPatch{Enabled: req.Enabled}
	if req.Role != nil {
		role := authn.Role(*req.Role)
		patch.Role = &role
	}
	if req.Permissions != nil {
		permissions, err := parsePermissions(*req.Permissions)
		if err != nil {
			rsp.ErrRsp(c, -2, err.Error())
			return
		}
		patch.Permissions = &permissions
	}
	username := c.Param("username")
	// The store hands back the account as it was before and after this patch,
	// read under one lock, so a role change is handled exactly like editing the
	// permission set: the role resolves to its implicit grants and the
	// difference drives the refresh.
	previous, updated, err := authn.DefaultStore.Update(principal.Username, username, patch)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	// A disabled account reaches nothing, whatever it stores.
	previousPermissions := enabledPermissions(previous)
	currentPermissions := enabledPermissions(updated)
	rotateAPIKeyIfLost(previousPermissions, currentPermissions)

	if updated.TokenVersion != previous.TokenVersion {
		// Disabling the account is the only change that invalidates the login.
		middleware.RevokeUserSessions(username)
	} else {
		// Every other change keeps the login valid: drop only the long-lived
		// connections whose in-memory state depends on what changed, and let the
		// frontend refresh its account state in place. Revoked grants have to
		// reconnect to stop using the feature, and granted ones have to reconnect
		// to pick up capabilities cached at connect time (the console socket
		// remembers whether it is read-only). Unrelated connections stay
		// untouched. A save that changes nothing stays silent.
		changed := permissionsChanged(previousPermissions, currentPermissions)
		roleChanged := updated.Role != previous.Role
		if (roleChanged || len(changed) > 0) && SessionNotifier != nil {
			// The role itself is rendered too (user management, the role label),
			// so the frontend refreshes even when the grants happen to match.
			// The notifier writes to every socket of the user, each with its own
			// write deadline; one stuck connection must not hold this request.
			go SessionNotifier(username, "auth", "refresh")
		}
		if channels := channelsForPermissions(changed); len(channels) > 0 {
			middleware.RefreshUserSessions(username, channels...)
		}
	}
	rsp.OkRsp(c)
	log.Infof("user updated: %s", username)
}

func (s *Service) DeleteUser(c *gin.Context) {
	var rsp proto.Response
	principal, _ := middleware.CurrentPrincipal(c)
	username := c.Param("username")
	previous, _ := authn.DefaultStore.Get(username)
	if err := authn.DefaultStore.Delete(principal.Username, username); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	middleware.RevokeUserSessions(username)
	rotateAPIKeyIfLost(enabledPermissions(previous), nil)
	rsp.OkRsp(c)
	log.Infof("user deleted: %s", username)
}

func (s *Service) ChangeUserPassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	username := c.Param("username")
	user, err := authn.DefaultStore.Get(username)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	if user.SystemAccount {
		rsp.ErrRsp(c, -3, "the device owner must change its own password")
		return
	}
	if err := changeUserPassword(username, req.Password); err != nil {
		rsp.ErrRsp(c, -4, err.Error())
		return
	}
	middleware.RevokeUserSessions(username)
	rsp.OkRsp(c)
	log.Infof("password reset for user: %s", username)
}

func enabledPermissions(user *authn.User) []authn.Permission {
	if user == nil || !user.Enabled {
		return nil
	}
	return authn.EffectivePermissions(user)
}

// permissionsChanged returns the grants that were added or removed. Both
// directions matter: a revoked grant must stop reaching the feature, while a
// granted one must reconnect to pick up state cached per connection.
func permissionsChanged(oldPermissions, newPermissions []authn.Permission) []authn.Permission {
	changed := make([]authn.Permission, 0, len(oldPermissions))
	for _, old := range oldPermissions {
		if !authn.Has(newPermissions, old) {
			changed = append(changed, old)
		}
	}
	for _, current := range newPermissions {
		if !authn.Has(oldPermissions, current) {
			changed = append(changed, current)
		}
	}
	return changed
}

// channelsForPermissions maps permissions that changed to the long-lived
// connection channels that must reconnect to take effect. Permissions without
// connection state (library, network, ...) are enforced per-request and need no
// teardown.
func channelsForPermissions(permissions []authn.Permission) []string {
	channels := make([]string, 0, 2)
	for _, permission := range permissions {
		switch permission {
		case authn.PermConsoleView:
			// Losing the console grant closes the video stream, and gaining it (an
			// account promoted to administrator) keeps every console connection
			// from running under the grants it cached at connect time.
			channels = append(channels, middleware.SessionChannelConsole, middleware.SessionChannelStream)
		case authn.PermConsoleControl:
			channels = append(channels, middleware.SessionChannelConsole)
		case authn.PermTerminal:
			channels = append(channels, middleware.SessionChannelTerminal)
		case authn.PermAi:
			channels = append(channels, middleware.SessionChannelAi)
		}
	}
	return channels
}

func parsePermissions(raw []string) ([]authn.Permission, error) {
	if raw == nil {
		return nil, nil
	}
	permissions := make([]authn.Permission, 0, len(raw))
	for _, item := range raw {
		permissions = append(permissions, authn.Permission(item))
	}
	if err := authn.ValidatePermissions(permissions); err != nil {
		return nil, err
	}
	return permissions, nil
}

func permissionStrings(permissions []authn.Permission) []string {
	strings := make([]string, 0, len(permissions))
	for _, permission := range permissions {
		strings = append(strings, string(permission))
	}
	return strings
}

func decodePassword(encrypted string) (string, error) {
	password, err := utils.DecodeDecrypt(encrypted)
	if err != nil || password == "" {
		return "", errInvalidPassword
	}
	if err = authn.ValidatePassword(password); err != nil {
		return "", err
	}
	return password, nil
}
