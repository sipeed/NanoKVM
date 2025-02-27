## If you want to compile kvm_system yourself, please follow the steps below: 

1. Clone the MaixCDK repository: `git clone https://github.com/sipeed/MaixCDK.git`
2. Improve the Compilation Environment, refer to [here](https://github.com/sipeed/MaixCDK/tree/main/docs/doc_zh#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
3. Copy `./kvm_system` to `~/MaixCDK` and open it in terminal
4. Execute `maixcdk build` and Select `maixcam` to complete the compilation
5. Replace `/kvmapp/kvm_system/kvm_system` in the NanoKVM system with `dist/kvm_system_release/kvm_system`
6. Execute: `/etc/init.d/S95nanokvm restart` on NanoKVM
