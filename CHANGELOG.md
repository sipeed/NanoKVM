## 2.5.3 (2026-11-03)

### Features

* Replaced the desktop image menu and the download page with a storage page that lists the media the emulated USB disk can carry, mounts and ejects them, and browses the files inside a medium over the same gadget, so the two machines exchange files without going through the terminal
* Added uploads, downloads and deletes to the storage page, with search, sorting, folder deletion behind a confirmation, one transfer display for image and file transfers, cancellable uploads, a free space preflight and a checksum mismatch report
* Browsed only media whose filesystem this device can read, so an ISO 9660 image is still served to the target machine but cannot be listed here, and limited CD-ROM mode to ISO 9660 and UDF images
* Made the shared folder follow the target machine: while it owns the data partition the listing refreshes on a timer after dropping the dentry and inode caches, so a file the target machine wrote shows up within a second of its own writeback
* Added a fine-grained permission system on top of the `admin` and `user` roles: administrators keep implicit full access, while every other account receives an explicit set of grants covering the console, power, media, terminal, device, network, updates, MCP, Tailscale and AI features, with the groups, risk marks and implied grants shown in a permission editor; mounting a medium needs the virtual disk, and the storage page names the account that has to enable it when the current account cannot
* Added a view-only console session for an account that may watch but not send input: the pointer and keyboard capture, the mouse menu and the input region editor follow the grant, pages, menus, settings tabs and storage actions render only what the account is allowed to use, and an account without console access lands on a page offering the sections its grants open
* Changed permission handling so an open session picks up the new grants without ending the login: a change that invalidates a cached capability drops the long-lived connection with a dedicated close code so the page reconnects, and only disabling an account ends the login
* Added the choice of regenerating the device-wide MCP API key when an account loses the MCP grant, instead of rotating the key silently and disconnecting every MCP client
* Kept the pre-2.6 image endpoints working as a compatibility layer over the new media API, so existing clients and scripts keep working
* Treated UDF images, not only ISO 9660 ones, as optical media, and accepted uploads by extension (`.iso`/`.img`), leaving an unusable image to fail when it is mounted instead of while it is stored

### Bug Fixes

* Fixed HID input being lost after a medium was mounted or the gadget was otherwise reset, by reopening the HID devices with a retry instead of a single attempt that could fail while the new nodes were still coming up
* Fixed `/data` staying read-only after a failed gadget script or a network switch
* Fixed the settings menu icon sitting a few pixels below the other menu icons, and centered the dialog tab icons in their box
* Fixed Chinese and Japanese punctuation being drawn by a Latin face in tooltips and dialogs, which pushed the ideographic comma and full stop above the baseline

### UI Improvements

* Gave the shared folder, ISO and IMG entries their own glyphs and picked file icons from the extension, so a listing can be read at a glance
* Listed administrators above regular accounts and gave their rows a lighter card
* Moved the PicoClaw chat composer to an antd text area and replaced the Radix scroll area with the native scroll container, so the settings dialog and the shortcut lists scroll like the rest of the app

### Localization

* Translated every string the storage page, the permission editor, the view-only console and the MCP key rotation add for all 24 supported locales
* Removed the keys the retired image menu and download page left behind

### Security

* Mounted images are opened through loop devices that refuse symlinks, and files inside a medium are opened without following links

### Chores

* Removed the desktop image menu, the download page and their web client code
* Dropped the `@radix-ui/react-scroll-area` dependency
* Documented the permission catalog, the split between mounting media and writing the library, and the grants that reach the whole device in `server/README.md` and `server/README_ZH.md`

## 2.5.2 (2026-09-29)

### Features

* Added a one-writer policy for the emulated USB disk and the `/data` partition: `/data` is mounted read-only from boot while the virtual disk serves the raw partition to the target machine, enabling the disk remounts it read-only and verifies the state before the target machine can write it, refusing to expose the disk when the remount fails, and releasing a medium hands the raw partition back to the target machine the same way
* Added confirmation before a mounted medium and the virtual disk take the shared partition from each other, including a warning that a running image transfer is cancelled and that `/data` becomes read-only on this device
* Added cancellation of a running image transfer before the partition handover, showed the transfer state in the image list and disabled the actions that cannot run while a medium is mounted, with a hint explaining why
* Added names for the mounted medium and the emulated USB device taken from the image file, truncated to the SCSI inquiry product field and the USB product string and restored on unmount
* Added streaming validation of uploaded images: ISO 9660 and UDF volume descriptors and raw disk images (GPT, APFS, HFS+, MBR) are accepted and anything else is rejected in seconds instead of after the whole transfer, with a free space check that keeps a 128 MiB reserve before any byte is received

