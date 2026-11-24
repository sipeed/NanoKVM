#include <errno.h>
#include <fcntl.h>
#include <linux/i2c-dev.h>
#include <stdint.h>
#include <stdio.h>
#include <sys/ioctl.h>
#include <time.h>
#include <unistd.h>

#include "nanokvm_update_edid.h"

#define LT7911EXS_FLASH_REG_PAGE 0xe0
#define LT7911EXS_EDID_ADDR 0x060000u
#define LT7911EXS_FLASH_PAGE_SIZE 32

static int client = -1;
static int old_offset = -1;

// Each call is one I2C transaction; a short transfer is an error, never a
// partial payload to continue in another transaction.
static int write_bytes(const uint8_t *data, size_t length)
{
    ssize_t count;
    do { count = write(client, data, length); } while (count < 0 && errno == EINTR);
    if (count == (ssize_t)length) return 0;
    if (count >= 0) errno = EIO;
    perror("I2C write");
    return -1;
}

static int select_page(uint8_t page)
{
    if (old_offset == page) return 0;
    uint8_t command[] = {0xff, page};
    if (write_bytes(command, sizeof(command)) != 0) return -1;
    old_offset = page;
    return 0;
}

static int i2c_write_byte(uint8_t page, uint8_t reg, uint8_t value)
{
    uint8_t command[] = {reg, value};
    return select_page(page) == 0 ? write_bytes(command, sizeof(command)) : -1;
}

static int i2c_write_bytes(uint8_t page, uint8_t reg, const uint8_t *data, size_t length)
{
    uint8_t command[33];
    if (!length || length > sizeof(command) - 1) { errno = EINVAL; return -1; }
    command[0] = reg;
    for (size_t i = 0; i < length; ++i) command[i + 1] = data[i];
    return select_page(page) == 0 ? write_bytes(command, length + 1) : -1;
}

static int i2c_read_bytes(uint8_t page, uint8_t reg, uint8_t *data, size_t length)
{
    if (select_page(page) != 0 || write_bytes(&reg, 1) != 0) return -1;
    ssize_t count;
    do { count = read(client, data, length); } while (count < 0 && errno == EINTR);
    if (count == (ssize_t)length) return 0;
    if (count >= 0) errno = EIO;
    perror("I2C read");
    return -1;
}

static int i2c_read_byte(uint8_t page, uint8_t reg, uint8_t *value)
{
    return i2c_read_bytes(page, reg, value, 1);
}

static int lt6911_enable(void) {
    // Enable the LT6911UXC by writing to the appropriate register
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xEE, 0x01) != 0) {
        fprintf(stderr, "Failed to enable LT6911UXC\n");
        return -1;
    }
    return 0;
}

// =======================================================================================================

static int lt6911uxc_edid_write(const uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t chip_data[1];
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911UXC_WR_SIZE;

    fprintf(stdout, "Writing EDID....\n");

    // Start
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x59, 0x51) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x10) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
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
        fprintf(stderr, "Unexpected SPI control value\n");
        return -1;
    }
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xAE) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xEE) != 0) return -1;
    // Write
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xDF) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x20) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
        if (i2c_write_bytes(LT6911_SYS_OFFSET, 0x59, edid_data + LT6911UXC_WR_SIZE * i, LT6911UXC_WR_SIZE) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80 + LT6911UXC_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, LT6911UXC_WR_SIZE * i % 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xC0) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x90) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, i + 1 == wr_count ? 0x88 : 0x84) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    }
    if (i2c_read_byte(LT6911_SYS3_OFFSET, 0x08, chip_data) != 0) return -1;
    if (chip_data[0] != 0xEE) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xAE) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS3_OFFSET, 0x08, 0xEE) != 0) return -1;

    fprintf(stdout, "EDID write completed\n");

    return 0;
}

static int lt6911uxc_edid_read(uint8_t *edid_data, uint16_t edid_size)
{
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911UXC_WR_SIZE;

    // Read EDID data from LT6911UXC
    fprintf(stdout, "Reading EDID...\n");
    // Read
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x84) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0x5F) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0xA0) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80 + LT6911UXC_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, LT6911UXC_WR_SIZE * i % 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x90) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x80) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x21) != 0) return -1;
        if (i2c_read_bytes(LT6911_SYS_OFFSET, 0x5F, edid_data+(LT6911UXC_WR_SIZE*i), LT6911UXC_WR_SIZE) != 0) return -1;
    }

    return 0;
}

static int lt6911c_edid_write(const uint8_t *edid_data, uint16_t edid_size)
{
    uint8_t chip_data[1];
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911C_WR_SIZE;

    fprintf(stdout, "Writing EDID....\n");

    // The runtime receiver type comes from /proc/lontium/status.
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0xC0) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x59, 0x51) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x92) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
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
    if (lt6911_enable() != 0) return -1;
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
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80 + LT6911C_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, LT6911C_WR_SIZE * i % 256) != 0) return -1;
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

