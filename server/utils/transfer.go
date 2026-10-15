package utils

// TransferSentinelPath coordinates transfers that write new files into the
// data partition: application updates and image downloads. Writing into an
// image a medium already owns does not take it. /run is already required by the device init scripts and preserves
// the previous reboot-clears-stale-state behaviour without using /tmp.
const TransferSentinelPath = "/run/nanokvm-transfer-in-progress"
