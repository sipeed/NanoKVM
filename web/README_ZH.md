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

