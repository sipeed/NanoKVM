#!/bin/bash
#
# Compare a freshly built package against the currently published release.
#
# Purely informational: it exits 0 whatever it finds. The point is to make the
# delta reviewable before the tarball is published, since the package is what
# every device pulls over OTA. Unexpected entries here (a library that vanished,
# an init script that changed without a matching commit) are worth a look.
#
# Usage: scripts/compare-release.sh <new-tarball> [base-url]

set -uo pipefail

NEW_TARBALL="${1:-}"
BASE_URL="${2:-https://cdn.sipeed.com/nanokvm}"

if [ -z "$NEW_TARBALL" ] || [ ! -f "$NEW_TARBALL" ]; then
    echo "Usage: $0 <new-tarball> [base-url]" >&2
    exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[INFO] fetching published manifest from $BASE_URL/latest.json"
if ! curl -fsSL "$BASE_URL/latest.json" -o "$WORK/latest.json"; then
    echo "[WARN] could not fetch latest.json - skipping comparison"
    exit 0
fi

cat "$WORK/latest.json"

OLD_NAME="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$WORK/latest.json")"
if [ -z "$OLD_NAME" ]; then
    echo "[WARN] no \"name\" in latest.json - skipping comparison"
    exit 0
fi

echo "[INFO] downloading published package $OLD_NAME"
if ! curl -fsSL "$BASE_URL/$OLD_NAME" -o "$WORK/$OLD_NAME"; then
    echo "[WARN] could not download $OLD_NAME - skipping comparison"
    exit 0
fi

mkdir -p "$WORK/old" "$WORK/new"
if ! tar xzf "$WORK/$OLD_NAME" -C "$WORK/old"; then
    echo "[WARN] could not extract $OLD_NAME - skipping comparison"
    exit 0
fi
if ! tar xzf "$NEW_TARBALL" -C "$WORK/new"; then
    echo "[WARN] could not extract $(basename "$NEW_TARBALL") - skipping comparison"
    exit 0
fi

# Strip the nanokvm_<version>/ prefix so the two trees are comparable.
OLD_ROOT="$(find "$WORK/old" -mindepth 1 -maxdepth 1 -type d | head -1)"
NEW_ROOT="$(find "$WORK/new" -mindepth 1 -maxdepth 1 -type d | head -1)"

if [ -z "$OLD_ROOT" ] || [ -z "$NEW_ROOT" ]; then
    echo "[WARN] could not locate a package root directory - skipping comparison"
    exit 0
fi

( cd "$OLD_ROOT" && find . -type f | sed 's|^\./||' | LC_ALL=C sort ) > "$WORK/old.list"
( cd "$NEW_ROOT" && find . -type f | sed 's|^\./||' | LC_ALL=C sort ) > "$WORK/new.list"

# An empty inventory would make every section below print "(none)", which reads
# identically to "verified, nothing changed". Refuse to imply that.
if [ ! -s "$WORK/old.list" ] || [ ! -s "$WORK/new.list" ]; then
    echo "[WARN] one of the packages produced an empty file list - comparison unreliable, skipping"
    exit 0
fi

echo
echo "=============================================================="
echo " $(basename "$OLD_ROOT")  ->  $(basename "$NEW_ROOT")"
echo "=============================================================="
printf ' files: %s -> %s\n' "$(wc -l < "$WORK/old.list" | tr -d ' ')" \
                            "$(wc -l < "$WORK/new.list" | tr -d ' ')"

echo
echo "--- added ----------------------------------------------------"
comm -13 "$WORK/old.list" "$WORK/new.list" | sed 's/^/  + /' || true

echo
echo "--- removed --------------------------------------------------"
comm -23 "$WORK/old.list" "$WORK/new.list" | sed 's/^/  - /' || true

echo
echo "--- changed --------------------------------------------------"
changed=0
while IFS= read -r file; do
    if ! cmp -s "$OLD_ROOT/$file" "$NEW_ROOT/$file"; then
        old_size="$(wc -c < "$OLD_ROOT/$file" | tr -d ' ')"
        new_size="$(wc -c < "$NEW_ROOT/$file" | tr -d ' ')"
        printf '  ~ %-52s %s -> %s bytes\n' "$file" "$old_size" "$new_size"
        changed=$((changed + 1))
    fi
done < <(comm -12 "$WORK/old.list" "$WORK/new.list")
[ "$changed" -eq 0 ] && echo "  (none)"

echo
echo "[INFO] comparison complete"
