#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>

#include <linux/i2c-dev.h>
#include <linux/i2c.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <time.h>

#include "nanokvm_update_edid.h"


int client;
// old offset set to 0xff first
static uint8_t old_offset = 0xff;

// =======================================================================================================

int get_edid_from_file(const char *filename, uint8_t *edid_data, uint16_t *edid_size) {
    FILE *file = fopen(filename, "rb");
    if (!file) {
        perror("Failed to open EDID file");
        return -1;
    }

    *edid_size = fread(edid_data, 1, EDID_BUFFER_SIZE, file);
    fclose(file);

    return 0;
}

int check_edid(uint8_t *edid_data, uint16_t edid_size)
{
    uint16_t i;
    // Check if the EDID data length is valid
    if (edid_size != EDID_BUFFER_SIZE) {
        fprintf(stderr, "EDID data length is not %d bytes\n", EDID_BUFFER_SIZE);
        return -1; // EDID data length is not enough
    }

    // Check EDID header
    if (edid_data[0] != 0x00 || edid_data[1] != 0xFF || 
        edid_data[2] != 0xFF || edid_data[3] != 0xFF || 
        edid_data[4] != 0xFF || edid_data[5] != 0xFF || 
        edid_data[6] != 0xFF || edid_data[7] != 0x00) {
        fprintf(stderr, "EDID header is invalid\n");
        return -1; // EDID header is invalid
    }

    // First 128 Bytes checksum
    uint8_t checksum1 = 0;
    for (i = 0; i < 127; i++) {
        checksum1 += edid_data[i];
    }
    checksum1 = 0x100 - checksum1; // Reverse
    if (checksum1 != edid_data[127]) {
        // Checksum for first 128 bytes is incorrect
        fprintf(stderr, "Checksum for first 128 bytes is incorrect\n");
        return -1; 
    }

    // Second 128 Bytes checksum
    uint8_t checksum2 = 0;
    for (i = 128; i < 255; i++) {
        checksum2 += edid_data[i];
    }
    checksum2 = 0x100 - checksum2; // Reverse
    if (checksum2 != edid_data[255]) {
        // Checksum for second 128 bytes is incorrect
        fprintf(stderr, "Checksum for second 128 bytes is incorrect\n");
        return -1;
    }

    return 0; // EDID is valid
}

// =======================================================================================================

void NanoKVM_PCIe_HDMI_Reset(void)
{
    system("echo 0 > /sys/class/gpio/gpio451/value");
    usleep(100000);
    system("echo 1 > /sys/class/gpio/gpio451/value");
    usleep(100000);
}

// =======================================================================================================

// I2C write function
int i2c_write_byte(uint8_t offset, uint8_t reg, uint8_t data) 
{
    // reg buffer
    uint8_t reg_buf[2] = {0};

    // if offset is changed, write it first
    if (offset != old_offset) {
        old_offset = offset;
        reg_buf[0] = LT6911_REG_OFFSET; // Set the offset register
        reg_buf[1] = offset;    // Set the register to read
        if (write(client, reg_buf, 2) != 2) {
            perror("Failed to write offset to the i2c bus");
            return -1;
        }
    }

    // write the data to the i2c bus
    reg_buf[0] = reg; // Set the register to write
    reg_buf[1] = data; // Set the data to write
    if (write(client, reg_buf, 2) != 2) {
        perror("Failed to write to the i2c bus");
        return -1;
    }
    return 0;
}

int i2c_write_bytes(uint8_t offset, uint8_t reg, const uint8_t *data, size_t len) 
{
    // check len
    if (len == 0) {
        fprintf(stderr, "Data length must be greater than 0.\n");
        return -1;
    }

    // reg buffer
    uint8_t reg_buf[1 + len];

    // if offset is changed, write it first
    if (offset != old_offset) {
        old_offset = offset;
        reg_buf[0] = LT6911_REG_OFFSET; // Set the offset register
        reg_buf[1] = offset;    // Set the register to read
        if (write(client, reg_buf, 2) != 2) {
            perror("Failed to write offset to the i2c bus");
            return -1;
        }
    }

    // write the data to the i2c bus
    reg_buf[0] = reg;
    for (size_t i = 0; i < len; i++) {
        reg_buf[i + 1] = data[i];
    }

    // write to the I2C bus
    if (write(client, reg_buf, 1 + len) != 1 + len) {
        perror("Failed to write to the i2c bus");
        return -1;
    }

    return 0;
}