static int lt6911c_edid_read(uint8_t *edid_data, uint16_t edid_size)
{
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911C_WR_SIZE;

    // Read EDID data from LT6911UXC
    fprintf(stdout, "Reading EDID...\n");
    // Read

    if (i2c_write_byte(LT6911_SYS_OFFSET, 0xFF, 0x80) != 0) return -1;
    if (lt6911_enable() != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x86) != 0) return -1;
    if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;

    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5E, 0x6F) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0xA2) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5B, 0x01) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5C, 0x80 + LT6911C_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5D, LT6911C_WR_SIZE * i % 256) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x92) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5A, 0x82) != 0) return -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x01) != 0) return -1;
        if (i2c_read_bytes(LT6911_SYS_OFFSET, 0x5F, edid_data+(LT6911C_WR_SIZE*i), LT6911C_WR_SIZE) != 0) return -1;
    }

    return 0;
}

static int lt6911d_edid_write(const uint8_t *edid_data, uint16_t edid_size)
{
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911D_WR_SIZE;

    fprintf(stdout, "Writing EDID....\n");

    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0xEE, 0x01) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5E, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x59, 0x50) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x10) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x21) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x04) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5B, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5C, 0x80) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5D, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x01) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    usleep(600000);

    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911D_DATA_OFFSET, 0x03, 0xBF) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_DATA_OFFSET, 0x03, 0xFF) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x04) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5E, 0xDF) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x20) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x21) != 0) return -1;
        if (i2c_write_bytes(LT6911D_MANAGE_OFFSET, 0x59, edid_data + LT6911D_WR_SIZE * i, LT6911D_WR_SIZE) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5B, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5C, 0x80 + LT6911D_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5D, LT6911D_WR_SIZE * i % 256) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x10) != 0) return -1;
        usleep(5000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        usleep(10000);
    }
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x08) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x00) != 0) return -1;

    fprintf(stdout, "EDID write completed\n");

    return 0;
}

static int lt6911d_edid_read(uint8_t *edid_data, uint16_t edid_size)
{
    uint16_t i;
    uint16_t wr_count = edid_size / LT6911D_WR_SIZE;

    fprintf(stdout, "Reading EDID...\n");

    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0xEE, 0x01) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5E, 0xDF) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x59, 0x50) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x10) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x21) != 0) return -1;
    for (i = 0; i < wr_count; i++) {
        if (i2c_write_byte(LT6911D_DATA_OFFSET, 0x03, 0xBF) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_DATA_OFFSET, 0x03, 0xFF) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x04) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5E, 0x5F) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x20) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5B, 0x00) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5C, 0x80 + LT6911D_WR_SIZE * i / 256) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5D, LT6911D_WR_SIZE * i % 256) != 0) return -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x10) != 0) return -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
        if (i2c_read_bytes(LT6911D_MANAGE_OFFSET, 0x5F, edid_data + (LT6911D_WR_SIZE * i), LT6911D_WR_SIZE) != 0) return -1;
        usleep(10000);
    }
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x08) != 0) return -1;
    usleep(1000);
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5A, 0x00) != 0) return -1;
    if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x00) != 0) return -1;

    return 0;
}

static int lt7911exs_flash_address(uint32_t address)
{
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5a, (uint8_t)(address >> 16)) != 0) return -1;
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5b, (uint8_t)(address >> 8)) != 0) return -1;
    return i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5c, (uint8_t)address);
}

static int lt7911exs_flash_trigger(void)
{
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x51, 0x01) != 0) return -1;
    return i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x51, 0x00);
}

static int lt7911exs_flash_delay(unsigned ms)
{
    struct timespec remaining = {ms / 1000, (ms % 1000) * 1000000L};
    int result;
    do { result = nanosleep(&remaining, &remaining); } while (result < 0 && errno == EINTR);
    return result;
}

// The EXS user EDID area uses the AX620E LT7911EXC flash protocol.
static int lt7911exs_edid_write(const uint8_t data[EDID_BUFFER_SIZE])
{
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0xee, 0x01) != 0) return -1;
    // SPI write-enable, then erase the 64 KiB user EDID block.
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x54, 0x01) != 0) return -1;
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x55, 0x06) != 0) return -1;
    if (lt7911exs_flash_trigger() != 0) return -1;
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x54, 0x05) != 0) return -1;
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x55, 0xd8) != 0) return -1;
    if (lt7911exs_flash_address(LT7911EXS_EDID_ADDR) != 0) return -1;
    if (lt7911exs_flash_trigger() != 0 || lt7911exs_flash_delay(200) != 0) return -1;

    for (unsigned offset = 0; offset < EDID_BUFFER_SIZE; offset += LT7911EXS_FLASH_PAGE_SIZE) {
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0xee, 0x01) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5f, 0x01) != 0) return -1;
        if (lt7911exs_flash_address(LT7911EXS_EDID_ADDR + offset) != 0) return -1;
        if (i2c_write_bytes(LT7911EXS_FLASH_REG_PAGE, 0x5d, data + offset, LT7911EXS_FLASH_PAGE_SIZE) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5f, 0x00) != 0) return -1;
    }
    return 0;
}

