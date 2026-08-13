#!/bin/bash
# Build zsmalloc.ko and zram.ko for the stock kernel.
#
#   build-modules.sh <kernel-source> <device-config> [output-dir]
#
# The device kernel has CONFIG_ZSMALLOC unset, so zram needs both modules. It
# also has MODVERSIONS and MODULE_SIG off, which means a module only has to
# match the vermagic string - no symbol CRCs, no signing.
#
# Get the config from the device itself:
#   ssh root@<device> 'zcat /proc/config.gz' > kernel.config
# Get the source from the board's build tree:
#   git clone --depth 1 --filter=blob:none --sparse -b NanoKVM \
#       https://github.com/sipeed/LicheeRV-Nano-Build
#   cd LicheeRV-Nano-Build && git sparse-checkout set linux_5.10
#
# Seeding .config from the running kernel means every option the vermagic is
# derived from already matches. Only CONFIG_LOCALVERSION is forced: the device
# reports 5.10.4-tag-, and reproducing that through LOCALVERSION_AUTO would
# depend on the git state of the machine Sipeed built on.
set -e

SRC=${1:?usage: build-modules.sh <kernel-source> <device-config> [output-dir]}
CONFIG=${2:?usage: build-modules.sh <kernel-source> <device-config> [output-dir]}
OUT=${3:-$PWD/ko}
WANT_VERMAGIC="5.10.4-tag- preempt mod_unload riscv"

[ -f "$SRC/Makefile" ] || { echo "not a kernel tree: $SRC"; exit 1; }
[ -f "$CONFIG" ]       || { echo "no such config: $CONFIG"; exit 1; }

cd "$SRC"
export ARCH=riscv
export CROSS_COMPILE=riscv64-unknown-linux-musl-
export KBUILD_BUILD_USER=build
export KBUILD_BUILD_HOST=nanokvm

echo "===== configure ====="
cp "$CONFIG" .config
./scripts/config --file .config --set-str CONFIG_LOCALVERSION "-tag-"
./scripts/config --file .config --disable CONFIG_LOCALVERSION_AUTO
./scripts/config --file .config --module CONFIG_ZSMALLOC
./scripts/config --file .config --module CONFIG_ZRAM
make olddefconfig >/dev/null
grep -E '^CONFIG_(ZRAM|ZSMALLOC|LOCALVERSION|PREEMPT=|MODULE_UNLOAD)' .config | sed 's/^/  /'
echo "  kernelrelease: $(make -s kernelrelease)"

echo
echo "===== build ====="
make -j"$(nproc)" modules_prepare 2>&1 | tail -3
make -j"$(nproc)" mm/zsmalloc.ko drivers/block/zram/zram.ko 2>&1 | tail -10

echo
echo "===== collect ====="
mkdir -p "$OUT"
for m in mm/zsmalloc.ko drivers/block/zram/zram.ko; do
    [ -f "$m" ] || { echo "MISSING: $m"; exit 1; }
    cp "$m" "$OUT/"
done

echo
echo "===== vermagic must match the device exactly ====="
ok=1
for m in "$OUT"/*.ko; do
    got=$(modinfo "$m" | sed -n 's/^vermagic: *//p')
    if [ "$got" = "$WANT_VERMAGIC" ]; then
        echo "  OK   $(basename "$m"): $got"
    else
        echo "  FAIL $(basename "$m"): '$got'"
        echo "       want                 '$WANT_VERMAGIC'"
        ok=0
    fi
done
[ "$ok" -eq 1 ] || { echo "vermagic mismatch - these will not load"; exit 1; }

echo
echo "  modules in $OUT"
echo "  install with: scp $OUT/*.ko root@<device>:/mnt/system/ko/"
