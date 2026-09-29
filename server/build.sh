#!/bin/bash

set -e

# Configuration Variables
BINARY_NAME="NanoKVM-Server"
CC_COMPILER="riscv64-unknown-linux-musl-gcc"
CGO_CFLAGS_OPTS="-mcpu=c906fdv -march=rv64imafdcv0p7xthead -mcmodel=medany -mabi=lp64d"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to check if a command exists
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[ERROR] Required command '$1' not found.${NC}"
        echo "Please install it or ensure it is in your PATH."
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# Step 1: Check Prerequisites
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[INFO] Checking build environment...${NC}"

check_dependency "go"
check_dependency "patchelf"
check_dependency "$CC_COMPILER"

echo -e "${GREEN}[OK] All dependencies found.${NC}"

# ------------------------------------------------------------------------------
# Step 2: Build the Binary
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[INFO] Starting cross-compilation for RISC-V 64-bit...${NC}"

export CGO_ENABLED=1
export GOOS=linux
export GOARCH=riscv64
export CC="$CC_COMPILER"
export CGO_CFLAGS="$CGO_CFLAGS_OPTS"

# A release build compiles libkvm immediately before the server and stages it
# under kvmapp/. Link against that fresh ABI instead of the tracked development
# copy in server/dl_lib, while keeping the latter as a standalone-build fallback.
LINK_LIB_DIR="$PWD/dl_lib"
FRESH_LIB_DIR="$PWD/../kvmapp/server/dl_lib"
if [ -f "$FRESH_LIB_DIR/libkvm.so" ]; then
    LINK_LIB_DIR="$FRESH_LIB_DIR"
fi
bash "$PWD/../scripts/verify-video-libs.sh" "$LINK_LIB_DIR"
export CGO_LDFLAGS="-L$LINK_LIB_DIR -Wl,-rpath-link,$LINK_LIB_DIR -Wl,-rpath-link,$PWD/dl_lib ${CGO_LDFLAGS:-}"

go build -o "$BINARY_NAME" -v

if [ -f "$BINARY_NAME" ]; then
    echo -e "${GREEN}[SUCCESS] Binary '$BINARY_NAME' created successfully.${NC}"
else
    echo -e "${RED}[ERROR] Build failed. Binary not found.${NC}"
    exit 1
fi

# ------------------------------------------------------------------------------
# Step 3: Patch RPATH
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[INFO] Patching RPATH with patchelf...${NC}"

patchelf --add-rpath '$ORIGIN/dl_lib' "$BINARY_NAME"

echo -e "${GREEN}[DONE] Build script completed successfully!${NC}"
