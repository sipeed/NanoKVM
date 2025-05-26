NanoKVM
======

<div align="center">

![](https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png)

<h3>
    <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html">🚀 快速开始</a>
     |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM">🛠️ 硬件信息</a>
     |
    <a href="https://github.com/sipeed/NanoKVM/releases/latest">💾 固件发布</a>
</h3>

[English](./README.md) | 中文 | [日本語](./README_JA.md)

</div>

## 🌟 NanoKVM 是什么？

NanoKVM 是一系列紧凑型开源 IP-KVM 设备。NanoKVM 基于 LicheeRV Nano (RISC-V) 构建，让您能够身临其境般的远程访问和控制计算机，是管理服务器、嵌入式系统或任何无头设备的理想之选。

## 📦 产品系列

我们提供多种 NanoKVM 版本以满足您的需求：

* **NanoKVM-Cube Lite**：为 DIY 爱好者和需要批量部署的企业用户提供的准系统套件。
* **NanoKVM-Cube Full**：包含外壳、配件以及预装系统 SD 卡的完整套装。开箱即用，非常适合个人用户。
* **NanoKVM-PCIe**：独特的外形设计，配备 PCIe 支架，可安装在机箱内部，并直接从 PCIe 插槽供电。可选配 WiFi 和 PoE 功能。

### 🚀 NanoKVM-Pro

根据大众的需求，我们将 NanoKVM 升级到了 **NanoKVM-Pro**：

* **分辨率升级**：从 1080P 升级到 **4K@30fps / 2K@60fps**。
* **网络升级**：从百兆网口升级到超快的 **GbE + WiFi 6**。
* **延迟升级**：编码器加速延迟从 100-150 毫秒减少到 **50-100 毫秒**。

