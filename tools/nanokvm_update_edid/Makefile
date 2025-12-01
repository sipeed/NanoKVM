# CROSS_COMPILE = aarch64-none-linux-gnu-
# CROSS_COMPILE = riscv64-unknown-linux-gnu-
CROSS_COMPILE = riscv64-unknown-linux-musl-
# CROSS_COMPILE = riscv64-unknown-elf-

CFLAGS += -I/usr/local/RISC-V-toolchain/riscv64-linux-musl-x86_64/sysroot/usr/include

CC = $(CROSS_COMPILE)gcc

SRC = nanokvm_update_edid.c

TARGET = nanokvm_update_edid

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) -march=rv64gc -o $@ $^

clean:
	rm -f $(TARGET)

.PHONY: all clean