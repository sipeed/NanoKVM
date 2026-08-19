#!/bin/sh
# Check that S01zram looks for its modules where an image build can put them.
#
#   test-zram-modpath.sh [path-to-S01zram]
#
# zsmalloc.ko and zram.ko are built out of tree by build-modules.sh and
# installed into /mnt/system/ko, beside the base image's own modules. /mnt is
# not a mount point. It is a plain directory on the root filesystem, so a rootfs
# update or a re-flash removes both modules.
#
# That loss is quiet. S01zram prints "FAIL (no zram device)" and returns 1, rcS
# records the exit status and carries on, and the web UI reports the feature as
# unavailable rather than broken. A board that had working compressed swap
# yesterday reads as a board that never had it.
#
# So /kvmapp/system/ko is searched first. It is part of the install package, so
# an update restores whatever is in it. Nothing is shipped there today and the
# search falls through on a stock device; putting the pair there is what makes
# the feature survive an update, and needs no further change to this script.
#
# The search is per directory, not per file. A directory has to hold both
# modules to be used, because zram cannot load without zsmalloc and a pair
# split across two directories would be two different builds.
S01=${1:-$(dirname "$0")/../../kvmapp/system/init.d/S01zram}
[ -f "$S01" ] || { echo "usage: test-zram-modpath.sh <S01zram>"; exit 1; }

fails=0
note() { printf '  %-62s %s\n' "$1" "$2"; [ "$2" = FAIL ] && fails=$((fails + 1)); return 0; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

echo "===== the modules are found where the install package puts them ====="

# Run the shipped function rather than a copy of it.
sed -n '/^load_modules() {/,/^}/p' "$S01" > "$work/func.sh"

if [ ! -s "$work/func.sh" ]; then
    note "the script defines load_modules" FAIL
    echo
    echo "$fails case(s) FAILED"
    exit "$fails"
fi
note "the script defines load_modules" OK

# The stub records every insmod. It creates the device only when it is asked
# for zram.ko, and only after zsmalloc.ko has been loaded, which is what the
# kernel does: zram cannot resolve its symbols without zsmalloc first.
cat > "$work/harness.sh" <<'HARNESS'
insmod() {
    printf '%s\n' "insmod $1" >> "$LOGFILE"

    case "$1" in
        *zsmalloc.ko) : > "$WORKDIR/zsmalloc.loaded" ;;
        *zram.ko)
            if [ -e "$WORKDIR/zsmalloc.loaded" ]; then
                : > "$ZRAM_DEV"
            else
                printf '%s\n' "REFUSED $1 (no zsmalloc)" >> "$LOGFILE"
                return 1
            fi
            ;;
    esac
}
HARNESS

# $1 = which directories get a full pair: kvmapp | mnt | both | none | partial
# Prints the function's exit status; the insmod log is left at "$work/log".
run() {
    rm -rf "$work/root"
    mkdir -p "$work/root/kvmapp/system/ko" "$work/root/mnt/system/ko"
    : > "$work/log"

    case "$1" in
        kvmapp)  : > "$work/root/kvmapp/system/ko/zsmalloc.ko"
                 : > "$work/root/kvmapp/system/ko/zram.ko" ;;
        mnt)     : > "$work/root/mnt/system/ko/zsmalloc.ko"
                 : > "$work/root/mnt/system/ko/zram.ko" ;;
        both)    : > "$work/root/kvmapp/system/ko/zsmalloc.ko"
                 : > "$work/root/kvmapp/system/ko/zram.ko"
                 : > "$work/root/mnt/system/ko/zsmalloc.ko"
                 : > "$work/root/mnt/system/ko/zram.ko" ;;
        partial) # zram.ko alone cannot load, so this directory must be skipped
                 : > "$work/root/kvmapp/system/ko/zram.ko"
                 : > "$work/root/mnt/system/ko/zsmalloc.ko"
                 : > "$work/root/mnt/system/ko/zram.ko" ;;
        none)    : ;;
    esac

    ZRAM_DEV="$work/root/zram0" \
    ZRAM_KO_DIRS="$work/root/kvmapp/system/ko $work/root/mnt/system/ko" \
    LOGFILE="$work/log" WORKDIR="$work/root" \
        sh -c ". $work/harness.sh; . $work/func.sh; load_modules"
    echo $?
}

loaded_from() {
    # The directory every insmod in the log came from, or "mixed".
    sed -n 's|^insmod \(.*\)/[a-z]*\.ko$|\1|p' "$work/log" | sort -u | tr '\n' ' '
}

# --- the install package carries them -------------------------------------
rc=$(run kvmapp)
[ "$rc" = 0 ] && note "modules under /kvmapp/system/ko load" OK \
              || note "modules under /kvmapp/system/ko load (rc=$rc)" FAIL
