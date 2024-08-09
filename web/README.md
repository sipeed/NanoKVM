# NanoKVM Frontend

## Structure

```shell
src
├── api                // backend api
├── assets             // static resouces
├── components         // public components
├── i18n               // i18n
├── jotai              // Global jotai variables
├── lib               // lib
├── pages             // web pages
│    ├── auth             // login and password
│    ├── desktop          // remote desktop
│    └── terminal         // web terminal
├── router.tsx        // routers
└── types            // types
```

## Deployment

Build:

```shell
cd web
pnpm install
pnpm build
```

Once compilation is complete, the `dist` folder will be generated. Rename the folder to `web` and upload it to the `/kvmapp/server/` directory in NanoKVM.
Then, restart the service by executing `/etc/init.d/S95nanokvm` in NanoKVM.

Additionally, browser may have old version cache. If you can't open the page, try a force refresh or clear the cache.
