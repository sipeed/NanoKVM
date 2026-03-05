# Building and Deploying NanoKVM

This guide covers building the server binary and web frontend, deploying to a NanoKVM device, and backing up or restoring the USB descriptor configuration.

---

## Prerequisites

| Tool | Purpose | Notes |
|------|---------|-------|
| Docker | Cross-compile Go for RISC-V | Docker Desktop or Colima |
| pnpm | Build web frontend | `npm install -g pnpm` |
| ssh / scp | Deploy to device | Device must be on your network |

### ARM Mac (Apple Silicon) — additional setup

The build container runs x86_64 binaries. On ARM Macs you need QEMU emulation via Docker buildx:

```bash
brew install docker-buildx
```

Then enable it:

```bash
docker buildx install
```

---

## 1. Build the Docker image

Only needs to be done once (or after Dockerfile changes):

```bash
make builder-image
```

---

## 2. Build the server binary

```bash
make app
```

Output: `server/NanoKVM-Server`

### ARM Mac — QEMU segfaults

QEMU x86_64 emulation on Apple Silicon occasionally causes the Go compiler to segfault mid-build. Go's build cache saves progress between attempts, so just retry:

```bash
for i in $(seq 1 5); do
  echo "=== Attempt $i ==="
  make app && break
done
```

This typically succeeds within 2–5 tries.

---

## 3. Build the web frontend

```bash
cd web
pnpm install
pnpm build
```

Output: `web/dist/`

---

## 4. Deploy to the device

Replace `<device-ip>` with your NanoKVM's IP address. The default SSH password is `root`.

### 4a. Deploy the server binary

```bash
scp server/NanoKVM-Server root@<device-ip>:/kvmapp/server/NanoKVM-Server
```

### 4b. Deploy the web frontend

```bash
scp -r web/dist/* root@<device-ip>:/kvmapp/server/www/
```

### 4c. Deploy the init script (if modified)

```bash
scp kvmapp/system/init.d/S03usbdev root@<device-ip>:/etc/init.d/S03usbdev
ssh root@<device-ip> chmod +x /etc/init.d/S03usbdev
```

### 4d. Restart the server

```bash
ssh root@<device-ip> /etc/init.d/S95nanokvm restart
```

The startup script copies `/kvmapp/server/` to `/tmp/server/` and runs from there, so the restart picks up your new binary automatically.

#### If the server fails to start with a missing library error

The musl dynamic linker on this device has no configured search path for `dl_lib/`. If you see `Error loading shared library libkvm.so`, patch the startup script to set `LD_LIBRARY_PATH` permanently:

```bash
sed -i 's|/tmp/server/NanoKVM-Server &|LD_LIBRARY_PATH=/tmp/server/dl_lib /tmp/server/NanoKVM-Server \&|g' /etc/init.d/S95nanokvm
/etc/init.d/S95nanokvm restart
```

This survives reboots. The patch is idempotent — safe to run more than once.

---

## 5. Back up USB descriptor configuration

USB descriptor settings are persisted in `/boot/` as plain text files. To back them up locally:

```bash
ssh root@<device-ip> 'for f in usb.vid usb.pid usb.manufacturer usb.product usb.serial; do
  [ -f /boot/$f ] && echo "$f=$(cat /boot/$f)" || echo "$f=(default)"
done'
```

To save to a local file:

```bash
ssh root@<device-ip> 'cd /boot && tar czf - usb.vid usb.pid usb.manufacturer usb.product usb.serial 2>/dev/null' \
  > usb-descriptor-backup.tar.gz
```

> **Note:** If none of the `/boot/usb.*` files exist, the device is using factory defaults and no backup is needed — Restore Defaults in the UI will return to the same state.

---

## 6. Restore USB descriptor configuration

### From the UI

In the NanoKVM web UI, go to **Settings > Device > USB Descriptor** and click **Restore Defaults**. This resets to:

| Field | Default |
|-------|---------|
| Manufacturer | `sipeed` |
| Product | `NanoKVM` |
| Serial | `0123456789ABCDEF` |
| VID | `0x3346` |
| PID | `0x1009` |

### From a backup archive

```bash
cat usb-descriptor-backup.tar.gz | ssh root@<device-ip> 'tar xzf - -C /boot'
```

Then reboot or trigger a USB rebind:

```bash
ssh root@<device-ip> '/etc/init.d/S03usbdev restart'
```

### Manually clear all overrides (revert to factory defaults)

```bash
ssh root@<device-ip> 'rm -f /boot/usb.vid /boot/usb.pid /boot/usb.manufacturer /boot/usb.product /boot/usb.serial'
```

Changes take effect on next boot, or immediately via the UI's **Restore Defaults** button.
