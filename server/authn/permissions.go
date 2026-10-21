package authn

import (
	"fmt"
)

// Permission identifies a grantable capability. The admin role implicitly holds
// every permission; the user role only holds the permissions stored on the
// account.
//
// A permission names what it lets the account do, not the settings page it
// lives on, and every grant that changes something shared says so in the
// catalog's risk and effect metadata instead of in the label alone.
type Permission string

const (
	// Console grants.
	PermConsoleView    Permission = "console.view"
	PermConsoleControl Permission = "console.control"

	// Target-machine grants.
	PermPower        Permission = "power"
	PermMediumAttach Permission = "medium.attach"

	// Media library grants.
	PermLibraryRead  Permission = "library.read"
	PermLibraryWrite Permission = "library.write"

	// Host grants.
	PermTerminal Permission = "terminal"
	PermDevice   Permission = "device"
	PermNetwork  Permission = "network"
	PermUpdate   Permission = "update"

	// Service grants.
	PermMcp       Permission = "mcp"
	PermTailscale Permission = "tailscale"
	PermAi        Permission = "ai"
)

// Group names the party a grant reaches. The account editor renders one section
// per group, so the sections stay meaningful as the catalog grows.
type Group string

const (
	// GroupConsole is what an account may do with the console it is watching.
	GroupConsole Group = "console"
	// GroupTarget is what it may do to the machine behind the console.
	GroupTarget Group = "target"
	// GroupLibrary is what it may do with the media library on this device.
	GroupLibrary Group = "library"
	// GroupHost is what it may change on this device.
	GroupHost Group = "host"
	// GroupServices are the add-ons that reach the device on their own.
	GroupServices Group = "services"
)

// Risk states how far a grant reaches, and the catalog carries two levels: a
// plain grant, and the grants that amount to full device control, which the
// account editor marks and names before the grants are saved.
type Risk string

const (
	// RiskInfo is a grant that stays within the feature it names.
	RiskInfo Risk = "info"
	// RiskWarn is a grant that reaches past the device: a root shell, the AI
	// loopback, an API key that outlives its grant.
	RiskWarn Risk = "warn"
)

// Descriptor is one catalog entry: the grant, the group it belongs to, the risk
// an administrator takes by granting it, and the grants it implies.
type Descriptor struct {
	Permission Permission   `json:"id"`
	Group      Group        `json:"group"`
	Risk       Risk         `json:"risk"`
	Implies    []Permission `json:"implies,omitempty"`
}

// Implied grants are declared once here instead of as unions at every call
// site: control without the picture is meaningless, nothing can be attached or
// changed in the library without being allowed to see it first, and the grants
// whose controls live in the console menu imply the console, because no page
// outside it renders them and a grant nothing can use is a promise the app
// cannot keep. Terminal and the media grants stand on their own pages.
var permissionCatalog = []Descriptor{
	{Permission: PermConsoleView, Group: GroupConsole, Risk: RiskInfo},
	{
		Permission: PermConsoleControl,
		Group:      GroupConsole,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermPower,
		Group:      GroupTarget,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermMediumAttach,
		Group:      GroupTarget,
		Risk:       RiskInfo,
		Implies:    []Permission{PermLibraryRead},
	},
	{Permission: PermLibraryRead, Group: GroupLibrary, Risk: RiskInfo},
	{
		Permission: PermLibraryWrite,
		Group:      GroupLibrary,
		Risk:       RiskInfo,
		Implies:    []Permission{PermLibraryRead},
	},
	{Permission: PermTerminal, Group: GroupHost, Risk: RiskWarn},
	{
		Permission: PermDevice,
		Group:      GroupHost,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermNetwork,
		Group:      GroupHost,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermUpdate,
		Group:      GroupHost,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermMcp,
		Group:      GroupServices,
		Risk:       RiskWarn,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermTailscale,
		Group:      GroupServices,
		Risk:       RiskInfo,
		Implies:    []Permission{PermConsoleView},
	},
	{
		Permission: PermAi,
		Group:      GroupServices,
		Risk:       RiskWarn,
		Implies:    []Permission{PermConsoleView},
	},
}

