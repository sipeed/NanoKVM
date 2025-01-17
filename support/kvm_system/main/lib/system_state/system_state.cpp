#include "config.h"
#include "system_state.h"

using namespace maix;
using namespace maix::sys;

extern kvm_sys_state_t kvm_sys_state;
extern kvm_oled_state_t kvm_oled_state;

// net_port
int get_ip_addr(ip_addr_t ip_type)
{
	switch (ip_type){
		case ETH_IP: // eth_addr
			if(strcmp(ip_address()["eth0"].c_str(), (char*)kvm_sys_state.eth_addr) != 0){
				if(*(ip_address()["eth0"].c_str()) == NULL){
					printf("can`t get ip addr\r\n");
					kvm_sys_state.eth_addr[0] = 0;
					return 0;
				} 
				for(int i = 0; i <= 15; i++)
				{
					kvm_sys_state.eth_addr[i] = *(ip_address()["eth0"].c_str() + i);
					printf("%c", kvm_sys_state.eth_addr[i]);
				}
				printf("\r\n");
			}
			return 1;
		case WiFi_IP: // wifi_addr
			if(strcmp(ip_address()["wlan0"].c_str(), (char*)kvm_sys_state.wifi_addr) != 0){
				if(*(ip_address()["wlan0"].c_str()) == NULL){
					printf("can`t get ip addr\r\n");
					kvm_sys_state.wifi_addr[0] = 0;
					return 0;
				} 
				for(int i = 0; i <= 15; i++)
				{
					kvm_sys_state.wifi_addr[i] = *(ip_address()["wlan0"].c_str() + i);
					printf("%c", kvm_sys_state.wifi_addr[i]);
				}
				printf("\r\n");
			}
			return 1;
		case Tailscale_IP: // tail_addr
			if(*(ip_address()["tailscale0"].c_str()) == NULL){
				printf("can`t get ip addr\r\n");
				kvm_sys_state.tail_addr[0] = 0;
				return 0;
			} 
			for(int i = 0; i <= 15; i++)
			{
				kvm_sys_state.tail_addr[i] = *(ip_address()["tailscale0"].c_str() + i);
				printf("%c", kvm_sys_state.tail_addr[i]);
			}
			printf("\r\n");
			return 1;
		case RNDIS_IP: // rndis_addr
			if(*(ip_address()["usb0"].c_str()) == NULL){
				printf("can`t get ip addr\r\n");
				kvm_sys_state.rndis_addr[0] = 0;
				return 0;
			} 
			for(int i = 0; i <= 15; i++)
			{
				kvm_sys_state.rndis_addr[i] = *(ip_address()["usb0"].c_str() + i);
				printf("%c", kvm_sys_state.rndis_addr[i]);
			}
			printf("\r\n");
			return 1;
		case ETH_ROUTE: // eth_route
			if(access("/etc/kvm/gateway", F_OK) != 0){
				// 不存在gateway文件
				memset( kvm_sys_state.eth_route, 0, sizeof( kvm_sys_state.eth_route ) );
				char Cmd[100]={0};
				memset( Cmd, 0, sizeof( Cmd ) );
				sprintf( Cmd,"ip route | grep -i '^default' | grep -i 'eth0' | awk '{print $3}'");
				FILE* fp = popen( Cmd, "r" );
				if ( NULL == fp )
				{
					pclose(fp);
					return 0;
				}
				memset( kvm_sys_state.eth_route, 0, sizeof( kvm_sys_state.eth_route ) );
				while ( NULL != fgets( (char*)kvm_sys_state.eth_route,sizeof( kvm_sys_state.eth_route ),fp ))
				{
					// printf("ip=%s\n",kvm_sys_state.eth_route);
					break;
				}
				if(kvm_sys_state.eth_route[0] == 0){
					// 开机时未插入ETH
					pclose(fp);
					return 0;
				}
				for(int i = 0; i < 40; i++){
					if(kvm_sys_state.eth_route[i] == 10){
						kvm_sys_state.eth_route[i] = ' ';
						break;
					}
				}
				pclose(fp);
				return 1;
			} else {
				int file_size;
				FILE *fp = fopen("/etc/kvm/gateway", "r");
				fseek(fp, 0, SEEK_END);
				file_size = ftell(fp); 
				fseek(fp, 0, SEEK_SET);
				fread(kvm_sys_state.eth_route, sizeof(char), file_size, fp);
				fclose(fp);
				return 1;
			}
		case WiFi_ROUTE: // wifi_route
			memset( kvm_sys_state.wifi_route, 0, sizeof( kvm_sys_state.wifi_route ) );
			char Cmd[100]={0};
			memset( Cmd, 0, sizeof( Cmd ) );
			sprintf( Cmd,"ip route | grep -i '^default' | grep -i 'wlan0' | awk '{print $3}'");
			FILE* fp = popen( Cmd, "r" );
			if ( NULL == fp )
			{
				pclose(fp);
				return 0;
			}
			memset( kvm_sys_state.wifi_route, 0, sizeof( kvm_sys_state.wifi_route ) );
			while ( NULL != fgets( (char*)kvm_sys_state.wifi_route,sizeof( kvm_sys_state.wifi_route ),fp ))
			{
				// printf("ip=%s\n",kvm_sys_state.wifi_route);
				break;
			}
			if(kvm_sys_state.wifi_route[0] == 0){
				// 开机时未插入ETH
				pclose(fp);
				return 0;
			}
			for(int i = 0; i < 40; i++){
				if(kvm_sys_state.wifi_route[i] == 10){
					kvm_sys_state.wifi_route[i] = ' ';
					break;
				}
			}
			pclose(fp);
			return 1;
	}
	return 0;
}

