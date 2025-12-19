# NanoKVM

<div align="center">
  <br>
  <img src="https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png" alt="NanoKVM" style="margin: 20px 0;">
  <h3>
    <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html">🚀 Quick Start</a>
     |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM">🛠️ Hardware Details</a>
     |
    <a href="https://github.com/sipeed/NanoKVM/releases/latest">💾 Firmware Releases</a>
  </h3>
  <br>
</div>

> For the recent discussion regarding the **built-in microphone**, please check [Issue #693](https://github.com/sipeed/NanoKVM/issues/693).

## 🌟 What is NanoKVM?

NanoKVM is a series of compact, open-source IP-KVM devices based on the LicheeRV Nano (RISC-V). NanoKVM allows you to remotely access and control computers as if you were sitting right in front of them – perfect for managing servers, embedded systems, or any headless machine.

## 📦 Product Family

We offer several NanoKVM versions to suit your needs:

* **NanoKVM-Cube Lite:** A barebones kit for DIY enthusiasts and enterprise users requiring bulk deployment.
* **NanoKVM-Cube Full:** A complete package featuring a sleek case, accessories, and a pre-flashed system SD card. Ready to use out-of-the-box; ideal for individual users.
* **NanoKVM-PCIe:** A unique form factor with a PCIe bracket for internal chassis mounting. It draws power directly from the PCIe slot and supports optional WiFi and PoE functions.
* **[NanoKVM-Pro:](https://github.com/sipeed/NanoKVM-Pro)** Based on popular demand, the **Pro version** delivers significant performance upgrades:
  * **Resolution:** Upgraded from 1080P to stunning **4K@30fps / 2K@60fps**.
  * **Network:** Blazing fast **1Gbps Ethernet + PoE + WiFi 6** ((upgraded from 100Mbps).
  * **Latency:** Encoder accelerated latency reduced from 100-150ms to **50-100ms**.

<div align="center">
  <img src="https://cdn.sipeed.com/public/nanokvm-products.jpg" alt="NanoKVM Product Family" width="80%" style="margin: 20px 0;">
</div>

> If you are looking for a USB-based KVM solution, check out [NanoKVM-USB](https://github.com/sipeed/NanoKVM-USB).

## 🛠️ Technical Specifications

| Feature            | NanoKVM-Pro                           | NanoKVM (Cube/PCIe)               | GxxKVM                             | JxxKVM                              |
|------------------- |-------------------------------------- |---------------------------------- |----------------------------------- |------------------------------------ |
| Core               | AX630C 2xA53 1.2G                     | SG2002 1xC906 1.0G                | RV1126 4xA7 1.5G                   | RV1106 1xA7 1.2G                    |
| Memory & Storage   | 1G LPDDR4X + 32G eMMC                 | 256M DDR3 + 32G microSD           | 1G DDR3 + 8G eMMc                  | 256M DDR3 + 16G eMMC                |
| System             | NanoKVM / PiKVM                       | NanoKVM                           | GxxKVM                             | JxxKVM                              |
| Resolution         | 4K@30fps / 2K@60fps                   | 1080P@60fps                       | 4K@30fps / 2K@60fps                | 1080P@60fps                         |
| HDMI Loopout       | 4K loopout                            | x                                 | x                                  | x                                   |
| Video Encoding     | MJPEG / H.264 / H.265                 | MJPEG / H264                      | MJPEG / H264                       | MJPEG / H264                        |
| Audio Transmit     | ✓                                     | x                                 | ✓                                  | x                                   |
| UEFI / BIOS        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Emulated USB Keyboard & Mouse | ✓                          | ✓                                 | ✓                                  | ✓                                   |
| Emulated USB ISO   | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| IPMI               | ✓                                     | ✓                                 | ✓                                  | x                                   |
| Wake-on-LAN        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Web Terminal       | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Serial Terminal    | 2 channels                            | 2 channels                        | x                                  | 1 channel                           |
| Custom Scripts     | ✓                                     | ✓                                 | x                                  | x                                   |
| Storage            | 32G eMMC 300MB/s                      | 32G MicroSD 12MB/s                | 8G eMMC 120MB/s                    | 8G eMMC 60MB/s                      |
| Ethernet           | 1000M                                 | 100M                              | 1000M                              | 100M                                |
| PoE                | Optional                              | Optional                          | x                                  | x                                   |
| WiFi               | Optional WiFi6                        | Optional WiFi6                    | x                                  | x                                   |
| ATX Power Control  | ✓                                     | ✓                                 | Extra $15                          | Extra $10                           |
| Display            | 1.47" 320x172 LCD / 0.96" 128x64 OLED | 0.96" 128x64 OLED                 | -                                  | 1.68" 280x240                       |
| More Features      | Sync LED Strip / Smart Assistant      | -                                 | -                                  | -                                   |
| Power Consumption  | 0.6A@5V                               | 0.2A@5V                           | 0.4A@5V                            | 0.2A@5V                             |
| Power Input        | USB-C or PoE                          | USB-C                             | USB-C                              | USB-C                               |
| Dimensions         | 65x65x26mm                            | 40x36x36mm                        | 80x60x17.5mm                       | 60x43x(24~31)mm                     |

## 📂 Project Structure

``` shell
├── kvmapp          # APP update package
│   ├── jpg_stream  # Legacy support for direct updates from older versions
│   ├── kvm_new_app # Triggers components for kvm_system updates
│   ├── kvm_system  # Core KVM application
│   ├── server      # Front-end and back-end integration
│   └── system      # Essential system components
├── web             # NanoKVM Front-end (UI)
├── server          # NanoKVM Back-end (Service)
├── support         # Auxiliary modules (Image subsystem, status, updates, OLED, HID, etc.)
├── ...
```

## 🔩 Hardware Platform (NanoKVM Cube/PCIe)

NanoKVM is based on Sipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html). You can find specifications, schematics, and dimensional drawings in the [download station](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano).

The NanoKVM Lite is constructed by the LicheeRV Nano and HDMItoCSI board, and the NanoKVM FULL adds the NanoKVM-A/B board and shell to the NanoKVM Lite. The HDMItoCSI board is used to convert the HDMI signal; NanoKVM-A, including OLED, ATX control output (USB Type-C interface), auxiliary power supply and ATX power on/off and reset buttons; The NanoKVM-B is connected to the plate at one end and the computer at the other end is connected to the computer ATX-Pin, which is used to remotely control the power of the computer.

The NanoKVM image is built on LicheeRV Nano SDK and MaixCDK, and is compatible with materials that use the LicheeRV Nano, opposite the KVM software cannot be used with the LicheeRV Nano or other SG2002 products. If you would like to build an HDMI input application on LicheeRV Nano or MaixCam, please contact us for technical support.

Note: Out of the 256MB memory in SG2002, 158MB is currently allocated for the multimedia subsystem, which NanoKVM will use for video image acquisition and processing.

* [NanoKVM-A Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
* [NanoKVM-B Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_B_30131.pdf)
* [NanoKVM-PCIe Schematic](https://cn.dl.sipeed.com/fileList/KVM/KVM_PCIE/HDK/01_Schematic/SCH_nanoKVM_PCIE_3105D_2025-12-19.pdf)
* [NanoKVM img](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

<div align="center">
  <img src="https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg" alt="NanoKVM PCB Pinout" width="80%" style="margin: 20px 0;">
</div>

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

Please keep your pull requests small and focused to facilitate easier review and merging.

> 🎁 **Contributors who submit high-quality Pull Requests may receive a NanoKVM Cube, PCIe, or Pro as a token of our appreciation!**

## 🛒 Where to Buy

* [Aliexpress(global except USA&Russia)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [Preorder (any other country that not support in Aliexpress or Taobao)](https://sipeed.com/nanokvm)

## 💬 Community & Support

* [Discord](https://discord.gg/V4sAZ9XWpN)
* QQ group: 703230713
* email: [support@sipeed.com](mailto:support@sipeed.com)
* [FAQ](https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/faq.html)

## 📜 License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.
