# NanoKVM EDID 维护工具

此工具使用配套内核的 `/proc/lontium/status` 和 `chip` 获取型号，不读取旧
`/etc/kvm/hdmi_version`、扫描 I2C 或读取芯片 ID。工具和 `S95nanokvm`、`S16lontium`
必须配套更新；执行读写前会检查维护协议版本。需要 root 权限。

```sh
nanokvm_update_edid --check                  # 仅检查内核状态和已绑定设备
nanokvm_update_edid --check /path/edid.bin   # 同时检查输入文件，不访问芯片寄存器
nanokvm_update_edid --read /path/saved.bin   # 读取并保存 256 字节 EDID
nanokvm_update_edid /path/new.bin           # 擦除 EDID 区，写入 256 字节并读回校验
nanokvm_update_edid --recover               # 恢复一次未完成的驱动/服务交接
```

支持 LT6911C、LT6911UXC、LT6911D 和 LT7911EXS。LT7911EXS 使用固件的
`0x060000` 用户 EDID 区，读写协议参考 AX620E 的 LT7911EXC 驱动。

实际 EDID 访问要求接收器当前开启、无接收器错误，并具备内核复位控制。SPI 维护会影响
固件执行，结束后需要重启接收器；无复位控制的设备在任何停机或解绑前直接拒绝。
`power_control=1` 只表示设备树声明了 GPIO，不能证明复位线实际连接。未接线的板子仍可能
需要手动断电；工具的成功表示 Flash 写入/读回及状态恢复通过，不证明 HDMI 源已重新读取 EDID。

维护顺序：

1. 持有 `/run/nanokvm-service.lock`，记录两个应用各自是否运行。
2. 保存 `/run/nanokvm-hdmi-maintenance`，停止采集和 OLED 服务，等待退出。
3. 解绑实际工作的 I2C client，再使用普通 `I2C_SLAVE` 访问；不用强制访问。
4. `--read` 读取 EDID 区的前 256 字节，校验后保存到新文件。写入命令直接擦除 EDID 区，
   写入新的 256 字节 EDID，再读回这 256 字节与输入逐字节比较。重复提交相同 EDID 也会擦写。
5. 退出 SPI/寄存器访问、关闭 I2C，重新绑定驱动；通过 `/proc/lontium/power` 请求复位，
   再重新识别并等待有效或无信号状态。用户态不直接操作 GPIO。
6. 使用原来的临时程序恢复先前运行的应用；原先停止的应用不会自动启动。不执行应用迁移。
   全部完成后清除维护标记。

C/UXC 的 4 KiB 擦除区始于 `0x018000`，D 的始于 `0x008000`。每次写入后，扇区剩余
3840 字节均为擦除态 `0xFF`，其中包括 LT6911D 在 `0x008100` 处的 32 字节版本字段。
LT7911EXS 用 `0xD8` 擦除 `0x060000–0x06FFFF` 的 64 KiB 块，再写入起始的 256 字节。
写入前可以用 `--read` 备份现有 EDID。EXS 用户区为空时，读取会返回 EDID 校验错误。

操作失败仍尝试清理和恢复。恢复失败时保留维护标记，普通应用启动、重启以及驱动装卸会
拒绝执行；修复硬件连接或完成必要的断电后可使用 `--recover`。`--recover` 只恢复驱动和
先前运行的服务。擦写或校验失败时，Flash 内容需要另行恢复。

SIGINT、SIGTERM、SIGHUP 会记录中断请求。进入擦写后延迟到读回和清理结束，避免在
擦除后主动退出；完成恢复后返回相应的中断退出码。SIGKILL 或崩溃会留下运行期标记，
下一次操作需显式恢复。擦写时突然断电可能导致 EDID 不完整。
维护锁约束本项目的工具和启动脚本，不约束外部直接执行的 I2C 工具。

构建：

```sh
make -C tools/nanokvm_update_edid CROSS_COMPILE=riscv64-unknown-linux-musl-
```

使用标准 RV64GC / LP64D，静态链接 C++ 和 GCC 运行库；只依赖设备的 musl libc。
发布构建脚本会编译此工具，打包路径保持 `/kvmapp/system/tool/nanokvm_update_edid`。

设备端先运行 `--check`，实际读写会中断采集并请求接收器复位。
