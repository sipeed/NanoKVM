#!/bin/bash
#
# Assemble a NanoKVM release package: nanokvm_<version>.tar.gz + latest.json.
#
# The layout and the manifest fields are dictated by the on-device updater:
#   - server/service/application/version.go  parses latest.json and derives the
#     download URL as "<base>/<name>", so "name" must be the tarball file name.
#   - server/service/application/update.go   verifies the download against
#     "sha512", which is the *base64* encoding of the raw SHA-512 digest.
#   - server/service/application/archive.go validates and extracts the package
#     before install.go moves its single top-level directory over /kvmapp, so
#     the tarball must contain exactly one root directory: nanokvm_<version>/.
#
# Build artifacts are expected to be in place already (see
# scripts/build-in-container.sh and the "web" target in the Makefile):
#   server/NanoKVM-Server           riscv64 server binary
#   kvmapp/kvm_system/kvm_system    kvm_system daemon
#   kvmapp/server/dl_lib/libkvm.so  freshly built video library (optional)
#   web/dist/                       built frontend
#
# Usage: scripts/package.sh <version>

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>   e.g. $0 2.4.4" >&2
    exit 1
fi

# The updater rejects file names outside [a-zA-Z0-9._-] (update_offline.go),
# and the version string ends up in the file name, so validate it up front.
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "[ERROR] invalid version '$VERSION', expected MAJOR.MINOR.PATCH" >&2
    exit 1
fi

OUT="$ROOT/build/release"
STAGE="$OUT/nanokvm_$VERSION"
TARBALL="$OUT/nanokvm_$VERSION.tar.gz"
MANIFEST="$OUT/latest.json"

require_file() {
    if [ ! -f "$1" ]; then
        echo "[ERROR] missing build artifact: ${1#"$ROOT"/}" >&2
        echo "        $2" >&2
        exit 1
    fi
}

# A host-architecture build is indistinguishable from a cross-compiled one by
# name alone, and NanoKVM-Server is gitignored, so nothing else would catch it.
# Refuse to package anything that is not riscv64 (ELF e_machine 243).
require_riscv64() {
    local path="$1" magic machine
    magic=$(od -An -tx1 -N4 "$path" | tr -d ' \n')
    if [ "$magic" != "7f454c46" ]; then
        echo "[ERROR] not an ELF object: ${path#"$ROOT"/}" >&2
        exit 1
    fi
    machine=$(od -An -tu1 -j18 -N1 "$path" | tr -d ' \n')
    if [ "$machine" != "243" ]; then
        echo "[ERROR] ${path#"$ROOT"/} is not riscv64 (ELF e_machine=$machine)" >&2
        echo "        a host-architecture build must never be packaged" >&2
        exit 1
    fi
}

require_file "$ROOT/server/NanoKVM-Server" "run: make app"
require_file "$ROOT/kvmapp/kvm_system/kvm_system" "run: make support"
require_file "$ROOT/web/dist/index.html" "run: make web"
# libkvm.so is the one runtime library that must come from the build: the copy
# tracked in server/dl_lib/ exists for cgo link time and lags far behind. If it
# were optional here, "make package" on its own would quietly ship the stale one.
require_file "$ROOT/kvmapp/server/dl_lib/libkvm.so" "run: make vision"

require_riscv64 "$ROOT/server/NanoKVM-Server"
require_riscv64 "$ROOT/kvmapp/kvm_system/kvm_system"
require_riscv64 "$ROOT/kvmapp/server/dl_lib/libkvm.so"

echo "[INFO] staging nanokvm_$VERSION"
# Clear the whole output directory: release.yml uploads build/release/nanokvm_*
# by glob, and a leftover tarball from an earlier version would ride along.
rm -rf "$OUT"
mkdir -p "$STAGE"

# 1. Everything tracked under kvmapp/ (init scripts, picoclaw bundle, kernel
#    module, jpg_stream, kvm_stream) plus whatever the support build dropped in
#    (kvm_system, server/dl_lib). -a carries the exec bits over from git, which
#    only matters for reading the archive by hand: install.go chmods the whole
#    tree to 0755 on the device regardless.
cp -a "$ROOT/kvmapp/." "$STAGE/"

# 2. Version marker. The updater reads /kvmapp/version to report the currently
#    installed version (version.go).
printf '%s\n' "$VERSION" > "$STAGE/version"

# 3. Go server binary.
mkdir -p "$STAGE/server"
cp -a "$ROOT/server/NanoKVM-Server" "$STAGE/server/NanoKVM-Server"

