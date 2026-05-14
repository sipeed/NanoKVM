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

This fork extends NanoKVM with **multi-user support and role-based access control (RBAC)** on the backend, plus the matching frontend UI for user management.

### 👥 Three built-in roles

| Role         | Stream | Power / Reset (GPIO) | Terminal & Scripts | HID Paste / Shortcuts | System Config (HDMI/SSH/Reboot/Hostname/TLS) | User Management |
| ------------ | :----: | :------------------: | :----------------: | :-------------------: | :------------------------------------------: | :-------------: |
| **viewer**   |   ✅   |          ❌          |         ❌         |          ❌           |                      ❌                      |        ❌        |
| **operator** |   ✅   |          ✅          |         ✅         |          ✅           |                      ❌                      |        ❌        |
| **admin**    |   ✅   |          ✅          |         ✅         |          ✅           |                      ✅                      |        ✅        |

Read-only endpoints (info, hardware, mDNS state, hostname, web title, autostart list, etc.) are accessible by **any authenticated user**.

### 🔐 Other security features

- **bcrypt** password hashing (no plaintext or simple-hash storage)
- **JWT** session cookies (`nano-kvm-token`) carrying username + role
- **Brute-force protection** on the login endpoint
- **Enable/disable** users without deleting them
- **Last-admin protection**: the last enabled admin account cannot be deleted
- **Self-delete protection**: admins cannot delete their own account
- Internal loopback endpoints (used by `kvm_system` / picoclaw) are gated by a separate loopback token, not JWT

### 📁 Storage & migration

- User accounts are stored in `/etc/kvm/accounts.json` (mode `0600`, JSON, bcrypt-hashed passwords).
- On first start, an existing single-user setup in `/etc/kvm/pwd` is **automatically migrated** — the existing user becomes the initial `admin`. The legacy file is removed after migration.
- If no accounts file exists, a default account is created: **username `admin` / password `admin`** (change it immediately on first login).

### 🌐 Frontend additions

- New settings pages: `Settings → Users` (list / add / edit / disable / delete) and `Settings → Account` (change own password).
- Login and password pages reused from upstream, extended for the new account model.

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

The repository contains a PowerShell helper (`build_nanokvm_multiuser.ps1`) that builds the modified backend in Docker and repacks it as an offline-update `.tar.gz`.

### Prerequisites

- Windows with **PowerShell 5+**
- **Docker Desktop** (running)
- `tar.exe` on PATH (ships with Windows 10/11)
- A working internet connection (downloads musl cross-compiler and Go modules)

### Inputs

Place these two files next to the build script:

1. The **original Sipeed update package** for the NanoKVM version you want to target (`.tar.gz` containing the compiled `NanoKVM-Server` binary and `kvm_system`).
2. The **source package** of this fork (`.tar.gz` containing `go.mod` and the modified Go sources).

### Run it

```powershell
.\build_nanokvm_multiuser.ps1
```

The script will:

1. Auto-detect the two input archives.
2. Spin up a `golang:1.22-bookworm` container.
3. Download the **`riscv64-linux-musl-cross`** toolchain (with fallback mirrors).
4. Patch `go.mod` to pinned dependency versions and build `NanoKVM-Server` for `GOOS=linux GOARCH=riscv64 CGO_ENABLED=1` against the Sipeed `libkvm` shared library.
5. Replace the binary and `web/` assets in the original package (preserving `sipeed.ico`).
6. Patch `S95nanokvm` init scripts to set `LD_LIBRARY_PATH=/tmp/server/dl_lib`.
7. Output `NanoKVM-Output/nanokvm_<version>.tar.gz`.

> The script keeps the upstream package layout intact; only the server binary, web bundle, and init script are touched.

For frontend-only changes, see [`web/README.md`](web/README.md) — `pnpm dev` against a NanoKVM device on the LAN.

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
│   │   └── brute_force.go              # rate-limited login attempts
│   ├── middleware/jwt.go               # CheckToken + RequireRole(...)
│   └── router/                         # endpoint groups by required role
├── web                                 # React front-end — extended with:
│   ├── src/pages/desktop/menu/settings/users/    # admin user management UI
│   └── src/pages/desktop/menu/settings/account/  # own account / password UI
├── kvmapp                              # unchanged from upstream (kvm_system, system, …)
├── support                             # unchanged from upstream (sg2002 modules)
└── build_nanokvm_multiuser.ps1         # Docker-based build wrapper (Windows)
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
- Multi-user RBAC extensions, frontend UI, and build tooling: **[@Schattenwelt](https://github.com/Schattenwelt)** and contributors to this fork.
- Built with the LicheeRV Nano SDK and MaixCDK.

Trademarks "NanoKVM", "Sipeed", and "LicheeRV" belong to their respective owners. Their use in this README is descriptive only and does not imply endorsement.

## 📜 License

This project is licensed under the **GPL-3.0 License**, the same license as the upstream NanoKVM project. See [LICENSE](LICENSE) for the full text.

All modifications in this fork are released under the same license. A summary of changes relative to upstream is kept in [CHANGELOG.md](CHANGELOG.md).

> **No warranty.** This software is provided "as is", without warranty of any kind, to the extent permitted by applicable law. See sections 15 and 16 of the GPL-3.0 for details.
