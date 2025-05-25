NanoKVM
======

<div align="center">

![](https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png)

<h3>
    <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html"> 빠른 시작 </a>
    |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM"> 하드웨어 </a>
</h3>

[English](./README.md) | [中文](./README_ZH.md) | [日本語](./README_JA.md) | 한국어

</div>

> NanoKVM은 [RISC-V](https://en.wikipedia.org/wiki/RISC-V)에 의해 구동됩니다!
> 이슈나 제안이 있는 경우, 여기에서 이슈를 생성하거나 [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)에서 말해주세요.

## 소개

Lichee NanoKVM은 LicheeRV Nano를 기반으로 하는 IP-KVM 제품이며, LicheeRV Nano의 극단적인 크기와 강력한 기능을 상속받습니다.

Lichee NanoKVM은 세 가지 버전으로 제공됩니다:

* NanoKVM-Cube Lite는 일정 수준의 DIY 능력을 갖춘 개인 사용자나 대량 수요가 있는 기업 사용자에게 적합한 구성입니다.

* NanoKVM-Cube Full은 정교한 케이스와 액세서리, 부팅 시 바로 사용할 수 있는 시스템 미러 카드가 포함된 전체 구성으로, 개인 사용자에게 권장됩니다.

* NanoKVM-PCle는 케이스 내부에 고정할 수 있는 PCIe 브래킷이 내장된 새로운 형태입니다. NanoKVM-PCIe는 NanoKVM Cube를 기반으로 WiFi와 PoE 기능을 선택적으로 추가할 수 있으며, 자체 PCIe 슬롯을 통해 메인보드에서 전원을 공급받을 수 있습니다. 또한 유선 연결(ETH)이 더 안정적이여서 전문적인 요구를 충족할 수 있습니다.

<div align="center">

![NanoKVM-Cube](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_1.jpg)

![NanoKVM-PCIe](https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM-PCIe.png)

</div>

> 보안에 대해 우려하는 사용자는 이 이슈([#301](https://github.com/sipeed/NanoKVM/issues/301))를 읽어볼 수 있습니다. 모든 보안 관련 우려에 대한 설명을 확인할 수 있습니다.
> GitHub는 개방적이고 투명한 플랫폼으로서, 이론바 "백도어" 문제에 대해 논의할 수 있는 공간을 제공합니다. 오픈 소스는 제품을 더 안전하게 만듭니다!

## 프로젝트 구조

``` shell
├── kvmapp          # APP 업데이트 패키지
│   ├── jpg_stream  # 매우 오래된 버전에서도 직접 업데이트 가능하도록 호환됨
│   ├── kvm_new_app # kvm_system 업데이트에 필요한 구성 요소를 트리거함
│   ├── kvm_system  # kvm_system 애플리케이션
│   ├── server      # NanoKVM 프론트 엔드와 백엔드 애플리케이션
│   └── system      # 필요한 시스템 구성 요소
├── web             # NanoKVM 프론트 엔드
├── server          # NanoKVM 백엔드
├── support         # 보조 기능 (이미지 하위 시스템, 시스템 상태, 시스템 업데이트, 화면, 키, 기타.)
│   ├── sg2002      # NanoKVM-Lite/Full/PCIe
│   └── h618        # NanoKVM-Pro
├── ...
```

## 기술 사양

| 제품           | NanoKVM (Lite)                        | NanoKVM (Full)                    | PiKVM V4                           |
|------------------- |-------------------------------------- |---------------------------------- |----------------------------------- |
| 컴퓨팅 단위      | LicheeRV Nano(RISCV)                  | LicheeRV Nano(RISCV)              | CM4 (ARM)                          |
| 해상도         | 1080P @ 60fps                         | 1080P @ 60fps                     | 1080P @ 60fps                      |
| 비디오 인코딩     | MJPEG, H264                           | MJPEG, H264                       | MJPEG, H264                        |
| 비디오 지연 시간        | 90～230ms                             | 90～230ms                         | 100～230ms                         |
| UEFI/BIOS          | ✓                                     | ✓                                 | ✓                                  |
| 가상 HID        | ✓                                     | ✓                                 | ✓                                  |
| 가상 CD-ROM     | ✓                                     | ✓                                 | ✓                                  |
| IPMI               | ✓                                     | ✓                                 | ✓                                  |
| Wake-on-LAN        | ✓                                     | ✓                                 | ✓                                  |
| 이더넷                | 100M/10M                              | 100M/10M                          | 1000M/100M/10M                     |
| ATX 전원 조작  | 없음，사용자 소유 장비 연결 가능  | USB 인터페이스 IO 제어 보드    | RJ-45 인터페이스 IO 제어 보드   |
| OLED               | 없음，사용자 소유 장비 연결 가능  | 128x64 0.96" 하얀색                | 128x32 0.91" 하얀색                 |
| UART               | 2                                     | 2                                 | 1                                  |
| TF 카드            | 없음                                  | ✓                                 | ✓                                  |
| 확장          | 없음                                  | PoE                               | WiFi/LTE                           |
| 전력 소모  | 0.2A@5V                               | 0.2A@5V                           | Peak 2.6A@5V                       |
| 전원 입력        | PC USB can be powered                 | PC USB 또는 보조 전원 공급 장치  | DC 5V 3A 전원 공급 장치  |
| 냉각            | 무소음 팬리스                        | 무소음 팬리스                    | 팬 냉각                        |
| 크기               | 23x37x15mm   ～1/30 PiKVM V4 크기     | 40x36x36mm   ～1/7 PiKVM V4 크기  | 120x68x44mm                        |

![NanoKVM PCB Pinout](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg)

## NanoKVM 하드웨어 플랫폼

NanoKVM은 Sipped [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html)의 기반으로 하며, 사양, 도식, 치수 도면은 [여기](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano)에 있습니다.

NanoKVM Lite는 LicheeRV Nano와 HDMItoCSI 보드로 구성되어 있으며, NanoKVM FULL은 NanoKVM Lite에 NasnoKVM-A/B 보드와 케이스를 추가한 구성입니다. HDMItoCSI 보드는 HDMI 신호를 변환하는 역할을 하고 NanoKVM-A는 OLED, ATX 전원 출력 (USB Type-C 인터페이스), 보조 전원 공급 장치, ATX 전원 켜기/끄기 및 리셋 버튼을 포함합니다. NanoKVM-B는 한쪽 끝이 컴퓨터와 연결되고 다른 한쪽 끝은 컴퓨터의 ATX 핀에 연결되어 컴퓨터의 전원을 원격으로 제어하는 데 사용됩니다.

NanoKVM 이미지는 LicheeRV Nano SDK와 MaixCDK로 구축되었으며, LicheeRV Nano를 사용하는 자재와 호환됩니다. 반면에 KVM 소프트웨어는 LicheeRV Nano나 다른 SG2002 제품과 함께 사용할 수 없습니다. 만약 LicheeRV Nano나 MaixCam에서 HDMI 입력 애플리케이션을 구축하고 싶으시다면, 기술 지원에 문의해 주세요.

참고: SG2002의 256MB 메모리 중에 158MB는 멀티미디어 하위 폴더에 할당되어 있으며, NanoKVM은 비디오 이미지 획득과 처리에 사용됩니다.

* [NanoKVM-A 도식](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
* [NanoKVM-B 도식](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_B_30131.pdf)
* [NanoKVM 이미지](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

## 로드맵

**개선 사항:**

* [x] HDMI 모듈 재구성과 libmaixcam_lib.so 종속성 삭제
* [x] 기본적으로 SSH를 비활성화 하고 웹 UI에 활성화/비활성화 토글을 추가
* [x] 기본적으로 Tailscale을 비활성화 하고 웹 UI에 활성화/비활성화 토글을 추가
* [x] 구성 파일에 JWT 구성 옵션 추가
* [x] bcrypt로 안전한 비밀번호 저장 

**배포:**

* [x] GitHub에 애플리케이션 배포
* [x] 온라인 업데이트에 대한 무결성 검사 구현
* [ ] 오프라인 업데이트 지원

**버그 수정:**

* [x] DNS 문제 해결
* [x] CSRF 취약점

**기능**

* [ ] [79](https://github.com/sipeed/NanoKVM/issues/79) Zerotier 지원
* [ ] [99](https://github.com/sipeed/NanoKVM/issues/99) WireGuard 지원
* [ ] [249](https://github.com/sipeed/NanoKVM/issues/249) 마우스 흔들기 추가

## 기여

1. 레포지토리를 포크하세요
2. 기능 브랜치를 만드세요
3. 변경한 것을 커밋하세요
4. 브랜치로 푸시하세요
5. 풀 리퀘스트를 생성하세요

NanoKVM에 관심을 가져주셔서 감사합니다!

작고 핵심적인 내용으로 풀 리퀘스트를 유지해 주세요. 이렇게 하면 검토하고 병합하기가 쉬워집니다.

> 고품질 풀 리퀘스트를 기여한 개발자들은 감사의 표시로 NanoKVM Cube, PCIe 또는 Pro를 받게 됩니다.

## 구매처

* [Aliexpress(미국&러시아를 제외한 전 세계)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [사전 주문 (Aliexpress나 Taobao를 지원하지 않는 국가)](https://sipeed.com/nanokvm)

## 커뮤니티

* [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)
* QQ 그룹: 703230713

## 라이센스

이 프로젝트는 GPL-3.0 라이센스에 따라 라이센스가 부여됩니다. 자세한 사항은 LICENSE 파일을 참조하세요.
