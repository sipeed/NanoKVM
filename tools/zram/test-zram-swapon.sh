#!/bin/sh
# Check that S01zram asks for a swap priority, and still works without one.
#
#   test-zram-swapon.sh [path-to-S01zram]
#
# zram and the optional swap file are both swapped on during boot, and the
# order between them is not defined: S01zram runs from rcS, and the swap file
# runs from the si11::sysinit line that the server appends to /etc/inittab. If
# the swap file wins, the kernel writes to the SD card before it writes to
# compressed RAM, which is the opposite of the intent. A priority settles it.
#
# BusyBox swapon documents -p PRI, but the applet on a given image may be built
# without it. A rejected option must not leave the board with no swap at all,
# so the script falls back to a plain swapon.
#
# This runs the shipped function against a stub swapon and checks what it was
# asked to do, so it fails if the priority or the fallback is removed.
S01=${1:-$(dirname "$0")/../../kvmapp/system/init.d/S01zram}
[ -f "$S01" ] || { echo "usage: test-zram-swapon.sh <S01zram>"; exit 1; }

fails=0
note() { printf '  %-58s %s\n' "$1" "$2"; [ "$2" = FAIL ] && fails=$((fails + 1)); return 0; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

echo "===== swapon asks for a priority, and copes without one ====="

# Run the shipped text rather than a copy of it.
sed -n '/^swapon_zram() {/,/^}/p' "$S01" > "$work/func.sh"

if [ ! -s "$work/func.sh" ]; then
    note "the script defines swapon_zram" FAIL
    echo
    echo "$fails case(s) FAILED"
    exit "$fails"
fi
note "the script defines swapon_zram" OK

# MODE decides how the stub behaves: "modern" accepts -p, "old" rejects it the
# way a busybox applet built without the option does, and "broken" fails either
# way. Every call is recorded.
cat > "$work/harness.sh" <<'HARNESS'
swapon() {
    printf '%s\n' "swapon $*" >> "$LOGFILE"

    case "$MODE" in
        modern) return 0 ;;
        old)    [ "$1" = "-p" ] && return 1
                return 0 ;;
        broken) return 1 ;;
    esac
}
HARNESS

run() {
    MODE=$1
    LOGFILE="$work/log"
    : > "$LOGFILE"

    ZRAM_DEV=/dev/zram0 ZRAM_PRIORITY=100 MODE="$MODE" LOGFILE="$LOGFILE" \
        sh -c ". $work/harness.sh; . $work/func.sh; swapon_zram"
}

# A swapon that takes -p must be asked for the priority, and asked only once.
run modern
status=$?
log=$(cat "$work/log")

[ "$status" -eq 0 ] && note "a modern swapon succeeds" OK \
    || note "a modern swapon succeeds" FAIL

[ "$log" = "swapon -p 100 /dev/zram0" ] \
    && note "it is asked for priority 100" OK \
    || note "it is asked for priority 100 (got: $log)" FAIL

# A swapon without -p must still end with zram active.
run old
status=$?
log=$(cat "$work/log")

[ "$status" -eq 0 ] && note "an old swapon succeeds" OK \
    || note "an old swapon succeeds" FAIL

echo "$log" | grep -q '^swapon -p 100 /dev/zram0$' \
    && note "it tries the priority first" OK \
    || note "it tries the priority first (got: $log)" FAIL

echo "$log" | grep -q '^swapon /dev/zram0$' \
    && note "it falls back to a plain swapon" OK \
    || note "it falls back to a plain swapon (got: $log)" FAIL

# A device that cannot be swapped on at all must report the failure. Reporting
# success here would leave the init script printing OK for a dead device.
run broken
status=$?

[ "$status" -ne 0 ] && note "a failing swapon reports failure" OK \
    || note "a failing swapon reports failure" FAIL

echo
if [ "$fails" -eq 0 ]; then
    echo "all cases passed"
else
    echo "$fails case(s) FAILED"
fi
exit "$fails"
