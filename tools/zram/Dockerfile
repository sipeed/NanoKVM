# Build environment for the out-of-tree zram modules.
#
#   docker build -t nanokvm-zram-builder tools/zram
#
# build-modules.sh needs three things: the cross-compiler that built the device
# kernel, the host packages a 5.10 tree needs to configure and link a module,
# and modinfo to read the vermagic back out.
#
# The toolchain is the same host-tools archive that docker/Dockerfile installs,
# so the modules are built by the compiler the kernel was built with. This image
# is separate from that one because it needs the kernel build packages and none
# of the MaixCDK stage, and because a module build is rare: only a kernel move
# requires it.
#
# The kernel tree does not belong on a Windows filesystem. Checking out
# linux_5.10 there fails outright, because the tree carries paths Windows
# refuses. Keep the source in a named volume, as tools/zram/README.md shows.
FROM ubuntu:24.04

ARG HOST_TOOLS_URL=https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz

# gcc-12 is here because the host half of a 5.10 build does not compile clean
# under this image's default gcc-13. Only scripts/ and the module linker run on
# the host; the modules themselves are built by the cross-compiler, so the host
# compiler version cannot reach the artefact.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        wget ca-certificates git build-essential \
        bc bison flex libssl-dev libelf-dev kmod cpio rsync python3 \
        gcc-12 g++-12 \
    && rm -rf /var/lib/apt/lists/* \
    && update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-12 100 \
    && update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-12 100

RUN wget -q -O /tmp/host-tools.tar.gz "$HOST_TOOLS_URL" \
    && tar -C /usr/local -zxf /tmp/host-tools.tar.gz \
    && rm -f /tmp/host-tools.tar.gz

ENV PATH="/usr/local/host-tools/gcc/riscv64-linux-musl-x86_64/bin:${PATH}"

RUN riscv64-unknown-linux-musl-gcc --version | head -1 \
    && gcc --version | head -1 \
    && modinfo --version
