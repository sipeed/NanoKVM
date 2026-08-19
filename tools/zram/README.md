# zram

Compressed swap in RAM, as two loadable modules against the stock kernel. No
new image, no kernel replacement, no boot-path change; `rmmod` undoes it.

## Why it is possible

```
# CONFIG_MODVERSIONS is not set     only vermagic must match, no symbol CRCs
# CONFIG_MODULE_SIG is not set      no signature enforcement
CONFIG_MODULES=y                    ~30 .ko already load from /mnt/system/ko
CONFIG_SWAP=y  CONFIG_CRYPTO_LZO=y  CONFIG_CRYPTO_ZSTD=y
# CONFIG_ZSMALLOC is not set        so zram needs zsmalloc built too
```

The board's own toolchain is the one in `tools/build` — Xuantie V2.6.1, gcc
10.2.0 — which is what `CONFIG_CC_VERSION_TEXT` on the device names.

## Why lzo-rle

`lz4` is not an option: `CONFIG_CRYPTO_LZ4` is unset, so `/proc/crypto` offers
only `deflate`, `lzo`, `lzo-rle` and `zstd`. The real choice is lzo-rle against
zstd.

The scarce resource on this board is CPU, not compression ratio: one in-order
C906 at 1GHz with no acceleration, also running H.264 encode. Compression is
paid on swap-*out*, which happens under memory pressure — exactly when that core
is already saturated. zstd costs several times more there for a better ratio.

## Reconsidered, with numbers

The reason above is a *kernel config* constraint, and this repository can now
build modules against the stock kernel — that is what `build-modules.sh` does.
So `CONFIG_CRYPTO_LZ4` could be built and lz4 offered to zram. Measured on a
live board, it would buy nothing:

```
zram offers   : lzo [lzo-rle] zstd
ratio         : 2.76x   (orig 3.21 MB -> compressed 1.17 MB)
mem_used      : 1.63 MB against the 40 MB mem_limit -> 4% of the cap
swap in use   : 3.2 MB of 96 MB
lifetime      : pswpout 40449 pages, pswpin 6503
```

Ratio is not the binding constraint: at 4% of the cap, a much worse ratio would
still fit. lz4 over lzo-rle is a few percent of compression time on a board that
idles at 5% of one core. And lzo-rle is the kernel's default for zram because of
its run-length handling of zero pages, which is most of what swap holds — lz4
has no equivalent. Against that, an extra module pinned to the kernel's vermagic
has to be rebuilt whenever the kernel moves.

If this is revisited, measure CPU during a sustained swap-out, not the ratio.
The ratio is already comfortable and is not what costs anything here.

An earlier version of this file claimed lzo-rle "reached about 5x". Today it
measures 2.76x on live pages. Both are real; they are different workloads, and
a single figure should not have been stated as the property of the algorithm.

Switching is one write, before `disksize` is set:

```shell
echo zstd > /sys/block/zram0/comp_algorithm
```

## Getting the modules onto a device

The modules are the only manual step. The server installs the init script.

There are two ways, and the first one is better.

### 1. Enable them in the kernel config

`CONFIG_ZRAM` and `CONFIG_ZSMALLOC` are both unset in the shipped kernel. Two
lines in the defconfig build them as part of the normal image:

```
CONFIG_ZSMALLOC=m
CONFIG_ZRAM=m
```

They then land in `/mnt/system/ko` with the other modules, they are rebuilt
whenever the kernel is, and no prebuilt binary has to be trusted or maintained.
This is the whole change needed to make the feature work for every device.

### 2. Build them out of tree

For a device running an image that does not have them. The build runs in a
container, because the kernel tree cannot be checked out on a Windows
filesystem: it carries paths Windows refuses and `git clone` fails at checkout.

```shell
docker build -t nanokvm-zram-builder tools/zram

ssh root@<device> 'zcat /proc/config.gz' > kernel.config

docker volume create nanokvm-kernel
docker run --rm -v nanokvm-kernel:/src -w /src nanokvm-zram-builder sh -c '
  git clone --depth 1 --filter=blob:none --sparse -b NanoKVM \
      https://github.com/sipeed/LicheeRV-Nano-Build
  cd LicheeRV-Nano-Build && git sparse-checkout set linux_5.10'

docker run --rm \
  -v nanokvm-kernel:/kernel \
  -v "$PWD/tools/zram:/tools:ro" \
  -v "$PWD/ko:/work" \
  nanokvm-zram-builder \
  bash /tools/build-modules.sh /kernel/LicheeRV-Nano-Build/linux_5.10 \
       /work/kernel.config /work/ko

scp ko/*.ko root@<device>:/mnt/system/ko/
```

## Where the modules are looked for

`S01zram` and the server both search `/kvmapp/system/ko` first and
`/mnt/system/ko` second. A directory has to hold both modules to be used: zram
cannot load without zsmalloc, and a pair split across two directories is two
builds carrying the same vermagic, which the kernel accepts and then resolves
against the wrong copy.

`/mnt` is not a mount point. It is a plain directory on the root filesystem, so
modules copied there by method 2 are removed by a rootfs update or a re-flash.
The loss is quiet: `S01zram` prints `FAIL (no zram device)` and returns 1, rcS
records the exit status and carries on, and the web UI reports the feature as
unavailable rather than broken. A device that had working compressed swap
yesterday reads as one that never had it.

`/kvmapp/system/ko` is part of the install package, so an update restores what
is in it. Nothing is shipped there today and the search falls through on a
stock device. It is searched first so that shipping the modules there, or
placing them there by hand, survives an update with no further change.

