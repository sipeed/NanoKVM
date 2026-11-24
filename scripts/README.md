# Release packaging

These scripts assemble the application update package that NanoKVM devices pull
over the air: `nanokvm_<version>.tar.gz` plus its `latest.json` manifest.

| Script | Purpose |
|---|---|
| `build-in-container.sh` | Builds every riscv64 artifact (`kvm_system`, `libkvm.so`, `NanoKVM-Server`). Runs inside the `nanokvm-builder` image only. |
| `package.sh` | Stages the package tree, creates the tarball, and writes `latest.json`. |
| `compare-release.sh` | Diffs a freshly built package against the currently published one. Informational. |
| `verify-release-assets.sh` | Checks the three GitHub Release assets before publishing or promotion. |
| `verify-release-tag.sh` | Requires an annotated numeric tag whose commit is on `main`. |

## What the updater expects

The format is not arbitrary — it is fixed by the on-device updater in
`server/service/application/`:

- **One safe root directory.** The updater scans before extracting and accepts
  only directories and regular files under `nanokvm_<version>/`; links,
  special files, duplicate paths, and path traversal are rejected.
- **`name` is the file name.** `version.go` builds the download URL as
  `<base>/<name>`, where `<base>` is `https://cdn.sipeed.com/nanokvm` (or
  `.../preview` when `/etc/kvm/preview_updates` exists).
- **`sha512` is base64, not hex.** `update.go` compares against
  `base64(raw sha512 digest)`. A hex digest will fail verification on device.
- **`/kvmapp/version`** is what the device reports as its installed version, so
  it must match the `version` field.

New releases use manifest v2. `size` remains the exact compressed byte count
for older clients, while v2 clients use `size_bytes` and
`unpacked_size_bytes` for storage preflight checks. Historical v1 `size`
values have inconsistent units, so v2 clients only require v1 `size` to be
non-zero and verify the downloaded SHA-512 instead. Publish v2 metadata before
releasing clients that consume it; clients retain v1 compatibility for custom
update servers.

## Building a release

The frontend needs Node and pnpm on the host; everything riscv64 needs the
builder image (see `docker/Dockerfile`).

```bash
make release VERSION=2.4.4
```

That is equivalent to:

```bash
make release-build         # kvm_system + libkvm.so + NanoKVM-Server, in Docker
make web                   # web/dist
make package VERSION=2.4.4 # build/release/{nanokvm_2.4.4.tar.gz,latest.json}
```

In CI this runs as the **NanoKVM Package** workflow. Pull requests and manual
runs only create Actions artifacts. For a public release, run **NanoKVM Create
Tag**, then run **NanoKVM Release** and choose prerelease, stable, or promotion.
Publishing attaches three assets:

Publishing is one-shot: an existing Release or draft is an error, and only a
published prerelease can be promoted.

- `nanokvm_<version>.tar.gz`
- `latest.json`
- `sha256.txt`

The Actions artifact also includes `BUILD_INFO.txt` with the source commit,
workflow run, immutable builder image digest, and both checksum encodings; that
provenance file is not attached to the GitHub release. Uploading the tarball and
`latest.json` to the CDN is what actually offers the update to devices in the
field, so that step stays manual. `sha256.txt` is only for users verifying a
manual download and does not change the on-device `latest.json` contract.

## Where each file in the package comes from

| Package path | Source |
|---|---|
| `version` | the requested version |
| `server/NanoKVM-Server` | `server/build.sh` (BoringCrypto, RPATH `$ORIGIN/dl_lib`) |
| `server/dl_lib/` | whatever the `kvm_vision` build emits, with any library it does not emit backfilled from the tracked `server/dl_lib/` |
| `server/web/` | `web/dist/` |
| `kvm_system/kvm_system` | `support/sg2002` `build kvm_system` |
| `system/tool/` | matching EDID maintenance binary built from `tools/nanokvm_update_edid/` |
| `system/firmware/` | complete SG2002 SD boot image and matching MIPI and Lontium modules |
| `kvm/` | default runtime state (input dimensions, fps, quality) |
| everything else | tracked `kvmapp/` |

Note that `kvm/` ships default runtime state, and `install.go` replaces
`/kvmapp` wholesale, so an update resets those values on the device. That is
long-standing behaviour, not something these scripts introduce.

The SG2002 OTA includes a complete `boot.sd` and its matched
`soph_mipi_rx.ko` and `lontium_hdmi.ko`. The supported upgrade baseline is
image `2026-06-10-1_4_3.img` with application `2.4.3`. That updater starts
both daemons through its installed S95. During migration `kvm_system` installs
the firmware and init scripts, and the server waits for the next service start.
After reboot S16 loads the manager and S95 starts both daemons.

The installer compares each firmware file and stages the modules that changed.
If `boot.sd` differs, it removes the old file from the 16 MiB FAT partition
and writes the complete new image directly. A write error stops the migration.
Retry while Linux is running, or copy the packaged `boot.sd` to the boot
partition with a card reader if the device can no longer boot.

## Video library linking

`make release-build` builds `libkvm.so` and its dependency `libkvm_mmf.so`,
stages both in `kvmapp/server/dl_lib/`, then runs `server/build.sh -a -tags=kvm_staged`.
The tag selects the staged directory for cgo. The rebuild ensures the linker
sees changes to the shared libraries even with a warm Go build cache.
The release script checks the KVM symbols the server imports, and
`make package` copies the same staged libraries into the archive.

For server-only builds, `make app` and `server/build.sh` use the prebuilt pair
in `server/dl_lib/`. Refresh both prebuilts together when changing their
interfaces. To test local video changes, run `make vision` and then
`./build.sh -a -tags=kvm_staged` from `server/` in the builder.

EDID 维护工具与 S95/S16 使用同一服务锁和维护协议。构建会从源码编译该工具；
需要配套的内核 proc 接口和启动脚本，不能只替换单个工具后直接擦写。使用方式及
恢复流程见 [EDID 工具说明](../tools/nanokvm_update_edid/README.md)。
