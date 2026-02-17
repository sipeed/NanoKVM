# Repository Guidelines

## Project Structure & Module Organization
- `server/`: Go backend (`main.go`, `router/`, `service/`, `proto/`, `config/`).
- `web/`: React + TypeScript frontend (`src/`, `public/`, `vite` build output in `dist/`).
- `kvmapp/`: deployable runtime package used on device (`server/`, `system/`, init scripts).
- `support/sg2002/`: hardware-specific support builds (`kvm_system`).
- `scripts/`: local automation for Cube workflows (overlay build, deploy/rollback, health checks).
- `docker/` + `Makefile`: containerized build environment for riscv64 artifacts.

## Build, Test, and Development Commands
- `make app`: build backend (`server/NanoKVM-Server`) in Docker.
- `make support`: build SG2002 support components.
- `make all`: build both backend and support.
- `cd server && ./build.sh`: local cross-compile backend (Linux x86_64 toolchain required).
- `cd web && pnpm install --frozen-lockfile && pnpm build`: frontend production build.
- `cd web && pnpm lint`: lint frontend code.
- `./scripts/build_cube_overlay.sh`: build deployable `build/nanokvm-cube-overlay.tar.gz`.
- `./scripts/deploy_cube_overlay.sh deploy --host <ip> --remote-stage-dir /data`: deploy overlay to Cube.

## Coding Style & Naming Conventions
- Go: keep code `gofmt`-clean; package names lowercase; exported identifiers in `PascalCase`.
- TypeScript/React: follow `web/.editorconfig` and `web/.prettierrc.yaml` (2 spaces, single quotes, width 100).
- Use `pnpm lint` for frontend checks before PR.
- Shell scripts: prefer POSIX/Bash with explicit error handling (`set -euo pipefail` where applicable).
- Keep new files and directories aligned with existing module boundaries (`router` vs `service`, API in `web/src/api`).

## Testing Guidelines
- There is no broad unit-test suite yet; rely on targeted validation:
  - Frontend: `cd web && pnpm lint && pnpm build`
  - Backend build: `make app` or `cd server && ./build.sh`
  - Device smoke checks: `scripts/check_nanokvm_health.sh` after deploy.
- When adding tests:
  - Go tests: `*_test.go` (run with `go test ./...` from `server/`).
  - Frontend tests: `*.test.ts(x)` near the related feature.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat: ...`, `fix: ...`, `chore: ...`, `release: ...`, `ci: ...`.
- Keep PRs small and focused; separate backend, frontend, and device-script changes when possible.
- PR description should include:
  - scope and affected paths,
  - target hardware (`NanoKVM Cube/PCIe`),
  - validation steps and command output summary,
  - screenshots for UI changes (`web/`).

## Security & Configuration Tips
- Never commit secrets, tokens, or device passwords.
- Treat `/kvmapp/system/init.d/*` changes as high impact; include rollback steps.
- Prefer `/data` over `/tmp` for large on-device staging during deploys.
