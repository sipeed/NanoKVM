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

待完善。

项目中使用了 CGO，需要使用 Linux 并安装工具链后才能编译。这部分内容会晚一点更新。
