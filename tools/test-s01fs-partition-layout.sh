#!/bin/sh

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
SCRIPT="$ROOT/kvmapp/system/init.d/S01fs"
TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/nanokvm-s01fs-layout.XXXXXX")
trap 'rm -rf "$TMP_ROOT"' EXIT HUP INT TERM

fail() {
        echo "FAIL: $*" >&2
        exit 1
}

assert_empty() {
        [ ! -s "$1" ] || fail "$1 is not empty: $(cat "$1")"
}

assert_line() {
        expected=$1
        file=$2
        [ -f "$file" ] || fail "missing $file"
        actual=$(cat "$file")
        [ "$actual" = "$expected" ] || fail "$file: expected '$expected', got '$actual'"
}

new_case() {
        name=$1
        unset PARTED_RESULT
        CASE_DIR="$TMP_ROOT/$name"
        mkdir -p "$CASE_DIR/bin"
        START_FILE="$CASE_DIR/start"
        SIZE_FILE="$CASE_DIR/size"
        PARTED_LOG="$CASE_DIR/parted.log"
        : > "$PARTED_LOG"

        cat > "$CASE_DIR/bin/parted" <<EOF
#!/bin/sh
printf '%s\n' "\$*" >> '$PARTED_LOG'
exit \${PARTED_RESULT:-0}
EOF
        chmod +x "$CASE_DIR/bin/parted"
}

run_create() (
        NANOKVM_DISK=/dev/testdisk
        NANOKVM_ROOT_START_FILE=$START_FILE
        NANOKVM_ROOT_SIZE_FILE=$SIZE_FILE
        NANOKVM_DATA_ALIGNMENT_SECTORS=${ALIGNMENT:-2048}
        NANOKVM_PARTED=$CASE_DIR/bin/parted
        export NANOKVM_DISK NANOKVM_ROOT_START_FILE NANOKVM_ROOT_SIZE_FILE
        export NANOKVM_DATA_ALIGNMENT_SECTORS NANOKVM_PARTED PARTED_RESULT
        set --
        # shellcheck disable=SC1090
        . "$SCRIPT"
        create_default_data_partition
)

# Root p2 must never be resized at boot. The official image already provides a
# 1.5 GiB ext4 filesystem, so changing it online only adds risk and metadata.
if grep -Eq 'resizepart[[:space:]]+2|resize2fs.*mmcblk0p2|819[23]MB|16000000' "$SCRIPT"
then
        fail 'S01fs still contains the legacy fixed root resize/layout'
fi

# Official image: p2 starts at sector 32769 and has exactly 3145728 sectors
# (1.5 GiB). p3 begins at the next 1 MiB boundary.
new_case official_image
printf '32769\n' > "$START_FILE"
printf '3145728\n' > "$SIZE_FILE"
run_create
assert_line '-s /dev/testdisk unit s mkpart primary 3180544s 100%' "$PARTED_LOG"

# Existing cards whose root was already enlarged keep that layout. The data
# start follows the live p2 end instead of overlapping or shrinking it.
new_case legacy_8gb_root
printf '32769\n' > "$START_FILE"
printf '15967232\n' > "$SIZE_FILE"
run_create
assert_line '-s /dev/testdisk unit s mkpart primary 16001024s 100%' "$PARTED_LOG"

# Already aligned geometry does not gain an unnecessary extra alignment unit.
new_case aligned_end
printf '2048\n' > "$START_FILE"
printf '2048\n' > "$SIZE_FILE"
run_create
assert_line '-s /dev/testdisk unit s mkpart primary 4096s 100%' "$PARTED_LOG"

# Invalid geometry fails before invoking parted.
new_case invalid_start
printf 'not-a-number\n' > "$START_FILE"
printf '3145728\n' > "$SIZE_FILE"
if run_create; then fail 'invalid start sector was accepted'; fi
assert_empty "$PARTED_LOG"

new_case zero_size
printf '32769\n' > "$START_FILE"
printf '0\n' > "$SIZE_FILE"
if run_create; then fail 'zero-sized root partition was accepted'; fi
assert_empty "$PARTED_LOG"

new_case invalid_alignment
printf '32769\n' > "$START_FILE"
printf '3145728\n' > "$SIZE_FILE"
ALIGNMENT=0
if run_create; then fail 'zero alignment was accepted'; fi
assert_empty "$PARTED_LOG"
unset ALIGNMENT

# Partitioning errors remain visible to the caller.
new_case parted_failure
printf '32769\n' > "$START_FILE"
printf '3145728\n' > "$SIZE_FILE"
PARTED_RESULT=1
if run_create; then fail 'parted failure was ignored'; fi
assert_line '-s /dev/testdisk unit s mkpart primary 3180544s 100%' "$PARTED_LOG"

echo 'S01fs partition-layout tests passed'
