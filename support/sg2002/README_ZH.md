# NanoKVM support 说明

## 环境准备

NanoKVM-Lite/Full/PCIe 以 SG2002 为主控芯片。系统程序和视频示例借助
[MaixCDK](https://github.com/sipeed/MaixCDK) 编译，`libkvm.so` 和 `libkvm_mmf.so`
也可通过 CMake 独立编译。后者使用该目录中的配置和 sensor 适配代码，结合 Sophgo SDK。
使用下面的 MaixCDK 工作流时，请先配置并激活
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
6. `make release-build` 会用刚放入 `kvmapp/server/dl_lib/` 的两份库链接 Go 服务，打包时也从这里取库。单独运行 `make app` 时使用 `server/dl_lib/`，修改视频库接口后需同步更新该目录中的两份预编译库。编译步骤见[服务器说明](../../server/README_ZH.md#编译部署)。
7. 执行 `./build kvm_vision clean` 清理构建产物，包括上述库的编译和安装目录。

采集库要求匹配的 `lontium_hdmi` 内核驱动及 `/proc/lontium/status`。采集等待内核确认的
CSI 时序，不再读取宽高配置文件、`hdmi_mode` 或自行访问 LT 寄存器。HDMI 开关通过
`/proc/lontium/power` 控制；升级时两份视频库及匹配头文件需要一起更新。
CSI pad 初始化位于板级 `S15kvmhwd`，不由 sensor 的 probe 执行。

启动顺序为 `S00kmod` 加载 Sophgo 模块、`S15kvmhwd` 初始化板级引脚、
`S16lontium` 加载 `/mnt/system/ko/lontium_hdmi.ko`，最后 `S95nanokvm` 启动应用。
S15 不再扫描 HDMI 地址或操作 GPIO451；S95 要求 `/proc/lontium/status` 存在，
无 HDMI 信号及手动关闭仍允许启动。停止应用不会卸载管理驱动或改变 HDMI 开关。

从镜像 1.4.3、应用 2.4.3 起，整包升级逐个比较 `system/firmware/` 中的 `boot.sd`
和两个内核模块，只替换内容有变化的文件。`boot.sd` 有变化时，先删除 FAT 上的旧文件，
再直接写入完整新版。固件或 S15、S16 有变化时，迁移成功后会重启设备，让内核模块和
板级初始化生效。升级也会清理旧 `hdmi_version`、`hdmi_mode` 及独立测试加载脚本。

OLED 在自己的刷新线程中读取一份完整内核快照，同时更新 HDMI 图标和分辨率，
不再用 VI 帧率判断输入是否存在，也不读取宽高文件。显示尺寸使用已确认的 CSI 输出，
不将独立 HDMI 输入尺寸替换成 CSI 尺寸或反过来替换。按当前要求保留原有文字和布局，
无效尺寸仍显示原来的空白/`--`；关闭、无信号、未锁定和读取失败只在内部区分。
屏幕上的 `FPS` 继续表示编码输出帧率。已删除 `main/lib/hdmi/` 的旧寄存器代码及其全局 I²C
对象，OLED 本身的 I²C 总线保留。

独立编译时，先用 `additional/kvm_mmf/cmake/riscv64-musl.cmake` 构建并安装
`additional/kvm_mmf`，设置 `SOPHGO_MIDDLEWARE_DIR`、`SOPHGO_RUNTIME_DIR` 和
`CMAKE_INSTALL_PREFIX`。再用同一工具链构建 `additional/kvm`，将
`KVM_MMF_PREFIX` 指向前一步的安装目录。
