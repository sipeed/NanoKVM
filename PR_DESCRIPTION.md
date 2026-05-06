# Multi-User Authentication with Role-Based Access Control

## Summary

This PR adds support for multiple users with three distinct roles, replacing the current single-user authentication system.

## Motivation

Many users (myself included) want to give different people different levels of access to the NanoKVM:
- **Admins** who configure everything
- **Operators** who use the KVM (control the remote PC)
- **Viewers** who can only watch the screen

Currently only one shared admin account exists, which is a security and usability limitation.

## Roles

| Role | Description |
|------|-------------|
| `admin` | Full access including user management and all system settings |
| `operator` | KVM control: stream, keyboard, mouse, paste, GPIO, terminal, scripts |
| `viewer` | Read-only: stream and basic device info |

## Changes

### Backend (Go)
- `server/service/auth/account.go` – New multi-user storage in `/etc/kvm/accounts.json` (bcrypt hashed)
- `server/service/auth/login.go` – Role embedded in JWT claims
- `server/service/auth/password.go` – Permission-aware password changes
- `server/service/auth/users.go` – **NEW** – CRUD endpoints for user management
- `server/middleware/jwt.go` – New `RequireRole()` middleware for fine-grained access control
- `server/proto/auth.go` – New request/response types
- `server/router/auth.go` – New user management endpoints
- `server/router/hid.go` – Role-based access (operator+ for inputs)
- `server/router/vm.go` – Role-based access per endpoint

### Frontend (React)
- `web/src/hooks/useRole.ts` – **NEW** – Hook to retrieve current user role
- `web/src/pages/desktop/menu/settings/users/index.tsx` – **NEW** – User management UI
- `web/src/pages/desktop/menu/settings/index.tsx` – Tabs filtered by role
- `web/src/pages/desktop/menu/index.tsx` – Menu items hidden based on role
- `web/src/api/auth.ts` – New API functions for user management
- `web/src/i18n/locales/{en,de}.ts` – Translations

## Backwards compatibility

The legacy `/etc/kvm/pwd` file is automatically migrated to `/etc/kvm/accounts.json` on first start. The migrated user receives the `admin` role.

## New API Endpoints

All require `admin` role except `/api/auth/users/:username/password` (admins can change anyone's password, others only their own).

```
GET    /api/auth/users
POST   /api/auth/users
PUT    /api/auth/users/:username
DELETE /api/auth/users/:username
POST   /api/auth/users/:username/password
```

## Testing

Tested on NanoKVM-PCIe with NanoKVM v2.4.0:
- ✅ Migration from legacy single-user format works
- ✅ Login with all three roles
- ✅ Role-based UI hiding
- ✅ User CRUD via web interface
- ✅ Last admin cannot be deleted
- ✅ Disabled users cannot log in

## Screenshot

(add a screenshot of the user management page here)