// I2C read function
int i2c_read_byte(uint8_t offset, uint8_t reg, uint8_t *data) 
{
    // reg buffer
    uint8_t reg_buf[2] = {0};

    // if offset is changed, write it first
    if (offset != old_offset) {
        old_offset = offset;
        reg_buf[0] = LT6911_REG_OFFSET; // Set the offset register
        reg_buf[1] = offset;    // Set the register to read
        if (write(client, reg_buf, 2) != 2) {
            perror("Failed to write offset to the i2c bus");
            return -1;
        }
    }

    // write the register address to read
    reg_buf[0] = reg; // Set the register to read
    if (write(client, reg_buf, 1) != 1) {
        perror("Failed to write register address to the i2c bus");
        return -1;
    }

    // read the data from the i2c bus
    if (read(client, data, 1) != 1 ) {
        perror("Failed to read from the i2c bus");
        return -1;
    }

    return 0;
}

int i2c_read_bytes(uint8_t offset, uint8_t reg, uint8_t *data, size_t len) 
{
    // 检查数据长度
    if (len == 0) {
        fprintf(stderr, "Data length must be greater than 0.\n");
        return -1;
    }

    uint8_t reg_buf[2]; // 创建寄存器缓冲区

    // 如果偏移量改变，先写入偏移量
    if (offset != old_offset) {
        old_offset = offset;
        reg_buf[0] = LT6911_REG_OFFSET; // 设置偏移寄存器
        reg_buf[1] = offset; // 设置偏移值
        if (write(client, reg_buf, 2) != 2) {
            perror("Failed to write offset to the i2c bus");
            return -1;
        }
    }

    // 写入要读取的寄存器地址
    reg_buf[0] = reg; // 设置要读取的寄存器
    if (write(client, reg_buf, 1) != 1) {
        perror("Failed to write register address to the i2c bus");
        return -1;
    }

    // 从 I2C 总线读取数据
    if (read(client, data, len) != len) {
        perror("Failed to read from the i2c bus");
        return -1;
    }

    return 0;
}

// =======================================================================================================

int lt6911_enable(void) {
    // Enable the LT6911UXC by writing to the appropriate register
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xEE, 0x01) != 0) {
        fprintf(stderr, "Failed to enable LT6911UXC\n");
        return -1;
    }
    return 0;
}

int lt6911_disable(void) {
    // Disable the LT6911UXC by writing to the appropriate register
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xEE, 0x00) != 0) {
        fprintf(stderr, "Failed to disable LT6911UXC\n");
        return -1;
    }
    return 0;
}

// =======================================================================================================

int lt6911uxc_edid_write(uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t i;
    int ret;
    uint8_t chip_data[16] = {0};
    uint8_t wr_count = edid_size / LT6911UXC_WR_SIZE + 1;
    uint8_t version_str[32] = {0};

    fprintf(stdout, "Writing EDID....\n");
    
    // Start
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x59, 0x51) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x10) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x81) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    // Waiting for erasure
    usleep(500000);

    if (i2c_read_byte(LT6911_SYS3_OFFSET, 0x08, chip_data) != 0) return -1;
    if (chip_data[0] != 0xEE) {
        fprintf(stderr, "Unsupported chip version\n");
        return -1;
    } 
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xAE) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xEE) != 0) return -1;
    // Write
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xDF) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x20) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
        if (i != wr_count-1) {
            if (i2c_write_bytes(LT6911_SYS_OFFSET, 0x59, edid_data+(LT6911UXC_WR_SIZE*i), LT6911UXC_WR_SIZE) != 0) return -1;
        } else {
            if (i2c_write_bytes(LT6911_SYS_OFFSET, 0x59, version_str, LT6911UXC_WR_SIZE) != 0) return -1;
        }
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i != wr_count-1) {
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00+(LT6911UXC_WR_SIZE*i)) != 0) return -1;
        } else {
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x81) != 0) return -1;
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00) != 0) return -1;
        }
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xC0) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x90) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i != wr_count-1) {
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
        } else {
            if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x88) != 0) return -1;
        }
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    }
    if (i2c_read_byte(LT6911_SYS3_OFFSET, 0x08, chip_data) != 0) return -1;
    if (chip_data[0] != 0xEE) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xAE) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xEE) != 0) return -1;

    fprintf(stdout, "EDID write completed\n");

    return 0;
}