### Bug Fixes

* Fixed mass storage mounts staying writable from the target machine: every mounted image is now served read-only, with the flag set before the LUN is attached, so the target machine can neither write to nor format it
* Fixed the LUN flags surviving a gadget restart, which brought the shared partition back to the target machine read-only or as an optical drive after a medium had been mounted
* Fixed the virtual disk switch staying on but unchangeable while a medium was mounted; the disk now reports itself on only while the LUN really carries the `/data` partition
* Fixed the on-screen keyboard crashing the page with "Minified React error #130" as soon as it was opened, by importing the `react-simple-keyboard` component through its named export, which the CommonJS interop under Vite 8 no longer resolves from a default import

### Localization

* Translated the new virtual disk and image mounting strings for every locale

### Chores

* Added unit tests for the upload header check, the free space preflight and the image name truncation

## 2.5.1 (2026-09-09)

### Features

* Added device-level multi-user support with `admin` and `user` roles and a user management page under Settings, separating administrative areas (terminal, scripts, storage, network, updates, MCP, PicoClaw and Tailscale) from the video, keyboard, mouse, paste, wake-on-LAN and power controls every account keeps
* Moved sessions to HttpOnly cookies with a per-user token version, so changing a password or disabling an account immediately ends that user's open web and WebSocket sessions
* Added support for a custom update server, so the application can be updated from your own mirror, with credentials in the URL, manifest validation and a settings page for configuring it
* Added SHA-256 verification of offline update packages before they are installed
* Added configurable mouse input regions for absolute mode, with automatic black-border detection, manual selection of the controllable area on screen, and original-resolution presets, so the pointer stays aligned when the target machine outputs a letterboxed or non-16:9 signal
* Added touch gestures to relative mouse mode, including tap, drag, long press, double-tap drag and two-finger scroll, so relative mode is now usable from a phone or tablet
* Added a `signal` field to `/api/vm/hdmi` reporting whether an HDMI source is actually present, not just whether capture is enabled
* Added a default root shell profile showing the user, host and working directory in the prompt over SSH and the Web terminal

### Bug Fixes

* Fixed mouse coordinates being offset in Direct H.264 mode when the target machine pads the picture with black bars
* Fixed touch input in absolute mode, and stopped taps on the black letterbox area from being sent to the target machine
* Fixed the video area not fitting the window, by scaling H.264 and MJPEG playback to contain and letting the page handle touch instead of the browser
* Fixed WebRTC H.264 failures leaving a silent black screen; signaling, negotiation, ICE and playback failures now report what went wrong and offer a retry
* Fixed a slow WebRTC viewer stalling the shared H.264 source for everyone else, by dropping its buffered frames until the next key frame
* Fixed application updates running from a temporary directory that could be too small or shared with another update; online and offline updates are now staged in isolated persistent workspaces with archive, manifest and free-space checks, and the last rollback backup is kept when space runs short
* Fixed the update lock being released before the server finished restarting, which allowed a second update to start and be killed mid-install
* Fixed Web terminal sessions not loading the root profile, by starting them as login shells in `/root`

### Performance

* Routed Direct and WebRTC viewers through a single shared H.264 capture source instead of each reading the encoder separately

### Localization

* Synchronized translations of other languages according to English

### Chores

* Upgraded the web build tooling to Vite 8 and switched to Vite's native tsconfig path resolution
* Added a dev container for full-stack development
* Prefixed GitHub Release titles with `nanokvm`
* Added release asset verification with per-device package size limits to the packaging workflow

## 2.5.0 (2026-08-04)

### Features

* Added an MCP service that lets trusted MCP clients capture screenshots and control the keyboard and mouse with an API key, including a settings page for enabling it and regenerating the key
* Added coordinated device control so MCP, PicoClaw and manual input hand ownership over to each other instead of writing HID input at the same time
* Added remote keyboard lock indicators that show the target machine's Num Lock, Caps Lock and Scroll Lock state
* Added an optional SHA-256 checksum and cancellation to remote image downloads

### Bug Fixes

