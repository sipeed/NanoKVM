NanoKVM
======

<div align="center">

![](https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png)

<h3>
    <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html">🚀 빠른 시작</a>
     |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM">🛠️ 하드웨어 정보</a>
     |
    <a href="https://github.com/sipeed/NanoKVM/releases/latest">💾 펌웨어 릴리즈</a>
</h3>

[English](./README.md) | [中文](./README_ZH.md) | [日本語](./README_JA.md) | 한국어

</div>

## 🌟 NanoKVM이 무엇인가요?

NanoKVM은 소형 오픈 소스 IP-KVM 장치 시리즈입니다. LicheeRV Nano(RISC-V)를 기반으로 구축된 NanoKVM을 사용하면 마치 컴퓨터 앞에 바로 앉아있는 것처럼 원격으로 컴퓨터에 접근하고 제어할 수 있어 서버, 임베디드 시스템 또는 모든 헤드리스 머신을 관리하는 데 완벽합니다.

## 📦 제품군

다양한 요구를 충족할 수 있도록 여러 NanoKVM 버전을 제공합니다:

* **NanoKVM-Cube Lite:** DIY 사용자 및 대량 배포가 필요한 기업용을 위한 최소 구성 키트입니다.
* **NanoKVM-Cube Full:** 세련된 케이스, 액세서리, 사전 플래시된 시스템 SD 카드가 포함된 완전 구성 패키지입니다. 개봉 후 즉시 사용할 수 있어 개인 사용자에게 적합합니다.
* **NanoKVM-PCIe:** 독특한 폼팩터로, PCIe 브래킷을 통해 섀시 내부에 장착하며, 전원인 PCIe 슬롯에서 직접 공급받습니다. 선택적으로 WiFi와 PoE 기능을 추가할 수 있습니다.

### 🚀 NanoKVM-Pro: 4K를 위한 파워 머신

대중적인 수요를 기반으로, NanoKVM을 **NanoKVM-Pro**로 업그레이드했습니다:

* **해상도 업그레이드:** 1080P에서 놀라운 **4K@30fps / 2K@60fps**까지.
* **네트워크 업그레이드:** 초고속 **GbE + PoE + WiFi 6** (100M 이더넷 대비 향상).
* **지연 시간 업그레이드:** 인코더 가속 지연시간이 100-150ms에서 **50-100ms**로 감소.