int chack_net_state(ip_addr_t use_ip_type)
{
	char Cmd[100]={0};
	if		(use_ip_type == ETH_ROUTE)  sprintf( Cmd,"ping -I eth0 -w 1 %s > /dev/null", kvm_sys_state.eth_route);
	else if	(use_ip_type == WiFi_ROUTE) sprintf( Cmd,"ping -I wlan0 -w 1 %s > /dev/null", kvm_sys_state.wifi_route);
	else return -1;	// 不支持的端口
	if(system(Cmd) == 0){	// 256：不通； = 0：通
		return 1;
	}
	return 0;
}

void patch_eth_wifi(void)
{
	// system("ip link set eth0 down");
	// system("ip link set eth0 up");
	// system("udhcpc -i eth0 &");
}

int kvm_eth_cable_exist()
{
	int temp;
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];		
	fp = fopen("/sys/class/net/eth0/carrier", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	if(RW_Data[0] == '0') return 0;
	else if(RW_Data[0] == '1') return 1;
	return -1;
}

int kvm_wifi_exist()
{
	// if(access("/sys/bus/sdio/devices/mmc1*", F_OK) == 0) return 1;
	// else return 0;
	uint8_t RW_Data[10];	
	FILE *fp;
	fp = popen("ifconfig | grep wlan", "r");
	fgets((char*)RW_Data, 2, fp);
	pclose(fp);
	if(RW_Data[0] == 'w') return 1;
	else return 0;
}

int kvm_rndis_exist()
{
	// if(access("/sys/kernel/config/usb_gadget/g0/configs/c.1/rndis.usb0", F_OK) == 0) return 1;
	// else return 0;

	int temp;
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];		
	fp = fopen("/sys/class/net/usb0/carrier", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	if(RW_Data[0] == '0') return 0;
	else if(RW_Data[0] == '1') return 1;
	return -1;
}

int kvm_tailscale_exist()
{
	// tailscale status

	int temp;
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];		
	fp = fopen("ifconfig tailscale0 | grep 'inet addr' | awk '{print $2}'", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	if(RW_Data[0] == 'a') return 1;
	else return 0;
	return -1;
}

void kvm_update_usb_state()
{
	// usb_state, hid_state, rndis_state, udisk_state
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];		
	fp = fopen("/sys/class/udc/4340000.usb/state", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	if(RW_Data[0] == 'n') kvm_sys_state.usb_state = 0;
	else if(RW_Data[0] == 'c') kvm_sys_state.usb_state = 1;
	else kvm_sys_state.usb_state = -1;
	// hid_state & udisk_state (rndis_state单独处理)
	if(kvm_sys_state.usb_state == 1){
		if(access("/sys/kernel/config/usb_gadget/g0/configs/c.1/hid.GS*", F_OK) == 0) 
			kvm_sys_state.hid_state = 1;
		if(access("/sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk0", F_OK) == 0) 
			kvm_sys_state.udisk_state = 1;
	} else {
		kvm_sys_state.hid_state = 0;
		kvm_sys_state.udisk_state = 0;
	}
}