* Fixed the USB network gadget getting a random host-side MAC on every bind, which made the attached PC register a new network adapter after each reboot; both the device and host MAC are now derived from the chip UID (thanks to [@BeaconCat](https://github.com/BeaconCat))
* Fixed OLED sleep durations above 255 seconds being truncated, so the 5 min, 10 min, 30 min and 1 hour options now behave as selected
* Fixed the mounted image API returning an error in HID-Only mode
* Fixed image downloads and application updates interfering with each other when running at the same time
* Fixed Direct H.264 playback falling behind when the decoder queue backed up, by resynchronizing at the next key frame and preferring hardware decoding
* Added a warning when Direct and WebRTC H.264 stream modes are used at the same time
* Made the video input state shared between processes and read it without shell pipelines, so HDMI status stays consistent between `NanoKVM-Server` and `kvm_system`

### Performance

* Reduced latency in 60 Hz mode with decode-driven flow control, GOP-aware bounded queues, and dedicated writer goroutines with write deadlines so a slow client no longer stalls the others
* Integrated zero-copy H.264 capture into the video pipeline instead of relying on a preload hook
* Stopped HDMI capture when no user is logged in or all viewers are idle, reducing power consumption

### UI Improvements

* Tidied the image download dialog layout and truncated long file names in the upload box

### Localization

* Synchronized translations of other languages according to English

### Chores

* Split release automation into separate package, tag and release workflows, and produced identifiable build artifacts with checksums for pull requests
* Allowed overriding the builder image, installed `patchelf` in the build environment, and fixed the exit codes of `support/sg2002/build`
* Fixed slow container builds caused by uid/gid mismatch and reused existing container users and groups

## 2.4.3 (2026-06-09)

### Features

* Added LT6911D support

### Bug Fixes

* Improved USB network adapter compatibility on Windows

## 2.4.2 (2026-05-20)

### Features

* Added HDMI capture status detection with localized warning and error overlays on the desktop screen

### Bug Fixes

* Fixed left-button touch cancellation and context menu cleanup for mouse input
* Improved the WebRTC loading indicator
* Added Wi-Fi password field validation
* Hardened Wake-on-LAN MAC handling by normalizing stored addresses, avoiding shell execution, handling missing history gracefully, and improving named MAC display
* Stabilized PicoClaw session switching by waiting for gateway release, refreshing runtime status before reconnecting, rendering structured thought messages, and preventing history row overflow

### Performance

* Improved H.264 streaming client handling by reducing frame queue latency, using client snapshots for fanout, applying backend ICE server configuration, and cleaning up disconnected WebRTC clients more aggressively

### UI Improvements

* Refreshed desktop menu ordering and community links, including replacing the Discussion link with Discord

### Chores

* Removed the legacy H.264 stream package
* Updated PostCSS, refreshed the MSW worker, and added pnpm workspace build approvals

## 2.4.1 (2026-05-08)

### Features

* Added DNS management to Network settings, including DHCP/manual modes, effective DNS display, network details, IPv4/IPv6 server validation, and persistent udhcpc hook support
* Added a configurable server `host` option for binding NanoKVM to a specific listen address (thanks to [@allmazz](https://github.com/allmazz))
* Added French keyboard layout support and language options (thanks to [@ilyesAj](https://github.com/ilyesAj))

### Bug Fixes

* Hardened HID recovery and cleanup by adding non-blocking HID writes, bounded reopen retries, stale event draining, and release reports after write failures
* Fixed the `kvm_vision` project name and build output message in the SG2002 build script (thanks to [@Voranto](https://github.com/Voranto))

### UI Improvements

* Moved TLS and Wi-Fi settings into the Network settings section
* Optimized the Settings scrollbar style

### Localization

* Updated Korean translations (thanks to [@kmw0410](https://github.com/kmw0410))
* Synchronized translations of other languages according to English

### Security

* Upgraded vulnerable web dependencies

## 2.4.0 (2026-04-10)

### Features

* **Introduced [PicoClaw](https://github.com/sipeed/picoclaw) support** — an AI-powered remote desktop assistant for NanoKVM. PicoClaw seamlessly integrates a lightweight AI agent with NanoKVM's underlying hardware capabilities. Key highlights include:
  * **Zero-Agent Architecture:** Operates entirely through HDMI video capture (vision) and USB HID emulation (keyboard/mouse). No SSH access, network connection to the host, or OS-level software installation is required.
  * **Natural Language Control:** Features a built-in chat interface allowing users to issue complex instructions in plain text.
  * **Autonomous GUI Operation:** The AI agent can autonomously observe the remote host's screen, understand UI elements, reason about the task, and execute operations mimicking human behavior.
  * **Installation Note:** PicoClaw is not built into the NanoKVM device or firmware. Install it separately when needed.

### Bug Fixes

* Added a default subnet mask for static IP configurations
* Fixed an issue where the IP address would occasionally not display

## 2.3.6 (2026-03-12)

### Features

* Implemented AP password authentication for the WiFi configuration page
* Added Korean and Japanese virtual keyboard layouts (thanks to [@klim4-bot](https://github.com/klim4-bot))
* Enabled support for 640x480 resolution (thanks to [@Voranto](https://github.com/Voranto))
* Added encryption parameters for OLED distribution network
* Added custom logo function and logo generation tools
* Added update mechanism for tailscale startup script

### Localization

* Updated Japanese translation (thanks to [@tkmsst](https://github.com/tkmsst))

## 2.3.5 (2026-02-28)

### Features

* Implemented login brute-force protection with lockout mechanism

### Bug Fixes

* Improved Tailscale error handling in UI components and refined backend state mapping

### Chores

* Updated server and web dependencies

## 2.3.4 (2026-01-26)

### Features

* Introduced `Leader Key` functionality to bypass local browser shortcut interception

### Bug Fixes

* Fixed an issue where the Right Shift key was not being recognized on Windows system
* Fixed a bug where the menu bar would fail to close correctly

### Localization

* Updated Traditional Chinese translations (thanks to [@j796160836](https://github.com/j796160836))
* Updated Korean translations (thanks to [@kmw0410](https://github.com/kmw0410))

## 2.3.3 (2026-01-16)

### Features

* Added support for setting the display mode of the menu bar

### Bug Fixes

* Fixed a keyboard issue where IME composition events were not handled correctly
* Resolved an issue where the `AltGr` key was not recognized on the Windows system
* Fixed a bug where `Command` key combinations were not fully released on the macOS system
* Fixed input issues with the `IntlBackslash` key on the German virtual keyboard

### Localization

* Updated Korean translations (thanks to [@kmw0410](https://github.com/kmw0410))

### Chores

* Bump react-router-dom from 6.27.0 to 6.30.3
* Updated eslint

## 2.3.2 (2026-01-08)

### Features

* Added support for custom keyboard shortcuts
* Added support for mouse Forward and Back buttons (reboot required)
* Added support for touchscreen mouse operation
* The menu bar now supports auto-hide and drag

### Bug Fixes

* Fixed an issue where the previous IP address was not released after configuring a static IP

### Performance

* Refactored the keyboard to support simultaneous keystrokes and a wider range of international layouts (reboot required)
* Refactored the mouse to improve response latency
* Refactored the WebSocket module to transmit keyboard and mouse data using the standard HID format

## 2.3.1 (2025-12-26)

### Features

* Added support for offline application updates (thanks to [@Alexander-Ger-Reich](https://github.com/Alexander-Ger-Reich))
* Implemented support for uploading ISO images (thanks to [@Alexander-Ger-Reich](https://github.com/Alexander-Ger-Reich))
* Extended clipboard compatibility to support Russian characters (thanks to [@pekishev](https://github.com/pekishev))
* Added configuration options for video scaling
* Added support for configuring mouse scroll wheel direction

### Bug Fixes

* Resolved an issue where custom port may not be accessible
* Fixed a bug where Web Terminal and Serial Terminal may not disconnect when the page is closed

### Security

* Enhanced validation logic on the Wi-Fi configuration page. Requests are now rejected when the device is not in AP mode to prevent unauthorized changes

### Chore

* Added a Docker image environment to support building `libkvm.so` and `NanoKVM-Server` (thanks to [@lowtech-guy](https://github.com/lowtech-guy))
* Optimized the Settings UI

### Localization

* Updated Korean translation (thanks to [@kmw0410](https://github.com/kmw0410))
* Updated Swedish translation (thanks to [@acidflash](https://github.com/acidflash))
* Updated Spanish translation (thanks to [@Deses](https://github.com/Deses))

## 2.3.0 [0e30a26](https://github.com/sipeed/NanoKVM/commit/0e30a26db42cbc08416662b49a88a5d16ad93424) (2025-11-26)

### Features

* Added an EDID editor in the terminal with a built-in 1080P EDID template
* Added German virtual keyboard and German clipboard support (thanks to [@Alexander-Ger-Reich](https://github.com/Alexander-Ger-Reich))
* Resetting the HID also resets the USB hardware
* Added support for deleting ISO images

### Refactoring & Improvements

* Video (H.264 WebRTC): Refactored the module to significantly reduce video latency
* Video (H.264 Direct): Refactored to optimize data transmission and support data parsing even when the page is in the background
* Video (MJPEG): Refactored and ensure correct data length transmission
* Added locking before resetting USB to prevent HID deadlock (thanks to [@scpcom](https://github.com/scpcom))
* Optimized HID writing logic
* Made HDMI toggle state persist across reboots (thanks to [@tpretz](https://github.com/tpretz))
* Enhanced the paste feature with browser clipboard API integration (thanks to [@patrickpilon](https://github.com/patrickpilon))
* Set the inquiry string for the virtual storage device (thanks to [@scpcom](https://github.com/scpcom))
* Hostname now updates `/etc/hosts` simultaneously and takes effect immediately (thanks to [@scpcom](https://github.com/scpcom))
* Improved compatibility for static IP configuration on Windows
* Optimized the web page title update logic
* Added a confirmation dialog when uninstalling Tailscale
* Improved UI for Clipboard, Image Mounting, and settings pages

### Bug Fixes

* Tailscale: Fixed an issue where Tailscale would turn the device into a router
* Tailscale: Fixed an issue where Tailscale would disable IPv6
* Tailscale: Added a swap memory option to prevent Tailscale Out-Of-Memory errors
* Tailscale: Fixed Tailscale accept-dns configuration (thanks to [@lazydba247](https://github.com/lazydba247))
* Fixed an issue where certain modifier keys were not recognized
* Fixed vertical mouse drift when the page is zoomed in or out

### Localization

* Update Korean translation (thanks to [@xenix4845](https://github.com/xenix4845))
* Update Traditional Chinese translation (thanks to [@protonchang](https://github.com/protonchang))
* Add Brazilian Portuguese translation (thanks to [@chiconws](https://github.com/chiconws) and [@Luccas-LF](https://github.com/Luccas-LF))
* Add Swedish translation (thanks to [@acidflash](https://github.com/acidflash))
* Add Catalan translation (thanks to [@Zagur](https://github.com/Zagur))
* Add Turkish translation (thanks to [@Keylem](https://github.com/Keylem))

### Security

* Implemented a delay after failed login attempts to mitigate brute-force attacks
* Upgraded dependencies to fix known security vulnerabilities

## 2.2.9 [c77981c](https://github.com/sipeed/NanoKVM/commit/c77981cc0ceebd8f6705b6c5d8c3cf4edf4f6717) (2025-06-13)

* fix(security): resolve parameter injection in serial port terminal

## 2.2.8 [01e28f1](https://github.com/sipeed/NanoKVM/commit/01e28f10ae8b581d484bb6077ddfe7bbe4e57919) (2025-05-22)

* feat: add AZERTY virtual keyboard Layout (thanks to [@felix068](https://github.com/felix068))
* feat: add support for enabling/disabling HDMI output (PCIe version only) (thanks to [@tpretz](https://github.com/tpretz))
* feat: add support for custom mouse wheel speed
* fix: prevent direct H.264 stream buffer overflow and replay issues
* perf: improve keyboard paste performance (thanks to [@ethanperrine](https://github.com/ethanperrine))
* Localization
  * update Korean translation (thanks to [@kmw0410](https://github.com/kmw0410))
  * update Ukrainian translation (thanks to [@arbdevml](https://github.com/arbdevml))
  * update Russian translation (thanks to [@arbdevml](https://github.com/arbdevml))

## 2.2.7 [e18ec22](https://github.com/sipeed/NanoKVM/commit/e18ec2219d22886529575d1fdaad5c320e05f5b2) (2025-05-08)

* feat: add HTTPS support
* feat: support direct H.264 streaming over HTTP
* Localization
  * update Russian translation (thanks to [polyzium](https://github.com/polyzium))
  * update Dutch translation (thanks to [LeonStraathof](https://github.com/LeonStraathof))
  * update Ukrainian translation (thanks to [click0](https://github.com/click0))
  * update German translation (thanks to [3limin4tor](https://github.com/3limin4tor))

## 2.2.6 [c83dc55](https://github.com/sipeed/NanoKVM/commit/c83dc5565c9dbed22336661a8832edbd93a06d11) (2025-04-17)

* feat: add mouse jiggler to prevent system sleep
* feat: add support for swap memory
* feat: add support for customizing the device hostname
* feat: add support for customizing the web page title
* feat: add support for assigning custom names to Wake-on-LAN MAC addresses
* feat: add confirmation prompts for power operations
* feat: add logo to the login page (thanks to [S33G](https://github.com/S33G))
* fix: fix possible privacy issues with MIC drivers. [Repair Record](https://github.com/sipeed/NanoKVM/commit/f9244b36df090a05cd59ba11ea4fd01e9b638995)
* fix: fix iptables rule that could interfere with SSH connections (thanks to [scpcom](https://github.com/scpcom))
* fix: fix the static IP gateway configuration might not apply correctly (thanks to [xitation](https://github.com/xitation))
* perf: optimized OLED display handling and sleep logic
* perf: improve H.264 streaming reliability by adding a heartbeat mechanism
* perf: set the minimum screen size to 640x480
* perf: add display of both wired and wireless IPv4 addresses in the settings page
* perf: update the Thai language translations (thanks to [ChokunPlayZ](https://github.com/ChokunPlayZ))
* chore: bump axios to 1.8.4
* chore: bump golang.org/x/net to v0.39.0
* chore: bump github.com/golang-jwt/jwt/v5 to to v5.2.2

## 2.2.5 [3286cc2](https://github.com/sipeed/NanoKVM/commit/3286cc2f85a14133d65935cb476c833dcf151459) (2025-03-26)

* fix: server crash caused by MJPEG frame detection error
* feat: add HID-Only mode
* feat: support preview updates
* perf: improve image reading performance by optimizing screen parameters

## 2.2.4 [1bf986d](https://github.com/sipeed/NanoKVM/commit/1bf986d41b34d568c1ffee5df90ce61b6b08456b) (2025-03-21)

* fix: resolve USB initialization issue
* fix: correct abnormal updates in certain models
* perf: add version restrictions for production testing

## 2.2.3 [6ef83cb](https://github.com/sipeed/NanoKVM/commit/6ef83cb22fcd77f721d32c97c85d12f2bfc3035a) (2025-03-21)

* feat: add support for setting H.264 GOP
* fix: resolve deadlock caused by HDMI resolution errors
* perf: merge H.264 SPS and PPS into I-frame
* perf: refactor MJPEG frame detection
* perf: added more configuration options to the serial port terminal (thanks to [@mekaris](https://github.com/mekaris))
* perf: improve the `update-nanokvm.py` script (thanks to [@reishoku](https://github.com/reishoku))
* perf: disable mDNS by default in new products
* perf: update log timestamp to millisecond precision
* chore: bump Go to 1.23
* chore: bump `golang.org/x/net` to v0.37.0

## 2.2.2 [58d5ab2](https://github.com/sipeed/NanoKVM/commit/58d5ab2d37244b1e1a68b925a5c23c324c489ad3) (2025-03-11)

* feat: add watchdog for NanoKVM-Server
* feat: add support for UE chip
* feat: support system reboot
* feat: support enable/disable mDNS
* fix: resolve UE chip cannot start server
* perf: refactor automatic resolution detection
* perf: add output prompt for unsupported resolutions
* perf: add lock to kvmv_read_img
* perf: configurable VENC automatic recycling feature
* perf: add maximum limit for vi
* perf: add tooltips to menu bar (thanks to [@S33G](https://github.com/S33G))
* perf: menu bar is now draggable (thanks to [@forumi0721](https://github.com/forumi0721))
* perf: image list support auto-refresh (thanks to [@forumi0721](https://github.com/forumi0721))
* perf: update translations

## 2.2.1 [b5e48a0](https://github.com/sipeed/NanoKVM/commit/b5e48a07e82df3aedd60442342ae50b95684a697) (2025-02-21)

* fix: mounted image were not being detected correctly
* perf: add support for CD-ROM mode when mounting image (thanks to [@scpcom](https://github.com/scpcom))
* perf: add a loading state during login
* perf: add changelog link in settings
* perf: update translation and cleanup the code (thanks to [@ChokunPlayZ](https://github.com/ChokunPlayZ) [@Stoufiler](https://github.com/Stoufiler) [@polyzium](https://github.com/polyzium) [@Jonher937](https://github.com/Jonher937) [@S33G](https://github.com/S33G))

## 2.2.0 [0dbf8c0](https://github.com/sipeed/NanoKVM/commit/0dbf8c007f2d0183d0f0601c3da6d3c3fccd8b31) (2025-02-17)

NanoKVM [Image v1.4.0](https://github.com/sipeed/NanoKVM/releases/tag/v1.4.0) has been released!

> Please refer to the [wiki](https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/system/introduction.html) for more details about the image and application.

* fix: improve password update notification logic (thanks to [@li20034](https://github.com/li20034))
* perf: increase update wait time to 10s (from 6s)
* perf: update Korean translation (thanks to [@forumi0721](https://github.com/forumi0721))
* perf: update Traditional Chinese translation (thanks to [@protonchang](https://github.com/protonchang))
* refactor: update `libkvm.so` and `libkvm_mmf.so` libraries

## 2.1.6 [6eb4a4e](https://github.com/sipeed/NanoKVM/commit/6eb4a4ea6254f465a47f9881d13934c686649061) (2025-02-14)

* feat: support downloading image from online URL (thanks to [@Itxaka](https://github.com/Itxaka))
* feat: add keyboard shortcut `Ctrl+Alt+Del` (thanks to [@CaffeeLake](https://github.com/CaffeeLake))
* fix: fix the CSRF issue
* perf: add an option to configure custom ICE servers (thanks to [@VMFortress](https://github.com/VMFortress))
* perf: removed unnecessary modifications to DNS configuration
* perf: add an SSH enable/disable toggle in the web UI
* perf: add a Tailscale enable/disable toggle in the web UI
* perf: download Tailscale installation package from the official source
* perf: automatic enable/disable GOMEMLIMIT on tailscale start/stop
* perf: add JWT configuration
  * secretKey: customize secret key. If empty, generated a random 64-byte secret key by default
  * refreshTokenDuration: customize token expiration time
  * revokeTokensOnLogout: invalidate all JWT tokens on logout
* perf: implement secure password storage using bcrypt hashing
* perf: implement integrity checks for online updates
* refactor: refactor HDMI module and remove the dependency `libmaixcam_lib.so`
* refactor: web terminal use pty instead of SSH
* refactor: move Tailscale APIs from the `network` module to the `extensions` module

## 2.1.5 [85f6447](https://github.com/sipeed/NanoKVM/commit/85f6447a16cc2591c6459b7d3dfda4d4cb75e98c) (2025-01-14)

* feat: add HDMI reset for NanoKVM-PCIe
* fix: remove unnecessary lock acquisition during HID reset
* refactor: refactor Tailscale

## 2.1.4 [d7ca7c4](https://github.com/sipeed/NanoKVM/commit/d7ca7c453d821ad099bf79b463969419041279cb) (2025-01-10)

* feat: support configuring OLED sleep settings
* feat: support setting the `GOMEMLIMIT` environment variable
* fix: fix Wi-Fi configuration
* perf: password changes now update both the web user and the system root user
* perf: add MAC address verification for Wake-on-LAN
* refactor: a lot update to web UI
* refactor: refactor Tailscale

## 2.1.3 [26078fe](https://github.com/sipeed/NanoKVM/commit/26078fe46e43d4543d7b09901b4992e4fbe4f01f) (2024-12-27)

* feat: add API to retrieve Wi-Fi information
* fix: fix keyboard modifier keys
* fix: update keyboard and mouse HID codes
* fix: update hardware version information

## 2.1.2 [5a39562](https://github.com/sipeed/NanoKVM/commit/5a39562f2d32695933f4e7e86866136236cc9903) (2024-12-04)

* feat: add hardware version to configuration
* feat: add Wi-Fi configuration support for NanoKVM-PCIe
* perf: update web UI
* chore: add dependency libraries

## 2.1.1 [74a303b](https://github.com/sipeed/NanoKVM/commit/74a303bd5cbb58f9d8ddd81abaaf4919dbbfb71b) （2024-11-06）

* feat: support h264
