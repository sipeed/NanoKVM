#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
s01_script="$repo_root/kvmapp/system/init.d/S01fs"
s03_script="$repo_root/kvmapp/system/init.d/S03usbdev"
real_dd="$(command -v dd)"
real_mkdir="$(command -v mkdir)"

tmpdir=""
original_path="$PATH"

make_stubs() {
	local bin="$1"

	cat >"$bin/mount" <<'EOF'
#!/bin/sh
printf 'mount %s\n' "$*" >> "$NANOKVM_TEST_LOG"
if [ "${NANOKVM_MOUNT_FAIL:-0}" = "1" ]; then
	exit 1
fi
exit 0
EOF

	cat >"$bin/mkdir" <<'EOF'
#!/bin/sh
"$NANOKVM_REAL_MKDIR" "$@"
for path do
	case "$path" in
		*/functions/mass_storage.disk0|functions/mass_storage.disk0)
			"$NANOKVM_REAL_MKDIR" -p "$path/lun.0"
			;;
	esac
done
EOF

	cat >"$bin/resize2fs" <<'EOF'
#!/bin/sh
printf 'resize2fs %s\n' "$*" >> "$NANOKVM_TEST_LOG"
exit 0
EOF

	cat >"$bin/sleep" <<'EOF'
#!/bin/sh
if [ "${NANOKVM_DELAY_DATA_PART_UNTIL_SLEEP:-0}" = "1" ] && [ ! -e "$NANOKVM_DATA_PART" ]; then
	: > "$NANOKVM_DATA_PART"
fi
exit 0
EOF

	cat >"$bin/parted" <<'EOF'
#!/bin/sh
printf 'parted %s\n' "$*" >> "$NANOKVM_TEST_LOG"
case " $* " in
	*" mkpart primary 8193MB 100% "*)
		if [ "${NANOKVM_DELAY_DATA_PART_UNTIL_SLEEP:-0}" != "1" ] && [ "${NANOKVM_NEVER_CREATE_DATA_PART:-0}" != "1" ]; then
			: > "$NANOKVM_DATA_PART"
			if [ "${NANOKVM_PARTED_CREATES_STALE_FS:-0}" = "1" ]; then
				: > "$NANOKVM_DATA_PART.hasfs"
			fi
		fi
		;;
esac
exit 0
EOF

	cat >"$bin/blkid" <<'EOF'
#!/bin/sh
printf 'blkid %s\n' "$*" >> "$NANOKVM_TEST_LOG"
if [ -e "$1.hasfs" ]; then
	printf '%s: UUID="test" TYPE="exfat"\n' "$1"
fi
exit 0
EOF

	cat >"$bin/mkfs.exfat" <<'EOF'
#!/bin/sh
printf 'mkfs.exfat %s\n' "$*" >> "$NANOKVM_TEST_LOG"
if [ "${NANOKVM_MKFS_FAIL:-0}" = "1" ]; then
	exit 1
fi
: > "$1.hasfs"
exit 0
EOF

	cat >"$bin/dd" <<'EOF'
#!/bin/sh
printf 'dd %s\n' "$*" >> "$NANOKVM_TEST_LOG"
exec "$NANOKVM_REAL_DD" "$@"
EOF

	chmod +x "$bin/mount" "$bin/mkdir" "$bin/resize2fs" "$bin/sleep" "$bin/parted" "$bin/blkid" "$bin/mkfs.exfat" "$bin/dd"
}

