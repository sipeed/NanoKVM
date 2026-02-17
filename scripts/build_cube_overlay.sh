#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Build NanoKVM Cube overlay package (backend + frontend + archive).

Usage:
  build_cube_overlay.sh [options]

Options:
  --repo <path>            Repository root (default: parent of scripts/)
  --archive-name <name>    Output archive name in build/ (default: nanokvm-cube-overlay.tar.gz)
  --skip-backend           Skip backend build (requires existing server/NanoKVM-Server)
  --skip-frontend          Skip frontend build (requires existing web/dist)
  --host-tools-bin <path>  Path to riscv toolchain bin dir
                           (default: /opt/host-tools/gcc/riscv64-linux-musl-x86_64/bin)
  -h, --help               Show this help

Examples:
  ./scripts/build_cube_overlay.sh
  ./scripts/build_cube_overlay.sh --skip-backend
  ./scripts/build_cube_overlay.sh --archive-name nanokvm-cube-overlay-dev.tar.gz
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARCHIVE_NAME="nanokvm-cube-overlay.tar.gz"
HOST_TOOLS_BIN="/opt/host-tools/gcc/riscv64-linux-musl-x86_64/bin"
SKIP_BACKEND=0
SKIP_FRONTEND=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_ROOT="${2:-}"
      shift 2
      ;;
    --archive-name)
      ARCHIVE_NAME="${2:-}"
      shift 2
      ;;
    --skip-backend)
      SKIP_BACKEND=1
      shift
      ;;
    --skip-frontend)
      SKIP_FRONTEND=1
      shift
      ;;
    --host-tools-bin)
      HOST_TOOLS_BIN="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
SERVER_DIR="$REPO_ROOT/server"
WEB_DIR="$REPO_ROOT/web"
BUILD_DIR="$REPO_ROOT/build"
RELEASE_DIR="$REPO_ROOT/release"
ARCHIVE_PATH="$BUILD_DIR/$ARCHIVE_NAME"

[[ -d "$REPO_ROOT" ]] || die "repo not found: $REPO_ROOT"
[[ -d "$SERVER_DIR" ]] || die "missing server dir: $SERVER_DIR"
[[ -d "$WEB_DIR" ]] || die "missing web dir: $WEB_DIR"

require_cmd tar
require_cmd cp
require_cmd rm
require_cmd mkdir
require_cmd chmod
require_cmd date

if [[ -d "$HOST_TOOLS_BIN" ]]; then
  export PATH="$HOST_TOOLS_BIN:$PATH"
fi

echo "Repo: $REPO_ROOT"
echo "Archive: $ARCHIVE_PATH"

if [[ "$SKIP_BACKEND" -eq 0 ]]; then
  echo "==> Building backend"
  require_cmd go
  require_cmd patchelf
  require_cmd riscv64-unknown-linux-musl-gcc
  (cd "$SERVER_DIR" && ./build.sh)
else
  echo "==> Skipping backend build"
fi

[[ -f "$SERVER_DIR/NanoKVM-Server" ]] || die "missing backend binary: $SERVER_DIR/NanoKVM-Server"

if [[ "$SKIP_FRONTEND" -eq 0 ]]; then
  echo "==> Building frontend"
  require_cmd node
  require_cmd pnpm

  node_major="$(node -p 'parseInt(process.versions.node.split(\".\")[0], 10)')"
  if [[ "$node_major" -lt 20 ]]; then
    die "Node.js >= 20 is required for vite build (current: $(node -v))"
  fi

  (
    cd "$WEB_DIR"
    CI=true pnpm install --frozen-lockfile
    pnpm build
  )
else
  echo "==> Skipping frontend build"
fi

[[ -d "$WEB_DIR/dist" ]] || die "missing frontend build output: $WEB_DIR/dist"

echo "==> Preparing release overlay"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/kvmapp/server" "$RELEASE_DIR/kvmapp/system"

cp -a "$REPO_ROOT/kvmapp/system/." "$RELEASE_DIR/kvmapp/system/"
cp "$SERVER_DIR/NanoKVM-Server" "$RELEASE_DIR/kvmapp/server/NanoKVM-Server"
cp -a "$WEB_DIR/dist" "$RELEASE_DIR/kvmapp/server/web"

chmod +x "$RELEASE_DIR/kvmapp/server/NanoKVM-Server"
chmod +x "$RELEASE_DIR/kvmapp/system/init.d/S95nanokvm"
if [[ -f "$RELEASE_DIR/kvmapp/system/init.d/S98tailscaled" ]]; then
  chmod +x "$RELEASE_DIR/kvmapp/system/init.d/S98tailscaled"
fi
if [[ -f "$RELEASE_DIR/kvmapp/system/init.d/S99netbird" ]]; then
  chmod +x "$RELEASE_DIR/kvmapp/system/init.d/S99netbird"
fi

mkdir -p "$BUILD_DIR"
tar -czf "$ARCHIVE_PATH" -C "$RELEASE_DIR" kvmapp

echo "==> Build complete"
ls -lh "$ARCHIVE_PATH"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$ARCHIVE_PATH"
fi
