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

## 本地开发

> 开发需要启用 SSH 功能。请在 Web `设置 - SSH` 中检查 SSH 是否已经启用。

由于 CORS 的限制，在本地开发时，需要关闭鉴权功能。

如果想要开发鉴权相关的功能，需要编译后在 NanoKVM 中进行测试。

1. 通过 SSH 登录到 NanoKVM：`ssh root@your-nanokvm-ip`（默认密码为 root）；
2. 修改配置文件 `/etc/kvm/server.yaml`，添加一行 `authentication: disable`。⚠️注意：该选项会禁用所有鉴权功能，生产环境请勿开启该选项！
3. 执行 `/etc/init.d/S95nanokvm restart` 重启服务。
4. 编辑 `.env.development` 文件，将 `VITE_SERVER_IP` 修改为你的 NanoKVM IP 地址。
5. 执行 `pnpm dev` 启动服务，然后在浏览器中访问 http://localhost:3001/ 。


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


注意：

1. 上传文件需要启用 SSH 功能。请在 Web `设置 - SSH` 中检查 SSH 是否已经启用。
2. 更新 web 目录后，浏览器可能会有缓存。如果遇到打不开页面的情况，请强制刷新或清空缓存。
