#ifndef CONFIG_H_
#define CONFIG_H_

#include "maix_basic.hpp"
#include "maix_time.hpp"
#include "maix_gpio.hpp"
#include "maix_pinmap.hpp"
#include "maix_i2c.hpp"
#include "maix_uart.hpp"
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/poll.h>
#include <fstream>
#include <linux/input.h>

#include "qr.h"
#include "system_ctrl.h"
#include "system_state.h"
#include "system_init.h"
#include "oled_ctrl.h"
#include "oled_ui.h"
#include "hdmi.h"

#define IP_Change_time 				5000
#define QR_Change_time 				5000
#define STATE_DELAY 				1000
#define OLED_DELAY 					1000
#define KEY_DELAY 					100
#define KEY_LONG_PRESS 				1500
#define KEY_LONGLONG_PRESS 			9000
#define WIFI_CONNECTION_DELAY 		5000
#define OLED_SLEEP_DELAY_MIN 		10
#define OLED_SLEEP_DELAY_DEFAULT 	30

typedef struct {
	int8_t page = 0;
	int8_t sub_page = 0;
	uint8_t eth_route[16] = {0};	// route ip
	uint8_t wifi_route[16] = {0};	// route ip
	uint8_t eth_addr[16] = {0};		// ETH ip
	uint8_t wifi_addr[16] = {0};	// WiFi ip
	uint8_t tail_addr[16] = {0};	// Tailscale ip
	uint8_t rndis_addr[16] = {0};	// RNDIS ip
	int8_t  eth_state = -1;			// cat /sys/class/net/eth0/carrier
	int8_t  wifi_state = -1;		// cat /sys/class/net/wlan0/carrier
	int8_t  tail_state = -1;		// ifconfig tailscale0 | grep 'inet addr' | awk '{print $2}'
	int8_t  hdmi_state = -1;		// cat /proc/cvitek/vi_dbg | grep VIFPS | awk '{print $3}' (1s)
	int8_t  usb_state = -1;			// cat /sys/class/udc/4340000.usb/state
	int8_t  hid_state = -1;			// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/hid.GSn(n=012)
	int8_t  rndis_state = -1;		// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/rndis.usb0
	int8_t  udisk_state = -1;		// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk0
	int8_t  host_pwr_state = -1;	// cat /sys/class/gpio/gpio504/value
	int16_t hdmi_width = 0;			// cat /kvmapp/kvm/width
	int16_t hdmi_height = 0;		// cat /kvmapp/kvm/height
	int8_t type = 0;				// cat /kvmapp/kvm/type
	int8_t now_fps = 0;				// cat /kvmapp/kvm/now_fps
	int16_t qlty = 0;				// cat /kvmapp/kvm/qlty
	int8_t oled_thread_running = 0;
	int8_t key_thread_running = 0;
	int8_t sys_thread_running = 0;
	int8_t wifi_config_process = -1;	// 1:QR;2:Test;3:IP;
	char wifi_ap_pass[9] = {0};
    uint8_t oled_sleep_state = 0;	// 0:wakeup; 1:sleep;
	int8_t reconvery_update = 0;	// 0:Undetected; 1:Needs Update; 2:Update finish; -1:not need to update
} kvm_sys_state_t;

typedef struct {
	int8_t page = -1;
	int8_t sub_page = -1;
	uint8_t eth_route[16] = {0};	// route ip
	uint8_t wifi_route[16] = {0};	// route ip
	uint8_t eth_addr[16] = {0};		// ETH ip
	uint8_t wifi_addr[16] = {0};	// WiFi ip
	uint8_t tail_addr[16] = {0};	// Tailscale ip
	uint8_t rndis_addr[16] = {0};	// RNDIS ip
	int8_t  eth_state = -1;			// cat /sys/class/net/eth0/carrier
	int8_t  wifi_state = -1;		// cat /sys/class/net/wlan0/carrier
	int8_t  tail_state = -1;		// ifconfig tailscale0 | grep inet\ addr | awk '{print $2}'
	int8_t  hdmi_state = -1;		// cat /proc/cvitek/vi_dbg | grep VIFPS | awk '{print $3}' (1s)
	int8_t  usb_state = -1;			// cat /sys/class/udc/4340000.usb/state
	int8_t  hid_state = -1;			// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/hid.GSn(n=012)
	int8_t  rndis_state = -1;		// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/rndis.usb0
	int8_t  udisk_state = -1;		// (exist?) /sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk0
	int8_t  host_pwr_state = -1;	// cat /sys/class/gpio/gpio504/value
	int16_t hdmi_width = -1;		// cat /kvmapp/kvm/width
	int16_t hdmi_height = -1;		// cat /kvmapp/kvm/height
	int8_t type = -1;				// cat /kvmapp/kvm/type
	int8_t now_fps = -1;			// cat /kvmapp/kvm/now_fps
	int16_t qlty = -1;				// cat /kvmapp/kvm/qlty
    uint8_t oled_sleep_param = 0;
    uint8_t oled_sleep_state = 0;	// 0:wakeup; 1:sleep;
	uint64_t oled_sleep_start = 0;
} kvm_oled_state_t;

#endif // CONFIG_H_
