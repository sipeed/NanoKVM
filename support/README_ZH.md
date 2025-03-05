# NanoKVM support 说明

`/support`包含NanoKVM辅助性的功能，如图像子系统、系统状态监控、系统更新、屏幕按键驱动和少部分的系统功能

当前 NanoKVM 根据主控芯片的不同分为两个版本：SG2002（包含NanoKVM-Lite/Full/PCIe）和H618（包括NanoKVM-Pro），不同的芯片有差异较大的工程和编译环境，为做区分，将它们分别存放在`/support/sg2002`和`/support/h618`
