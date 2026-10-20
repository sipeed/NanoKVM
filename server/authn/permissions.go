package authn

import "fmt"

// Permission identifies a grantable feature group. The admin role implicitly
// holds every permission; the user role only holds the permissions stored on
// the account (or the legacy default set when none are stored).
type Permission string

const (
	PermConsoleView    Permission = "console.view"
	PermConsoleControl Permission = "console.control"
	PermPower          Permission = "power"
	PermMediaMount     Permission = "media.mount"
	PermMediaManage    Permission = "media.manage"
	PermTerminal       Permission = "terminal"
	PermDevice         Permission = "device"
	PermNetwork        Permission = "network"
	PermUpdate         Permission = "update"
	PermMcp            Permission = "mcp"
	PermTailscale      Permission = "tailscale"
	PermAi             Permission = "ai"
)

// permissionCatalog lists every grantable permission in display order: console
// operations first, device administration second.
var permissionCatalog = []Permission{
	PermConsoleView,
	PermConsoleControl,
	PermPower,
	PermMediaMount,
	PermMediaManage,
	PermTerminal,
	PermDevice,
	PermNetwork,
	PermUpdate,
	PermMcp,
	PermTailscale,
	PermAi,
}

// PermissionCatalog returns the grantable permissions in stable order.
func PermissionCatalog() []Permission {
	return append([]Permission(nil), permissionCatalog...)
}

func IsValidPermission(permission Permission) bool {
	for _, known := range permissionCatalog {
		if permission == known {
			return true
		}
	}
	return false
}

// ValidatePermissions rejects unknown or duplicate permissions.
func ValidatePermissions(permissions []Permission) error {
	seen := make(map[Permission]struct{}, len(permissions))
	for _, permission := range permissions {
		if !IsValidPermission(permission) {
			return fmt.Errorf("unknown permission: %q", permission)
		}
		if _, exists := seen[permission]; exists {
			return fmt.Errorf("duplicate permission: %q", permission)
		}
		seen[permission] = struct{}{}
	}
	return nil
}

// Has reports whether the set contains the permission. Administrators are not
// special-cased: callers that should honor the role's implicit grants resolve
// EffectivePermissions first.
func Has(permissions []Permission, permission Permission) bool {
	for _, granted := range permissions {
		if granted == permission {
			return true
		}
	}
	return false
}

// ValidateUserPermissions rejects grant sets that would leave a regular user
// unable to reach the console at all. A nil set is the legacy default, which
// already includes console.view, so it is always acceptable.
func ValidateUserPermissions(role Role, permissions []Permission) error {
	if role == RoleAdmin || permissions == nil {
		return nil
	}
	if Has(permissions, PermConsoleView) {
		return nil
	}
	return fmt.Errorf("%q is required for regular users", PermConsoleView)
}

// legacyUserPermissions preserves the capabilities the user role had before
// fine-grained permissions existed: full console access and power control.
func legacyUserPermissions() []Permission {
	return []Permission{PermConsoleView, PermConsoleControl, PermPower}
}

// EffectivePermissions resolves what a user can actually do: administrators
// get the whole catalog; regular users get their stored grants, falling back
// to the legacy default set when nothing was ever stored.
func EffectivePermissions(user *User) []Permission {
	if user == nil {
		return nil
	}
	if user.Role == RoleAdmin {
		return PermissionCatalog()
	}
	if user.Permissions == nil {
		return legacyUserPermissions()
	}
	return append([]Permission(nil), user.Permissions...)
}
