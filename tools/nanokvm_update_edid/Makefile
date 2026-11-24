CROSS_COMPILE ?= riscv64-unknown-linux-musl-
CC = $(CROSS_COMPILE)gcc
CXX = $(CROSS_COMPILE)g++
TARGET ?= nanokvm_update_edid
BUILD_DIR ?= build
ARCH_FLAGS ?= -march=rv64gc -mabi=lp64d
HDMI_INCLUDE = ../../support/sg2002/additional/kvm/include
CPPFLAGS += -D_DEFAULT_SOURCE -I$(HDMI_INCLUDE)
CFLAGS ?= -Os -std=c11 -Wall -Wextra -Werror
CXXFLAGS ?= -Os -std=c++17 -Wall -Wextra -Werror
LDFLAGS ?= -s -static-libstdc++ -static-libgcc

all: $(TARGET)

$(TARGET): $(BUILD_DIR)/main.o $(BUILD_DIR)/edid.o
	$(CXX) $(ARCH_FLAGS) $(LDFLAGS) -o $@ $^ $(LDLIBS)

$(BUILD_DIR)/main.o: main.cpp nanokvm_update_edid.h $(HDMI_INCLUDE)/lontium_hdmi.hpp Makefile
	mkdir -p $(BUILD_DIR)
	$(CXX) $(CPPFLAGS) $(ARCH_FLAGS) $(CXXFLAGS) -c -o $@ $<

$(BUILD_DIR)/edid.o: nanokvm_update_edid.c nanokvm_update_edid.h Makefile
	mkdir -p $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(ARCH_FLAGS) $(CFLAGS) -c -o $@ $<

clean:
	rm -f $(TARGET) $(BUILD_DIR)/main.o $(BUILD_DIR)/edid.o

.PHONY: all clean
