# NanoKVM Support Instructions

## Environment Preparation

NanoKVM-Lite/Full/PCIe uses the SG2002. The system daemon and `libkvm.so` wrapper
build with [MaixCDK](https://github.com/sipeed/MaixCDK); `libkvm_mmf.so` builds
separately with CMake using the Sophgo sources in that checkout. Configure and
activate the [MaixCDK environment](https://github.com/sipeed/MaixCDK/blob/main/docs/doc_zh/README.md)
and add the RISC-V musl toolchain to `PATH`. Run the commands below from
`support/sg2002/`. Alternatively, `make vision` at the repository root builds
the video libraries in Docker. `make app` builds the server using the prebuilt
libraries in `server/dl_lib/`.

## kvm_system Compilation Instructions

> The `kvm_system` is responsible for monitoring the NanoKVM system status, system updates, screen key drivers, and a few system functions, compiled with MaixCDK.

1. Before compiling, please ensure that the above-mentioned `MaixCDK` environment is correctly configured.
2. Modify the paths of `MAIXCDK_PATH` and `NanoKVM_PATH` in `./build`.
3. Execute `./build kvm_system` to compile `kvm_system`.
4. Use `scp ./kvm_system/dist/kvm_system_release/kvm_system root@192.168.x.x:/kvmapp/kvm_system` to copy it to NanoKVM for testing.
5. Use `./build kvm_system add_to_kvmapp` to stage the executable in the repository's `kvmapp/` directory.
6. Use `./build kvm_system clean` to clean the compilation of `kvm_system`.

## kvm_vision Compilation Instructions

> `kvm_vision` builds `libkvm_mmf.so`, then the MaixCDK wrapper `libkvm.so` and the `kvm_vision_test` example.

1. Before compiling, please ensure that the above-mentioned `MaixCDK` environment is correctly configured.
2. Modify the paths of `MAIXCDK_PATH` and `NanoKVM_PATH` in `./build`.
3. Execute `./build kvm_vision` to build both libraries and the example. The library build and install directories are `kvm_vision_test/build/kvm_mmf-build/` and `kvm_vision_test/build/kvm_mmf-install/`.
4. The resulting libraries are in `kvm_vision_test/dist/kvm_vision_test_release/dl_lib/`.
5. Run `./build kvm_vision add_to_kvmapp` to stage them in the repository's `kvmapp/server/dl_lib/`.
6. After changing the video library interfaces, update both prebuilt files `server/dl_lib/libkvm.so` and `server/dl_lib/libkvm_mmf.so` from the same build. Server compilation uses these files directly; see the [server build instructions](../../server/README.md#compile--deploy).
7. Use `./build kvm_vision clean` to remove the build outputs, including both library build and install directories.
