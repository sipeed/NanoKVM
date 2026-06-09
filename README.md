# NanoKVM – Multi-User RBAC Fork

> ⚠️ **Unofficial Community Fork**
> This is a modified version of [sipeed/NanoKVM](https://github.com/sipeed/NanoKVM), maintained independently by [@Schattenwelt](https://github.com/Schattenwelt). Builds are kept in sync with the upstream firmware — see the [Releases](https://github.com/Schattenwelt/NanoKVM/releases) page for the upstream version each release was built against.
> It is **not** affiliated with, endorsed by, or supported by Sipeed.
> For the official firmware, support, and warranty, please use the [upstream project](https://github.com/sipeed/NanoKVM).

<div align="center">
  <br>
  <img src="https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png" alt="NanoKVM" style="margin: 20px 0;">
  <h3>
    <a href="https://github.com/Schattenwelt/NanoKVM/releases">📦 Fork Releases</a>
     |
    <a href="https://github.com/Schattenwelt/NanoKVM/tree/multi-user-rbac">🌿 multi-user-rbac branch</a>
     |
    <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html">📖 Upstream Wiki</a>
  </h3>
  <br>
</div>

## 🔀 What's different in this fork?

This fork extends NanoKVM with **multi-user support and role-based access control (RBAC)** on the backend and the matching frontend UI for user management, plus an **activity log (audit log)** that records who did what.

### 👥 Three built-in roles

| Role         | Stream | Power / Reset (GPIO) | Terminal & Scripts | HID Paste / Shortcuts | System Config (HDMI/SSH/Reboot/Hostname/TLS) | User Management | Audit Log |
| ------------ | :----: | :------------------: | :----------------: | :-------------------: | :------------------------------------------: | :-------------: | :-------: |
| **viewer**   |   ✅   |          ❌          |         ❌         |          ❌           |                      ❌                      |        ❌        |     ❌     |
| **operator** |   ✅   |          ✅          |         ✅         |          ✅           |                      ❌                      |        ❌        |     ❌     |
| **admin**    |   ✅   |          ✅          |         ✅         |          ✅           |                      ✅                      |        ✅        |     ✅     |

Read-only endpoints (info, hardware, mDNS state, hostname, web title, autostart list, etc.) are accessible by **any authenticated user**.

Every action that changes state — plus every login attempt, successful or failed — is recorded in the **activity log** regardless of role; **viewing** the log (the `Audit Log` column above) is admin-only.

### 🔐 Other security features

- **bcrypt** password hashing (no plaintext or simple-hash storage)
- **JWT** session cookies (`nano-kvm-token`) carrying username + role
- **Brute-force protection** on the login endpoint
- **Enable/disable** users without deleting them
- **Last-admin protection**: the last enabled admin account cannot be deleted
- **Self-delete protection**: admins cannot delete their own account
- Internal loopback endpoints (used by `kvm_system` / picoclaw) are gated by a separate loopback token, not JWT

### 🧾 Activity log (audit log)

Records **who did what**, so multi-user access stays accountable:

- Captures every state-changing request (power / reset, terminal & scripts, HID paste, HDMI / SSH / reboot / hostname / TLS configuration, user management, …) and **every login attempt — including failures**.
- Each entry stores timestamp, username, role, client IP, action, HTTP status, result, and latency, written as **JSON Lines** to `/etc/kvm/audit.log` (mode `0600`).
- **Size-based rotation** (default 10 MB → `audit.log.1`), configurable in `server.yaml` (`audit.file`, `audit.maxSizeMB`).
- Can be **switched on/off at runtime** from `Settings → Activity Log` (admin only). The change applies immediately and is persisted to `/etc/kvm/server.yaml` (`audit.enabled`).
- Implemented as a single global middleware that reads the authenticated user from the request context — **no per-endpoint changes**. Viewing is admin-only via `GET /api/auth/audit`; the toggle uses `GET` / `POST /api/auth/audit/config`.

> The log stores usernames and client IP addresses. If that is not desired, disable it via the toggle in the web UI or set `audit.enabled: false` in `/etc/kvm/server.yaml`.

### 📁 Storage & migration

- User accounts are stored in `/etc/kvm/accounts.json` (mode `0600`, JSON, bcrypt-hashed passwords).
- On first start, an existing single-user setup in `/etc/kvm/pwd` is **automatically migrated** — the existing user becomes the initial `admin`. The legacy file is removed after migration.
- If no accounts file exists, a default account is created: **username `admin` / password `admin`** (change it immediately on first login).
- The activity log is stored in `/etc/kvm/audit.log` (mode `0600`, JSON Lines). It is enabled by default and can be turned off from the web UI or via `audit.enabled: false` in `/etc/kvm/server.yaml`.

### 🌐 Frontend additions

- New settings pages: `Settings → Users` (list / add / edit / disable / delete) and `Settings → Account` (change own password).
- New `Settings → Activity Log` page (admin only): a table of recorded actions with filters by user and by success / failure, a refresh button, and a switch to enable / disable logging.
- Login and password pages reused from upstream, extended for the new account model.
- User-management and activity-log strings are translated for **all 24 supported UI languages**; any locale not explicitly translated falls back to English via i18next.

## 📥 Installation

> ⚠️ **This is an update package, not a full SD-card image.** You need a working NanoKVM with the official Sipeed firmware already running. Each fork release is built against a specific upstream version — pick the release that matches (or is closest to) the firmware currently on your device. See the [Releases](https://github.com/Schattenwelt/NanoKVM/releases) page for the compatibility note on each release.

1. Download the matching `nanokvm_<version>.tar.gz` from the [fork's Releases page](https://github.com/Schattenwelt/NanoKVM/releases).
2. Open the NanoKVM web UI and go to **Settings → Check for updates → Offline update**.
3. Upload the `.tar.gz` and let the device apply it. The NanoKVM service will restart automatically.
4. Log in (existing credentials still work — they have been migrated to the new format).
5. Go to **Settings → Users**, create your accounts, assign roles, and disable the default `admin` if appropriate.

### Rolling back

The official firmware images from Sipeed are GPL-3.0 and can be re-flashed (or applied as an offline update) at any time. Always back up `/etc/kvm/accounts.json` if you want to preserve users across reinstalls.

## 🏗️ Building from source

All sources of this fork (Go backend + React frontend + RBAC patches) are
in this repository under **GPL-3.0**. For most users, the pre-built
`.tar.gz` on the [Releases](https://github.com/Schattenwelt/NanoKVM/releases)
page is the recommended install path; the section below is for people who
want to rebuild themselves.

### What needs to happen

A working build produces a Sipeed offline-update `.tar.gz` containing:

1. The fork's `NanoKVM-Server` binary, cross-compiled for the device.
2. The fork's `web/` bundle (built with Vite).
3. The unchanged upstream `kvm_system`, init scripts (with
   `LD_LIBRARY_PATH=/tmp/server/dl_lib`), and helper utilities.

### Toolchain

- Go **1.22** with `GOOS=linux GOARCH=riscv64 CGO_ENABLED=1`
- A RISC-V musl cross-toolchain — e.g. `riscv64-linux-musl-cross`
  from [musl.cc](https://musl.cc/)
- The Sipeed `libkvm.so` (extract `server/dl_lib/` from any official
  Sipeed offline-update tarball)
- Node **20+** and **pnpm** for the React frontend
- Standard `tar` to repack the result into the Sipeed update format

### High-level steps

1. Build the frontend: `cd web && pnpm install && pnpm build` → `web/dist/`.
2. Build the backend against `libkvm.so` using the musl cross-compiler.
3. Take an official Sipeed offline-update `.tar.gz` of the matching
   upstream version as a "host package" and replace inside it:
   - `server/NanoKVM-Server` with your rebuild
   - `server/web/` with `web/dist/`
   - `etc/init.d/S95nanokvm` patched to set `LD_LIBRARY_PATH=/tmp/server/dl_lib`
4. Repack as `nanokvm_<version>.tar.gz`. Apply via the device's
   **Settings → Check for updates → Offline update**.

> The exact build orchestration used to produce the official releases of
> this fork is not distributed publicly. If you intend to rebuild and
> are stuck, please open an issue.

For frontend-only iteration, see [`web/README.md`](web/README.md) —
`pnpm dev` against a NanoKVM device on the LAN.

## 🌟 What is NanoKVM?

NanoKVM is a series of compact, open-source IP-KVM devices based on the LicheeRV Nano (RISC-V). It lets you remotely access and control computers as if you were sitting in front of them, making it useful for servers, embedded systems, and other headless machines.

## 📦 Compatible Hardware

This fork tracks the upstream NanoKVM firmware and targets the SG2002-based hardware:

- **NanoKVM-Cube Lite / Full** (SG2002, microSD)
- **NanoKVM-PCIe** (SG2002, microSD)

Each release on GitHub notes the upstream firmware version it was built against.

> **Not in scope:** [NanoKVM-Pro](https://github.com/sipeed/NanoKVM-Pro) (AX630C / ARM) uses a different codebase and is **not** supported by this fork.

If you are looking for a USB-based KVM solution, check out [NanoKVM-USB](https://github.com/sipeed/NanoKVM-USB).

## 📂 Project Structure

```text
├── server                              # NanoKVM Back-end (Go) — RBAC-extended
│   ├── service/auth/                   # accounts, roles, login, brute-force, password
│   │   ├── account.go                  # /etc/kvm/accounts.json, bcrypt, legacy migration
│   │   ├── users.go                    # admin user-management endpoints
│   │   ├── login.go / password.go      # session and own-password endpoints
│   │   ├── brute_force.go              # rate-limited login attempts
│   │   └── audit.go                    # admin endpoints: read log + enable/disable
│   ├── service/audit/                  # activity log: write (JSON Lines), rotation, read-back, runtime toggle
│   ├── middleware/jwt.go               # CheckToken + RequireRole(...)
│   ├── middleware/audit.go             # records who did what (global middleware)
│   └── router/                         # endpoint groups by required role
├── web                                 # React front-end — extended with:
│   ├── src/pages/desktop/menu/settings/users/    # admin user management UI
│   ├── src/pages/desktop/menu/settings/account/  # own account / password UI
│   └── src/pages/desktop/menu/settings/audit/    # admin activity-log viewer + on/off toggle
├── kvmapp                              # unchanged from upstream (kvm_system, system, …)
└── support                             # unchanged from upstream (sg2002 modules)
```

## 💻 Development

For module-level guides, see the upstream documentation:

- **Backend service:** [`server/README.md`](server/README.md)
- **Frontend UI:** [`web/README.md`](web/README.md)
- **System support modules:** [`support/sg2002/README.md`](support/sg2002/README.md)

The RBAC additions live entirely in:

- `server/service/auth/`
- `server/middleware/jwt.go`
- `server/router/*.go` (each router group now uses `RequireRole(...)` where appropriate)
- `web/src/pages/desktop/menu/settings/users/` and `.../account/`

The activity-log additions live in:

- `server/service/audit/` (log writer, rotation, read-back, runtime toggle) and `server/service/auth/audit.go` (admin endpoints)
- `server/middleware/audit.go` (global recording middleware)
- `web/src/pages/desktop/menu/settings/audit/` and the `audit` strings in `web/src/i18n/locales/*`

## 🤝 Contributing

Contributions to this fork are welcome:

1. Fork **this** repository (`Schattenwelt/NanoKVM`).
2. Create a feature branch off `multi-user-rbac`.
3. Commit your changes (please keep PRs small and focused).
4. Push to your branch and open a Pull Request against `multi-user-rbac`.

> Changes that are not RBAC-related and could benefit all NanoKVM users are better submitted to the [upstream project](https://github.com/sipeed/NanoKVM) directly.

## 💬 Community & Support

- **Issues with this fork:** [GitHub Issues](https://github.com/Schattenwelt/NanoKVM/issues)
- **Hardware questions / official firmware:** [Sipeed Discord](https://discord.gg/V4sAZ9XWpN), [Upstream FAQ](https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/faq.html), or [support@sipeed.com](mailto:support@sipeed.com)

> ⚠️ Please **do not** open issues about this fork on the upstream Sipeed repository, and do not contact Sipeed support about problems that only occur with this fork's build.

## 🛒 Where to Buy the Hardware

The hardware itself is unchanged — buy a regular NanoKVM and apply this update on top of the matching stock firmware.

- [AliExpress (global, except USA and Russia)](https://www.aliexpress.com/item/1005007369816019.html)
- [Taobao](https://item.taobao.com/item.htm?id=811206560480)
- [Sipeed online shop](https://sipeed.com/nanokvm)

## 🙏 Credits

- Original project: **[sipeed/NanoKVM](https://github.com/sipeed/NanoKVM)** — © Sipeed, licensed under GPL-3.0.
- Multi-user RBAC extensions, activity log, frontend UI, and build tooling: **[@Schattenwelt](https://github.com/Schattenwelt)** and contributors to this fork.
- Built with the LicheeRV Nano SDK and MaixCDK.

Trademarks "NanoKVM", "Sipeed", and "LicheeRV" belong to their respective owners. Their use in this README is descriptive only and does not imply endorsement.

## 📜 License

This project is licensed under the **GPL-3.0 License**, the same license as the upstream NanoKVM project. See [LICENSE](LICENSE) for the full text.

All modifications in this fork are released under the same license. A summary of changes relative to upstream is kept in [CHANGELOG.md](CHANGELOG.md).

> **No warranty.** This software is provided "as is", without warranty of any kind, to the extent permitted by applicable law. See sections 15 and 16 of the GPL-3.0 for details.