setup_case() {
	tmpdir="$(mktemp -d)"
	original_path="$PATH"
	mkdir -p "$tmpdir/bin" "$tmpdir/boot" "$tmpdir/data" "$tmpdir/dev" "$tmpdir/etc"
	make_stubs "$tmpdir/bin"

	export PATH="$tmpdir/bin:$PATH"
	export NANOKVM_TEST_LOG="$tmpdir/log"
	export NANOKVM_DISK="$tmpdir/dev/mmcblk0"
	export NANOKVM_BOOT_PART="$tmpdir/dev/mmcblk0p1"
	export NANOKVM_ROOT_PART="$tmpdir/dev/mmcblk0p2"
	export NANOKVM_DATA_PART="$tmpdir/dev/mmcblk0p3"
	export NANOKVM_BOOT_DIR="$tmpdir/boot"
	export NANOKVM_DATA_DIR="$tmpdir/data"
	export NANOKVM_DISK0_MARKER="$tmpdir/etc/kvm.disk0"
	export NANOKVM_DATA_FORMAT_PENDING="$tmpdir/etc/kvm.disk0.formatting"
	export NANOKVM_PROFILE="$tmpdir/profile"
	export NANOKVM_REAL_DD="$real_dd"
	export NANOKVM_REAL_MKDIR="$real_mkdir"

	: > "$NANOKVM_DISK"
	: > "$NANOKVM_BOOT_PART"
	: > "$NANOKVM_ROOT_PART"
	: > "$NANOKVM_BOOT_DIR/usb.disk0"
	: > "$NANOKVM_TEST_LOG"
	: > "$NANOKVM_PROFILE"
}

teardown_case() {
	PATH="$original_path"
	export PATH
	if [ -n "$tmpdir" ]; then
		rm -rf "$tmpdir"
	fi
	tmpdir=""
}

run_s01() {
	"$s01_script" start >/dev/null
}

load_s03_helpers() {
	# shellcheck disable=SC1090
	. <(sed -n '1,/^start_usb_dev()/ { /^start_usb_dev()/q; p; }' "$s03_script")
}

run_case() {
	local name="$1"
	local setup_fn="$2"
	local run_fn="$3"
	local assert_fn="$4"

	setup_case
	trap teardown_case RETURN
	"$setup_fn"
	"$run_fn"
	"$assert_fn"
	teardown_case
	trap - RETURN
	printf 'ok - %s\n' "$name"
}

noop() {
	:
}

exists() {
	[ -e "$1" ]
}

missing() {
	[ ! -e "$1" ]
}

log_contains() {
	local pattern="$1"
	if ! grep -Fq "$pattern" "$NANOKVM_TEST_LOG"; then
		printf 'expected log to contain: %s\n' "$pattern" >&2
		cat "$NANOKVM_TEST_LOG" >&2
		exit 1
	fi
}

log_not_contains() {
	local pattern="$1"
	if grep -Fq "$pattern" "$NANOKVM_TEST_LOG"; then
		printf 'expected log not to contain: %s\n' "$pattern" >&2
		cat "$NANOKVM_TEST_LOG" >&2
		exit 1
	fi
}

given_pending_partition() {
	: > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DISK0_MARKER"
	: > "$NANOKVM_DATA_FORMAT_PENDING"
}

assert_pending_partition_formatted() {
	exists "$NANOKVM_DATA_PART.hasfs"
	exists "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_not_contains "blkid $NANOKVM_DATA_PART"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_format_fails() {
	given_pending_partition
	export NANOKVM_MKFS_FAIL=1
}

assert_format_failure_keeps_pending() {
	missing "$NANOKVM_DISK0_MARKER"
	exists "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	unset NANOKVM_MKFS_FAIL
}

given_delayed_partition_and_format_fails() {
	export NANOKVM_DELAY_DATA_PART_UNTIL_SLEEP=1
	export NANOKVM_MKFS_FAIL=1
}

assert_delayed_partition_failure_keeps_pending() {
	exists "$NANOKVM_DATA_PART"
	missing "$NANOKVM_DISK0_MARKER"
	exists "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "parted -s $NANOKVM_DISK mkpart primary 8193MB 100%"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	unset NANOKVM_DELAY_DATA_PART_UNTIL_SLEEP
	unset NANOKVM_MKFS_FAIL
}

given_partition_never_appears() {
	export NANOKVM_NEVER_CREATE_DATA_PART=1
}

