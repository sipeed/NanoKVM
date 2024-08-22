# NanoKVM Frontend

This is NanoKVM web project. For more documentation, please refer to the [Wiki](https://wiki.sipeed.com/nanokvm).

## Structure

```shell
src
├── api                // backend api
├── assets             // static resources
├── components         // public components
├── i18n               // language resources
├── jotai              // Global jotai variables
├── lib                // util libs
├── pages              // web pages
│    ├── auth             // login and password
│    ├── desktop          // remote desktop
│    └── terminal         // web terminal
├── router.tsx         // routers
└── types              // types
```

## Deployment

Build:

```shell
cd web
pnpm install
pnpm build
```

1. After the compilation is complete, the `dist` folder will be generated.
2. Rename the folder to `web`.
3. Upload `web` to `/kvmapp/server/` in NanoKVM.
4. Restart the service by executing `/etc/init.d/S95nanokvm restart` in NanoKVM.

Additionally, browser may have old version cache. If you can't open the page, try a force refresh or clear the cache.