> NanoKVM-Pro 现已开启预售！[点击此处查看产品详情](https://sipeed.com/nanokvm/pro)。

<div align="center">

![NanoKVM Product Family](https://cdn.sipeed.com/public/nanokvm-products.jpg)

</div>

## 🛠️ 技术规格

| 产品            | NanoKVM-Pro                           | NanoKVM (Cube/PCIe)               | GxxKVM                             | JxxKVM                              |
|------------------- |-------------------------------------- |---------------------------------- |----------------------------------- |------------------------------------ |
| 核心               | AX631 2xA53 1.5G                      | SG2002 1xC906 1.0G                | RV1126 4xA7 1.5G                   | RV1106 1xA7 1.2G                    |
| 内存&存储          | 1G LPDDR4X + 32G eMMC                 | 256M DDR3 + 32G microSD           | 1G DDR3 + 8G eMMc                  | 256M DDR3 + 16G eMMC                |
| 系统               | NanoKVM / PiKVM                       | NanoKVM                           | GxxKVM                             | JxxKVM                              |
| 分辨率             | 4K@30fps / 2K@60fps                   | 1080P@60fps                       | 4K@30fps / 2K@60fps                | 1080P@60fps                         |
| HDMI 环出          | 4K 环出                               | x                                 | x                                  | x                                   |
| 视频编码           | MJPEG / H.264 / H.265                 | MJPEG / H264                      | MJPEG / H264                       | MJPEG / H264                        |
| 音频输出           | ✓                                     | x                                 | ✓                                  | x                                   |
| UEFI / BIOS        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 模拟 USB 键鼠      | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 模拟 USB ISO       | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| IPMI               | ✓                                     | ✓                                 | ✓                                  | x                                   |
| 局域网唤醒         | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 网页终端           | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 串口终端           | 3 channels                            | 2 channels                        | x                                  | 1 channel                           |
| 用户脚本           | ✓                                     | ✓                                 | x                                  | x                                   |
| 存储               | 32G eMMC 300MB/s                      | 32G MicroSD 12MB/s                | 8G eMMC 120MB/s                    | 8G eMMC 60MB/s                      |
| 网口               | 1000M                                 | 100M                              | 1000M                              | 100M                                |
| PoE                | 可选                                  | 可选                              | x                                  | x                                   |
| WiFi               | 可选 WiFi6                            | 可选 WiFi6                        | x                                  | x                                   |
| ATX 电源控制       | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 显示屏             | 1.47" 320x172 LCD / 0.96" 128x64 OLED | 0.96" 128x64 OLED                 | -                                  | 1.68" 280x240                       |
| 特色功能           | LED 同步灯带 / 智能助手               | -                                 | -                                  | -                                   |
| 功耗               | 0.4A@5V                               | 0.2A@5V                           | 0.4A@5V                            | 0.2A@5V                             |
| 电源输入           | USB-C or PoE                          | USB-C                             | USB-C                              | USB-C                               |
| 尺寸               | 65x65x26mm                            | 40x36x36mm                        | 80x60x17.5mm                       | 60x43x(24~31)mm                     |
| 价格               | ~~$79~~ $69 ATX / ~~$89~~ $79 Desk    | $25 Lite / $50 Full(带ATX)        | $89 无ATX / $102 带ATX             | $69 无ATX / $79 带ATX               |

## 📂 项目结构

``` shell
├── kvmapp          # APP更新包
│   ├── jpg_stream  # 兼容从非常老的版本中直接更新
│   ├── kvm_new_app # 触发 kvm_system 更新必要组件
│   ├── kvm_system  # kvm_system 应用
│   ├── server      # NanoKVM 前后端应用
│   └── system      # 必要系统组件
├── server          # NanoKVM 后端
├── support         # 辅助功能(图像子系统、系统状态、系统更新、屏幕、按键……)
│   ├── sg2002      # NanoKVM-Lite/Full/PCIe
│   └── h618        # NanoKVM-Pro
├── web             # NanoKVM 前端
├── LICENSE
├── README_JA.md
├── README.md
├── README_ZH.md
└── CHANGELOG.md
```

## 🔩 硬件平台(NanoKVM Cube/PCIe)

NanoKVM 基于 Sipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html) 核心板搭建，这部分硬件的规格书、原理图、尺寸图等均可在这里找到：[点击这里](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano)

NanoKVM Lite 由 LicheeRV Nano E 和 HDMItoCSI 小板构成，NanoKVM FULL 在 NanoKVM Lite 基础上增加 NanoKVM-A/B 板和外壳。HDMItoCSI板用于转换HDMI信号；NanoKVM-A 包含 OLED、ATX控制输出（TypeC接口形式）、辅助供电（TypeC接口）以及ATX开关机、复位按键；NanoKVM-B 一端连接A板，一端连接电脑ATX针脚，用于电脑的远程开关机。

NanoKVM 镜像在LicheeRV Nano SDK 和 MaixCDK 基础上构建，可以兼容使用 LicheeRV Nano 的资料，反之LicheeRV Nano 或其他 SG2002 产品无法使用KVM软件。如果您想在 LicheeRV Nano 或 MaixCam 上构建 HDMI输入相关应用，请与我们联系，以获得技术支持。

注: SG2002的256MB内存中, 目前划分105MB用于多媒体子系统, NanoKVM会在视频图像采集和处理中使用这部分内存.

* [NanoKVM-A 原理图](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
* [NanoKVM-B 原理图](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_HDMI_MIPI_31011.pdf)
* [NanoKVM 镜像下载](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

![NanoKVM PCB Pinout](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg)

## 🤝 贡献代码

我们十分欢迎任何人来贡献代码！您可以通过以下方式提供帮助：

1. Fork 本仓库.
2. 创建一个分支.
3. 提交你的代码.
4. 推送代码到分支.
5. 创建一个PR.

请保持你的 PR 尽量简单且集中，以便于更轻松地审查和合并。

> 🎁 **提交高质量 PR 的贡献者可能会收到 NanoKVM Cube、PCIe 或 Pro 作为感谢礼物！**

## 🛒 购买渠道

* [Aliexpress(全球，除了美国和俄罗斯)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [Preorder (其它不支持淘宝和速卖通的国家)](https://sipeed.com/nanokvm)

## 💬 社区

* [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)
* QQ group: 703230713