int lt6911uxc_edid_read(uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t i;
    int ret;
    uint8_t chip_data[16] = {0};
    uint8_t wr_count = edid_size / LT6911UXC_WR_SIZE;

    // Read EDID data from LT6911UXC
    fprintf(stdout, "Reading EDID...\n");
    // Read
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0x5F) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0xA0) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00+(LT6911UXC_WR_SIZE*i)) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x90) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
        if (i2c_read_bytes(LT6911_SYS_OFFSET, 0x5F, edid_data+(LT6911UXC_WR_SIZE*i), LT6911UXC_WR_SIZE) != 0) return -1;
    }

    return 0;
}

int lt6911c_edid_write(uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t i;
    int ret;
    uint8_t chip_data[16] = {0};
    uint8_t wr_count = edid_size / LT6911C_WR_SIZE;
    uint8_t version_str[32] = {0};

    fprintf(stdout, "Writing EDID....\n");
    
    // Start
    lt6911_enable();
    if (i2c_read_bytes(LT6911_SYS4_OFFSET, 0x00, chip_data, 2) != 0) return -1;
    if (chip_data[0] != 0x16 || chip_data[1] != 0x05) {
        fprintf(stderr, "Unsupported chip version\n");
        return -1;
    }
    lt6911_disable();

    usleep(100000);

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_read_bytes(LT6911_SYS4_OFFSET, 0x00, chip_data, 2) != 0) return -1;
    if (chip_data[0] != 0x16 || chip_data[1] != 0x05) {
        fprintf(stderr, "Unsupported chip version\n");
        return -1;
    }
    lt6911_disable();

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xC0) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x59, 0x51) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x92) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x86) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x83) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;

    // waiting to clean
    usleep(500000);
    if (i2c_read_byte(LT6911_SYS2_OFFSET, 0x02, chip_data) != 0) return -1;
    if (chip_data[0] != 0xFF) {
        fprintf(stderr, "Clean Error\n");
        return -1;
    }
    if (i2c_write_byte(LT6911_SYS2_OFFSET, 0x02, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS2_OFFSET, 0x02, 0xFF) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x86) != 0) return -1;

    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x86) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xEF) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0xA2) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x01) != 0) return -1;
        if (i2c_write_bytes(LT6911_SYS_OFFSET, 0x59, edid_data+(LT6911C_WR_SIZE*i), LT6911C_WR_SIZE) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00+(LT6911C_WR_SIZE*i)) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xE0) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x92) != 0) return -1;
    }
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x8A) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_read_byte(LT6911_SYS2_OFFSET, 0x02, chip_data) != 0) return -1;
    if (chip_data[0] != 0xFF) return -1;
    if (i2c_write_byte(LT6911_SYS2_OFFSET, 0x02, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS2_OFFSET, 0x02, 0xFF) != 0) return -1;

    fprintf(stdout, "EDID write completed\n");

    return 0;
}

int lt6911c_edid_read(uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t i;
    int ret;
    uint8_t chip_data[16] = {0};
    uint8_t wr_count = edid_size / LT6911C_WR_SIZE;

    // Read EDID data from LT6911UXC
    fprintf(stdout, "Reading EDID...\n");
    // Read

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    lt6911_enable();
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x86) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;

    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0x6F) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0xA2) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, 0x00+(LT6911C_WR_SIZE*i)) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x92) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x01) != 0) return -1;
        if (i2c_read_bytes(LT6911_SYS_OFFSET, 0x5F, edid_data+(LT6911C_WR_SIZE*i), LT6911C_WR_SIZE) != 0) return -1;
    }

    return 0;
}

// =======================================================================================================

