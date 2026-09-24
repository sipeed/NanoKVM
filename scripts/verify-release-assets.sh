#!/bin/bash
# Verify the four assets that make up a NanoKVM GitHub release.

set -euo pipefail

ASSET_DIR="${1:-}"
VERSION="${2:-}"

if [ -z "$ASSET_DIR" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <asset-directory> <version>" >&2
    exit 1
fi
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "[ERROR] invalid version '$VERSION', expected MAJOR.MINOR.PATCH" >&2
    exit 1
fi

TARBALL_NAME="nanokvm_${VERSION}.tar.gz"
TARBALL="$ASSET_DIR/$TARBALL_NAME"
MANIFEST="$ASSET_DIR/latest.json"
CHECKSUM="$ASSET_DIR/sha256.txt"
NETBIRD="$ASSET_DIR/netbird_riscv64.tgz"

for path in "$TARBALL" "$MANIFEST" "$CHECKSUM" "$NETBIRD"; do
    if [ ! -f "$path" ]; then
        echo "[ERROR] missing release asset: $path" >&2
        exit 1
    fi
done

# The NetBird client is built by scripts/build-netbird.sh and published alongside
# the package; the device downloads it on demand. Nothing else would notice a
# host-architecture build or a version that drifted away from the firmware pin.
PINNED_NETBIRD=$(tr -d '[:space:]' < "$(dirname "$0")/../kvmapp/system/netbird/VERSION")
PINNED_NETBIRD_SHA256=$(tr -d '[:space:]' < "$(dirname "$0")/../kvmapp/system/netbird/SHA256")
NETBIRD_ROOT="netbird_${PINNED_NETBIRD}_riscv64"

if ! printf '%s' "$PINNED_NETBIRD_SHA256" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "[ERROR] invalid pinned NetBird SHA-256" >&2
    exit 1
fi
ACTUAL_NETBIRD_SHA256=$(sha256sum "$NETBIRD" | cut -d' ' -f1)
if [ "$ACTUAL_NETBIRD_SHA256" != "$PINNED_NETBIRD_SHA256" ]; then
    echo "[ERROR] netbird asset SHA-256 does not match firmware pin" >&2
    exit 1
fi

NETBIRD_ENTRIES=$(tar -tzf "$NETBIRD" | cut -d/ -f1 | sort -u)
if [ "$NETBIRD_ENTRIES" != "$NETBIRD_ROOT" ]; then
    echo "[ERROR] $NETBIRD must contain exactly one top-level dir '$NETBIRD_ROOT'" >&2
    echo "        got: $(echo "$NETBIRD_ENTRIES" | tr '\n' ' ')" >&2
    exit 1
fi

NETBIRD_TMP=$(mktemp -d)
# ENTRY_LIST/VERBOSE_LIST are created further down; :- keeps `set -u` from
# turning an early failure here into an unbound-variable error.
trap 'rm -rf "$NETBIRD_TMP" "${ENTRY_LIST:-}" "${VERBOSE_LIST:-}"' EXIT
tar -xzf "$NETBIRD" -C "$NETBIRD_TMP"

ASSET_VERSION=$(tr -d '[:space:]' < "$NETBIRD_TMP/$NETBIRD_ROOT/VERSION")
if [ "$ASSET_VERSION" != "$PINNED_NETBIRD" ]; then
    echo "[ERROR] netbird asset reports $ASSET_VERSION, firmware pins $PINNED_NETBIRD" >&2
    exit 1
fi

NETBIRD_BIN="$NETBIRD_TMP/$NETBIRD_ROOT/netbird"
NETBIRD_MAGIC=$(od -An -tx1 -N4 "$NETBIRD_BIN" | tr -d ' \n')
NETBIRD_MACHINE=$(od -An -tu1 -j18 -N1 "$NETBIRD_BIN" | tr -d ' \n')
if [ "$NETBIRD_MAGIC" != "7f454c46" ] || [ "$NETBIRD_MACHINE" != "243" ]; then
    echo "[ERROR] netbird binary is not a riscv64 ELF (e_machine=$NETBIRD_MACHINE)" >&2
    exit 1
fi

PACKAGE_ROOT="nanokvm_${VERSION}"

MAX_PACKAGE_SIZE=$((1 << 30))
MAX_UNPACKED_SIZE=$((2 << 30))
MAX_ARCHIVE_ENTRIES=100000
ENTRY_LIST=$(mktemp)
VERBOSE_LIST=$(mktemp)
trap 'rm -rf "$NETBIRD_TMP" "${ENTRY_LIST:-}" "${VERBOSE_LIST:-}"' EXIT

if ! tar -tzf "$TARBALL" > "$ENTRY_LIST"; then
    echo "[ERROR] could not list release tarball" >&2
    exit 1
fi
if ! tar -tvzf "$TARBALL" > "$VERBOSE_LIST"; then
    echo "[ERROR] could not inspect release tarball entry types" >&2
    exit 1
fi

ENTRY_COUNT=0
while IFS= read -r entry; do
    ENTRY_COUNT=$((ENTRY_COUNT + 1))
    if [ "$ENTRY_COUNT" -gt "$MAX_ARCHIVE_ENTRIES" ]; then
        echo "[ERROR] archive contains more than $MAX_ARCHIVE_ENTRIES entries" >&2
        exit 1
    fi
    case "$entry" in
        "$PACKAGE_ROOT"|"$PACKAGE_ROOT"/*) ;;
        *)
            echo "[ERROR] archive entry is outside $PACKAGE_ROOT/: $entry" >&2
            exit 1
            ;;
    esac
    case "/$entry/" in
        */../*|*/./*)
            echo "[ERROR] archive entry contains an unsafe path component: $entry" >&2
            exit 1
            ;;
    esac
done < "$ENTRY_LIST"
if [ "$ENTRY_COUNT" -eq 0 ]; then
    echo "[ERROR] release tarball is empty" >&2
    exit 1
fi

while IFS= read -r verbose_entry; do
    entry_type=${verbose_entry:0:1}
    case "$entry_type" in
        -|d) ;;
        *)
            echo "[ERROR] archive contains a link or special entry: $verbose_entry" >&2
            exit 1
            ;;
    esac
done < "$VERBOSE_LIST"

ARCHIVE_VERSION=$(tar -xOzf "$TARBALL" "$PACKAGE_ROOT/version" 2>/dev/null) || {
    echo "[ERROR] release tarball does not contain $PACKAGE_ROOT/version" >&2
    exit 1
}
if [ "$ARCHIVE_VERSION" != "$VERSION" ]; then
    echo "[ERROR] archive version '$ARCHIVE_VERSION' does not match '$VERSION'" >&2
    exit 1
fi

SHA256=$(sha256sum "$TARBALL" | cut -d' ' -f1)
if ! printf '%s  %s\n' "$SHA256" "$TARBALL_NAME" | cmp -s - "$CHECKSUM"; then
    echo "[ERROR] sha256.txt does not match $TARBALL_NAME" >&2
    exit 1
fi

MANIFEST_VERSION=$(jq -er '.version | select(type == "string" and length > 0)' "$MANIFEST")
MANIFEST_NAME=$(jq -er '.name | select(type == "string" and length > 0)' "$MANIFEST")
MANIFEST_SIZE=$(jq -er '.size | select(type == "number" and . >= 0 and floor == .)' "$MANIFEST")
MANIFEST_FORMAT=$(jq -er '.manifest_version | select(type == "number" and . == 2)' "$MANIFEST")
MANIFEST_SIZE_BYTES=$(jq -er '.size_bytes | select(type == "number" and . > 0 and floor == .)' "$MANIFEST")
MANIFEST_UNPACKED_SIZE_BYTES=$(jq -er '.unpacked_size_bytes | select(type == "number" and . > 0 and floor == .)' "$MANIFEST")
MANIFEST_SHA512=$(jq -er '.sha512 | select(type == "string" and length > 0)' "$MANIFEST")

if [ "$MANIFEST_VERSION" != "$VERSION" ]; then
    echo "[ERROR] latest.json version '$MANIFEST_VERSION' does not match '$VERSION'" >&2
    exit 1
fi
if [ "$MANIFEST_NAME" != "$TARBALL_NAME" ]; then
    echo "[ERROR] latest.json name '$MANIFEST_NAME' does not match '$TARBALL_NAME'" >&2
    exit 1
fi

ACTUAL_SIZE=$(wc -c < "$TARBALL" | tr -d ' ')
if [ "$MANIFEST_FORMAT" != "2" ]; then
    echo "[ERROR] latest.json manifest_version must be 2" >&2
    exit 1
fi
if [ "$MANIFEST_SIZE" != "$ACTUAL_SIZE" ] || [ "$MANIFEST_SIZE_BYTES" != "$ACTUAL_SIZE" ]; then
    echo "[ERROR] latest.json size '$MANIFEST_SIZE' does not match '$ACTUAL_SIZE'" >&2
    exit 1
fi
if [ "$ACTUAL_SIZE" -gt "$MAX_PACKAGE_SIZE" ]; then
    echo "[ERROR] release tarball exceeds device limit of $MAX_PACKAGE_SIZE bytes" >&2
    exit 1
fi

ACTUAL_UNPACKED_SIZE=$(python3 - "$TARBALL" <<'PY'
import sys
import tarfile

total = 0
with tarfile.open(sys.argv[1], "r:gz") as archive:
    for member in archive:
        if member.isfile():
            total += member.size
print(total)
PY
)
if [ "$MANIFEST_UNPACKED_SIZE_BYTES" != "$ACTUAL_UNPACKED_SIZE" ]; then
    echo "[ERROR] latest.json unpacked_size_bytes '$MANIFEST_UNPACKED_SIZE_BYTES' does not match '$ACTUAL_UNPACKED_SIZE'" >&2
    exit 1
fi
if [ "$ACTUAL_UNPACKED_SIZE" -gt "$MAX_UNPACKED_SIZE" ]; then
    echo "[ERROR] unpacked package exceeds device limit of $MAX_UNPACKED_SIZE bytes" >&2
    exit 1
fi

ACTUAL_SHA512=$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)
if [ "$MANIFEST_SHA512" != "$ACTUAL_SHA512" ]; then
    echo "[ERROR] latest.json sha512 does not match $TARBALL_NAME" >&2
    exit 1
fi

echo "[OK] verified NanoKVM release assets for $VERSION"