void kvm_update_hdmi_state()
{
	static uint8_t check_times = 4;
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];
	if(++check_times > 5){
		check_times = 0;
		fp = popen("cat /proc/cvitek/vi_dbg | grep VIFPS | awk '{print $3}'", "r");
		if (fp == NULL) {
			pclose(fp);
			return;
		}
		fgets((char*)RW_Data, 2, fp);
		pclose(fp);
		// printf("[kvmd]HDMI exist? %c\n", RW_Data[0]);
		if (RW_Data[0] != '0'){
			kvm_sys_state.hdmi_state = 1;
		} else {
			kvm_sys_state.hdmi_state = 0;
		}
	}
}

void kvm_update_stream_fps(void)
{
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];

	// FPS
	fp = fopen("/kvmapp/kvm/now_fps", "r");
    fseek(fp, 0, SEEK_END);
    file_size = ftell(fp); 
    fseek(fp, 0, SEEK_SET);
    fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	RW_Data[file_size] = 0;
	kvm_sys_state.now_fps = atoi((char*)RW_Data);
}

void kvm_update_stream_type(void)
{
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];

	// type
	fp = fopen("/kvmapp/kvm/type", "r");
    fseek(fp, 0, SEEK_END);
    file_size = ftell(fp); 
    fseek(fp, 0, SEEK_SET);
    fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	if(RW_Data[0] == 'm') 		kvm_sys_state.type = KVM_TYPE_MJPG;
	else if(RW_Data[0] == 'h') 	kvm_sys_state.type = KVM_TYPE_H264;
	else 						kvm_sys_state.type = KVM_TYPE_none;
}

void kvm_update_stream_qlty(void)
{
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];
	uint16_t tmp16;

	// QLTY
	fp = fopen("/kvmapp/kvm/qlty", "r");
    fseek(fp, 0, SEEK_END);
    file_size = ftell(fp); 
    fseek(fp, 0, SEEK_SET);
    fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	RW_Data[file_size] = 0;
	tmp16 = atoi((char*)RW_Data);
	if(kvm_sys_state.type == KVM_TYPE_MJPG){
		if(tmp16 < 60) 						 	kvm_sys_state.qlty = 1;
		else if(tmp16 >= 60 && tmp16 < 75) 	 	kvm_sys_state.qlty = 2;
		else if(tmp16 >= 75 && tmp16 < 90) 	 	kvm_sys_state.qlty = 3;
		else if(tmp16 >= 90 && tmp16 <= 100) 	kvm_sys_state.qlty = 4;
		else 									kvm_sys_state.qlty = 4;
	} else {
		if(tmp16 < 1500) 						kvm_sys_state.qlty = 1;
		else if(tmp16 >= 1500 && tmp16 < 2500) 	kvm_sys_state.qlty = 2;
		else if(tmp16 >= 2500 && tmp16 < 3500) 	kvm_sys_state.qlty = 3;
		else if(tmp16 >= 3500 && tmp16 <= 5000) kvm_sys_state.qlty = 4;
		else 									kvm_sys_state.qlty = 4;
	}
}

void kvm_update_hdmi_res(void)
{
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];
	// HDMI width
	fp = fopen("/kvmapp/kvm/width", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	RW_Data[file_size] = 0;
	kvm_sys_state.hdmi_width = atoi((char*)RW_Data);
	// HDMI height
	fp = fopen("/kvmapp/kvm/height", "r");
	fseek(fp, 0, SEEK_END);
	file_size = ftell(fp); 
	fseek(fp, 0, SEEK_SET);
	fread(RW_Data, sizeof(char), file_size, fp);
	fclose(fp);
	RW_Data[file_size] = 0;
	kvm_sys_state.hdmi_height = atoi((char*)RW_Data);
}