int lt6911_edid_config(chip_version_t chip_version, uint8_t *edid_data, uint16_t edid_size) 
{
    if (chip_version == CHIP_UNKNOWN)
    {
        fprintf(stderr, "Unknown chip version\n");
        return -1;
    }

    // open i2c device
    if ((client = open(I2C_DEVICE, O_RDWR)) < 0) {
        perror("Failed to open the i2c bus");
        return -1;
    }

    // // set the lt6911uxc address
    if (ioctl(client, I2C_SLAVE, I2C_ADDRESS) < 0) {
        perror("Failed to acquire bus access and/or talk to slave");
        close(client);
        return -1;
    }

    // edid write
    if (chip_version == CHIP_LT6911UXC) {
        if (lt6911uxc_edid_write(edid_data, edid_size) != 0) {
            fprintf(stderr, "Failed to write EDID data to LT6911UXC\n");
            close(client);
            return -1;
        }
    } else if (chip_version == CHIP_LT6911C) {
        if (lt6911c_edid_write(edid_data, edid_size) != 0) {
            fprintf(stderr, "Failed to write EDID data to LT6911C\n");
            close(client);
            return -1;
        }
    } else {
        fprintf(stderr, "Unknown chip version\n");
        close(client);
        return -1;
    }
    // sleep 1s
    sleep(1);

    // read edid data back
    uint8_t edid_read_data[EDID_BUFFER_SIZE] = {0};
    if (chip_version == CHIP_LT6911UXC) {
        if (lt6911uxc_edid_read(edid_read_data, EDID_BUFFER_SIZE) != 0) {
            fprintf(stderr, "Failed to read EDID data from LT6911UXC\n");
            close(client);
            return -1;
        }
    } else if (chip_version == CHIP_LT6911C) {
        if (lt6911c_edid_read(edid_read_data, EDID_BUFFER_SIZE) != 0) {
            fprintf(stderr, "Failed to read EDID data from LT6911C\n");
            close(client);
            return -1;
        }
    } else {
        fprintf(stderr, "Unknown chip version\n");
        close(client);
        return -1;
    }

    // check if the read data matches the written data
    if (memcmp(edid_data, edid_read_data, EDID_BUFFER_SIZE) != 0) {
        fprintf(stderr, "EDID data mismatch after write/read cycle\n");
        // print edid with 16*16 hex format
        fprintf(stderr, "Written EDID data:\n");
        for (int i = 0; i < EDID_BUFFER_SIZE; i++) {
            fprintf(stderr, "%02X ", edid_data[i]);
            if ((i + 1) % 16 == 0) {
                fprintf(stderr, "\n");
            }
        }
        fprintf(stderr, "\nRead EDID data:\n");
        for (int i = 0; i < EDID_BUFFER_SIZE; i++) {
            fprintf(stderr, "%02X ", edid_read_data[i]);
            if ((i + 1) % 16 == 0) {
                fprintf(stderr, "\n");
            }
        }
        close(client);
        return -1;
    } else {
        fprintf(stdout, "EDID data verified successfully\n");
    }

    // close client
    close(client);
    return 0;
}

// =======================================================================================================

void print_warning(product_version_t product_version) {
    printf("\n=========================================================\n");
    printf("Incorrect EDID may cause issues such as \n");
    printf("inability to display images, please modify with caution\n");
    printf("=========================================================\n\n");

    if (product_version == PRODUCT_CUBE_A || product_version == PRODUCT_CUBE_B) {
        printf("\n==========================================================\n");
        printf("⚠️  WARNING: Hardware version detected as Cube/Lite!\n");
        printf("==========================================================\n");
        printf("After flashing, you MUST manually power cycle the device!\n");
        printf("Please ensure you can physically disconnect its power,\n");
        printf("NOT just remotely reboot it!!\n");
        printf("==========================================================\n\n");
    } 
}

void print_success(product_version_t product_version) {
    printf("\n=========================================================\n");
    printf("✅  EDID update successful!\n");
    if (product_version == PRODUCT_CUBE_A || product_version == PRODUCT_CUBE_B) {
        printf("Please manually power cycle the device to apply changes.\n");
    } 
    printf("=========================================================\n\n");
}

int get_user_confirmation() {
    char input[256];
    printf("Do you want to continue? (Y/N): \n");
    
    while (1) {
        
        if (fgets(input, sizeof(input), stdin) == NULL) {
            printf("\nInput error. Exiting.\n");
            return 0;
        }
        
        // 去除换行符
        input[strcspn(input, "\n")] = '\0';
        
        if (strlen(input) == 0) {
            continue; // 空输入，重新提示
        }
        
        // 转换为小写方便比较
        char choice = tolower(input[0]);
        
        if (choice == 'y') {
            return 1;
        } else if (choice == 'n') {
            return 0;
        } else {
            printf("Invalid input. Please enter Y or N.\n");
        }
    }
}

