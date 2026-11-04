# NanoKVM support 说明

## 环境准备

NanoKVM-Lite/Full/PCIe 以 SG2002 为主控芯片。系统程序和 `libkvm.so` 包装层借助
[MaixCDK](https://github.com/sipeed/MaixCDK) 编译，`libkvm_mmf.so` 使用该目录中的
Sophgo 源码通过 CMake 独立编译。请先配置并激活
[MaixCDK 环境](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md)，
将 RISC-V musl 工具链加入 `PATH`。以下命令在 `support/sg2002/` 下执行。
也可以在仓库根目录执行 `make vision`，通过 Docker 构建视频库。
`make app` 使用 `server/dl_lib/` 中的预编译库构建服务器。

## kvm_system 编译说明

> `kvm_system` 负责 NanoKVM 系统状态监控、系统更新、屏幕按键驱动和少部分的系统功能，借助 MaixCDK 编译

1. 编译前，请保证上述 1.`MaixCDK`环境已正确配置
2. 修改 `./build` 中 `MAIXCDK_PATH` 和 `NanoKVM_PATH`的路径
3. 执行 `./build kvm_system` 编译 kvm_system 
4. 使用 `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` 拷贝入 NanoKVM 测试
5. 使用 `./build kvm_system add_to_kvmapp` 将可执行文件放入仓库的 `kvmapp/` 目录
6. 使用 `./build kvm_system clean` 可以清除 kvm_system 的编译

## kvm_vision 编译说明

> `kvm_vision` 先构建 `libkvm_mmf.so`，再构建 MaixCDK 包装层 `libkvm.so` 和 `kvm_vision_test` 示例程序。

1. 编译前，请保证上述 1.`MaixCDK`环境已正确配置
2. 修改 `./build` 中 `MAIXCDK_PATH` 和 `NanoKVM_PATH`的路径
3. 执行 `./build kvm_vision` 编译两份库和示例程序。库的编译和安装目录分别为 `kvm_vision_test/build/kvm_mmf-build/`、`kvm_vision_test/build/kvm_mmf-install/`。
4. 构建后的动态库位于 `kvm_vision_test/dist/kvm_vision_test_release/dl_lib/`。
5. 执行 `./build kvm_vision add_to_kvmapp`，将库放入仓库的 `kvmapp/server/dl_lib/`。
6. 修改视频库接口后，用同一批构建的两份库更新 `server/dl_lib/libkvm.so` 和 `server/dl_lib/libkvm_mmf.so`。服务器直接使用这些预编译库，编译步骤见[服务器说明](../../server/README_ZH.md#编译部署)。
7. 执行 `./build kvm_vision clean` 清理构建产物，包括上述库的编译和安装目录。
