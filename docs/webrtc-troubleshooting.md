# WebRTC diagnosis on NanoKVM-PCIe

On 23 October 2026, H.264 WebRTC failed from Chrome to a NanoKVM-PCIe running app 2.5.2 and OS v1.4.2. MJPEG remained usable. Tests over both the Tailscale subnet route and direct LAN reached the same result:

- The signaling WebSocket opened, the browser sent an offer, and it received and applied the answer.
- The KVM sent four remote ICE candidates (three host, one server-reflexive).
- Chrome reported ICE gathering `complete` with **zero local candidates**. The peer stayed in `new`, so no candidate pair could be checked.

This places the observed failure at local browser ICE gathering, not at the KVM's signaling or H.264 capture stage. The exact reason Chrome gathered no candidate remains unconfirmed. Check the browser's WebRTC UDP/IP policy and local network controls before changing STUN/TURN settings or the device firewall. Do not log SDP, TURN credentials, cookies, or full candidate addresses in routine logs.

## Client changes

`web/src/pages/desktop/screen/h264-webrtc.tsx` now sends the offer before flushing locally gathered candidates. Previously `setLocalDescription()` could start gathering and send a candidate before the server received the offer, causing its `AddICECandidate` call to fail. This ordering fix is valid but did not solve the observed zero-candidate failure.

The client also logs signaling and ICE milestones, allows 30 seconds for connection instead of 10, and removes an early five-second failure warning. If gathering completes with zero local candidates, it reports the failure once and closes the unused peer and signaling socket instead of retrying indefinitely. Select MJPEG in the video menu for a usable stream until browser ICE gathering is fixed.

## Tailscale reliability finding

The device's Tailscale IP stopped responding during testing. The kernel log showed an out-of-memory kill of `tailscaled`; the device has 158 MiB RAM and initially had no swap. Starting `/etc/init.d/S98tailscaled` restored Tailscale ping. To reduce repeat OOM kills, the built-in Tailscale **Swap memory** setting was enabled, creating a persistent 256 MiB `/swapfile`; `/proc/swaps` and `/etc/inittab` confirmed it. This can increase writes to the device's flash storage. If access disappears again while LAN remains reachable, check `ps` and `dmesg` on the KVM before changing tailnet policy.

After video-mode tests, MJPEG briefly reported `Switching resolution...` (capture result -4). The UI's **Reset HDMI** command restored a live Unraid console image. This was a separate HDMI capture state, not a WebRTC ICE fix.

## Verification and rollback

Run `pnpm --dir web build`, lint the changed source, and inspect the browser console after selecting WebRTC. The deployed web assets live in both `/kvmapp/server/web` (persistent) and `/tmp/server/web` (live) on this device. A pre-deployment backup is `/root/nanokvm-web-backup-20261023.tar` on the KVM. Restore it to the persistent web directory and copy those assets to the live directory to roll back. Avoid restarting `/etc/init.d/S95nanokvm` from its own web terminal: that can terminate the terminal before the command completes.