assert_late_device_keeps_pending_without_format() {
	missing "$NANOKVM_DATA_PART"
	missing "$NANOKVM_DISK0_MARKER"
	exists "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "parted -s $NANOKVM_DISK mkpart primary 8193MB 100%"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	unset NANOKVM_NEVER_CREATE_DATA_PART
}

given_mount_fails_after_format() {
	given_pending_partition
	export NANOKVM_MOUNT_FAIL=1
}

assert_mount_failure_clears_ready_marker() {
	exists "$NANOKVM_DATA_PART.hasfs"
	missing "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
	unset NANOKVM_MOUNT_FAIL
}

given_unknown_existing_partition() {
	printf 'user data' > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DISK0_MARKER"
}

assert_unknown_partition_ignored() {
	missing "$NANOKVM_DISK0_MARKER"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_not_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_empty_legacy_marked_partition() {
	: > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DISK0_MARKER"
}

assert_empty_legacy_partition_recovered() {
	exists "$NANOKVM_DATA_PART.hasfs"
	exists "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_contains "dd if=$NANOKVM_DATA_PART"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_empty_unmarked_partition() {
	: > "$NANOKVM_DATA_PART"
}

assert_empty_unmarked_partition_ignored() {
	missing "$NANOKVM_DISK0_MARKER"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_not_contains "dd if=$NANOKVM_DATA_PART"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_not_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_existing_filesystem() {
	: > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DATA_PART.hasfs"
}

assert_existing_filesystem_mounted() {
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
	exists "$NANOKVM_DISK0_MARKER"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
}

given_existing_filesystem_mount_fails() {
	given_existing_filesystem
	: > "$NANOKVM_DISK0_MARKER"
	export NANOKVM_MOUNT_FAIL=1
}

assert_existing_filesystem_mount_failure_clears_marker() {
	missing "$NANOKVM_DISK0_MARKER"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	unset NANOKVM_MOUNT_FAIL
}

given_new_partition_with_stale_signature() {
	export NANOKVM_PARTED_CREATES_STALE_FS=1
}

assert_new_partition_formatted_despite_stale_signature() {
	exists "$NANOKVM_DATA_PART"
	exists "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "parted -s $NANOKVM_DISK mkpart primary 8193MB 100%"
	log_not_contains "blkid $NANOKVM_DATA_PART"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
	unset NANOKVM_PARTED_CREATES_STALE_FS
}

assert_missing_partition_created_and_formatted() {
	exists "$NANOKVM_DATA_PART"
	exists "$NANOKVM_DATA_PART.hasfs"
	exists "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "parted -s $NANOKVM_DISK mkpart primary 8193MB 100%"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_custom_backing_file_configured() {
	printf '%s\n' "$tmpdir/custom.img" > "$NANOKVM_BOOT_DIR/usb.disk0"
}

given_custom_backing_with_pending_default_partition() {
	given_custom_backing_file_configured
	: > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DATA_FORMAT_PENDING"
}

given_custom_backing_with_unknown_marked_partition() {
	given_custom_backing_file_configured
	printf 'user data' > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DISK0_MARKER"
}

assert_custom_backing_does_not_create_default_partition() {
	missing "$NANOKVM_DATA_PART"
	missing "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_not_contains "parted -s $NANOKVM_DISK mkpart primary 8193MB 100%"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_not_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

assert_pending_default_partition_retried_with_custom_backing() {
	exists "$NANOKVM_DATA_PART.hasfs"
	exists "$NANOKVM_DISK0_MARKER"
	missing "$NANOKVM_DATA_FORMAT_PENDING"
	log_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

assert_custom_backing_unknown_partition_clears_marker() {
	missing "$NANOKVM_DISK0_MARKER"
	log_contains "blkid $NANOKVM_DATA_PART"
	log_not_contains "mkfs.exfat $NANOKVM_DATA_PART"
	log_not_contains "mount $NANOKVM_DATA_PART $NANOKVM_DATA_DIR"
}

given_explicit_default_partition_configured() {
	printf '%s\n' "$NANOKVM_DATA_PART" > "$NANOKVM_BOOT_DIR/usb.disk0"
}

given_explicit_default_partition_with_whitespace_configured() {
	printf '  %s  \n' "$NANOKVM_DATA_PART" > "$NANOKVM_BOOT_DIR/usb.disk0"
}

run_s03_helper() {
	load_s03_helpers
}

run_s03_mass_storage() {
	load_s03_helpers
	mkdir -p "$tmpdir/gadget/functions" "$tmpdir/gadget/configs/c.1"
	(
		cd "$tmpdir/gadget"
		configure_mass_storage
	)
}

given_s03_ready_default() {
	: > "$NANOKVM_DATA_PART"
	: > "$NANOKVM_DISK0_MARKER"
}

assert_s03_default_ready() {
	[ "$(default_data_disk_file)" = "$NANOKVM_DATA_PART" ]
	[ "$(resolve_disk_file "")" = "$NANOKVM_DATA_PART" ]
	[ "$(resolve_disk_file "$NANOKVM_DATA_PART")" = "$NANOKVM_DATA_PART" ]
}

given_s03_pending_default() {
	given_s03_ready_default
	: > "$NANOKVM_DATA_FORMAT_PENDING"
}

assert_s03_default_hidden() {
	[ -z "$(default_data_disk_file)" ]
	[ -z "$(resolve_disk_file "")" ]
	[ -z "$(resolve_disk_file "$NANOKVM_DATA_PART")" ]
}

given_s03_missing_marker() {
	: > "$NANOKVM_DATA_PART"
}

given_s03_missing_device() {
	: > "$NANOKVM_DISK0_MARKER"
}

assert_s03_custom_disk_allowed() {
	[ "$(resolve_disk_file "/data/custom.img")" = "/data/custom.img" ]
	[ "$(resolve_disk_file "  /data/custom.img  ")" = "/data/custom.img" ]
}

assert_s03_explicit_default_with_whitespace_ready() {
	[ "$(resolve_disk_file "  $NANOKVM_DATA_PART  ")" = "$NANOKVM_DATA_PART" ]
}

assert_s03_explicit_default_with_whitespace_hidden() {
	[ -z "$(resolve_disk_file "  $NANOKVM_DATA_PART  ")" ]
}

assert_s03_mass_storage_created_for_ready_default() {
	exists "$tmpdir/gadget/functions/mass_storage.disk0"
	[ -L "$tmpdir/gadget/configs/c.1/mass_storage.disk0" ]
	[ "$(cat "$tmpdir/gadget/functions/mass_storage.disk0/lun.0/file")" = "$NANOKVM_DATA_PART" ]
	[ "$(cat "$tmpdir/gadget/functions/mass_storage.disk0/lun.0/removable")" = "1" ]
	[ "$(cat "$tmpdir/gadget/functions/mass_storage.disk0/lun.0/inquiry_string")" = "NanoKVM USB Mass Storage0520" ]
}

assert_s03_mass_storage_not_created() {
	missing "$tmpdir/gadget/functions/mass_storage.disk0"
	missing "$tmpdir/gadget/configs/c.1/mass_storage.disk0"
}

given_s03_custom_disk() {
	printf '%s\n' "$tmpdir/custom.img" > "$NANOKVM_BOOT_DIR/usb.disk0"
}

given_s03_explicit_default_with_whitespace() {
	given_s03_ready_default
	printf '  %s  \n' "$NANOKVM_DATA_PART" > "$NANOKVM_BOOT_DIR/usb.disk0"
}

assert_s03_mass_storage_created_for_custom_disk() {
	exists "$tmpdir/gadget/functions/mass_storage.disk0"
	[ -L "$tmpdir/gadget/configs/c.1/mass_storage.disk0" ]
	[ "$(cat "$tmpdir/gadget/functions/mass_storage.disk0/lun.0/file")" = "$tmpdir/custom.img" ]
}

run_case "retries pending unformatted partition" given_pending_partition run_s01 assert_pending_partition_formatted
run_case "keeps pending marker when mkfs fails" given_format_fails run_s01 assert_format_failure_keeps_pending
run_case "keeps pending marker when delayed partition format fails" given_delayed_partition_and_format_fails run_s01 assert_delayed_partition_failure_keeps_pending
run_case "keeps pending marker when new partition device is late" given_partition_never_appears run_s01 assert_late_device_keeps_pending_without_format
run_case "removes marker when mount fails after format" given_mount_fails_after_format run_s01 assert_mount_failure_clears_ready_marker
run_case "does not format or mount unknown existing partition" given_unknown_existing_partition run_s01 assert_unknown_partition_ignored
run_case "recovers zero-filled legacy marked partition" given_empty_legacy_marked_partition run_s01 assert_empty_legacy_partition_recovered
run_case "does not recover zero-filled partition without legacy marker" given_empty_unmarked_partition run_s01 assert_empty_unmarked_partition_ignored
run_case "mounts existing filesystem without formatting" given_existing_filesystem run_s01 assert_existing_filesystem_mounted
run_case "removes marker when existing filesystem mount fails" given_existing_filesystem_mount_fails run_s01 assert_existing_filesystem_mount_failure_clears_marker
run_case "formats new partition even with stale signature" given_new_partition_with_stale_signature run_s01 assert_new_partition_formatted_despite_stale_signature
run_case "creates and formats missing partition" noop run_s01 assert_missing_partition_created_and_formatted
run_case "does not create default partition for custom backing file" given_custom_backing_file_configured run_s01 assert_custom_backing_does_not_create_default_partition
run_case "retries pending default partition with custom backing file" given_custom_backing_with_pending_default_partition run_s01 assert_pending_default_partition_retried_with_custom_backing
run_case "clears stale marker for unknown partition with custom backing file" given_custom_backing_with_unknown_marked_partition run_s01 assert_custom_backing_unknown_partition_clears_marker
run_case "creates default partition when explicitly configured" given_explicit_default_partition_configured run_s01 assert_missing_partition_created_and_formatted
run_case "trims explicit default partition config before creating it" given_explicit_default_partition_with_whitespace_configured run_s01 assert_missing_partition_created_and_formatted
run_case "S03 exposes default data disk only when ready" given_s03_ready_default run_s03_helper assert_s03_default_ready
run_case "S03 hides default and explicit p3 when format is pending" given_s03_pending_default run_s03_helper assert_s03_default_hidden
run_case "S03 hides default and explicit p3 without ready marker" given_s03_missing_marker run_s03_helper assert_s03_default_hidden
run_case "S03 hides default and explicit p3 when device is missing" given_s03_missing_device run_s03_helper assert_s03_default_hidden
run_case "S03 still allows custom backing files" noop run_s03_helper assert_s03_custom_disk_allowed
run_case "S03 trims explicit p3 before resolving readiness" given_s03_ready_default run_s03_helper assert_s03_explicit_default_with_whitespace_ready
run_case "S03 hides whitespace explicit p3 while format is pending" given_s03_pending_default run_s03_helper assert_s03_explicit_default_with_whitespace_hidden
run_case "S03 creates mass storage for ready default data disk" given_s03_ready_default run_s03_mass_storage assert_s03_mass_storage_created_for_ready_default
run_case "S03 skips mass storage while default data disk is pending" given_s03_pending_default run_s03_mass_storage assert_s03_mass_storage_not_created
run_case "S03 creates mass storage for custom backing files" given_s03_custom_disk run_s03_mass_storage assert_s03_mass_storage_created_for_custom_disk
run_case "S03 trims explicit p3 before creating mass storage" given_s03_explicit_default_with_whitespace run_s03_mass_storage assert_s03_mass_storage_created_for_ready_default

echo "S01fs data disk tests passed"
