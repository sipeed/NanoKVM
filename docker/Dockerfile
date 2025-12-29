FROM ubuntu:24.04 AS base_apt

# RUN echo 'Acquire::http::Proxy "http://cache.lan:3142";' > /etc/apt/apt.conf.d/00cacher
RUN userdel -r ubuntu
RUN apt update \
    && apt install wget git cmake build-essential python3 python3-venv python3-pip autoconf automake libtool gosu -y

ARG DOCKER_USER=build
RUN useradd -m "$DOCKER_USER"
USER $DOCKER_USER

FROM base_apt AS host_tools

USER root
RUN wget -O /tmp/host-tools.tar.gz https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz \
    && tar -C /usr/local -zxvf /tmp/host-tools.tar.gz  \
    && rm -f /tmp/host-tools.tar.gz \
    && export PATH=$PATH:/usr/local/host-tools/gcc/riscv64-linux-musl-x86_64/bin \
    && echo "Installed host-tools gcc" && riscv64-unknown-linux-musl-gcc -v

FROM base_apt AS golang

USER root
RUN bash -c 'wget -O /tmp/go.tar.gz https://go.dev/dl/go1.23.4.linux-$([ `uname -m` == "x86_64" ] && echo "amd64" || echo "arm64").tar.gz' \
    && tar -C /usr/local -zxvf /tmp/go.tar.gz \
    && export PATH=$PATH:/usr/local/go/bin \
    && echo "Installed golang" &&  go version

COPY server /tmp/go_cache

ENV PATH="$PATH:/usr/local/go/bin"

RUN cd /tmp/go_cache \
    && echo "Caching go dep" \
    && go mod download \
    && go mod tidy \
    && cd / \
    && rm -rf /tmp/go_cache

FROM base_apt AS sdk

RUN cd ~ \
    && git clone https://github.com/Sipeed/MaixCDK \
    && cd MaixCDK \
    && python3 -m venv . \
    && . ./bin/activate \
    && pip install -U -r requirements.txt 

COPY --chown=$DOCKER_USER . /home/$DOCKER_USER/NanoKVM

RUN cd ~/MaixCDK \
    && . ./bin/activate \
    && cd ~/NanoKVM/support/sg2002 \
    && ./build kvm_system

FROM base_apt

# Install golang
COPY --from=golang /usr/local/go /usr/local/go
COPY --chown=$DOCKER_USER --from=golang /root/go /home/$DOCKER_USER/go
ENV PATH="$PATH:/usr/local/go/bin"

# Install host tools
COPY --from=host_tools /usr/local/host-tools /usr/local/host-tools
ENV PATH="$PATH:/usr/local/host-tools/gcc/riscv64-linux-musl-x86_64/bin"

# Install SDK
COPY --from=sdk /home/$DOCKER_USER/MaixCDK /home/$DOCKER_USER/MaixCDK
COPY --chmod=+x docker/entrypoint /entrypoint

RUN echo "Verify build tools" \
    && echo "Installed host-tools gcc" && riscv64-unknown-linux-musl-gcc -v \
    && echo "Installed golang" && go version

USER root
RUN chmod 0755 /entrypoint \
 && sed "s/\$DOCKER_USER/$DOCKER_USER/g" -i /entrypoint

ENTRYPOINT ["/entrypoint"]