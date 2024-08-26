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

## Development

Here are some steps you can follow to develop based on your needs:

- Log in to NanoKVM via SSH: `ssh root@your-nanokvm-ip` (default password is root);
- Stop the current service: `killall NanoKVM-Server`.

1. Build the frontend project: `pnpm build`;
2. Remove the files in NanoKVM: `rm -rf /kvmapp/server/web`;
3. Upload the new files: `scp -r dist root@your-nanokvm-ip:/kvmapp/server/web`;
4. Start the service: `/kvmapp/server/NanoKVM-Server`.

Then, refresh the page in the browser to see the changes.

### Configuration

**Note: Do not enable these settings in production environment unless you fully understand their purpose!**

In development mode, you can edit the configuration file `/etc/kvm/server.yaml` for easier development:


- Add `log: debug` to print service logs. This option may cause service slowdowns, so avoid using it in production.
- Add `authentication: disable` to disable all authentication, so don't need to log in again after restarting the service. This option should not be enabled in production!

### Browser

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