// Grants of earlier releases, kept so an account file written by one of them
// keeps meaning what it meant. media.mount and media.manage split into the
// attach/read/write grants above.
const (
	legacyPermMediaMount  Permission = "media.mount"
	legacyPermMediaManage Permission = "media.manage"
)

// Catalog returns the catalog in display order.
func Catalog() []Descriptor {
	catalog := make([]Descriptor, len(permissionCatalog))
	for index, descriptor := range permissionCatalog {
		catalog[index] = descriptor
		catalog[index].Implies = append([]Permission(nil), descriptor.Implies...)
	}
	return catalog
}

// PermissionIDs returns every grantable permission in catalog order.
func PermissionIDs() []Permission {
	ids := make([]Permission, 0, len(permissionCatalog))
	for _, descriptor := range permissionCatalog {
		ids = append(ids, descriptor.Permission)
	}
	return ids
}

func IsValidPermission(permission Permission) bool {
	for _, descriptor := range permissionCatalog {
		if descriptor.Permission == permission {
			return true
		}
	}
	return false
}

// ValidatePermissions rejects unknown or duplicate permissions. It is for grant
// sets arriving in a request; the grant set stored on an account is validated by
// ValidateStoredPermissions, which tolerates ids this build does not know.
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

// ValidateStoredPermissions only rejects duplicates. An account file written by
// a newer release carries grants this build cannot evaluate, and refusing to
// load it would lock the device out instead of ignoring a capability that is
// unavailable here anyway.
func ValidateStoredPermissions(permissions []Permission) error {
	seen := make(map[Permission]struct{}, len(permissions))
	for _, permission := range permissions {
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

// Closure resolves the grants an account ends up holding: the set itself plus
// everything it implies, transitively, in catalog order.
func Closure(permissions []Permission) []Permission {
	granted := closureSet(permissions)

	resolved := make([]Permission, 0, len(granted))
	for _, descriptor := range permissionCatalog {
		if _, ok := granted[descriptor.Permission]; ok {
			resolved = append(resolved, descriptor.Permission)
			delete(granted, descriptor.Permission)
		}
	}
	// Keep ids this build does not know in the order they were stored, so they
	// still round-trip through the client.
	for _, permission := range permissions {
		if _, ok := granted[permission]; ok {
			resolved = append(resolved, permission)
			delete(granted, permission)
		}
	}
	return resolved
}

func closureSet(permissions []Permission) map[Permission]struct{} {
	granted := make(map[Permission]struct{}, len(permissions))
	var add func(Permission)
	add = func(permission Permission) {
		if _, exists := granted[permission]; exists {
			return
		}
		granted[permission] = struct{}{}
		for _, descriptor := range permissionCatalog {
			if descriptor.Permission != permission {
				continue
			}
			for _, implied := range descriptor.Implies {
				add(implied)
			}
		}
	}
	for _, permission := range permissions {
		add(permission)
	}
	return granted
}

// NormalizeStoredPermissions translates the grants an earlier release wrote and
// removes duplicates, so the store holds one spelling of every capability.
// Unknown ids are preserved: a downgrade must not silently drop a grant.
func NormalizeStoredPermissions(permissions []Permission) []Permission {
	normalized := make([]Permission, 0, len(permissions)+2)
	appendOnce := func(permission Permission) {
		if !Has(normalized, permission) {
			normalized = append(normalized, permission)
		}
	}
	for _, permission := range permissions {
		switch permission {
		case legacyPermMediaMount:
			// Attaching a medium is what let a watcher read the library.
			appendOnce(PermMediumAttach)
			appendOnce(PermLibraryRead)
		case legacyPermMediaManage:
			appendOnce(PermLibraryRead)
			appendOnce(PermLibraryWrite)
		default:
			appendOnce(permission)
		}
	}
	return normalized
}

// legacyUserPermissions preserves the capabilities the user role had before
// fine-grained permissions existed: full console access and power control.
func legacyUserPermissions() []Permission {
	return []Permission{PermConsoleView, PermConsoleControl, PermPower}
}

// EffectivePermissions resolves what a user can actually do: administrators
// hold the whole catalog, regular users hold their stored grants and whatever
// those imply.
func EffectivePermissions(user *User) []Permission {
	if user == nil {
		return nil
	}
	if user.Role == RoleAdmin {
		return PermissionIDs()
	}
	return Closure(user.Permissions)
}
