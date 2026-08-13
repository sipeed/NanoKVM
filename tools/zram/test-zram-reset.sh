#!/bin/sh
# Check that S01zram resets a zram device that is already initialised.
#
#   test-zram-reset.sh [path-to-S01zram]
#
# swapoff removes the device from /proc/swaps but leaves it initialised: it
# keeps its disksize. The kernel then rejects a second write to disksize with
# EBUSY, and the start fails:
#
#   + echo 96M
#   sh: write error: Resource busy
#   + echo 'FAIL (disksize)'
#
# Nothing hit this while the script only ran at boot, because a freshly
# inserted module reports disksize 0. The toggle in Settings > Device >
# Advanced stops and starts a live device, which is the path that needs a
# reset first.
#
# The reset must not run on a fresh module. Writing to reset is harmless there,
# but the guard is what documents that this is repair and not routine.
S01=${1:-$(dirname "$0")/../../kvmapp/system/init.d/S01zram}
[ -f "$S01" ] || { echo "usage: test-zram-reset.sh <S01zram>"; exit 1; }

fails=0
note() { printf '  %-58s %s\n' "$1" "$2"; [ "$2" = FAIL ] && fails=$((fails + 1)); return 0; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

echo "===== a stale device is reset before it is configured ====="

# Run the shipped text rather than a copy of it.
sed -n '/^reset_stale_device() {/,/^}/p' "$S01" > "$work/func.sh"

if [ ! -s "$work/func.sh" ]; then
    note "the script defines reset_stale_device" FAIL
    echo
    echo "$fails case(s) FAILED"
    exit "$fails"
fi
note "the script defines reset_stale_device" OK

# sysfs is a directory of plain files here. reset starts absent, so its
# contents afterwards say whether the function wrote to it.
setup() {
    rm -rf "$work/sys"
    mkdir -p "$work/sys"
    [ -n "$1" ] && printf '%s\n' "$1" > "$work/sys/disksize"
    return 0
}

run() {
    ZRAM_SYSFS="$work/sys" sh -c ". $work/func.sh; reset_stale_device"
}

# A device left initialised by a swapoff must be reset, or disksize is EBUSY.
setup 100663296
run
status=$?

[ "$status" -eq 0 ] && note "a stale device resets without error" OK \
    || note "a stale device resets without error" FAIL

[ "$(cat "$work/sys/reset" 2>/dev/null)" = "1" ] \
    && note "reset is written for a stale device" OK \
    || note "reset is written for a stale device" FAIL

# A freshly inserted module reports 0 and needs no repair.
setup 0
run
status=$?

[ "$status" -eq 0 ] && note "a fresh module succeeds" OK \
    || note "a fresh module succeeds" FAIL

[ ! -f "$work/sys/reset" ] \
    && note "reset is left alone for a fresh module" OK \
    || note "reset is left alone for a fresh module" FAIL

# No disksize file means no device to repair. Writing reset here would create
# a file in sysfs that the kernel does not have.
setup ""
run
status=$?

[ "$status" -eq 0 ] && note "a missing disksize succeeds" OK \
    || note "a missing disksize succeeds" FAIL

[ ! -f "$work/sys/reset" ] \
    && note "reset is left alone when there is no device" OK \
    || note "reset is left alone when there is no device" FAIL

echo
if [ "$fails" -eq 0 ]; then
    echo "all cases passed"
else
    echo "$fails case(s) FAILED"
fi
exit "$fails"
