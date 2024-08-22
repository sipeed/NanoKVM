NanoKVM
======

<div align="center">

![](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_3.jpg)

<h3>
    <a href="https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html"> Quick Start </a> |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM"> Hardware </a>
</h3>

English | [中文](./README_ZH.md)

</div>

> Your NanoKVM Power by RISC-V !
> If you have any issues or suggestions, creating issue here, or tell us with [MaixHub Discussion](https://maixhub.com/discussion/nanokvm).


## Introduction

Lichee NanoKVM is an IP-KVM product based on LicheeRV Nano, inheriting the extreme size and powerful features of LicheeRV Nano.
The Lichee NanoKVM is available in two versions:
NanoKVM Lite is a basic configuration that is suitable for individual users with certain DIY capabilities and enterprise users with bulk requirements.
The NanoKVM Full is a full version with a sophisticated case and complete accessories, as well as a built-in system mirror card that is ready to use at boot, and is recommended for individual users.

![](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_1.jpg)

## Tech Specs

| Products | NanoKVM (Lite) | NanoKVM (Full) | PiKVM V4 |
| --- | --- | --- | --- |
| Compute Units   | LicheeRV Nano(RISCV) | LicheeRV Nano(RISCV) | CM4 (ARM) |
| Resolution       | 1080P @ 60fps | 1080P @ 60fps | 1080P @ 60fps |
| Video encoding  | MJPEG, H264(developing) | MJPEG, H264(developing) | MJPEG, H264 |
| Video delay     | 90～230ms | 90～230ms | 100～230ms |
| UEFI/BIOS               | ✓ | ✓ | ✓ |
| Virtual HID | ✓ | ✓ | ✓ |
| Virtual CD-ROM | ✓ | ✓ | ✓ |
| IPMI      | ✓ | ✓ | ✓ |
| Wake-on-LAN | ✓ | ✓ | ✓ |
| ETH | 100M/10M | 100M/10M | 1000M/100M/10M |
| ATX power control | None，Users can connect by their own | USB interface IO control board | RJ-45 interface IO control board |
| OLED | None，Users can connect by their own | 128x64 0.96" white | 128x32 0.91" white |
| UART | 2 | 2 | 1 |
| TF Card | None | ✓ | ✓ |
| Expansion | None | WiFi or PoE | WiFi/LTE |
| Power consumption | 0.2A@5V | 0.2A@5V | Peak 2.6A@5V |
| Power input | PC USB can be powered | PC USB or auxiliary power supply | DC 5V 3A power supply is required |
| Cooling | Silent fanless | Silent fanless | Fan cooling |
| Size | 23x37x15mm <br> ～1/30 PiKVM V4 size | 40x36x36mm <br/> ～1/7 PiKVM V4 size | 120x68x44mm |

![](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg)

## Hardware platform NanoKVM

NanoKVM is based on Sipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html)，you can find specifications, schematics, and dimensional drawings [here](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano).

The NanoKVM Lite is constructed by the LicheeRV Nano and HDMItoCSI board, and the NanoKVM FULL adds the NanoKVM-A/B board and shell to the NanoKVM Lite. The HDMItoCSI board is used to convert the HDMI signal; NanoKVM-A, including OLED, ATX control output (USB Type-C interface), auxiliary power supply and ATX power on/off and reset buttons; The NanoKVM-B is connected to the plate at one end and the computer at the other end is connected to the computer ATX-Pin, which is used to remotely control the power of the computer.

The NanoKVM image is built on LicheeRV Nano SDK and MaixCDK, and is compatible with materials that use the LicheeRV Nano, opposite the KVM software cannot be used with the LicheeRV Nano or other SG2002 products. If you would like to build an HDMI input application on LicheeRV Nano or MaixCam, please contact us for technical support.

+ [NanoKVM-A Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
+ [NanoKVM-B Schematic](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_HDMI_MIPI_31011.pdf)
+ [NanoKVM img](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

## Where to buy

* [Aliexpress(global except USA&Russia)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [Preorder (anyother country that not support in Aliexpress or Taobao)](https://sipeed.com/nanokvm)


## Community

* [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)
* QQ group: 703230713



