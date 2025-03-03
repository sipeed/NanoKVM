## If you need to compile `kvm_system` yourself, please follow the steps below:

1. The `kvm_system` project is compiled under the [MaixCDK](https://github.com/sipeed/MaixCDK) framework. Before compiling, please ensure that the `MaixCDK` environment is correctly configured. For the configuration tutorial, click [here](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md).
2. Modify the paths of `MAIXCDK_PATH` and `NanoKVM_PATH` in `./build`.
3. Execute `./build kvm_system` to compile `kvm_system`.
4. Use `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` to copy it into NanoKVM for testing.
5. Use `./build add_to_kvmapp` to place the executable files into the `/kvmapp` installation package.
6. Use `./build clean` to clean up the compilation of `kvm_system`.
