## 如果需要自己编译 kvm_system 请按以下步骤完成编译

1. `kvm_system`工程在[MaixCDK](https://github.com/sipeed/MaixCDK) 框架下编译。编译前，请保证`MaixCDK`环境已正确配置，配置教程点击[这里](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md)
2. 修改 `./build` 中 `MAIXCDK_PATH` 和 `NanoKVM_PATH`的路径
3. 执行 `./build kvm_system` 编译 kvm_system 
4. 使用 `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` 拷贝入 NanoKVM 测试
5. 使用 `./build add_to_kvmapp` 可以将可执行文件放入 `/kvmapp` 安装包内
6. 使用 `./build clean` 可以清除 kvm_system 的编译
