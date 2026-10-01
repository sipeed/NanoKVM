#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SCRIPT="$ROOT/kvmapp/system/init.d/S25wifimod"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT HUP INT TERM

mkdir -p "$WORK/ko/3rd" "$WORK/bin"

cat > "$WORK/bin/insmod" <<'EOF'
#!/bin/sh
basename "$1" >> "$NANOKVM_INSMOD_LOG"
EOF
chmod +x "$WORK/bin/insmod"

run_case() {
	name=$1
	alias_value=$2
	expected=$3
	devices="$WORK/$name/devices"
	log="$WORK/$name/insmod.log"

	mkdir -p "$devices/card:0000:1"
	printf '%s\n' "$alias_value" > "$devices/card:0000:1/modalias"
	: > "$log"

	NANOKVM_KO_DIR="$WORK/ko" \
	NANOKVM_SDIO_DEVICES_DIR="$devices" \
	NANOKVM_INSMOD="$WORK/bin/insmod" \
	NANOKVM_INSMOD_LOG="$log" \
		sh "$SCRIPT" start >/dev/null

	actual=$(cat "$log")
	if [ "$actual" != "$expected" ]
	then
		echo "$name: unexpected modules" >&2
		echo "expected:" >&2
		printf '%s\n' "$expected" >&2
		echo "actual:" >&2
		printf '%s\n' "$actual" >&2
		exit 1
	fi
}

run_case aic 'sdio:c07v5449d0145' 'cfg80211.ko
aic8800_bsp.ko
aic8800_fdrv.ko'

run_case rtl 'sdio:c07v024CdB73A' 'cfg80211.ko
8733bs.ko'

run_case unknown 'sdio:c07vFFFFdFFFF' 'cfg80211.ko
aic8800_bsp.ko
aic8800_fdrv.ko
8733bs.ko'

echo "S25wifimod tests passed"
