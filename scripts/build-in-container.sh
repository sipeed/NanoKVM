#!/bin/bash
#
# Build every riscv64 artifact of a release, from inside the nanokvm-builder
# image (docker/Dockerfile). Not meant to be run on the host: it needs the
# riscv64 musl toolchain and the patched MaixCDK checkout that the image ships.
#
# Produces:
#   kvmapp/kvm_system/kvm_system    kvm_system daemon
#   kvmapp/server/dl_lib/           video libraries, including a fresh libkvm.so
#   server/NanoKVM-Server           Go server (BoringCrypto, RPATH $ORIGIN/dl_lib)

set -euo pipefail

# docker/entrypoint sets HOME for the build user. support/sg2002/build resolves
# both MaixCDK and the source tree through ~, so a wrong HOME would send the
# whole build at /root; say so plainly rather than emitting "directory missing".
BUILD_HOME="${BUILD_HOME:-/home/build}"
if [ "${HOME:-}" != "$BUILD_HOME" ]; then
    echo "[ERROR] HOME is '${HOME:-unset}', expected $BUILD_HOME" >&2
    echo "        run this inside the builder image via the Makefile" >&2
    exit 1
fi

MAIXCDK_PATH="$HOME/MaixCDK"
NANOKVM_PATH="$HOME/NanoKVM"

for dir in "$MAIXCDK_PATH" "$NANOKVM_PATH"; do
    if [ ! -d "$dir" ]; then
        echo "[ERROR] $dir not found - is this running inside nanokvm-builder?" >&2
        exit 1
    fi
done

# Check the toolchain up front. builder-image reuses any existing image, so an
# image built before a tooling change silently lacks it - and without this the
# SDK build would run for minutes before server/build.sh failed at the end.
for tool in go riscv64-unknown-linux-musl-gcc patchelf; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "[ERROR] '$tool' is missing from the builder image" >&2
        echo "        the image is out of date; rebuild it with: make rebuild-image" >&2
        exit 1
    fi
done

# The SDK tree is owned by the ids baked into the image (DOCKER_UID/DOCKER_GID),
# while the entrypoint drops to the caller's ids. If they disagree, syncing
# components fails partway through a long build; catch it here instead.
if [ ! -w "$MAIXCDK_PATH/components" ]; then
    echo "[ERROR] $MAIXCDK_PATH/components is not writable by $(id -u):$(id -g)" >&2
    echo "        the image was built for different ids; rebuild it with:" >&2
    echo "        make rebuild-image" >&2
    exit 1
fi

# shellcheck disable=SC1091
. "$MAIXCDK_PATH/bin/activate"

echo "::group::support: sync MaixCDK components"
cd "$NANOKVM_PATH/support/sg2002"
# The image bakes support/sg2002/additional/ into MaixCDK's components at image
# build time, and ./build only re-copies them when components/kvm is missing.
# Refresh unconditionally so a cached image never yields stale libraries.
./build update_lib
echo "::endgroup::"

echo "::group::support: build kvm_system"
./build kvm_system clean
./build kvm_system
./build kvm_system add_to_kvmapp
echo "::endgroup::"

echo "::group::support: build kvm_vision (libkvm.so)"
./build kvm_vision clean
./build kvm_vision
./build kvm_vision add_to_kvmapp
echo "::endgroup::"

echo "::group::server: cross-compile NanoKVM-Server"
cd "$NANOKVM_PATH/server"
GOFLAGS="-ldflags=-s" ./build.sh
echo "::endgroup::"

# support/sg2002/build reports "Build Error!" without a non-zero exit status for
# some failure paths, so assert on the artifacts rather than trusting $?.
echo "[INFO] verifying artifacts"
missing=0
for artifact in \
    "$NANOKVM_PATH/kvmapp/kvm_system/kvm_system" \
    "$NANOKVM_PATH/kvmapp/server/dl_lib/libkvm.so" \
    "$NANOKVM_PATH/server/NanoKVM-Server"
do
    if [ -f "$artifact" ]; then
        echo "  ok      ${artifact#$NANOKVM_PATH/}"
    else
        echo "  MISSING ${artifact#$NANOKVM_PATH/}" >&2
        missing=1
    fi
done

if [ "$missing" -ne 0 ]; then
    echo "[ERROR] build did not produce all expected artifacts" >&2
    exit 1
fi

# NanoKVM-Server is cgo-linked against the tracked server/dl_lib/libkvm.so
# (server/common/kvm_vision.go: -L../dl_lib -lkvm), but the package ships the
# freshly built one from kvm_vision. Those are different files, so confirm the
# shipped library still exports every symbol the binary actually imports from
# it. Without this a dropped symbol only shows up as a crash on a real device.
echo "[INFO] verifying shipped libkvm.so satisfies NanoKVM-Server"
if ! command -v readelf >/dev/null 2>&1; then
    echo "[WARN] readelf unavailable, skipping ABI check"
else
    exported() {
        readelf --dyn-syms --wide "$1" 2>/dev/null \
            | awk '$7 != "UND" && $8 != "" { print $8 }' \
            | sed 's/@.*//' | LC_ALL=C sort -u
    }
    imported() {
        readelf --dyn-syms --wide "$1" 2>/dev/null \
            | awk '$7 == "UND" && $8 != "" { print $8 }' \
            | sed 's/@.*//' | LC_ALL=C sort -u
    }

    linked_lib="$NANOKVM_PATH/server/dl_lib/libkvm.so"
    shipped_lib="$NANOKVM_PATH/kvmapp/server/dl_lib/libkvm.so"
    server_bin="$NANOKVM_PATH/server/NanoKVM-Server"

    # Symbols the binary imports that the link-time library provides, i.e. the
    # ones libkvm.so is actually responsible for at runtime.
    needed=$(comm -12 <(imported "$server_bin") <(exported "$linked_lib"))

    if [ -z "$needed" ]; then
        echo "[WARN] no libkvm symbols resolved; skipping ABI check"
    else
        absent=$(comm -23 <(printf '%s\n' "$needed") <(exported "$shipped_lib"))
        if [ -n "$absent" ]; then
            echo "[ERROR] shipped libkvm.so is missing symbols NanoKVM-Server needs:" >&2
            printf '  %s\n' $absent >&2
            exit 1
        fi
        echo "  ok      $(printf '%s\n' "$needed" | wc -l | tr -d ' ') libkvm symbols resolve"
    fi
fi

echo "[DONE] riscv64 artifacts built"
