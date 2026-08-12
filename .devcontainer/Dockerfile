# Dev container image for VS Code / the devcontainer CLI.
#
# The release builder image (docker/Dockerfile) stays the single source of
# truth for the RISC-V cross toolchain, Go and MaixCDK. This layer only adds
# the frontend toolchain on top: the builder image deliberately ships without
# Node (`make web` runs on the host), but an IDE container should cover web
# development as well.
#
# BASE_IMAGE can be overridden to a locally built builder image, e.g. the
# output of `make builder-image` (nanokvm-builder-local-<uid>-<gid>).
ARG BASE_IMAGE=ghcr.io/sipeed/nanokvm-builder:latest
FROM ${BASE_IMAGE}

USER root

# Node major and pnpm major track .github/workflows/package.yml ("Set up
# Node" / "Set up pnpm") and web/package.json "engines" -- keep all of them
# in sync when CI bumps either.
ARG NODE_MAJOR=22
ARG PNPM_VERSION=11
# Both can be overridden behind restrictive or mirrored corporate networks
# via devcontainer.json, e.g.:
#   "build": {"args": {
#     "NODE_DIST_MIRROR": "https://registry.npmmirror.com/-/binary/node",
#     "NPM_REGISTRY": "https://registry.npmmirror.com"
#   }}
ARG NODE_DIST_MIRROR=https://nodejs.org/dist
ARG NPM_REGISTRY=https://registry.npmjs.org

# Install the latest Node of the pinned major from official dist tarballs;
# tracking the latest patch release is intentional (rebuild the container to
# pick up updates). The SHA-256 check guards download integrity -- it shares
# its origin with the tarball, so it is not an authenticity proof.
RUN set -eux; \
    apt-get update; \
    apt-get install -y ca-certificates curl xz-utils; \
    rm -rf /var/lib/apt/lists/*; \
    case "$(uname -m)" in \
        x86_64) node_arch=x64 ;; \
        aarch64) node_arch=arm64 ;; \
        *) echo "unsupported architecture: $(uname -m)" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "${NODE_DIST_MIRROR}/latest-v${NODE_MAJOR}.x/SHASUMS256.txt" \
        -o /tmp/SHASUMS256.txt; \
    tarball="$(grep -o "node-v[0-9.]*-linux-${node_arch}\.tar\.xz" /tmp/SHASUMS256.txt | head -n1)"; \
    curl -fsSL "${NODE_DIST_MIRROR}/latest-v${NODE_MAJOR}.x/${tarball}" -o "/tmp/${tarball}"; \
    cd /tmp && grep " ${tarball}\$" SHASUMS256.txt | sha256sum -c -; \
    tar -xJf "/tmp/${tarball}" -C /usr/local --strip-components=1 --no-same-owner; \
    rm -f "/tmp/${tarball}" /tmp/SHASUMS256.txt; \
    node --version && npm --version
RUN npm install --global --registry "${NPM_REGISTRY}" "pnpm@${PNPM_VERSION}" \
    && pnpm --version
