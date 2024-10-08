# NanoKVM Server

The code of NanoKVM backend server. For more documentation, please refer to [Wiki](https://wiki.sipeed.com/nanokvm).

## Structure

```shell
server
├── config       // server config
├── logger       // server log
├── main.go
├── middleware   // server middleware
├── proto        // api request and response arguments
├── router       // api routes
├── service      // api handlers
└── utils        // utils functions
```

## Development

The configuration file path is `/etc/kvm/server.yaml`. There are two configurable options:

- `log: error`: log level, default is `error`. Too many logs may affect service performance, it is recommended to use the `error` level in production environment.

- `authentication: enable`: Whether to enable authentication, default is `enable`. Logging in is required after each service restart, use `disable` will skip the authentication check and don't need to log in again. Please delete this configuration for production environments!

## Deployment

```shell
# Build
cd server
go mod tidy
GOARCH=riscv64 GOOS=linux go build
```

1. After the compilation is complete, the executable file `NanoKVM-Server` will be generated;
2. Upload the `NanoKVM-Server` file to the `/kvmapp/server/` directory of NanoKVM;
3. Execute `/etc/init.d/S95nanokvm restart` in NanoKVM to restart the service.