[ "$(loaded_from)" = "$work/root/kvmapp/system/ko " ] \
    && note "and they are loaded from there" OK \
    || note "and they are loaded from there (got: $(loaded_from))" FAIL

# --- a board set up by hand before this change ------------------------------
rc=$(run mnt)
[ "$rc" = 0 ] && note "modules under /mnt/system/ko still load" OK \
              || note "modules under /mnt/system/ko still load (rc=$rc)" FAIL
[ "$(loaded_from)" = "$work/root/mnt/system/ko " ] \
    && note "and they are loaded from there" OK \
    || note "and they are loaded from there (got: $(loaded_from))" FAIL

# --- both present: the install package wins --------------------------------
# It is the copy an image build refreshes, so it is the copy that matches the
# rest of the installed firmware.
rc=$(run both)
[ "$rc" = 0 ] && note "with both present the load succeeds" OK \
              || note "with both present the load succeeds (rc=$rc)" FAIL
[ "$(loaded_from)" = "$work/root/kvmapp/system/ko " ] \
    && note "the install package copy is preferred" OK \
    || note "the install package copy is preferred (got: $(loaded_from))" FAIL

# --- ordering: zsmalloc before zram ----------------------------------------
# The harness refuses zram.ko without it, so a wrong order shows up as a
# REFUSED line rather than as a silent success.
run both > /dev/null
order=$(sed -n 's|^insmod .*/\([a-z]*\)\.ko$|\1|p' "$work/log" | tr '\n' ' ')
[ "$order" = "zsmalloc zram " ] \
    && note "zsmalloc is loaded before zram" OK \
    || note "zsmalloc is loaded before zram (got: '$order')" FAIL
grep -q REFUSED "$work/log" \
    && note "the kernel never refused a module" FAIL \
    || note "the kernel never refused a module" OK

# --- a directory holding only one of the pair is skipped -------------------
rc=$(run partial)
[ "$rc" = 0 ] && note "a half-populated directory falls through to the next" OK \
              || note "a half-populated directory falls through to the next (rc=$rc)" FAIL
[ "$(loaded_from)" = "$work/root/mnt/system/ko " ] \
    && note "and the complete directory is the one used" OK \
    || note "and the complete directory is the one used (got: $(loaded_from))" FAIL

# --- no modules anywhere ---------------------------------------------------
# This is the state the reference board was in. It has to report failure, and
# it must not call insmod on a path that does not exist.
rc=$(run none)
[ "$rc" != 0 ] && note "no modules anywhere reports failure" OK \
               || note "no modules anywhere reports failure (rc=$rc)" FAIL
[ ! -s "$work/log" ] && note "and nothing is insmod-ed" OK \
                     || note "and nothing is insmod-ed (got: $(cat "$work/log"))" FAIL

# --- the device already exists ---------------------------------------------
# A re-run must not insmod a module that is already in the kernel.
rm -rf "$work/root"
mkdir -p "$work/root/kvmapp/system/ko"
: > "$work/root/kvmapp/system/ko/zsmalloc.ko"
: > "$work/root/kvmapp/system/ko/zram.ko"
: > "$work/root/zram0"
: > "$work/log"
rc=$(ZRAM_DEV="$work/root/zram0" \
     ZRAM_KO_DIRS="$work/root/kvmapp/system/ko" \
     LOGFILE="$work/log" WORKDIR="$work/root" \
     sh -c ". $work/harness.sh; . $work/func.sh; load_modules"; echo $?)
[ "$rc" = 0 ] && note "an already-loaded module reports success" OK \
              || note "an already-loaded module reports success (rc=$rc)" FAIL
[ ! -s "$work/log" ] && note "and is not inserted twice" OK \
                     || note "and is not inserted twice (got: $(cat "$work/log"))" FAIL

# --- the shipped text ------------------------------------------------------
# The hardcoded path is the defect. Assert it is gone, ignoring comments, since
# the block above names /mnt/system/ko in prose to explain why it is second.
code="$work/code.sh"
grep -v '^[[:space:]]*#' "$S01" > "$code"

grep -q 'insmod /mnt/system/ko' "$code" \
    && note "no insmod hardcodes /mnt/system/ko" FAIL \
    || note "no insmod hardcodes /mnt/system/ko" OK

grep -q 'kvmapp/system/ko' "$code" \
    && note "the install package directory is in the search list" OK \
    || note "the install package directory is in the search list" FAIL

echo
if [ "$fails" -eq 0 ]; then
    echo "all cases passed"
else
    echo "$fails case(s) FAILED"
fi
exit "$fails"
