#ifndef NANOKVM_UPDATE_EDID_H
#define NANOKVM_UPDATE_EDID_H

#define I2C_DEVICE          "/dev/i2c-4"    // I2C 设备文件
#define EDID_BUFFER_SIZE    256             // 最大支持的字节数

#define I2C_ADDRESS             0x2b            // I2C 设备地址（根据实际设备调整）
#define LT6911_REG_OFFSET       0xFF            // LT6911UXC 寄存器偏移地址
#define LT6911_SYS_OFFSET       0x80            // LT6911UXC 寄存器偏移地址
#define LT6911_SYS2_OFFSET      0x90            // LT6911UXC 寄存器偏移地址
#define LT6911_SYS3_OFFSET      0x81            // LT6911UXC 寄存器偏移地址
#define LT6911_SYS4_OFFSET      0xA0            // LT6911UXC 寄存器偏移地址
#define LT6911_CSI_INFO_OFFSET  0x85            // LT6911UXC CSI接口信息寄存器偏移地址
#define LT6911_HDMI_INFO_OFFSET 0x86            // LT6911UXC HDMI信息寄存器偏移地址
#define LT6911_CSI_TOTAL_OFFSET 0xD4            // LT6911UXC CSI总线统计信息
#define LT6911_AUDIO_INFO_OFFSET 0xB0            // LT6911UXC 音频信息寄存器偏移地址
#define LT6911C_HDMI_INFO_OFFSET 0xD2            // LT6911C HDMI信息寄存器偏移地址
#define LT6911C_AUDIO_INFO_OFFSET 0xD1            // LT6911C 音频信息寄存器偏移地址
#define LT6911C_CSI_INFO_OFFSET 0xC2            // LT6911C CSI信息寄存器偏移地址

#define EDID_BUFFER_SIZE        256             // 最大支持的字节数
#define LT6911UXC_WR_SIZE       32              // LT6911UXC单次读写最大字节数
#define LT6911C_WR_SIZE         16              // LT6911C单次读写最大字节数

#define VERSION_PATH "/etc/kvm/hdmi_version"
#define PRODUCT_PATH "/etc/kvm/hw"

typedef enum {
    CHIP_LT6911UXC = 0,
    CHIP_LT6911C,
    CHIP_UNKNOWN
} chip_version_t;

typedef enum {
    PRODUCT_CUBE_A = 0,
    PRODUCT_CUBE_B,
    PRODUCT_PCIE_A,
    PRODUCT_UNKNOWN,
} product_version_t;

#endif  // NANOKVM_UPDATE_EDID_H