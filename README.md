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

## 🌟 What is NanoKVM?

NanoKVM is a series of compact, open-source IP-KVM devices based on the LicheeRV Nano (RISC-V). It lets you remotely access and control computers as if you were sitting in front of them, making it useful for servers, embedded systems, and other headless machines.

## 📦 Product Family

Choose the NanoKVM model that best fits your deployment:

- **NanoKVM-Cube Lite:** A barebones kit for DIY users and bulk deployments.
- **NanoKVM-Cube Full:** A ready-to-use kit with a case, accessories, and a pre-flashed system SD card.
- **NanoKVM-PCIe:** A PCIe-bracket form factor for internal chassis mounting. It draws power from the PCIe slot and supports optional Wi-Fi and PoE.
- **[NanoKVM-Pro](https://github.com/sipeed/NanoKVM-Pro):** A higher-performance version with major upgrades:
  - **Resolution:** Up to **4K@30fps / 2K@60fps**.
  - **Network:** **1Gbps Ethernet + PoE + Wi-Fi 6**, upgraded from 100Mbps Ethernet.
  - **Latency:** Hardware-accelerated encoding reduces latency from 100-150ms to **50-100ms**.

<div align="center">
  <img src="https://cdn.sipeed.com/public/nanokvm-products-v2.jpg" alt="NanoKVM Product Family" width="100%" style="margin: 20px 0;">
</div>

> If you are looking for a USB-based KVM solution, check out [NanoKVM-USB](https://github.com/sipeed/NanoKVM-USB).

## 🛠️ Technical Specifications

| Feature            | NanoKVM-Pro                           | NanoKVM (Cube/PCIe)               | GxxKVM                             | JxxKVM                              |
| ------------------ | ------------------------------------- | --------------------------------- | ---------------------------------- | ----------------------------------- |
| Core               | AX630C 2xA53 1.2G                     | SG2002 1xC906 1.0G                | RV1126 4xA7 1.5G                   | RV1106 1xA7 1.2G                    |
| Memory & Storage   | 1G LPDDR4X + 32G eMMC                 | 256M DDR3 + 32G microSD           | 1G DDR3 + 8G eMMC                  | 256M DDR3 + 16G eMMC                |
| System             | NanoKVM / PiKVM                       | NanoKVM                           | GxxKVM                             | JxxKVM                              |
| Resolution         | 4K@30fps / 2K@60fps                   | 1080P@60fps                       | 4K@30fps / 2K@60fps                | 1080P@60fps                         |
| HDMI Loopout       | 4K loopout                            | —                                 | —                                  | —                                   |
| Video Encoding     | MJPEG / H.264 / H.265                 | MJPEG / H.264                     | MJPEG / H.264                      | MJPEG / H.264                       |
| Audio Transmit     | ✓                                     | —                                 | ✓                                  | —                                   |
| UEFI / BIOS        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Emulated USB Keyboard & Mouse | ✓                          | ✓                                 | ✓                                  | ✓                                   |
| Emulated USB ISO   | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| IPMI               | ✓                                     | ✓                                 | ✓                                  | —                                   |
| Wake-on-LAN        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Web Terminal       | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| Serial Terminal    | 2 channels                            | 2 channels                        | —                                  | 1 channel                           |
| Custom Scripts     | ✓                                     | ✓                                 | —                                  | —                                   |
| Storage            | 32G eMMC 300MB/s                      | 32G MicroSD 12MB/s                | 8G eMMC 120MB/s                    | 8G eMMC 60MB/s                      |
| Ethernet           | 1000M                                 | 100M                              | 1000M                              | 100M                                |
| PoE                | Optional                              | Optional                          | —                                  | —                                   |
| Wi-Fi              | Optional Wi-Fi 6                      | Optional Wi-Fi 6                  | —                                  | —                                   |
| ATX Power Control  | ✓                                     | ✓                                 | Extra $15                          | Extra $10                           |
| Display            | 1.47" 320x172 LCD / 0.96" 128x64 OLED | 0.96" 128x64 OLED                 | —                                  | 1.68" 280x240                       |
| More Features      | Sync LED Strip / Smart Assistant      | —                                 | —                                  | —                                   |
| Power Consumption  | 0.6A@5V                               | 0.2A@5V                           | 0.4A@5V                            | 0.2A@5V                             |
| Power Input        | USB-C or PoE                          | USB-C                             | USB-C                              | USB-C                               |
| Dimensions         | 65x65x26mm                            | 40x36x36mm                        | 80x60x17.5mm                       | 60x43x(24~31)mm                     |

## 📂 Project Structure

```text
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

## 💻 Development

Start with the guide that matches the part of NanoKVM you want to work on:

- **System support modules:** Build and update the low-level hardware support components in [support/sg2002/README.md](support/sg2002/README.md).
- **Backend service:** Set up, build, and understand the Go service in [server/README.md](server/README.md).
- **Frontend UI:** Develop, lint, and build the React interface in [web/README.md](web/README.md).

> Backend compilation and runtime validation require the target toolchain or a NanoKVM device. See the module-specific guides above for the latest development workflow.

## 🔩 Hardware Platform (NanoKVM Cube/PCIe)

NanoKVM is based on Sipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html). You can find specifications, schematics, and dimensional drawings in the [download station](https://dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano).

The NanoKVM Cube/PCIe hardware is built from these components:

- **NanoKVM Lite:** LicheeRV Nano plus the HDMI-to-CSI board.
- **NanoKVM Full:** NanoKVM Lite plus the NanoKVM-A/B boards and enclosure.
- **HDMI-to-CSI board:** Converts the HDMI input signal.
- **NanoKVM-A board:** Provides OLED, ATX control output through USB-C, auxiliary power, and physical ATX power/reset buttons.
- **NanoKVM-B board:** Connects NanoKVM-A to the host computer's ATX pins for remote power control.

The NanoKVM image is built with the LicheeRV Nano SDK and MaixCDK. It is intended for NanoKVM hardware and is not a general-purpose KVM software package for other LicheeRV Nano or SG2002 products. If you want to build an HDMI input application on LicheeRV Nano or MaixCam, please contact us for technical support.

> Note: Of the 256MB memory on SG2002, 158MB is currently allocated to the multimedia subsystem for video capture and processing.

- [NanoKVM-A Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
- [NanoKVM-B Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_B_30131.pdf)
- [NanoKVM-PCIe Schematic](https://cn.dl.sipeed.com/fileList/KVM/KVM_PCIE/HDK/01_Schematic/SCH_nanoKVM_PCIE_3105D_2025-12-19.pdf)
- [NanoKVM image](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

<div align="center">
  <img src="https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg" alt="NanoKVM PCB Pinout" width="80%" style="margin: 20px 0;">
</div>

## 🤝 Contributing

We welcome contributions. To get started:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

Please keep your pull requests small and focused to facilitate easier review and merging.

> 🎁 **Contributors who submit high-quality Pull Requests may receive a NanoKVM Cube, PCIe, or Pro as a token of our appreciation!**

## 🛒 Where to Buy

- [AliExpress (global, except USA and Russia)](https://www.aliexpress.com/item/1005007369816019.html)
- [Taobao](https://item.taobao.com/item.htm?id=811206560480)
- [Preorder for other regions](https://sipeed.com/nanokvm)

## 💬 Community & Support

- [Discord](https://discord.gg/V4sAZ9XWpN)
- QQ group: 703230713
- Email: [support@sipeed.com](mailto:support@sipeed.com)
- [FAQ](https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/faq.html)

## 📜 License

This project is licensed under the GPL-3.0 License. See [LICENSE](LICENSE) for details.
