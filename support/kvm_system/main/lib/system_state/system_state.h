#ifndef SYSTEM_STATE_H_
#define SYSTEM_STATE_H_
#include "config.h"

enum ip_addr_t
{
    ETH_IP=1, WiFi_IP, Tailscale_IP, RNDIS_IP, ETH_ROUTE, WiFi_ROUTE, NULL_IP
};

// net_port
int get_ip_addr(ip_addr_t ip_type);
int chack_net_state(ip_addr_t use_ip_type);
void patch_eth_wifi(void);
int kvm_eth_cable_exist();
int kvm_wifi_exist();
int kvm_rndis_exist();
int kvm_tailscale_exist();
void kvm_update_usb_state();
void kvm_update_hdmi_state();
void kvm_update_stream_fps(void);
void kvm_update_stream_type(void);
void kvm_update_stream_qlty(void);
void kvm_update_hdmi_res(void);
void kvm_update_eth_state(void);
void kvm_update_wifi_state(void);
void kvm_update_rndis_state(void);
void kvm_update_tailscale_state(void);
uint8_t ion_free_space(void);

#endif // SYSTEM_STATE_H_