> NanoKVM-Pro가 예약 판매 중입니다! [제품 세부 정보는 여기를 클릭하세요](https://sipeed.com/nanokvm/pro).

<div align="center">

![NanoKVM Product Family](https://cdn.sipeed.com/public/nanokvm-products.jpg)

</div>

## 🛠️ 기술 사양

| 제품            | NanoKVM-Pro                           | NanoKVM (Cube/PCIe)               | GxxKVM                             | JxxKVM                              |
|------------------- |-------------------------------------- |---------------------------------- |----------------------------------- |------------------------------------ |
| 코어               | AX631 2xA53 1.5G                      | SG2002 1xC906 1.0G                | RV1126 4xA7 1.5G                   | RV1106 1xA7 1.2G                    |
| 메모리 & 저장 공간   | 1G LPDDR4X + 32G eMMC                 | 256M DDR3 + 32G microSD           | 1G DDR3 + 8G eMMc                  | 256M DDR3 + 16G eMMC                |
| 시스템             | NanoKVM / PiKVM                       | NanoKVM                           | GxxKVM                             | JxxKVM                              |
| 해상도         | 4K@30fps / 2K@60fps                   | 1080P@60fps                       | 4K@30fps / 2K@60fps                | 1080P@60fps                         |
| HDMI 루프아웃       | 4K 루프아웃                            | x                                 | x                                  | x                                   |
| 영상 인코딩     | MJPEG / H.264 / H.265                 | MJPEG / H264                      | MJPEG / H264                       | MJPEG / H264                        |
| 오디오 전송     | ✓                                     | x                                 | ✓                                  | x                                   |
| UEFI / BIOS        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| USB 키보드 & 마우스 에뮬레이션 | ✓                          | ✓                                 | ✓                                  | ✓                                   |
| USB ISO 에뮬레이션   | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| IPMI               | ✓                                     | ✓                                 | ✓                                  | x                                   |
| Wake-on-LAN        | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 웹 터미널       | ✓                                     | ✓                                 | ✓                                  | ✓                                   |
| 시리얼 터미널    | 3 채널                            | 2 채널                        | x                                  | 1 채널                           |
| 사용자 정의 스크립트     | ✓                                     | ✓                                 | x                                  | x                                   |
| 저장 공간            | 32G eMMC 300MB/s                      | 32G MicroSD 12MB/s                | 8G eMMC 120MB/s                    | 8G eMMC 60MB/s                      |
| 이더넷           | 1000M                                 | 100M                              | 1000M                              | 100M                                |
| PoE                | 옵션                              | 옵션                          | x                                  | x                                   |
| WiFi               | WiFi6 옵션                        | WiFi6 옵션                   | x                                  | x                                   |
| ATX 전원 조작  | ✓                                     | ✓                                  | $15 추가                          | $10 추가                           |
| 디스플레이            | 1.47" 320x172 LCD / 0.96" 128x64 OLED | 0.96" 128x64 OLED                 | -                                  | 1.68" 280x240                       |
| 기타 기능      | LED 줄 동기화 / 스마트 어시스턴트      | -                                 | -                                  | -                                   |
| 전력 소비량  | 0.4A@5V                               | 0.2A@5V                           | 0.4A@5V                            | 0.2A@5V                             |
| 전원 입력        | USB-C 또는 PoE                          | USB-C                             | USB-C                              | USB-C                               |
| 크기         | 65x65x26mm                            | 40x36x36mm                        | 80x60x17.5mm                       | 60x43x(24~31)mm                     |
| 가격              | ~~$79~~ $69 ATX / ~~$89~~ $79 Desk    | $25 Lite / $50 Full(with ATX)     | ATX 미사용 시 $89 / ATX 사용 시 $102         | ATX 미사용 시 $69 / ATX 사용 시 $79           |

## 📂 프로젝트 구조

``` shell
├── kvmapp          # APP 업데이트 패키지
│   ├── jpg_stream  # 매우 오래된 버전에서도 직접 업데이트 가능하도록 호환됨
│   ├── kvm_new_app # kvm_system 업데이트에 필요한 구성 요소를 트리거함
│   ├── kvm_system  # kvm_system 애플리케이션
│   ├── server      # NanoKVM 프론트 엔드와 백엔드 애플리케이션
│   └── system      # 필요한 시스템 구성 요소
├── web             # NanoKVM 프론트엔드
├── server          # NanoKVM 백엔드
├── support         # 보조 기능 (이미지 하위 시스템, 시스템 상태, 시스템 업데이트, 화면, 키, 기타.)
│   ├── sg2002      # NanoKVM-Lite/Full/PCIe
│   └── h618        # NanoKVM-Pro
├── ...
```

## 🔩 하드웨어 플랫폼 (NanoKVM Cube/PCIe)

NanoKVM은 Sipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html)를 기반으로 하며，[여기](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano)에서 사양, 도식, 치수, 도면은 여기에서 찾을 수 있습니다.

NanoKVM Lite는 LicheeRV Nano와 HDMItoCSI 보드로 구성되어 있으며, NanoKVM FULL은 NanoKVM Lite에 NasnoKVM-A/B 보드와 케이스를 추가한 구성입니다. HDMItoCSI 보드는 HDMI 신호를 변환하는 역할을 하고 NanoKVM-A는 OLED, ATX 전원 출력 (USB Type-C 인터페이스), 보조 전원 공급 장치, ATX 전원 켜기/끄기 및 리셋 버튼을 포함합니다. NanoKVM-B는 한쪽 끝이 컴퓨터와 연결되고 다른 한쪽 끝은 컴퓨터의 ATX 핀에 연결되어 컴퓨터의 전원을 원격으로 제어하는 데 사용됩니다.

NanoKVM 이미지는 LicheeRV Nano SDK와 MaixCDK로 구축되었으며, LicheeRV Nano를 사용하는 자재와 호환됩니다. 반면에 KVM 소프트웨어는 LicheeRV Nano나 다른 SG2002 제품과 함께 사용할 수 없습니다. 만약 LicheeRV Nano나 MaixCam에서 HDMI 입력 애플리케이션을 구축하고 싶으시다면, 기술 지원에 문의해 주세요.

참고: SG2002의 256MB 메모리 중에 158MB는 멀티미디어 하위 폴더에 할당되어 있으며, NanoKVM은 비디오 이미지 획득과 처리에 사용됩니다.

* [NanoKVM-A 도식](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
* [NanoKVM-B 도식](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_B_30131.pdf)
* [NanoKVM 이미지](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

![NanoKVM PCB Pinout](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg)

## 🤝 기여

여러분의 기여를 환영합니다! 도움을 줄 수 있는 방법은 다음과 같습니다:

1. 레포지토리를 포크하세요
2. 기능 브랜치를 만드세요
3. 변경한 것을 커밋하세요
4. 브랜치로 푸시하세요
5. 풀 리퀘스트를 생성하세요

Please keep your pull requests small and focused to facilitate easier review and merging.

> 🎁 **고품질 풀 리퀘스트를 제출한 기여자는 감사의 표시로 NanoKVM Cube, PCIe, 또는 Pro를 받을 수 있습니다!**

## 🛒 어디서 구매하나요?

* [Aliexpress(미국&러시아를 제외한 전 세계)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [사전 주문 (Aliexpress나 Taobao를 지원하지 않는 국가)](https://sipeed.com/nanokvm)

## 💬 커뮤니티 & 지원

* [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)
* QQ group: 703230713

## 📜 라이센스

이 프로젝트는 GPL-3.0 라이센스에 따라 라이센스가 부여됩니다. 자세한 사항은 LICENSE 파일을 참조하세요.
