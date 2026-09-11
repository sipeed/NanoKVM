#!/bin/bash
# Check the native VI handoff ABI in both standalone and release libraries.
set -euo pipefail
lib_dir=${1:?usage: verify-video-libs.sh LIBRARY_DIRECTORY}
command -v readelf >/dev/null
symbols=$(mktemp -d)
trap 'rm -rf "$symbols"' EXIT
readelf --dyn-syms --wide "$lib_dir/libkvm.so" > "$symbols/kvm"
readelf --dyn-syms --wide "$lib_dir/libkvm_mmf.so" > "$symbols/mmf"
for symbol in _Z16mmf_venc_push_viii _Z32mmf_enc_jpg_push_vi_with_qualityiii _Z23mmf_vi_frame_pop_nativeiPiS_S_S_; do
    awk -v s="$symbol" '$7 == "UND" && $8 == s { found=1 } END { exit !found }' "$symbols/kvm" || {
        echo "libkvm.so does not use the native VI ABI: $symbol" >&2; exit 1;
    }
    awk -v s="$symbol" '$7 != "UND" && $8 == s { found=1 } END { exit !found }' "$symbols/mmf" || {
        echo "libkvm_mmf.so does not provide the native VI ABI: $symbol" >&2; exit 1;
    }
done
awk '$7 == "UND" && $8 ~ /^_Z[0-9]+mmf_/ {print $8}' "$symbols/kvm" | LC_ALL=C sort -u > "$symbols/needed"
awk '$7 != "UND" && $8 != "" {print $8}' "$symbols/mmf" | LC_ALL=C sort -u > "$symbols/provided"
comm -23 "$symbols/needed" "$symbols/provided" > "$symbols/missing"
if [ -s "$symbols/missing" ]; then
    echo "libkvm_mmf.so is missing MMF symbols required by libkvm.so:" >&2
    cat "$symbols/missing" >&2
    exit 1
fi
echo "Native VI ABI verified: $lib_dir"