# 4. Runtime shared libraries. "build kvm_vision add_to_kvmapp" copies its whole
#    dist/dl_lib into kvmapp/server/dl_lib, so freshly built libraries are
#    already staged; the tracked server/dl_lib/ backfills the rest. Never
#    clobber a fresh library with the tracked (link-time) copy.
mkdir -p "$STAGE/server/dl_lib"
for lib in "$ROOT"/server/dl_lib/*; do
    [ -e "$lib" ] || continue
    name="$(basename "$lib")"
    if [ ! -e "$STAGE/server/dl_lib/$name" ]; then
        cp -a "$lib" "$STAGE/server/dl_lib/$name"
    fi
done

#    The pinned SDK dist could still add or rename a library when its revision
#    is deliberately updated (e.g. an soname bump leaving both .409 and .410
#    behind). Require the shipped names to be exactly the tracked set, and fail
#    loudly otherwise.
staged_libs=$(cd "$STAGE/server/dl_lib" && ls -1 | LC_ALL=C sort)
tracked_libs=$(cd "$ROOT/server/dl_lib" && ls -1 | LC_ALL=C sort)
if [ "$staged_libs" != "$tracked_libs" ]; then
    echo "[ERROR] shipped server/dl_lib does not match the tracked library set" >&2
    echo "        unexpected (in package, not tracked):" >&2
    comm -23 <(printf '%s\n' "$staged_libs") <(printf '%s\n' "$tracked_libs") \
        | sed 's/^/          + /' >&2
    echo "        absent (tracked, not in package):" >&2
    comm -13 <(printf '%s\n' "$staged_libs") <(printf '%s\n' "$tracked_libs") \
        | sed 's/^/          - /' >&2
    echo "        if this change is intended, update server/dl_lib/ to match." >&2
    exit 1
fi

#    A library arrives either from the SDK dist (mode 755) or from the tracked
#    backfill (git stores them 644), so without this the archive would depend on
#    which path populated each file. 644 is what published releases have always
#    carried, and install.go chmods the installed tree to 0755 anyway.
chmod 644 "$STAGE"/server/dl_lib/*

# 5. Frontend. router.go serves <dir of executable>/web.
rm -rf "$STAGE/server/web"
mkdir -p "$STAGE/server/web"
cp -a "$ROOT/web/dist/." "$STAGE/server/web/"

# 6. EDID helper shipped under system/tool/ (prebuilt riscv64 binary in tools/).
mkdir -p "$STAGE/system/tool"
cp -a "$ROOT/tools/nanokvm_update_edid/nanokvm_update_edid" "$STAGE/system/tool/"
cp -a "$ROOT/tools/nanokvm_update_edid/E21_NanoKVM.bin" "$STAGE/system/tool/"

# 7. Default runtime state read by common.GetScreen() on first boot.
mkdir -p "$STAGE/kvm"
printf '30\n'    > "$STAGE/kvm/fps"
printf '0\n'     > "$STAGE/kvm/now_fps"
printf '60\n'    > "$STAGE/kvm/qlty"
printf '1920\n'  > "$STAGE/kvm/width"
printf '1080\n'  > "$STAGE/kvm/height"
printf '0\n'     > "$STAGE/kvm/state"
printf 'mjpeg\n' > "$STAGE/kvm/type"
printf '0'       > "$STAGE/kvm/res"

# 8. Directories the released package has always carried, kept so the layout
#    matches previous releases exactly (system_init.cpp probes inside them).
mkdir -p "$STAGE/jpg_stream/dl_lib" "$STAGE/kvm_system/dl_lib"

# --- archive -----------------------------------------------------------------
# Normalise owner and timestamps so the same source tree yields the same
# tarball, which makes the published sha512 verifiable after the fact.
SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-$(git -C "$ROOT" log -1 --format=%ct 2>/dev/null || echo 0)}"

find "$STAGE" -exec touch -d "@$SOURCE_DATE_EPOCH" {} + 2>/dev/null \
    || find "$STAGE" -exec touch -t "$(date -r "$SOURCE_DATE_EPOCH" +%Y%m%d%H%M.%S)" {} + 2>/dev/null \
    || echo "[WARN] could not normalise timestamps"

echo "[INFO] creating $(basename "$TARBALL")"
rm -f "$TARBALL"

# Read the version into a variable first: piping through head can hand tar a
# SIGPIPE, and under "set -o pipefail" that would silently select the bsdtar
# branch on a GNU system, quietly losing reproducibility.
tar_version="$(tar --version 2>/dev/null || true)"

if [ "${tar_version#*GNU}" != "$tar_version" ]; then
    tar --format=gnu --sort=name \
        --owner=0 --group=0 --numeric-owner \
        --mtime="@$SOURCE_DATE_EPOCH" \
        -C "$OUT" -cf - "nanokvm_$VERSION" \
        | gzip -n -9 > "$TARBALL"
else
    # bsdtar (macOS): no --sort/--mtime, so the archive is not byte-reproducible.
    echo "[WARN] GNU tar not found; archive will not be byte-reproducible"
    tar --uid 0 --gid 0 --uname '' --gname '' \
        -C "$OUT" -cf - "nanokvm_$VERSION" \
        | gzip -n -9 > "$TARBALL"
fi

# --- manifest ----------------------------------------------------------------
# update.go compares base64(raw sha512), not the hex digest.
SHA512="$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)"
SIZE_BYTES="$(wc -c < "$TARBALL" | tr -d ' ')"
UNPACKED_SIZE_BYTES="$(python3 - "$TARBALL" <<'PY'
import sys
import tarfile

total = 0
with tarfile.open(sys.argv[1], "r:gz") as archive:
    for member in archive:
        if member.isfile():
            total += member.size
print(total)
PY
)"

cat > "$MANIFEST" <<EOF
{
  "manifest_version": 2,
  "version": "$VERSION",
  "name": "nanokvm_$VERSION.tar.gz",
  "sha512": "$SHA512",
  "size": $SIZE_BYTES,
  "size_bytes": $SIZE_BYTES,
  "unpacked_size_bytes": $UNPACKED_SIZE_BYTES
}
EOF

echo
echo "[DONE] $TARBALL"
echo "[DONE] $MANIFEST"
cat "$MANIFEST"