## Turning it on

Open `Settings > Device > Advanced` in the web UI and turn on **Compressed swap
(zram)**. The toggle copies `/kvmapp/system/init.d/S01zram` to `/etc/init.d/`,
makes it executable, and starts it. Turning the toggle off stops the device and
removes the script again.

The row reports "The kernel modules are not installed on this device" and the
toggle stays disabled until both `.ko` files are in place.

`build-modules.sh` refuses to emit modules whose vermagic does not match
`5.10.4-tag- preempt mod_unload riscv` exactly, so a module that cannot load
never reaches a device.

`loadsystemko.sh` lists modules explicitly and does not glob, so dropping files
into `/mnt/system/ko` does not make them load. `S01zram` is what enables them.

## Where the script lives

`S01zram` moved to `kvmapp/system/init.d/` so that it ships in the install
package and the server has a source to copy from. It is not in the list of
scripts that `kvm_system` copies at boot: that list is hard-coded C++, and
adding a name to it needs a MaixCDK rebuild and a redeploy on every device. The
presence of `/etc/init.d/S01zram` is what marks the feature as enabled, the
same way `S98tailscaled` already works.

`tools/zram/test-zram-swapon.sh` checks the swap priority and its fallback:

```shell
sh tools/zram/test-zram-swapon.sh
```

## Swap priority cannot be set on this image

The script asks for `swapon -p 100` and falls back to a plain `swapon`. On this
board the fallback is what always runs. Measured 2026-08-13:

```
$ swapon --help
Usage: swapon [-a] [-e] [DEVICE]
	-a	Start swapping on all swap devices
	-e	Silently skip devices that do not exist
```

BusyBox 1.36.1 here is built without `FEATURE_SWAPON_PRI`, so neither `-p` nor
the `pri=` option in `/etc/fstab` is available. zram lands at the kernel's
default priority, which shows as `-2` in `/proc/swaps`.

The `-p` attempt stays in the script. It is correct on an image that has the
feature, and `tools/zram/test-zram-swapon.sh` covers both paths.

Boot order does not compensate. The kernel gives the first device swapped on
the higher priority, and the swap file goes first:

```
si5::sysinit:/sbin/swapon -a          <- inittab, sysinit
si11::sysinit:/sbin/swapon /swapfile  <- appended by the swap file feature
rcS:12345:wait:/etc/init.d/rcS        <- reaches S01zram
```

BusyBox init runs every `sysinit` entry to completion before it starts the
`wait` entries, so the swap file is always enabled first and always takes the
better priority.

**Do not enable both on this board.** With both on, the kernel writes to the SD
card before it writes to compressed RAM, which defeats the reason for using
zram. The two controls in `Settings > Device > Advanced` are independent by
design, so nothing stops you; this is the reason not to.

## Stopping and starting a live device

`swapoff` takes the device out of `/proc/swaps` but leaves it initialised: it
keeps its `disksize`. The kernel then rejects a second write to `disksize`:

```
sh: write error: Resource busy
```

`start` therefore resets a device that reports a non-zero `disksize` before it
configures one. Nothing hit this while the script only ran at boot, because a
freshly inserted module reports 0. The UI toggle stops and starts a live
device, which is the path that needs the repair.

`disable` does not remove the modules. They stay loaded, so the toggle keeps
reporting the feature as available and a re-enable costs no `insmod`.

## Testing on a live board

Use a `hot_add` device, never the live swap, and give it a `mem_limit`. Keep the
payload small: 8 MB is what the measurements above used, and it is small for a
reason.

```shell
N=$(cat /sys/class/zram-control/hot_add)
echo 16M > /sys/block/zram$N/disksize
echo 8M  > /sys/block/zram$N/mem_limit     # do not skip this
dd if=/some/real/file of=/dev/zram$N bs=64k count=128
cat /sys/block/zram$N/mm_stat
echo 1 > /sys/block/zram$N/reset
echo $N > /sys/class/zram-control/hot_remove
```

Two mistakes will wedge the board, and each on its own is enough:

- **Staging the payload in `/tmp`.** `/tmp` is tmpfs, so the file is spent out
  of the same RAM the test is measuring, before the test begins. Read from a
  real file on `/data`, or generate the data in the pipe.
- **A `hot_add` device with no `mem_limit`.** `zram0` is capped at 40 MB by
  `S01zram` and cannot spiral. A device created by hand is uncapped and will
  compress the payload into whatever RAM is left.

The board does not crash and the kernel kills nothing. It stops being able to
`fork`: `ping` answers, the already-running `NanoKVM-Server` answers HTTP in
well under a second, and `ssh` times out during the banner exchange because
`sshd` cannot start a child. Recovery is a power cycle. Everything that would
free the memory can be done with shell builtins, which need no new process
(`: > /tmp/file`, `echo 1 > /sys/block/zramN/reset`), so it is worth retrying
ssh on a slow loop before giving up on it.

Use `/dev/zero` only to check deduplication. It never reaches the compressor:
identical pages are counted in the `same_pages` field of `mm_stat` and the
compressed size stays 0.

## The trade

With no disk swap behind it, exceeding zram means the OOM killer rather than
slow paging, and the largest process is `NanoKVM-Server` — so an OOM takes video
with it. `mem_limit` caps the RAM zram may consume so it cannot spiral, but the
tail behaviour is a cliff rather than a slope. On a board that measured 143
pages ever swapped, and zero under a live streaming session, that cliff is a
long way off.
