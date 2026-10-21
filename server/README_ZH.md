# NanoKVM Server

NanoKVM 后端服务的代码。更多文档请参考 [Wiki](https://wiki.sipeed.com/nanokvm) 。

## 目录结构

```shell
server
├── common       // 公用组件
├── config       // 服务配置
├── dl_lib       // so 文件
├── include      // 头文件
├── logger       // 服务日志
├── middleware   // 中间件
├── proto        // api 请求响应参数
├── router       // api 路由
├── service      // api 处理逻辑
├── utils        // 工具函数
└── main.go
```

## 配置文件

配置文件路径为 `/etc/kvm/server.yaml`。

```yaml
# 网络设置
proto: http            # 访问协议，默认为 `http`，仅当配置了证书时支持改为 `https`
host: ""
port:
    http: 80           # HTTP 服务的监听端口，默认为 `80`
    https: 443         # HTTPS 服务的监听端口（启用 https 协议时生效），默认为 `443`
cert:
    crt: server.crt    # HTTPS 服务使用的公钥证书路径
    key: server.key    # HTTPS 服务使用的私钥文件路径


# 日志配置
logger:
    level: info     # 全局日志打印级别，从高到底可选 `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `panic`。默认为 `info`
    file: stdout    # 日志输出目标位置。若填写 `stdout` 则输出在控制台。配置为文件路径则会输出到对应的文件。默认为 `stdout`


# 认证与安全
authentication: enable              # 是否开启 HTTP 接口与网页的身份校验。可选 `enable` (开启) 或 `disable` (禁用)。默认为 `enable`。强烈建议公开在互联网的机器开启此项！
jwt:
   secretKey: ""                    # 用于签发和验证 JWT Token 的密钥。如果不填，服务启动时将自动随机生成
   refreshTokenDuration: 2678400    # 登录超时的刷新周期（单位：秒）。默认为 `2678400`（约31天）
   revokeTokensOnLogout: true       # 退出登录时是否废除该用户的全部会话；不会影响其他用户。设为 false 时仅清除浏览器 Cookie，不推荐使用。默认为 `true`
security:
   loginLockoutDuration: 0,         # 达到失败上限后，禁止该 IP 再次尝试登录的持续时间（单位：秒）。如果设为 `0` 或不填，则代表不开启防暴力破解功能。默认为 `0`
   loginMaxFailures:     5,         # 允许触发保护前，单个 IP 连续登录失败的最大次数。默认为 `5`


# WebRTC 内网穿透
stun: stun.l.google.com:19302    # 默认使用的 STUN 服务器地址，用于打洞获取公网 IP 建立 P2P 流
turn:
    turnAddr: example_addr       # 当 P2P 直连失败时，作为备用的中继（TURN）服务器地址（格式如 `ip:port`）。留空表示不使用 TURN 中继
    turnUser: example_user       # TURN 服务器授权连接时使用的用户名
    turnCred: example_cred       # TURN 服务器授权连接时使用的凭据/密码
```

## Web 多用户

NanoKVM 使用两种设备级角色：

- `admin`：拥有以下全部能力，并可管理用户。
- `user`：仅拥有被授予的功能权限。

每项权限都描述“对谁做什么”，服务端下发给账户编辑器的权限目录还带有分组、风险等级和蕴含关系：

| 分组 | 权限 |
| --- | --- |
| 控制台（本会话） | `console.view`、`console.control` |
| 被控机 | `power`、`medium.attach` |
| 介质库（本设备） | `library.read`、`library.write` |
| 本设备 | `terminal`、`device`、`network`、`update` |
| 服务 | `mcp`、`tailscale`、`ai` |

蕴含关系只在权限目录里声明一次，并由服务端在应答任何请求前解析：`console.control` 蕴含
`console.view`，`medium.attach` 与 `library.write` 都蕴含 `library.read`；而控制项位于控制台菜单里的
权限——`power`、`device`、`network`、`update`、`mcp`、`tailscale`、`ai`——同样蕴含 `console.view`，
因为控制台之外没有任何页面渲染它们。由此得到几个行为：

- 账户可以完全没有控制台权限。此时 Web 界面会落到一个提示页，列出该账户可用的页面
  （介质库、终端），而不是打开一个它无权访问的控制台。媒体功能只需要 `library.read`，
  因为另外两项媒体权限都蕴含它；也只有 `terminal` 与媒体权限能拥有控制台之外的独立页面。
- 媒体权限按信任边界拆分：`medium.attach` 在被控机上挂载/弹出介质，并写入被控机可读的共享分区；
  `library.write` 修改库内容（上传、删除、镜像内的文件）；`library.read` 负责列表与下载。
  文件相关接口用同一路径同时服务镜像与共享分区，因此路由同时接受这两项权限之一，
  再按请求指定的介质类型做校验。分区上的每个 `.iso`、`.img` 都属于介质库，因此经共享分区上传这类文件，
  或删除本身是/内含这类文件的文件或文件夹，同样需要 `library.write`。
- 模拟的 USB 设备既不属于媒体也不属于网络：虚拟磁盘与 RNDIS 虚拟网卡分别把设备的原始数据分区
  和一块网卡交给被控机，因此都归 `device`。只有拥有 `device` 权限的账户开启虚拟磁盘后，才能挂载
  镜像；磁盘未开启时存储页面会给出提示。

以下四项权限的实际范围比名称更大，等同于完整的设备控制权；权限目录只有两个风险等级，`warn`
专用于它们，账户编辑器会做标记并在保存前按名称列出：

- `terminal`：即 root shell（与 SSH 相同），并可运行已保存的脚本和开机自启脚本。
- `mcp`：会下发设备级 API Key，可在 Web 会话之外控制键鼠并获取截图。Key 为共用，任一账户失去该权限
  （撤销、降级、禁用或删除）时服务端都会重新生成，所有 MCP 客户端需要换用新 Key。
- `ai`：通过本地回环接口操作设备，不受其他权限限制。
- `update`：安装固件与应用更新包。离线包只校验上传者自己提供的校验和，安装它即等于以 root 运行代码。

`device` 不做该标记：它仍在本账户被授予的设置范围内，但会改变设备对所有人生效的行为，
且无法按账户收窄。`device` 可开关 SSH（root，口令为设备所有者口令）、重启设备、通过模拟的 USB 设备把
原始数据分区或网卡交给被控机，并修改 OLED、HDMI、mDNS、内存、交换与 HID 设置。编辑器中对此同样有说明。

另有两项权限会改动影响所有观看者的设置：`console.view` 会设置视频模式、分辨率、帧率与画质，
并复位 HDMI 采集；`power` 会管理网络唤醒设备列表。编辑器中对这两项都有明确说明。

管理员可在**设置 > 账户**中管理用户。账户数据继续保存在 `/etc/kvm/pwd`；服务会原地迁移旧版单账户
JSON，并以 `0600` 权限原子写入多用户格式。沿用同一路径可保持长按 BOOT 键重置密码的现有行为。
用户自助修改密码时必须验证当前密码；管理员可在账户管理中重置非设备所有者的密码。由于设备所有者
密码还会同步至 Linux root 账户，因此只有设备所有者本人可以修改自己的密码。

所有登录会话都会校验当前账户状态：每个请求都按账户文件重新授权，因此被撤销的权限会立即失效，
无需重新登录。禁用、删除或重置密码会立即撤销该用户的 HTTP 与实时连接，且不会影响其他用户。
修改角色或权限不会失效登录：账户会收到刷新通知，只会断开缓存了相关状态的长期连接
（控制台、视频流、终端、AI），这些客户端随后会以新权限重连。失去 `console.view` 的账户会被
转到提示页，而不是一个无法打开的控制台。多个用户可同时观看和协作控制 KVM；输入沿用现有 HID
协调器，因此同时输入可能交错。没有 `console.control` 的用户仍可观看画面并使用其其他权限对应的菜单，
但控制台会丢弃其键鼠报文，Web 界面会将会话标记为只读。
视频模式、画质、分辨率、MJPEG 帧检测以及复位 HDMI 采集只要求 `console.view`，仍属于共享 KVM 操作；
多人同时调整时，以最后一次设备级修改为准。启用/关闭 HDMI 采集及其空闲超时则属于设备设置。
`console.control` 仅限输入：键盘、鼠标、粘贴，以及将指针位移映射到目标机画面的输入区域。

账户文件保存的是显式权限集合：细粒度权限出现之前写入的记录，在读取时会物化为当时 user 角色的
能力，拆分过的媒体权限也会被翻译成新名称，因此存储中不会留下“缺失即回退到另一套行为”的状态。
本版本不认识的权限会被原样保留并忽略，因此回滚版本不会把设备锁在门外。
新建普通账户时若不指定权限集合，含义同上：只认识角色的脚本仍会得到 user 角色过去创建出的账户；
账户编辑器新建普通账户时只预置 `console.view`，而显式传入的空集合就是真的空。

## 编译部署

**注意：请使用 Linux 操作系统（x86-64）和 Go 1.25 或更高版本。该工具链无法在 ARM、Windows 或 macOS 下使用。**

1. 安装工具链
   1. 下载工具链：[下载地址](https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz)；
   2. 解压下载文件，然后将 `host-tools/gcc/riscv64-linux-musl-x86_64/bin` 目录加入到环境变量；
   3. 执行 `riscv64-unknown-linux-musl-gcc -v`，如果显示版本信息则安装成功。

2. 编译
   1. 在项目根目录下执行 `cd server` 进入 server 目录；
   2. 执行 `go mod tidy` 安装 Go 依赖包；
   3. （可选）如果您手动编译了 `libkvm.so`，则需要通过 `patchelf --add-rpath \$ORIGIN ./dl_lib/libkvm.so` 修改其 RPATH 属性。
   4. 执行 `CGO_ENABLED=1 GOOS=linux GOARCH=riscv64 CC=riscv64-unknown-linux-musl-gcc CGO_CFLAGS="-mcpu=c906fdv -march=rv64imafdcv0p7xthead -mcmodel=medany -mabi=lp64d" go build` 进行编译；
   5. 编译完成后，会生成可执行文件 `NanoKVM-Server`。

3. 修改 RPATH
   1. 执行 `sudo apt install patchelf` 或 `pip install patchelf` 安装 patchelf；
   2. 执行 `patchelf --version`，确保版本大于等于 0.14；
   3. 执行 `patchelf --add-rpath \$ORIGIN/dl_lib NanoKVM-Server` 修改可执行文件的 RPATH 属性。

4. 部署
   1. 上传文件需要启用 SSH 功能。请在 Web `设置 - SSH` 中检查 SSH 是否已经启用；
   2. 使用编译生成的 `NanoKVM-Server` 文件，替换 NanoKVM 中 `/kvmapp/server/` 目录下的原始文件；
   3. 在 NanoKVM 中执行 `/etc/init.d/S95nanokvm restart` 重启服务。

## 手动更新

> 请确保已经在 Web 界面的 `设置 - SSH` 中启用了 SSH 功能，以便上传文件。

1. 从 [GitHub](https://github.com/sipeed/NanoKVM/releases) 下载最新的应用安装包；
2. 解压缩下载的安装包，并将解压后的文件夹重命名为 `kvmapp`；
3. 备份 NanoKVM 系统中的 `/kvmapp` 目录，然后用解压后的 `kvmapp` 文件夹替换现有目录。
4. 在 NanoKVM 中执行 `/etc/init.d/S95nanokvm restart` 重启服务。
