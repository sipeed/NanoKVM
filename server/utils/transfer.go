package utils

// TransferSentinelPath coordinates application uploads and virtual-media
// transfers. /run is already required by the device init scripts and preserves
// the previous reboot-clears-stale-state behaviour without using /tmp.
const TransferSentinelPath = "/run/nanokvm-transfer-in-progress"
