#!/usr/bin/env bash
#
# build-deploy.sh — cross-compile the NanoKVM server (including the PicoClaw
# integration) for RISC-V and deploy it to a NanoKVM over SSH.
#
# It builds inside the repo's Docker builder image (Go 1.25 + the
# riscv64-unknown-linux-musl toolchain + MaixCDK/libkvm), patches the
# $ORIGIN/dl_lib rpath so the device can find libkvm.so, then scp's the binary
# to /kvmapp/server and restarts the service.
#
# Run from WSL2 or Git Bash with Docker Desktop (the Makefile path won't work in
# raw PowerShell). The first run builds the toolchain image and is slow.
#
# Usage:
#   ./build-deploy.sh <nanokvm-host>             # build + deploy
#   ./build-deploy.sh --build-only               # build only, no deploy
#   ./build-deploy.sh 192.168.1.50 --user root   # custom ssh user
#   ./build-deploy.sh 192.168.1.50 --with-web    # also build+push the frontend
#
# Env overrides: NANOKVM_HOST, NANOKVM_USER (default root), IMAGE_NAME
#
set -euo pipefail

# Git Bash / MSYS mangles container-side /paths into Windows paths — disable it.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

IMAGE_NAME="${IMAGE_NAME:-nanokvm-builder}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${NANOKVM_HOST:-}"
USER_NAME="${NANOKVM_USER:-root}"
BUILD_ONLY=0
WITH_WEB=0

while [ $# -gt 0 ]; do
  case "$1" in
    --build-only) BUILD_ONLY=1 ;;
    --with-web)   WITH_WEB=1 ;;
    --user)       USER_NAME="${2:?--user needs a value}"; shift ;;
    -h|--help)    sed -n '/^# Usage:/,/^# Env overrides:/p' "$0" | sed 's/^#\{1,\} \{0,1\}//'; exit 0 ;;
    -*)           echo "unknown flag: $1" >&2; exit 2 ;;
    *)            HOST="$1" ;;
  esac
  shift
done

log() { printf '\033[1;33m[*]\033[0m %s\n' "$*"; }
ok()  { printf '\033[0;32m[ok]\033[0m %s\n' "$*"; }
die() { printf '\033[0;31m[err]\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker not found (need Docker Desktop / docker CLI on PATH)"

# ---------------------------------------------------------------------------
# 1. Ensure the builder image exists
# ---------------------------------------------------------------------------
if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
  log "Builder image '$IMAGE_NAME' missing — building it (one-time, slow: Go + musl toolchain + libkvm)..."
  ( cd "$REPO_DIR" && docker build -t "$IMAGE_NAME" -f docker/Dockerfile . )
  ok "Builder image ready."
else
  ok "Builder image '$IMAGE_NAME' present."
fi

# ---------------------------------------------------------------------------
# 2. Cross-compile + patch rpath
#    Runs as root (no -e UID) so we can guarantee patchelf is available;
#    build.sh aborts without it. Ownership is restored to the mount owner.
# ---------------------------------------------------------------------------
log "Cross-compiling server/NanoKVM-Server for linux/riscv64..."
docker run --rm -v "$REPO_DIR":/home/build/NanoKVM "$IMAGE_NAME" bash -c '
  set -e
  if ! command -v patchelf >/dev/null 2>&1; then
    echo "[*] installing patchelf in builder..."
    apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq patchelf >/dev/null
  fi
  cd /home/build/NanoKVM/server
  ./build.sh
  chown --reference=. NanoKVM-Server 2>/dev/null || true
'
[ -f "$REPO_DIR/server/NanoKVM-Server" ] || die "build produced no binary"
ok "Built server/NanoKVM-Server"

if [ "$BUILD_ONLY" -eq 1 ]; then
  ok "Build-only: binary at server/NanoKVM-Server (not deployed)."
  exit 0
fi

[ -n "$HOST" ] || die "no NanoKVM host given — pass it as an argument or set NANOKVM_HOST."
SSH_TARGET="$USER_NAME@$HOST"

# ---------------------------------------------------------------------------
# 3. Deploy
#    The device runs /kvmapp/server/NanoKVM-Server (copied to /tmp/server at
#    start), so overwriting it is safe and 'restart' picks up the new build.
#    Leave /kvmapp/server/dl_lib in place — the rpath points at it.
# ---------------------------------------------------------------------------
log "Copying binary -> $SSH_TARGET:/kvmapp/server/NanoKVM-Server"
scp "$REPO_DIR/server/NanoKVM-Server" "$SSH_TARGET:/kvmapp/server/NanoKVM-Server" \
  || die "scp failed. If it's 'Read-only file system', SSH in and run: mount -o remount,rw /kvmapp"

if [ "$WITH_WEB" -eq 1 ]; then
  command -v pnpm >/dev/null || die "--with-web needs pnpm on PATH"
  log "Building web frontend..."
  ( cd "$REPO_DIR/web" && pnpm install --frozen-lockfile && pnpm build )
  [ -d "$REPO_DIR/web/dist" ] || die "web build produced no dist/ — check web build output dir"
  log "Copying web/dist -> $SSH_TARGET:/kvmapp/server/web/ (verify this path matches your device layout)"
  scp -r "$REPO_DIR/web/dist/." "$SSH_TARGET:/kvmapp/server/web/"
fi

log "Restarting NanoKVM service..."
ssh "$SSH_TARGET" '/etc/init.d/S95nanokvm restart'
ok "Done — new server is live."
