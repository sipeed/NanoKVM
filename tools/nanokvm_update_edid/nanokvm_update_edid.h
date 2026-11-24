#ifndef NANOKVM_UPDATE_EDID_H
#define NANOKVM_UPDATE_EDID_H

#include <stdint.h>

#define EDID_BUFFER_SIZE 256
#define LT6911_SYS_OFFSET 0x80
#define LT6911_SYS2_OFFSET 0x90
#define LT6911_SYS3_OFFSET 0x81
#define LT6911D_MANAGE_OFFSET 0xe0
#define LT6911D_DATA_OFFSET 0xe1
#define LT6911UXC_WR_SIZE 32
#define LT6911C_WR_SIZE 16
#define LT6911D_WR_SIZE 32

typedef enum {
    CHIP_LT6911C,
    CHIP_LT6911UXC,
    CHIP_LT6911D,
    CHIP_LT7911EXS
} chip_version_t;

#ifdef __cplusplus
extern "C" {
#endif

int edid_open(const char *device, unsigned address);
int edid_read(chip_version_t chip, uint8_t data[EDID_BUFFER_SIZE]);
/* Erase the chip's EDID area and program the EDID at its start. */
int edid_write(chip_version_t chip, const uint8_t data[EDID_BUFFER_SIZE]);
int edid_close(chip_version_t chip);

#ifdef __cplusplus
}
#endif
#endif
