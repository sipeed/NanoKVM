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

## Local Development

Due to CORS restrictions, authentication needs to be disabled during local development.

To develop authentication features, you need to build the project and test in NanoKVM.

1. Log in to NanoKVM via SSH: `ssh root@your-nanokvm-ip` (default password is root).
2. Open the configuration file `/etc/kvm/server.yaml/` and add `authentication: disable`. ⚠️CAUTION: This option disables all authentication and should NOT be enabled in production environment!
3. Restart the service: `/etc/init.d/S95nanokvm restart`.
4. Edit the `.env.development` file and change `VITE_SERVER_IP` to your NanoKVM IP address.
5. Run `pnpm dev` to start the server and visit http://localhost:3001/ in browser.


It's recommended to disable browser caching to avoid access issues during development:

1. Open the browser Developer Tools;
2. Go to the `Network` tab;
3. Check `Disable cache` option;
4. Refresh the page.

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
