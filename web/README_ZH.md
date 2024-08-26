# NanoKVM 前端页面

NanoKVM 前端页面的代码。更多文档请参考 [Wiki](https://wiki.sipeed.com/nanokvm) 。

## 目录结构

```shell
src
├── api                // 后端接口
├── assets             // 资源文件
├── components         // 公共组件
├── i18n               // 多语言
├── jotai             // 全局 jotai 变量
├── lib               // lib
├── pages             // 页面
│    ├── auth             // 鉴权页面
│    ├── desktop          // 远程桌面
│    └── terminal         // 终端
├── router.tsx        // 路由
└── types             // 类型定义
```

## 开发

这里给出一些参考，你可以根据自己的情况来开发。

- 首先通过 ssh 登录到 NanoKVM：`ssh root@your-nanokvm-ip`（默认密码为 root）；
- 停止当前服务：`killall NanoKVM-Server`。

1. 编译前端项目：`pnpm build`；
2. 删除 NanoKVM 中前端文件：`rm -rf /kvmapp/server/web`；
3. 重新上传前端文件：`scp -r dist root@your-nanokvm-ip:/kvmapp/server/web`；
4. 启动服务：`/kvmapp/server/NanoKVM-Server`

最后，在浏览器中刷新页面即可。

### 配置文件

**注意：请勿在生产环境中开启这些配置项！除非你了解每个配置的用途。**

在开发模式下，为了更方便的开发，可以修改配置文件 `/etc/kvm/server.yaml`。

- 添加 `log: debug`，会打印服务日志。该选项可能导致服务卡顿，生产环境中请勿开启。
- 添加 `authentication: disable`，会禁用所有鉴权，服务重启后也不再需要重新登录。生产环境请勿开启该选项！

### 浏览器设置

建议在浏览器中禁用缓存，防止在开发过程中出现无法访问的情况。

1. 打开开发者工具；
2. 点击 `Network` 选项卡；
3. 勾选 `Disable cache` 选项；
4. 刷新页面。

## 部署

编译：

```shell
cd web
pnpm install
pnpm build
```

1. 编译完成后会生成 `dist` 文件夹；
2. 将该文件夹重命名为 `web`；
3. 将 `web` 文件夹上传到 NanoKVM 的 `/kvmapp/server/` 目录下；
4. 在 NanoKVM 中执行 `/etc/init.d/S95nanokvm restart` 重启服务。


注意：更新 web 目录后，浏览器可能会有缓存。如果遇到打不开页面的情况，请强制刷新或清空缓存。
