# Building the native video libraries

The Docker builder pins MaixCDK to
`30f4b8b7e3f66ded9cfa64fb081b46e30bc27248` and uses its Xuantie GCC 10.2
musl toolchain for SG2002. Rebuild an older builder after the pin changes.

The release build refreshes the SDK components, cleans both native projects,
and links the Go server against the newly staged libraries. Standalone server
builds also support the checked-in `server/dl_lib` copies. These must be updated
together when the native implementation changes:

```sh
cd support/sg2002
./build update_lib
./build kvm_vision clean
./build kvm_vision
./build kvm_vision add_to_kvmapp
cd ../..
cp kvmapp/server/dl_lib/libkvm.so server/dl_lib/
cp kvmapp/server/dl_lib/libkvm_mmf.so server/dl_lib/
bash scripts/verify-video-libs.sh server/dl_lib
```

The ABI check requires native VI frame acquisition and H26x/JPEG submission in
`libkvm.so`, their providers in `libkvm_mmf.so`, and all other imported MMF
symbols. It rejects stale and mixed library pairs. Passing it establishes
symbol compatibility, not hardware runtime stability.

Go's BoringCrypto backend only supports Linux amd64/arm64. The RISC-V server
uses Go's crypto implementation; setting `GOEXPERIMENT=boringcrypto` does not
enable that backend on SG2002.
