FROM ubuntu:24.04 AS base_apt

# RUN echo 'Acquire::http::Proxy "http://cache.lan:3142";' > /etc/apt/apt.conf.d/00cacher
RUN userdel -r ubuntu
RUN apt update \
    && apt install wget git cmake build-essential python3 python3-venv python3-pip autoconf automake libtool gosu patchelf -y

ARG DOCKER_USER=build
ARG DOCKER_UID=1000
ARG DOCKER_GID=1000
# Reuse existing accounts for numeric IDs that are already present in the
# base image. All later ownership and user switches use numeric IDs, so a
# dedicated build user/group is only needed when the ID does not exist.
RUN set -eux; \
    if ! getent group "$DOCKER_GID" >/dev/null; then \
        groupadd --gid "$DOCKER_GID" "$DOCKER_USER"; \
    fi; \
    if ! getent passwd "$DOCKER_UID" >/dev/null; then \
        useradd --uid "$DOCKER_UID" --gid "$DOCKER_GID" --no-create-home \
            --home-dir "/home/$DOCKER_USER" --shell /bin/bash "$DOCKER_USER"; \
    fi; \
    install -d -o "$DOCKER_UID" -g "$DOCKER_GID" "/home/$DOCKER_USER"
USER $DOCKER_UID:$DOCKER_GID

FROM base_apt AS host_tools

USER root
RUN wget -O /tmp/host-tools.tar.gz https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz \
    && tar -C /usr/local -zxvf /tmp/host-tools.tar.gz  \
    && rm -f /tmp/host-tools.tar.gz \
    && export PATH=$PATH:/usr/local/host-tools/gcc/riscv64-linux-musl-x86_64/bin \
    && echo "Installed host-tools gcc" && riscv64-unknown-linux-musl-gcc -v

FROM base_apt AS golang

USER root
RUN bash -c 'wget -O /tmp/go.tar.gz https://go.dev/dl/go1.25.0.linux-$([ `uname -m` == "x86_64" ] && echo "amd64" || uname -m).tar.gz' \
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

ENV HOME="/home/$DOCKER_USER"
ARG MAIXCDK_REV=30f4b8b7e3f66ded9cfa64fb081b46e30bc27248

RUN cd ~ \
    && git clone https://github.com/Sipeed/MaixCDK \
    && cd MaixCDK \
    && git checkout "$MAIXCDK_REV" \
    && python3 -m venv . \
    && . ./bin/activate \
    && pip install -U -r requirements.txt 

COPY --chown=$DOCKER_UID:$DOCKER_GID . /home/$DOCKER_USER/NanoKVM

RUN cd ~/MaixCDK \
    && . ./bin/activate \
    && cd ~/NanoKVM/support/sg2002 \
    && ./build kvm_system

FROM base_apt

# Install golang
COPY --from=golang /usr/local/go /usr/local/go
COPY --chown=$DOCKER_UID:$DOCKER_GID --from=golang /root/go /home/$DOCKER_USER/go
ENV PATH="$PATH:/usr/local/go/bin"

# Install host tools
COPY --from=host_tools /usr/local/host-tools /usr/local/host-tools
ENV PATH="$PATH:/usr/local/host-tools/gcc/riscv64-linux-musl-x86_64/bin"

# Install SDK
COPY --chown=$DOCKER_UID:$DOCKER_GID --from=sdk /home/$DOCKER_USER/MaixCDK /home/$DOCKER_USER/MaixCDK
COPY --chmod=+x docker/entrypoint /entrypoint

RUN echo "Verify build tools" \
    && echo "Installed host-tools gcc" && riscv64-unknown-linux-musl-gcc -v \
    && echo "Installed golang" && go version

USER root
RUN chmod 0755 /entrypoint \
 && sed "s/\$DOCKER_USER/$DOCKER_USER/g" -i /entrypoint

ENTRYPOINT ["/entrypoint"]
