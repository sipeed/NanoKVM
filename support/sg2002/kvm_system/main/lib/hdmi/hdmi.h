#ifndef HDMI_H_
#define HDMI_H_

#include "maix_basic.hpp"
#include "maix_time.hpp"
#include "maix_gpio.hpp"
#include "maix_pinmap.hpp"
#include "maix_i2c.hpp"
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <pthread.h>

#define LT6911_ADDR 	0x2B
#define LT6911_READ 	0xFF
#define LT6911_WRITE 	0x00

void lt6911_enable();
void lt6911_disable();
void lt6911_start();
void lt6911_stop();
void lt6911_reset();
void lt6911_get_hdmi_errer();
uint8_t lt6911_get_hdmi_res();
void lt6911_get_hdmi_clk();
uint8_t lt6911_get_csi_res();

#endif // HDMI_H_