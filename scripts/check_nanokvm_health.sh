#!/bin/sh

set -u

now() {
  date "+%Y-%m-%d %H:%M:%S"
}

section() {
  echo
  echo "================================================================"
  echo "$1"
  echo "================================================================"
}

run_cmd() {
  cmd="$1"
  echo
  echo "\$ $cmd"
  sh -c "$cmd" 2>&1 || echo "[WARN] command failed with exit code $?"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

print_file_head() {
  file="$1"
  lines="$2"
  if [ -f "$file" ]; then
    echo "--- $file (first $lines lines) ---"
    head -n "$lines" "$file"
  else
    echo "--- $file not found ---"
  fi
}

echo "NanoKVM health check started at: $(now)"

section "System"
run_cmd "uname -a"
run_cmd "uptime"
run_cmd "cat /etc/os-release 2>/dev/null || cat /etc/issue 2>/dev/null || true"
run_cmd "cat /proc/cmdline"

section "Storage"
run_cmd "df -h"
run_cmd "df -i"
run_cmd "mount | sed -n '1,120p'"
run_cmd "du -sh /kvmapp 2>/dev/null || true"
run_cmd "du -sh /tmp 2>/dev/null || true"
run_cmd "du -sh /data 2>/dev/null || true"
run_cmd "du -sh /root 2>/dev/null || true"

section "Network"
run_cmd "ip addr show 2>/dev/null || ifconfig -a 2>/dev/null || true"
run_cmd "ip route show 2>/dev/null || route -n 2>/dev/null || true"
run_cmd "netstat -lntp 2>/dev/null || netstat -lnt 2>/dev/null || true"

section "Critical Paths"
for p in /kvmapp /kvmapp/server /kvmapp/kvm_system /kvmapp/system /kvmapp/system/init.d /mnt/system/usr/bin /mnt/data; do
  if [ -e "$p" ]; then
    echo "[OK] exists: $p"
  else
    echo "[ERR] missing: $p"
  fi
done

section "Service Scripts"
for s in /etc/init.d/S95nanokvm /etc/init.d/S98tailscaled /etc/init.d/S99netbird /etc/init.d/S03usbdev /etc/init.d/S03usbhid; do
  if [ -x "$s" ]; then
    echo "[OK] executable: $s"
  elif [ -f "$s" ]; then
    echo "[WARN] present but not executable: $s"
  else
    echo "[WARN] not found: $s"
  fi
done

section "Service Status"
for s in /etc/init.d/S95nanokvm /etc/init.d/S98tailscaled /etc/init.d/S99netbird /etc/init.d/S03usbdev /etc/init.d/S03usbhid; do
  if [ -x "$s" ]; then
    run_cmd "$s status"
  fi
done

section "Processes"
run_cmd "ps | grep -E 'NanoKVM-Server|kvm_system|tailscaled|tailscale|netbird|jpg_stream' | grep -v grep || true"

section "Binary Presence"
for b in /kvmapp/server/NanoKVM-Server /usr/bin/tailscale /usr/sbin/tailscaled /usr/bin/netbird /kvmapp/system/netbird/netbird; do
  if [ -f "$b" ]; then
    ls -lh "$b"
  else
    echo "[WARN] missing: $b"
  fi
done

section "Sensor Config"
print_file_head "/mnt/system/usr/bin/sensor_cfg.ini" 80
print_file_head "/mnt/data/sensor_cfg.ini" 80
print_file_head "/mnt/data/sensor_cfg.ini.LT" 80

run_cmd "grep -inE '6911|lt6911|4653|gc4653|sensor' /mnt/system/usr/bin/sensor_cfg.ini 2>/dev/null | sed -n '1,120p' || true"
run_cmd "grep -inE '6911|lt6911|4653|gc4653|sensor' /mnt/data/sensor_cfg.ini 2>/dev/null | sed -n '1,120p' || true"

section "Device Nodes"
for n in /dev/hidg0 /dev/hidg1 /dev/net/tun; do
  if [ -e "$n" ]; then
    ls -l "$n"
  else
    echo "[WARN] missing: $n"
  fi
done

section "Kernel / Runtime Errors"
if has_cmd dmesg; then
  run_cmd "dmesg | tail -n 300"
  run_cmd "dmesg | grep -iE 'lt6911|gc4653|sensorName|pqbin|cvi_bin_isp|hidg1|invalid argument|AE_|isp' | tail -n 200 || true"
else
  echo "[WARN] dmesg command not available"
fi

section "Quick API Reachability (local)"
if has_cmd wget; then
  run_cmd "wget -q -O - http://127.0.0.1 2>/dev/null | head -n 5 || true"
fi
if has_cmd curl; then
  run_cmd "curl -I --max-time 3 http://127.0.0.1 || true"
fi

section "Summary Hints"
echo "1) If you see 'mwSns:6911 != pqBinSns:4653', sensor profile mismatch is likely."
echo "2) If /dev/hidg1 exists but writes fail with 'invalid argument', restart S03usbdev/S03usbhid."
echo "3) If /tmp is full, deploy/updates may fail. Prefer /data as staging."
echo "4) If /kvmapp/server/NanoKVM-Server is missing or tiny, backend deployment is broken."

echo
echo "NanoKVM health check completed at: $(now)"