void kvm_update_eth_state(void)
{	
	// 嗨得是老架构啊
	static uint8_t eth_cable_state = 0;
	// if(kvm_eth_cable_exist() == 1){
	// 	if(eth_cable_state == 0){
	// 		system("udhcpc -i eth0 &");
	// 	}
	// 	eth_cable_state = 1;
	// } else {
	// 	eth_cable_state = 0;
	// }
	eth_cable_state = kvm_eth_cable_exist();

	if(eth_cable_state){
		// 获取实时IP
		if(strcmp(ip_address()["eth0"].c_str(), (char*)kvm_sys_state.eth_addr) != 0){
		// if(1){
			if(get_ip_addr(ETH_IP)){
				kvm_sys_state.eth_state = 2;
			} else {
				kvm_sys_state.eth_state = 1;
				return;
			}
			// OLED_ShowKVMStreamState(KVM_IP, kvm_sys_state.ip_addr);
		}
		// ping 网关
		if(kvm_sys_state.eth_route[0] == 0){
			get_ip_addr(ETH_ROUTE);
		} else {
			if(chack_net_state(ETH_ROUTE)){
				// 网络通
				kvm_sys_state.eth_state = 3;
			} else {
				kvm_sys_state.eth_state = 2;
			}
		}

	} else {
		kvm_sys_state.eth_state = 0;
		patch_eth_wifi();
	}

	/*
	switch (kvm_sys_state.eth_state){
		case -1:
		// 初始缺省值
			kvm_sys_state.eth_state = 0;
		case 0:
		// 存在PHY
			printf("kvm_update_eth_state case 0\n");
			if (kvm_eth_cable_exist()) {
				// 已插入
				// system("udhcpc -i eth0 > /dev/null &");
				kvm_sys_state.eth_state = 1;
			} else break;
			// break; // 消除短暂感叹号
		case 1:
		// 线缆已插入&无网络
			if (get_ip_addr(ETH_IP)){
				kvm_sys_state.eth_state = 2;
			} else break;
		case 2:
		// 已获取ip
			// system("udhcpc -i eth0 > /dev/null");
			if (get_ip_addr(ETH_ROUTE) && chack_net_state(ETH_ROUTE)){
				// ping 通
				kvm_sys_state.eth_state = 3;
			}
			if (kvm_eth_cable_exist() == 0) {
				// 未插入
				kvm_sys_state.eth_state = 0;
				patch_eth_wifi();
			}
			break;
		case 3:
		// 有网络&检测是否拔出/持续检测是否能ping通
			if (kvm_sys_state.eth_route[0] != 0){
				if (chack_net_state(ETH_ROUTE) == 0){
					// ping不通
					kvm_sys_state.eth_state = 2;
					// patch_eth_wifi();
				}
			}
			if (kvm_eth_cable_exist() == 0) {
				// 未插入
				kvm_sys_state.eth_state = 0;
				patch_eth_wifi();
			}
			break;
		default:
			kvm_sys_state.eth_state = 0;
	}
	*/
}

void kvm_update_wifi_state(void)
{	
	// 无wifi模块(检测存在?)->有模块&未联网(检测是否联网)->
	if(kvm_sys_state.wifi_state == -2) return;
	switch (kvm_sys_state.wifi_state){
		case -1:
		// 初始缺省值
			if (kvm_wifi_exist()) {
				kvm_sys_state.wifi_state = 0;
				system("touch /etc/kvm/wifi_exist");
			}
			else {
				kvm_sys_state.wifi_state = -2; // 不存在wifi模块,直接跳出
				system("rm /etc/kvm/wifi_exist");
				return;
			}
			// break;	// 直接开始检测联网
		case 0:
		// 存在WiFi&未联网
			system("echo 0 > /kvmapp/kvm/wifi_state");
			if (get_ip_addr(WiFi_IP) && get_ip_addr(WiFi_ROUTE)){
				// 已获取ip+route
				if (chack_net_state(WiFi_ROUTE)){
					// ping 通
					kvm_sys_state.wifi_state = 1;
				}
			}
			break;
		case 1:
		// 已联网&持续检测是否能ping通
			system("echo 1 > /kvmapp/kvm/wifi_state");
			get_ip_addr(WiFi_IP);
			if (kvm_sys_state.wifi_route[0] != 0){
				if (chack_net_state(WiFi_ROUTE) == 0){
					// ping 通
					kvm_sys_state.wifi_state = 0;
				}
			}
		// default:
		// 	kvm_sys_state.wifi_state = -1;
	}
}

void kvm_update_rndis_state(void)
{
	if (kvm_rndis_exist()) {
		if(kvm_sys_state.rndis_state != 1){
			if (get_ip_addr(RNDIS_IP)) {
				kvm_sys_state.rndis_state = 1;
			}
		}
	}
	else kvm_sys_state.rndis_state = 0;
}

void kvm_update_tailscale_state(void)
{
	if (kvm_tailscale_exist()) {
		if(kvm_sys_state.tail_state != 1){
			if (get_ip_addr(Tailscale_IP)) {
				kvm_sys_state.tail_state = 1;
			}
		}
	}
	else kvm_sys_state.tail_state = 0;
}

//============================================================================

uint8_t ion_free_space(void)
{
	//cat /sys/kernel/debug/ion/cvi_carveout_heap_dump/summary | grep "usage rate:" | awk '{print $2}'
}