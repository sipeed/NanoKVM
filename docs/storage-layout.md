# SD card layout

The root filesystem keeps the image's original 1.5 GiB partition. On first boot,
the data partition uses the remaining card space, starting at the next 1 MiB
boundary after the actual root partition. Reboots do not resize the root.

Use a card large enough for the complete system image and the disk images you
want to store. A 4 GB or larger card is recommended; large installation ISOs
require correspondingly more data space. Partition-layout tests are not a
qualification of every card capacity or model.

An existing data partition is preserved. Devices with a previously enlarged
root keep that partition: a mounted filesystem is never shrunk automatically.
If reading the partition geometry or creating the data partition fails, startup
does not mark partition creation as complete, allowing a later retry.
