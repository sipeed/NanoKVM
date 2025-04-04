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
proto: http
port:
    http: 80
    https: 443
cert:
    crt: server.crt
    key: server.key

# 日志级别（debug/info/warn/error）
# 注意：在生产环境中使用 info 或 error。debug 模式仅在开发环境中使用。
logger:
    level: info
    file: stdout

# 鉴权设置（enable/disable）
# 注意：生产环境中请勿使用 disable。
authentication: enable

jwt:
   # jwt 密钥。设置为空则使用随机生成的64位密钥
   secretKey: ""
   # jwt token 过期时间（单位：秒），默认为2678400（31天）
   refreshTokenDuration: 2678400
   # 在帐号登出时是否使所有 jwt token 失效。默认为 true
   revokeTokensOnLogout: true

# 自定义 STUN 服务器的地址
# 注意：可以设置为“disable”来禁用 STUN 服务（例如在局域网环境中使用时）
stun: stun.l.google.com:19302

turn:
    turnAddr: example_addr
    turnUser: example_user
    turnCred: example_cred
```

## 编译部署

**注意：请使用 Linux 操作系统（x86-64）。该工具链无法在 ARM、Windows 或 macOS 下使用。**

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
