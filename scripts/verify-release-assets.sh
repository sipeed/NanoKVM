#!/bin/bash
# Verify the three assets that make up a NanoKVM GitHub release.

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

for path in "$TARBALL" "$MANIFEST" "$CHECKSUM"; do
    if [ ! -f "$path" ]; then
        echo "[ERROR] missing release asset: $path" >&2
        exit 1
    fi
done

PACKAGE_ROOT="nanokvm_${VERSION}"
ENTRY_LIST=$(mktemp)
VERBOSE_LIST=$(mktemp)
trap 'rm -f "$ENTRY_LIST" "$VERBOSE_LIST"' EXIT

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
if [ "$MANIFEST_SIZE" != "$ACTUAL_SIZE" ]; then
    echo "[ERROR] latest.json size '$MANIFEST_SIZE' does not match '$ACTUAL_SIZE'" >&2
    exit 1
fi

ACTUAL_SHA512=$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)
if [ "$MANIFEST_SHA512" != "$ACTUAL_SHA512" ]; then
    echo "[ERROR] latest.json sha512 does not match $TARBALL_NAME" >&2
    exit 1
fi

echo "[OK] verified NanoKVM release assets for $VERSION"
