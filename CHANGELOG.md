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