// =======================================================================================================

int main(int argc, char *argv[]) {

    uint8_t counter = 0;

    // Check version
    chip_version_t chip_version = CHIP_UNKNOWN;
    product_version_t product_version = PRODUCT_UNKNOWN;
    char chip_version_str[32] = {0};
    char product_version_str[32] = {0};

    FILE *file = fopen(VERSION_PATH, "r");
    if (file == NULL) {
        fprintf(stderr, "Please upgrade to the latest system\n");
        return 1;
    }
    
    if (fgets(chip_version_str, sizeof(chip_version_str), file) == NULL) {
        fprintf(stderr, "Failed to read chip version\n");
        fclose(file);
        return 1;
    }
    fclose(file);

    file = fopen(PRODUCT_PATH, "r");
    if (file == NULL) {
        fprintf(stderr, "Please upgrade to the latest system\n");
        return 1;
    }
    
    if (fgets(product_version_str, sizeof(product_version_str), file) == NULL) {
        fprintf(stderr, "Failed to read product version\n");
        fclose(file);
        return 1;
    }
    fclose(file);
    
    chip_version_str[strcspn(chip_version_str, "\n")] = '\0';
    product_version_str[strcspn(product_version_str, "\n")] = '\0';
    
    if (strcmp(chip_version_str, "c") == 0) {
        fprintf(stdout, "Chip Version: LT6911C\n");
        chip_version = CHIP_LT6911C;
    } else if (strcmp(chip_version_str, "ux") == 0) {
        fprintf(stdout, "Chip Version: LT6911UXC\n");
        chip_version = CHIP_LT6911UXC;
    } else if (strcmp(chip_version_str, "ue") == 0) {
        fprintf(stderr, "Chip Version Error: UE version's edid can't be updated\n");
        return 1;
    } else {
        fprintf(stderr, "Chip Version Error: Unknown version\n");
        return 1;
    }
        
    if (strcmp(product_version_str, "alpha") == 0) {
        fprintf(stdout, "Product Version: CUBE_A\n");
        product_version = PRODUCT_CUBE_A;
    } else if (strcmp(product_version_str, "beta") == 0) {
        fprintf(stdout, "Product Version: CUBE_B\n");
        product_version = PRODUCT_CUBE_B;
    } else if (strcmp(product_version_str, "pcie") == 0) {
        fprintf(stdout, "Product Version : PCIE_A\n");
        product_version = PRODUCT_PCIE_A;
    } else {
        fprintf(stderr, "Product Version Error: Unknown version\n");
        return 1;
    }

    print_warning(product_version);
    if (product_version == PRODUCT_CUBE_A || product_version == PRODUCT_CUBE_B) {
        if (get_user_confirmation() == 0) {
            return EXIT_FAILURE;
        }
    }

    // check command line arguments
    if (argc != 2) {
        fprintf(stderr, "Please enter the location of the EDID file using \"%s /path/to/edid.bin\"\n", argv[0]);
        return EXIT_FAILURE;
    }

    uint16_t edid_size = 0;
    uint8_t edid_data[EDID_BUFFER_SIZE] = {0};
    if (get_edid_from_file(argv[1], edid_data, &edid_size) != 0) {
        fprintf(stderr, "Failed to read EDID data from file %s\n", argv[1]);
        return EXIT_FAILURE;
    }
    if (check_edid(edid_data, edid_size) != 0) {
        fprintf(stderr, "EDID data is invalid\n");
        return EXIT_FAILURE;
    }
    fprintf(stdout, "EDID data loaded successfully from %s\n", argv[1]);

    if (product_version == PRODUCT_PCIE_A) NanoKVM_PCIe_HDMI_Reset();

    // configure lt6911 edid
    if (lt6911_edid_config(chip_version, edid_data, edid_size) != 0) {
        fprintf(stderr, "Failed to configure LT6911 EDID\n");
        return EXIT_FAILURE;
    }

    if (product_version == PRODUCT_PCIE_A) NanoKVM_PCIe_HDMI_Reset();

    print_success(product_version);

    return EXIT_SUCCESS;
}
