#ifndef SYSTEM_CTRL_H_
#define SYSTEM_CTRL_H_
#include "config.h"

void gen_hostapd_conf(char* ap_ssid);
void gen_udhcpd_conf();
void gen_dnsmasq_conf();
uint8_t sta_connect_ap(void);
uint8_t ssid_pass_ok(void);
uint8_t wifi_connected(void);
void kvm_start_wifi_config_process(void);
void kvm_wifi_web_config_process();
void kvm_wifi_config_process();
uint8_t kvm_reset_password(void);

#endif // SYSTEM_CTRL_H_