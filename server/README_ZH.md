# NanoKVM Server

NanoKVM 后端服务的代码。更多文档请参考 [Wiki](https://wiki.sipeed.com/nanokvm) 。

## 目录结构

```shell
server
├── config       // 服务配置
├── logger       // 服务日志
├── main.go
├── middleware   // 中间件
├── proto        // api 请求响应参数
├── router       // api 路由
├── service      // api 处理逻辑
└── utils        // 工具函数
```

## 开发

配置文件路径为 `/etc/kvm/server.yaml`。有两个可配置的选项：

- `log: error`：日志等级，默认为 `error`。日志过多可能会影响服务性能，生产环境中建议使用 `error` 等级。
- `authentication: enable`：是否启用鉴权，默认开启。服务每次重启后都需要重新登录，将该选项设为 `disable` 会跳过鉴权检查，可以不用重复登录。生产环境请删除该条配置！

## 部署

```shell
# 编译
cd server
go mod tidy
GOARCH=riscv64 GOOS=linux go build
```

1. 编译完成后会生成可执行文件 `NanoKVM-Server`；
2. 将 `NanoKVM-Server` 文件上传到 NanoKVM 的 `/kvmapp/server/` 目录下；
3. 在 NanoKVM 中执行 `/etc/init.d/S95nanokvm restart` 重启服务。
