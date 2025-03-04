# NanoKVM support 说明

## 环境准备
1. NanoKVM-Lite/Full/PCIe 以SG2002为主控芯片，support 部分的工程在[MaixCDK](https://github.com/sipeed/MaixCDK) 框架下编译。编译前，请保证`MaixCDK`环境已正确配置，配置教程点击[这里](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md)

## kvm_system 编译说明

> `kvm_system` 负责 NanoKVM 系统状态监控、系统更新、屏幕按键驱动和少部分的系统功能，借助 MaixCDK 编译

1. 编译前，请保证上述 1.`MaixCDK`环境已正确配置
2. 修改 `./build` 中 `MAIXCDK_PATH` 和 `NanoKVM_PATH`的路径
3. 执行 `./build kvm_system` 编译 kvm_system 
4. 使用 `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` 拷贝入 NanoKVM 测试
5. 使用 `./build add_to_kvmapp` 可以将可执行文件放入 `/kvmapp` 安装包内
6. 使用 `./build kvm_system clean` 可以清除 kvm_system 的编译

## kvm_vision 编译说明

> `kvm_vision` 是 NanoKVM 图像获取编码子系统的统称，使用MaixCDK编译出动态库供Go调用，使用 `kvm_vision_test` 编译和测试动态库

1. 编译前，请保证上述 1.`MaixCDK`环境已正确配置
2. 修改 `./build` 中 `MAIXCDK_PATH` 和 `NanoKVM_PATH`的路径
3. 执行 `./build kvm_vision` 编译 kvm_vision_test 
4. 可使用 `kvm_vision_test/dist/kvm_vision_test_release/dl_lib/` 中的动态库测试
5. 使用 `./build add_to_kvmapp` 可以将动态库放入 `/kvmapp` 安装包内
6. 使用 `./build kvm_vision clean` 可以清除 kvm_system 的编译
