# NanoKVM Server

This is the backend server implementation for NanoKVM.

For detailed documentation, please visit our [Wiki](https://wiki.sipeed.com/nanokvm).

## Structure

```shell
server
├── common       // Common utility components
├── config       // Server configuration
├── dl_lib       // Shared object libraries
├── include      // Header files for shared objects
├── logger       // Logging system
├── middleware   // Server middleware components 
├── proto        // API request/response definitions
├── router       // API route handlers
├── service      // Core service implementations
├── utils        // Utility functions
└── main.go
```

## Configuration

The configuration file path is `/etc/kvm/server.yaml`.

```yaml
proto: http
port:
    http: 80
    https: 443
cert:
    crt: server.crt
    key: server.key

# Log level (debug/info/warn/error)
# Note: Use 'info' or 'error' in production, 'debug' only for development
logger:
    level: info
    file: stdout
    
# Authentication setting (enable/disable)
# Note: Only disable authentication in development environment
authentication: enable

jwt:
   # JWT secret key. If left empty, a random 64-byte key will be generated automatically.
   secretKey: ""
   # JWT token expiration time in seconds. Default: 2678400 (31 days)
   refreshTokenDuration: 2678400
   # Invalidate all JWT tokens when the user logs out. Default: true
   revokeTokensOnLogout: true

# Address for custom STUN server
# Note: You can disable the STUN service by setting it to 'disable' (e.g., in a LAN environment)
stun: stun.l.google.com:19302

# Address and authentication for custom TURN server
turn:
    turnAddr: example_addr
    turnUser: example_user
    turnCred: example_cred
```

## Compile & Deploy

Note: Use Linux operating system (x86-64). This build process is not compatible with ARM, Windows or macOS.

1. Install the Toolchain
    1. Download the toolchain from the following link: [Download Link](https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz).
    2. Extract the file and add the `host-tools/gcc/riscv64-linux-musl-x86_64/bin` directory to your PATH environment variable.
    3. Run `riscv64-unknown-linux-musl-gcc -v`. If there is version information in the output, the installation is successful.

2. Compile the Project
    1. Run `cd server` from the project root directory.
    2. Run `go mod tidy` to install Go dependencies.
    3. Run `CGO_ENABLED=1 GOOS=linux GOARCH=riscv64 CC=riscv64-unknown-linux-musl-gcc CGO_CFLAGS="-mcpu=c906fdv -march=rv64imafdcv0p7xthead -mcmodel=medany -mabi=lp64d" go build` to compile the project.
    4. After compilation, an executable file named `NanoKVM-Server` will be generated.

3. Modify RPATH
    1. Run `sudo apt install patchelf` or `pip install patchelf` to install patchelf.
    2. Run `patchelf --version`. Ensure the version is 0.14 or higher`.
    3. Run `patchelf --add-rpath \$ORIGIN/dl_lib NanoKVM-Server` to modify the RPATH of the executable file.

4. Deploy the Application
    1. File uploads requires SSH. Please enable it in the Web Settings: `Settings > SSH`;
    2. Replace the original file in the NanoKVM `/kvmapp/server/` directory with the newly compiled `NanoKVM-Server`.
    3. Restart the service on NanoKVM by executing `/etc/init.d/S95nanokvm restart`.

## Manually Update

> File uploads requires SSH. Please enable it in the Web Settings: `Settings > SSH`;

1. Download the latest application from [GitHub](https://github.com/sipeed/NanoKVM/releases);
2. Unzip the downloaded file and rename the unzipped folder to `kvmapp`;
3. Back up the existing `/kvmapp` directory on your NanoKVM, then replace it with the new `kvmapp` folder;
4. Run `/etc/init.d/S95nanokvm restart` on your NanoKVM to restart the service.
