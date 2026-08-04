#!/bin/bash
# Resolve an annotated numeric tag from origin and verify its commit is on main.

set -euo pipefail

TAG="${1:-}"
EXPECTED_SHA="${2:-}"

if ! echo "$TAG" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "[ERROR] invalid tag '$TAG', expected MAJOR.MINOR.PATCH" >&2
    exit 1
fi
if [ -n "$EXPECTED_SHA" ] && ! echo "$EXPECTED_SHA" | grep -qE '^[0-9a-f]{40}$'; then
    echo "[ERROR] expected commit must be a full lowercase commit SHA" >&2
    exit 1
fi

TAG_REF="refs/tags/$TAG"
PEELED_REF="${TAG_REF}^{}"
REMOTE_REFS=$(git ls-remote --tags origin "$TAG_REF" "$PEELED_REF")
TAG_OBJECT=$(printf '%s\n' "$REMOTE_REFS" | awk -v ref="$TAG_REF" '$2 == ref { print $1 }')
SOURCE_SHA=$(printf '%s\n' "$REMOTE_REFS" | awk -v ref="$PEELED_REF" '$2 == ref { print $1 }')

if ! echo "$TAG_OBJECT" | grep -qE '^[0-9a-f]{40}$'; then
    echo "[ERROR] tag '$TAG' does not exist on origin" >&2
    exit 1
fi
if ! echo "$SOURCE_SHA" | grep -qE '^[0-9a-f]{40}$'; then
    echo "[ERROR] tag '$TAG' is not an annotated tag" >&2
    exit 1
fi
if [ -n "$EXPECTED_SHA" ] && [ "$SOURCE_SHA" != "$EXPECTED_SHA" ]; then
    echo "[ERROR] tag '$TAG' moved from '$EXPECTED_SHA' to '$SOURCE_SHA'" >&2
    exit 1
fi

git fetch --no-tags origin main
if ! git merge-base --is-ancestor "$SOURCE_SHA" FETCH_HEAD; then
    echo "[ERROR] tag '$TAG' points to a commit outside origin/main" >&2
    exit 1
fi

printf '%s\n' "$SOURCE_SHA"
