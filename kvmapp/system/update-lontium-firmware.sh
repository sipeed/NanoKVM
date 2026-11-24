#!/bin/sh
set -eu

cd /kvmapp/system/firmware
boot=/boot/boot.sd
modules=/mnt/system/ko

exec 8>/run/nanokvm-firmware.lock
flock -n 8
mountpoint -q /boot || { echo "/boot is not mounted" >&2; exit 1; }

changed=
for dest in "$boot" "$modules/soph_mipi_rx.ko" "$modules/lontium_hdmi.ko"; do
    name=${dest##*/}
    [ -f "$name" ] && [ -s "$name" ] || { echo "Missing or empty firmware: $name" >&2; exit 1; }
    cmp -s "$name" "$dest" && continue
    if [ "$dest" != "$boot" ]; then
        install -m 644 "$name" "$dest.new"
    fi
    changed="$changed $dest"
done

[ -n "$changed" ] || exit 0
# A retry must still reboot if the previous run stopped after the last write.
touch /run/nanokvm-hardware-reboot
for dest in $changed; do
    if [ "$dest" = "$boot" ]; then
        # The 16 MiB boot partition has room for one image.
        rm -f "$boot"
        dd if=boot.sd of="$boot" bs=64k conv=fsync
    else
        mv -f "$dest.new" "$dest"
    fi
done
sync
