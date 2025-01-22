# NanoKVM

<div align="center">

![](https://wiki.sipeed.com/hardware/assets/NanoKVM/introduce/NanoKVM_3.png)

<h3>
    <a href="https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html"> クイックスタート </a> |
    <a href="https://cn.dl.sipeed.com/shareURL/KVM/nanoKVM"> ハードウェア </a>
</h3>

[English](./README.md) | [中文](./README_ZH.md) | 日本語

</div>

> Your NanoKVM Power by RISC-V !
> 使用中に問題や提案がある場合は、ここで issue を提出するか、[MaixHub Discussion](https://maixhub.com/discussion/nanokvm) でお知らせください。

## オープンソース & 貢献 & 出荷

スターが2Kに近づいています！10月中旬にバックエンドのソースコードを整理してオープンソース化します！（また、10.1前のすべての予約注文が出荷される時期でもあります）

### 10.18 更新

10.8にバックエンドコードをオープンソース化しました。すぐにPRを提出してくれたCivilに感謝します。最新のNanoKVM-PCIeを報酬として提供します！
10月中旬のバッチはテストとパッケージングを開始しており、10.1前のほとんどの注文は次週と次々週に出荷されます。
10.1以降、アリエクスプレスの出荷日は12月に変更されました。これは保守的な納期です。10月の注文は11.15〜12.15の間に発送される予定です。

## 紹介

Lichee NanoKVMは、LicheeRV NanoをベースにしたIP-KVM製品で、LicheeRV Nanoの極小サイズと強力な機能を継承しています。
Lichee NanoKVMは2つのバージョンがあります：
NanoKVM Liteは基本構成で、一定のDIY能力を持つ個人ユーザーや大量のニーズを持つ企業ユーザーに適しています。
NanoKVM Fullは完全版で、洗練されたケースと完全なアクセサリーを備え、起動時にすぐに使用できるシステムミラーカードが内蔵されており、個人ユーザーに推奨されます。

![](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_1.jpg)

## 技術仕様

| 製品 | NanoKVM (Lite) | NanoKVM (Full) | PiKVM V4 |
| --- | --- | --- | --- |
| 計算ユニット | LicheeRV Nano(RISCV) | LicheeRV Nano(RISCV) | CM4 (ARM) |
| 解像度 | 1080P @ 60fps | 1080P @ 60fps | 1080P @ 60fps |
| ビデオエンコーディング | MJPEG, H264(開発中) | MJPEG, H264(開発中) | MJPEG, H264 |
| ビデオ遅延 | 90～230ms | 90～230ms | 100～230ms |
| UEFI/BIOS | ✓ | ✓ | ✓ |
| 仮想HID | ✓ | ✓ | ✓ |
| 仮想CD-ROM | ✓ | ✓ | ✓ |
| IPMI | ✓ | ✓ | ✓ |
| Wake-on-LAN | ✓ | ✓ | ✓ |
| ETH | 100M/10M | 100M/10M | 1000M/100M/10M |
| ATX電源制御 | なし、ユーザーが自分で接続 | USBインターフェースIO制御ボード | RJ-45インターフェースIO制御ボード |
| OLED | なし、ユーザーが自分で接続 | 128x64 0.96" 白 | 128x32 0.91" 白 |
| UART | 2 | 2 | 1 |
| TFカード | なし | ✓ | ✓ |
| 拡張 | なし | PoE | WiFi/LTE |
| 消費電力 | 0.2A@5V | 0.2A@5V | ピーク2.6A@5V |
| 電源入力 | PC USBで給電可能 | PC USBまたは補助電源 | DC 5V 3A電源が必要 |
| 冷却 | 静音ファンレス | 静音ファンレス | ファン冷却 |
| サイズ | 23x37x15mm <br> ～1/30 PiKVM V4サイズ | 40x36x36mm <br/> ～1/7 PiKVM V4サイズ | 120x68x44mm |

![](https://wiki.sipeed.com/hardware/zh/kvm/assets/NanoKVM/1_intro/NanoKVM_2.jpg)

## ハードウェアプラットフォーム NanoKVM

NanoKVMはSipeed [LicheeRV Nano](https://wiki.sipeed.com/hardware/zh/lichee/RV_Nano/1_intro.html)に基づいており、仕様、回路図、寸法図は[こちら](http://cn.dl.sipeed.com/shareURL/LICHEE/LicheeRV_Nano)で確認できます。

NanoKVM LiteはLicheeRV NanoとHDMItoCSIボードで構成され、NanoKVM FULLはNanoKVM LiteにNanoKVM-A/Bボードとシェルを追加しています。HDMItoCSIボードはHDMI信号を変換するために使用されます。NanoKVM-AにはOLED、ATX制御出力（USB Type-Cインターフェース）、補助電源供給およびATX電源オン/オフおよびリセットボタンが含まれています。NanoKVM-Bは一端がAボードに接続され、他端がコンピュータのATXピンに接続され、コンピュータの電源をリモートで制御します。

NanoKVMイメージはLicheeRV Nano SDKおよびMaixCDKに基づいて構築されており、LicheeRV Nanoを使用する資料と互換性があります。逆に、KVMソフトウェアはLicheeRV Nanoや他のSG2002製品では使用できません。LicheeRV NanoやMaixCamでHDMI入力アプリケーションを構築したい場合は、技術サポートを受けるためにお問い合わせください。

注：SG2002の256MBメモリのうち、現在105MBがマルチメディアサブシステムに割り当てられており、NanoKVMはビデオ画像の取得と処理にこのメモリを使用します。

+ [NanoKVM-A 回路図](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_RV_Nano_KVM_A_30111.pdf)
+ [NanoKVM-B 回路図](https://cn.dl.sipeed.com/fileList/KVM/nanoKVM/HDK/02_Schematic/SCH_HDMI_MIPI_31011.pdf)
+ [NanoKVM イメージダウンロード](https://github.com/sipeed/NanoKVM/releases/tag/NanoKVM)

## 購入方法

* [Aliexpress(グローバル、米国とロシアを除く)](https://www.aliexpress.com/item/1005007369816019.html)
* [淘宝](https://item.taobao.com/item.htm?id=811206560480)
* [予約注文 (淘宝とアリエクスプレスがサポートされていない国)](https://sipeed.com/nanokvm)

## コミュニティ

* [MaixHub Discussion](https://maixhub.com/discussion/nanokvm)
* QQグループ: 703230713
