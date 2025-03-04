# NanoKVM Support Instructions

## Environment Preparation
1. NanoKVM-Lite/Full/PCIe is based on the SG2002 as the main control chip. The projects in the support section are compiled under the [MaixCDK](https://github.com/sipeed/MaixCDK) framework. Before compiling, please ensure that the `MaixCDK` environment is correctly configured. For configuration instructions, click [here](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md).

## kvm_system Compilation Instructions

> The `kvm_system` is responsible for monitoring the NanoKVM system status, system updates, screen key drivers, and a few system functions, compiled with MaixCDK.

1. Before compiling, please ensure that the above-mentioned `MaixCDK` environment is correctly configured.
2. Modify the paths of `MAIXCDK_PATH` and `NanoKVM_PATH` in `./build`.
3. Execute `./build kvm_system` to compile `kvm_system`.
4. Use `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` to copy it to NanoKVM for testing.
5. Use `./build add_to_kvmapp` to place the executable file into the `/kvmapp` installation package.
6. Use `./build kvm_system clean` to clean the compilation of `kvm_system`.

## kvm_vision Compilation Instructions

> `kvm_vision` refers to the image acquisition and encoding subsystem of NanoKVM, compiled with MaixCDK to produce dynamic libraries for Go calls. Use `kvm_vision_test` to compile and test the dynamic library.

1. Before compiling, please ensure that the above-mentioned `MaixCDK` environment is correctly configured.
2. Modify the paths of `MAIXCDK_PATH` and `NanoKVM_PATH` in `./build`.
3. Execute `./build kvm_vision` to compile `kvm_vision_test`.
4. You can test the dynamic libraries in `kvm_vision_test/dist/kvm_vision_test_release/dl_lib/`.
5. Use `./build add_to_kvmapp` to place the dynamic libraries into the `/kvmapp` installation package.
6. Use `./build kvm_vision clean` to clean the compilation of `kvm_vision`.