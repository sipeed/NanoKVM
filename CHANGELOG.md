## 2.2.5 [3286cc2](https://github.com/sipeed/NanoKVM/commit/3286cc2f85a14133d65935cb476c833dcf151459) (2025-03-26)

fix: server crash caused by MJPEG frame detection error
feat: add HID-Only mode
feat: support preview updates
perf: improve image reading performance by optimizing screen parameters

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
