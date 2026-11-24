# Lontium Go 状态接口

`ReadStatus()` 每次独立打开 `/proc/lontium/status`，读取同一快照到 EOF，按 ABI 1
校验完整字段。解析规则与 `support/sg2002/additional/kvm/include/lontium_hdmi.hpp`
一致：缺字段、重复字段、溢出、非法布尔值、不一致的时序或开关状态均失败，结果清零。
允许未知新增字段，最多读取 4096 字节。此包不访问芯片寄存器或控制电源。

`Status.Input` 是芯片独立报告的 HDMI 输入尺寸；`Status.CSI` 是采集使用的输出时序。
两者不互相补齐，帧率为零表示未知。原始尺寸采用 uint32，不裁剪到采集能力范围。
`VideoSize()` 仅用于适配 uint16 参数，超出表示范围或无有效时序时返回 `0, 0`。
采集范围、对齐和格式由视频库检查；不使用分辨率白名单、默认输入或试探。

Go 后端接口保留原有字段，并增加接收器和采集配置状态：

- 输入分辨率接口：`width` / `height` 是 CSI 输出，增加 `valid` 和 `receiver`。
  接收器正常可读但无信号或关闭时成功返回零尺寸、`valid=false`；读取失败返回非零 `code`，
  清空尺寸和 `receiver`，通过 `readError` 保留错误。
- HDMI 状态接口：`enabled` 是保存的用户开关偏好，空闲休眠不改该配置；`signal` 表示实际
  接收器的有效 CSI 状态。`receiver` 包含实际请求开关、控制能力、信号状态、原始错误及两类时序。
- `capture.state` 表示采集链配置：`ready`、`configuring`、`inactive`、`unsupported`、
  `input-error` 或 `error`。`result` 保留 C 返回值，`receiverSequence` 表示采集线程已经处理的
  内核状态序号。`ready` 要求序号匹配及配置成功，不保证某次编码读取一定有帧。
  每次截图仍处理真实的编码返回值；采集错误不覆盖接收器信号。
- 序号仅在同一次驱动绑定内比较，`updatedNs` 是内核 CLOCK_BOOTTIME，不能作墙钟时间或等待期限。

开关使用匹配视频库的 `/proc/lontium/power` 控制路径，关闭前停止采集，C 的负 errno
传递为 Go error；保存配置或硬件控制失败均返回失败。普通开关失败恢复先前偏好；显式复位
若已成功关闭而重新开启失败，保留开启偏好并报告实际错误，状态接口仍报告真实关闭状态。
启动只应用一次保存的开关状态，不先执行关闭再开启。设备树声明复位脚不证明实际连线，
`receiver.power` 也只代表驱动的请求状态。

截图租约保护空闲关闭；读租约按实际内核状态和配套视频库的配置状态等待，最长 5 秒，
采用调用者更早的期限并支持取消。等待期间不持有 HDMI 管理锁。保留截图串行读取、来源计数的
版本检查，以及首次成功帧的单次刷新机制。MCP 唤醒与读帧共用请求的超时预算（排队后开始）；
PicoClaw 在唤醒后才读取一次源尺寸，既有编码缩放规则不变。

Go 服务新增使用 `kvmv_capture_state()`，必须与本次构建的 `libkvm.so`、`libkvm_mmf.so`
及头文件配套部署。