static int lt7911exs_edid_read(uint8_t data[EDID_BUFFER_SIZE])
{
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0xee, 0x01) != 0) return -1;
    // Reset the flash FIFO before issuing SPI reads.
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5f, 0x08) != 0) return -1;
    if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x5f, 0x00) != 0) return -1;
    if (lt7911exs_flash_delay(1000) != 0) return -1;

    for (unsigned offset = 0; offset < EDID_BUFFER_SIZE; offset += LT7911EXS_FLASH_PAGE_SIZE) {
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x54, 0x45) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x55, 0x03) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x56, LT7911EXS_FLASH_PAGE_SIZE) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x57, 0x00) != 0) return -1;
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0x58, 0x00) != 0) return -1;
        if (lt7911exs_flash_address(LT7911EXS_EDID_ADDR + offset) != 0) return -1;
        if (lt7911exs_flash_trigger() != 0) return -1;
        if (i2c_read_bytes(LT7911EXS_FLASH_REG_PAGE, 0x5e, data + offset, LT7911EXS_FLASH_PAGE_SIZE) != 0) return -1;
    }
    return 0;
}

int edid_open(const char *device, unsigned address)
{
    if (client >= 0 || (address != 0x2b && address != 0x41)) { errno = EINVAL; return -1; }
    client = open(device, O_RDWR | O_CLOEXEC);
    if (client < 0) return -1;
    old_offset = -1;
    // Never use I2C_SLAVE_FORCE. The receiver must already be unbound.
    if (ioctl(client, I2C_SLAVE, address) == 0) return 0;
    int saved = errno;
    close(client);
    client = -1;
    errno = saved;
    return -1;
}

int edid_read(chip_version_t chip, uint8_t data[EDID_BUFFER_SIZE])
{
    if (client < 0) { errno = EBADF; return -1; }
    switch (chip) {
    case CHIP_LT6911C: return lt6911c_edid_read(data, EDID_BUFFER_SIZE);
    case CHIP_LT6911UXC: return lt6911uxc_edid_read(data, EDID_BUFFER_SIZE);
    case CHIP_LT6911D: return lt6911d_edid_read(data, EDID_BUFFER_SIZE);
    case CHIP_LT7911EXS: return lt7911exs_edid_read(data);
    default: errno = EOPNOTSUPP; return -1;
    }
}

int edid_write(chip_version_t chip, const uint8_t data[EDID_BUFFER_SIZE])
{
    if (client < 0) { errno = EBADF; return -1; }
    switch (chip) {
    case CHIP_LT6911C: return lt6911c_edid_write(data, EDID_BUFFER_SIZE);
    case CHIP_LT6911UXC: return lt6911uxc_edid_write(data, EDID_BUFFER_SIZE);
    case CHIP_LT6911D: return lt6911d_edid_write(data, EDID_BUFFER_SIZE);
    case CHIP_LT7911EXS: return lt7911exs_edid_write(data);
    default: errno = EOPNOTSUPP; return -1;
    }
}

int edid_close(chip_version_t chip)
{
    if (client < 0) return 0;
    int result = 0;
    // Restore SPI and register access even after an incomplete transaction.
    if (chip == CHIP_LT7911EXS) {
        if (i2c_write_byte(LT7911EXS_FLASH_REG_PAGE, 0xee, 0x00) != 0) result = -1;
    } else if (chip == CHIP_LT6911D) {
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5a, 0x08) != 0) result = -1;
        usleep(1000);
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x5a, 0x00) != 0) result = -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0x58, 0x00) != 0) result = -1;
        if (i2c_write_byte(LT6911D_MANAGE_OFFSET, 0xee, 0x00) != 0) result = -1;
    } else if (chip == CHIP_LT6911C || chip == CHIP_LT6911UXC) {
        uint8_t idle = chip == CHIP_LT6911C ? 0x82 : 0x80;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5a, idle | 0x08) != 0) result = -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x5a, idle) != 0) result = -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0x58, 0x00) != 0) result = -1;
        if (i2c_write_byte(LT6911_SYS_OFFSET, 0xee, 0x00) != 0) result = -1;
    } else {
        errno = EOPNOTSUPP;
        result = -1;
    }
    if (close(client) != 0) result = -1;
    client = -1;
    old_offset = -1;
    return result;
}
