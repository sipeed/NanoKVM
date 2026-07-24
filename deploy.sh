#!/usr/bin/env bash
# NanoKVM dev deploy helper. Builds and uploads changed components to a
# running NanoKVM over SSH. SSH must be enabled on the device
# (Settings > SSH).
#
# Usage: NANOKVM_HOST=<host> ./deploy.sh <target> [reboot]
#
# See `./deploy.sh` with no args for the full target list.

set -euo pipefail

HOST="${NANOKVM_HOST:-london-gw-kvm.london.zelotus.com}"
SSH_USER="${NANOKVM_SSH_USER:-root}"
TARGET="${SSH_USER}@${HOST}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

usage() {
  cat <<EOF
Usage: NANOKVM_HOST=<host> $(basename "$0") <target> [reboot]

Targets:
  script   Push kvmapp/system/init.d/S03usb{dev,hid} to /etc/init.d/ and
           /kvmapp/system/init.d/ on the device. Pass "reboot" as 2nd arg
           to reboot afterwards (required to rebind the USB gadget).
  server   make app -> scp NanoKVM-Server -> restart S95nanokvm
  web      pnpm build -> rsync dist -> restart S95nanokvm
  all      script + server + web (no auto-reboot)
  status   Show which init.d script is live, what /boot/usb.* flags exist,
           and current usb_gadget function set
  shell    Open an interactive SSH session

Environment:
  NANOKVM_HOST       target hostname (default: ${HOST})
  NANOKVM_SSH_USER   ssh user (default: ${SSH_USER})
  SSH_OPTS           extra ssh/scp options (default: ${SSH_OPTS})
EOF
  exit 1
}

# shellcheck disable=SC2086
ssh_run() { ssh ${SSH_OPTS} "${TARGET}" "$@"; }
# shellcheck disable=SC2086
scp_to()  { scp ${SSH_OPTS} "$1" "${TARGET}:$2"; }

target_script() {
  echo ">>> Pushing init.d scripts to ${HOST}"
  scp_to kvmapp/system/init.d/S03usbdev /etc/init.d/S03usbdev
  scp_to kvmapp/system/init.d/S03usbhid /etc/init.d/S03usbhid
  scp_to kvmapp/system/init.d/S03usbdev /kvmapp/system/init.d/S03usbdev
  scp_to kvmapp/system/init.d/S03usbhid /kvmapp/system/init.d/S03usbhid
  ssh_run 'chmod +x /etc/init.d/S03usb* /kvmapp/system/init.d/S03usb*'
  if [ "${1:-}" = "reboot" ]; then
    echo ">>> Rebooting"
    ssh_run reboot || true
  else
    echo ">>> Done. Reboot required to rebind the USB gadget:"
    echo "      ssh ${TARGET} reboot"
  fi
}

target_server() {
  echo ">>> Building Go server (make app)"
  make app
  echo ">>> Uploading server/NanoKVM-Server"
  scp_to server/NanoKVM-Server /kvmapp/server/NanoKVM-Server
  # The binary's rpath resolves libkvm.so from $ORIGIN/dl_lib at runtime,
  # so the .so versions must match the binary's expected ABI. Ship dl_lib
  # alongside the binary in case the device's installed copy is older.
  echo ">>> Syncing server/dl_lib -> /kvmapp/server/dl_lib/"
  # shellcheck disable=SC2086
  rsync -avz -e "ssh ${SSH_OPTS}" server/dl_lib/ "${TARGET}:/kvmapp/server/dl_lib/"
  ssh_run 'chmod +x /kvmapp/server/NanoKVM-Server && /etc/init.d/S95nanokvm restart'
}

target_web() {
  if command -v pnpm >/dev/null 2>&1; then
    echo ">>> Building frontend (pnpm)"
    (cd web && pnpm install --frozen-lockfile && pnpm build)
  else
    echo ">>> pnpm not found, falling back to npm"
    (cd web && npm install --no-fund --no-audit && ./node_modules/.bin/vite build)
  fi
  echo ">>> Syncing web/dist -> /kvmapp/server/web/"
  # shellcheck disable=SC2086
  rsync -avz --delete -e "ssh ${SSH_OPTS}" web/dist/ "${TARGET}:/kvmapp/server/web/"
  ssh_run '/etc/init.d/S95nanokvm restart'
}

target_status() {
  ssh_run '
    echo "== live /etc/init.d/ ==";
    ls -la /etc/init.d/S03usb* 2>/dev/null || echo "(none)";
    echo;
    echo "== kvmapp /kvmapp/system/init.d/ ==";
    ls -la /kvmapp/system/init.d/S03usb* 2>/dev/null || echo "(none)";
    echo;
    echo "== /boot flags ==";
    ls -la /boot/usb.* /boot/disable_hid /boot/BIOS 2>/dev/null || echo "(none)";
    echo;
    echo "== usb_gadget functions ==";
    ls /sys/kernel/config/usb_gadget/g0/functions 2>/dev/null || echo "(gadget not bound)";
    echo;
    echo "== usb_gadget configs/c.1 links ==";
    ls -la /sys/kernel/config/usb_gadget/g0/configs/c.1/ 2>/dev/null || true;
  '
}

case "${1:-}" in
  script) shift || true; target_script "${1:-}" ;;
  server) target_server ;;
  web)    target_web ;;
  all)    target_script; target_server; target_web ;;
  status) target_status ;;
  # shellcheck disable=SC2086
  shell)  exec ssh ${SSH_OPTS} "${TARGET}" ;;
  *)      usage ;;
esac
