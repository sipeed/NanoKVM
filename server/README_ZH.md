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
   trustedProxies:                  # 允许提供 X-Forwarded-Host 和 X-Forwarded-Proto 的反向代理 IP 或 CIDR。默认仅信任回环地址。
     - 127.0.0.1/32
     - ::1/128
   allowedOrigins: []               # 可选的额外浏览器 Origin，必须精确填写 scheme、host 和非默认端口。


# WebRTC 内网穿透
stun: stun.l.google.com:19302    # 默认使用的 STUN 服务器地址，用于打洞获取公网 IP 建立 P2P 流
turn:
    turnAddr: example_addr       # 当 P2P 直连失败时，作为备用的中继（TURN）服务器地址（格式如 `ip:port`）。留空表示不使用 TURN 中继
    turnUser: example_user       # TURN 服务器授权连接时使用的用户名
    turnCred: example_cred       # TURN 服务器授权连接时使用的凭据/密码
```

## Web 多用户

NanoKVM 使用两种设备级角色：

- `admin`：除 KVM 操作外，还可管理用户、系统、网络、更新、存储、终端、脚本、MCP 和 PicoClaw。
- `user`：可使用 KVM 视频、键盘、鼠标、粘贴、目标机电源/复位和网络唤醒。

管理员可在**设置 > 账户**中管理用户。账户数据继续保存在 `/etc/kvm/pwd`；服务会原地迁移旧版单账户
JSON，并以 `0600` 权限原子写入多用户格式。沿用同一路径可保持长按 BOOT 键重置密码的现有行为。
用户自助修改密码时必须验证当前密码；管理员可在账户管理中重置非设备所有者的密码。设备所有者可修改
自己的用户名和密码；该密码还会同步至 Linux root 账户。设备所有者账户的限制用于防止在账户管理中
误操作；具有终端或脚本访问权限的管理员仍拥有设备管理员权限，并非受沙箱隔离的用户。

所有登录会话都会校验当前账户状态。禁用、删除、修改角色或密码会立即撤销该用户的 HTTP 与实时连接，
且不会影响其他用户。多个用户可同时观看和协作控制 KVM；输入沿用现有 HID 协调器，因此同时输入可能交错。
视频模式、画质、分辨率和 MJPEG 帧检测仍属于共享 KVM 操作；多人同时调整时，以最后一次设备级修改为准。

## 反向代理

将 NanoKVM 部署在反向代理后时，必须保留浏览器可见的主机名和协议。HID、H.264、终端和 PicoClaw 等 WebSocket 接口会校验 `Origin`；漏掉这些请求头时，普通 HTTP 页面虽可打开，WebSocket 握手仍可能返回 `403`。

nginx 配置应至少等效于：

```nginx
location / {
    proxy_pass http://127.0.0.1:80;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

最后一跳代理必须用浏览器可见的值覆盖（不要追加）`Host`、`X-Forwarded-Host` 和
`X-Forwarded-Proto`，并清除客户端自行注入的转发请求头。多跳代理时，应让每一跳把值传给下一跳，
并确保最终一跳的地址配置在 `security.trustedProxies` 中。旧配置若使用 `Host $proxy_host` 必须迁移；
该值指向上游地址，可能导致 WebSocket Origin 校验失败（尤其是公网使用非默认端口时）。

只有直连对端地址命中 `security.trustedProxies` 时，NanoKVM 才会采纳 `X-Forwarded-Host` 与 `X-Forwarded-Proto`。默认只信任 `127.0.0.1/32` 和 `::1/128`；非回环反向代理请加入其 IP 或 CIDR，切勿将不受信任的客户端网段加入。若代理确实无法保留原始主机名，可通过 `security.allowedOrigins` 列出 `https://kvm.example.com` 这样的完整 Origin（仅精确匹配 scheme、host 和端口）。优先使用转发请求头；`allowedOrigins` 是例外白名单，不支持通配符，也不能替代代理信任设置。

## API 与自动化认证

默认情况下，`POST /api/auth/login` 是浏览器登录：服务设置 HttpOnly 会话 Cookie，并返回不含 token 的普通成功响应。自动化客户端可发送 `X-NanoKVM-Return-Token: true`，明确要求在响应中取得 JWT；Cookie 仍会同时设置。后续请求使用 `Authorization: Bearer <JWT>`。如果带有 `Authorization` 请求头但凭据无效，NanoKVM 会直接拒绝，不会回退使用浏览器 Cookie。

认证与用户管理 API 中的密码不是明文。其格式是使用口令 `nanokvm-sipeed-2024` 的 CryptoJS / OpenSSL 带盐加密格式。这只是传输混淆，远程访问仍必须使用 HTTPS。下面的 shell 函数输出原始 Base64（为兼容 CryptoJS，必须指定 `-md md5`）；配合 `curl --data-urlencode` 使用时，curl 会恰好执行一次 HTTP 表单编码。JSON 客户端仍可发送旧版的百分号编码 CryptoJS 值：

```sh
encrypt_password() {
  printf %s "$1" | openssl enc -aes-256-cbc -salt -a -A -md md5 \
    -pass pass:nanokvm-sipeed-2024
}
```

以下示例登录并请求 token（用 `jq` 提取 token）：

```sh
BASE='https://kvm.example.com'
TOKEN=$(curl --fail --silent --show-error \
  -H 'X-NanoKVM-Return-Token: true' \
  --data-urlencode 'username=admin' \
  --data-urlencode "password=$(encrypt_password '替换为实际密码')" \
  "$BASE/api/auth/login" | jq -er '.data.token')
curl --fail --silent --show-error -H "Authorization: Bearer $TOKEN" "$BASE/api/auth/account"
```

管理员可创建用户、重命名非设备所有者用户，并重置非设备所有者的密码。设备所有者只能修改自己的
用户名；以下使用设备所有者 token 的示例将默认的 `admin` 所有者账户改名：

```sh
curl --fail --silent --show-error -X POST -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'username=operator' \
  --data-urlencode "password=$(encrypt_password 'operator-password')" \
  --data-urlencode 'role=user' "$BASE/api/auth/users"
curl --fail --silent --show-error -X POST -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "password=$(encrypt_password 'new-operator-password')" \
  "$BASE/api/auth/users/operator/password"
curl --fail --silent --show-error -X PUT -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'username=owner' "$BASE/api/auth/users/admin"
```

已登录的所有者改名后 `$TOKEN` 会立即失效，因此示例将改名放在最后；继续调用 API 前请使用新用户名重新登录。

修改当前登录用户自己的密码时，向 `/api/auth/password` 提交加密后的 `currentPassword` 与 `password`。此前向该接口提交 `{username, password}` 的客户端必须迁移；旧请求体不再受支持。

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
