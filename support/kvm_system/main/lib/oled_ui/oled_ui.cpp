#include "oled_ui.h"

using namespace maix;
using namespace maix::sys;

extern kvm_sys_state_t kvm_sys_state;
extern kvm_oled_state_t kvm_oled_state;

void kvm_init_cube_ui(void)
{
	uint8_t temp;
	char* str_temp = "192.168.1.243";

	OLED_Clear();
	// OLED_Revolve();
	OLED_ShowLogo();
	OLED_ShowSipeedLogo();
	OLED_ShowKVMState(HDMI_STATE, 	0);
	OLED_ShowKVMState(HID_STATE, 	0);
	OLED_ShowKVMState(ETH_STATE, 	0);
	OLED_ShowKVMState(WIFI_STATE, 	0);
	OLED_Showline();
	OLED_ShowKVMStreamState(KVM_INIT, &temp);
	temp = 0;
	OLED_ShowKVMStreamState(KVM_ETH_IP, &temp);
	temp = KVM_RES_none;
	OLED_ShowKVMStreamState(KVM_HDMI_RES, &temp);
	temp = KVM_TYPE_none;
	OLED_ShowKVMStreamState(KVM_STEAM_TYPE, &temp);
	temp = 0;
	OLED_ShowKVMStreamState(KVM_STEAM_FPS, &temp);
	temp = 80;
	OLED_ShowKVMStreamState(KVM_JPG_QLTY, &temp);
}

void kvm_init_pcie_ui(void)
{
	OLED_Revolve();
	OLED_Showline_1();
	OLED_ShowSipeedLogo();
	OLED_ShowKVMState(HDMI_STATE, 	0);
	OLED_ShowKVMState(HID_STATE, 	0);
	OLED_ShowKVMState(ETH_STATE, 	0);
	OLED_ShowKVMState(WIFI_STATE, 	0);

	// OLED_ShowString(0, 2, "!192.168.222.197", 4);
	// OLED_ShowString(1, 2, "  192.168.2.197", 4);
	// OLED_ShowString(1, 3, "1920*1080", 4);
	// OLED_ShowString(41, 3, "  FPS", 4);

	// OLED_ShowString_AlignRight(AlignRightEND_P, 2, "192.168.0.69", 4);
	// OLED_ShowString_AlignRight(37, 3, "1920*1080", 4);
	OLED_ShowString_AlignRight(AlignRightEND_P, 3, "  FPS", 4);
	// OLED_ShowString(0, 3, "\"ABCDEFGHIJKLMMN\'", 4);
	// OLED_ShowString(5, 2, "1", 4);
}

void kvm_init_ui(void)
{
	if(kvm_hw_ver != 2){
		kvm_init_cube_ui();
	} else {
		kvm_init_pcie_ui();
	}
}

void qrcode_to_oled(QRCode *qr)
{
	char *p_oled_data;
	uint16_t count = 0;
	uint8_t bit;
	uint8_t begin_x = 2;
	uint8_t begin_y = 2;
	p_oled_data = (char *)malloc( 132 * sizeof(char));
	if(p_oled_data != NULL){
		// fill
		for(int i = 0; i < 132; i++){
			p_oled_data[i] = 0xFF;
		}
		// i | ; j -
		for(int i = 0; i < 29; i++){
			for(int j = 0; j < 29; j++){
				if(qrIsBlacke(qr, i, j)){
					// 敲黑点
					uint16_t data_index = ((i+begin_y)/8)*33+(j+begin_x);
					uint8_t mask = ~(0x01 << ((i+begin_y)%8));
					p_oled_data[data_index] &= mask;
				}
			}
		}
		OLED_Fill();
		OLED_ShowIMG(29, 0, p_oled_data, 33, 4);
		free(p_oled_data);
	}
}

int qrencode(char *string)
{
	// test: qrencode("WIFI:T:WPA2;S:NanoKVM;P:12345678;;");
	int errcode = QR_ERR_NONE;
	QRCode* p = qrInit(3, QR_EM_8BIT, 1, 4, &errcode);
	if (p == NULL) {
		printf("error\n");
		return -1;
	}
	qrAddData(p, (const qr_byte_t*)string, strlen(string));
	if (!qrFinalize(p)) {
		printf("finalize error\n");
		return -1;
	}

	qrcode_to_oled(p);
	if(string[0] == 'W'){
		OLED_ShowStringTurn(3, 1, "WiFi", 8);
		OLED_ShowStringTurn(3, 2, "AP:", 8);
	} else if(string[0] == 'h'){
		if(string[7] == '1'){
			OLED_ShowStringTurn(3, 1, "Web:", 8);
		} else if(string[8] == 'w'){
			OLED_ShowStringTurn(3, 1, "WiKi", 8);
		}
	}
	int size = 0;
	// width = height = qr_vertable[version] * mag + sep * mag * 2
	qr_byte_t * buffer = qrSymbolToBMP(p, 5, 5, &size);
	if (buffer == NULL) {
		printf("error %s", qrGetErrorInfo(p));
		return -1;
	}
	ofstream f("/etc/kvm/wifi_config.bmp");
	if (f.fail()) {
		return -1;
	}
	f.write((const char *)buffer, size);
	f.close();
	return 0;
}

ip_addr_t show_which_ip(void)
{
	if(kvm_sys_state.wifi_state == -2) return ETH_IP;
	static uint8_t run_count = 0;
	static ip_addr_t ip_type = ETH_IP; 
	run_count++;
	if(run_count > IP_Change_time/STATE_DELAY){
		run_count = 0;
		switch(ip_type){
			case ETH_IP:
				ip_type = WiFi_IP;
				break;
			case WiFi_IP:
				ip_type = ETH_IP;
				break;
			default:
				ip_type = ETH_IP;
		}
	}
	// printf("show_which_ip? %d\n", ip_type);
	return ip_type;
}

uint8_t ip_changed(ip_addr_t ip_type)
{
	uint8_t *kvm_sys_ip;
	uint8_t *kvm_oled_ip;
	uint8_t ret;
	if(ip_type == ETH_IP){
		kvm_sys_ip = kvm_sys_state.eth_addr;
		kvm_oled_ip = kvm_oled_state.eth_addr;
	} else if(ip_type == WiFi_IP){
		kvm_sys_ip = kvm_sys_state.wifi_addr;
		kvm_oled_ip = kvm_oled_state.wifi_addr;
	} else ret = 0;
	for (int i = 0; i < 16; i++){
		if(kvm_sys_ip[i] == 0) ret = 0;
		if(kvm_sys_ip[i] != kvm_oled_ip[i]) ret = 1;
	}
	if(ret == 1){
		memcpy(kvm_oled_ip, kvm_sys_ip, 16);
	}
	return ret;
}

void kvm_eth_state_disp(ip_addr_t _ip_type, uint8_t first_disp)
{
	static ip_addr_t _ip_type_old = NULL_IP;
	uint8_t temp;
	// printf("[kvmd]eth_state = %d\n", kvm_sys_state.eth_state);
	if(	(kvm_oled_state.eth_state != kvm_sys_state.eth_state) || 
		(_ip_type_old != _ip_type) || 
		first_disp || ip_changed(ETH_IP))
	{
		kvm_oled_state.eth_state = kvm_sys_state.eth_state;
		_ip_type_old = _ip_type;
		switch(kvm_oled_state.eth_state){
			case -1:
			case  0:
				temp = 0;
				OLED_ShowKVMState(ETH_STATE, 	0);
				if(_ip_type == ETH_IP)
					OLED_ShowKVMStreamState(KVM_ETH_IP, &temp);
				break;
			case  1:
				OLED_ShowKVMState(ETH_STATE, 	1);
				if(_ip_type == ETH_IP)
					OLED_ShowKVMStreamState(KVM_ETH_IP, &temp);
				break;
			case  2:
				OLED_Show_Network_Error(1);
			case  3:
				OLED_Show_Network_Error(0);
				OLED_ShowKVMState(ETH_STATE, 	1);
				if(_ip_type == ETH_IP)
					OLED_ShowKVMStreamState(KVM_ETH_IP, kvm_sys_state.eth_addr);
				break;
		}
	}
}

void kvm_wifi_state_disp(ip_addr_t _ip_type, uint8_t first_disp)
{
	static ip_addr_t _ip_type_old = NULL_IP;
	uint8_t temp;
	// printf("[kvmd]wifi_state = %d\n", kvm_sys_state.wifi_state);
	if(	(kvm_oled_state.wifi_state != kvm_sys_state.wifi_state) || 
		(_ip_type_old != _ip_type) || 
		first_disp || ip_changed(WiFi_IP))
	{
		kvm_oled_state.wifi_state = kvm_sys_state.wifi_state;
		_ip_type_old = _ip_type;
		switch(kvm_oled_state.wifi_state){
			case -2:
				OLED_ShowKVMState(WIFI_STATE, 	-1);
				break;
			case -1:
			case  0:
				temp = 0;
				OLED_ShowKVMState(WIFI_STATE, 	0);
				if(_ip_type == WiFi_IP)
					OLED_ShowKVMStreamState(KVM_WIFI_IP, &temp);
				break;
			case  1:
				OLED_ShowKVMState(WIFI_STATE, 	1);
				if(_ip_type == WiFi_IP){
					OLED_ShowKVMStreamState(KVM_WIFI_IP, kvm_sys_state.wifi_addr);
				}
				break;
		}
	}
}

void kvm_usb_state_disp(uint8_t first_disp)
{
	if((kvm_oled_state.usb_state != kvm_sys_state.usb_state) || first_disp){
		kvm_oled_state.usb_state = kvm_sys_state.usb_state;
		switch(kvm_oled_state.usb_state){
			case -1:
			case  0:
				OLED_ShowKVMState(HID_STATE, 	0);
				break;
			case  1:
				OLED_ShowKVMState(HID_STATE, 	1);
				break;
		}
	}
}

void kvm_hdmi_state_disp(uint8_t first_disp)
{
	if((kvm_oled_state.hdmi_state != kvm_sys_state.hdmi_state) || first_disp){
		kvm_oled_state.hdmi_state = kvm_sys_state.hdmi_state;
		switch(kvm_oled_state.hdmi_state){
			case -1:
			case  0:
				OLED_ShowKVMState(HDMI_STATE, 	0);
				break;
			case  1:
				OLED_ShowKVMState(HDMI_STATE, 	1);
				break;
		}
	}
}

void kvm_fps_disp(uint8_t first_disp)
{
	if((kvm_oled_state.now_fps != kvm_sys_state.now_fps) || first_disp){
		kvm_oled_state.now_fps = kvm_sys_state.now_fps;
		OLED_ShowKVMStreamState(KVM_STEAM_FPS, &kvm_oled_state.now_fps);
	}
}

void kvm_res_disp(uint8_t first_disp)
{
	if(	(kvm_oled_state.hdmi_width != kvm_sys_state.hdmi_width) || \
		(kvm_oled_state.hdmi_height != kvm_sys_state.hdmi_height) || \
		first_disp ){
		kvm_oled_state.hdmi_width = kvm_sys_state.hdmi_width;
		kvm_oled_state.hdmi_height = kvm_sys_state.hdmi_height;
		OLED_Show_Res(kvm_sys_state.hdmi_width, kvm_sys_state.hdmi_height);
	}
}

void kvm_type_disp(uint8_t first_disp)
{
	if(	(kvm_oled_state.type != kvm_sys_state.type) || first_disp){
		kvm_oled_state.type = kvm_sys_state.type;
		OLED_ShowKVMStreamState(KVM_STEAM_TYPE, &kvm_oled_state.type);
	}
}

void kvm_qlty_disp(uint8_t first_disp)
{
	if(	(kvm_oled_state.qlty != kvm_sys_state.qlty) || first_disp){
		kvm_oled_state.qlty = kvm_sys_state.qlty;
		OLED_ShowKVMStreamState(KVM_JPG_QLTY, &kvm_sys_state.qlty);
	}
}

void kvm_main_disp(uint8_t first_disp)
{
	if(first_disp){
		OLED_Clear();
		kvm_init_ui();
	}
}

void kvm_oled_clear(uint8_t subpage_changed)
{
	if(subpage_changed){
		OLED_Clear();
	}
}

void kvm_main_ui_disp(uint8_t first_disp, uint8_t subpage_changed)
{
	ip_addr_t now_ip_type;
	// if(kvm_oled_state.sub_page == 0)
	// if(kvm_oled_state.oled_sleep_state == 1){
	if(kvm_oled_state.sub_page == 1){
		// main page (oled sleep)
		kvm_oled_clear(first_disp || subpage_changed);
		kvm_oled_state.oled_sleep_state = 1;
	} else {
		// main page
		kvm_oled_state.oled_sleep_state = 0;
		now_ip_type = show_which_ip();
		kvm_main_disp(first_disp || subpage_changed);
		kvm_eth_state_disp(now_ip_type, first_disp || subpage_changed);
		kvm_wifi_state_disp(now_ip_type, first_disp || subpage_changed);
		kvm_usb_state_disp(first_disp || subpage_changed);
		kvm_hdmi_state_disp(first_disp || subpage_changed);
		kvm_fps_disp(first_disp || subpage_changed);
		kvm_res_disp(first_disp || subpage_changed);
		kvm_type_disp(first_disp || subpage_changed);
		kvm_qlty_disp(first_disp || subpage_changed);
	}
}

uint8_t show_which_page()
{
	static uint8_t run_count = 0xfe;
	static uint8_t show_type = 0;	// 0 不动 1 QRcode; 2 text
	if(sta_connect_ap()){
		if(ssid_pass_ok()){
			// 
		}
	}
	run_count++;
	if(run_count > QR_Change_time/STATE_DELAY){
		run_count = 0;
		if(show_type == 1) show_type = 2;
		else show_type = 1;
		return show_type;
	}
	return 0;
}

void show_text_wifi_config(char *ap_ssid)
{
	OLED_Clear();
	OLED_ShowString(0, 0, "SSID:", 8);
	OLED_ShowString_AlignRight(63, 1, "NanoKVM", 8);
	OLED_ShowString(0, 2, "PASS:", 8);
	OLED_ShowString_AlignRight(63, 3, ap_ssid, 8);
}

void show_wifi_config_ip(void)
{
	OLED_Clear();
	get_ip_addr(WiFi_IP);
	OLED_ShowString(0, 1, "Config IP:", 8);
	OLED_ShowString_AlignRight(63, 2, (char*)kvm_sys_state.wifi_addr, 4);
}

void show_wifi_config_QR(void)
{
	static char cmd[70];
	OLED_Clear();
	get_ip_addr(WiFi_IP);
	printf("http://%s/#/wifi\n", kvm_sys_state.wifi_addr);
	sprintf(cmd, "http://%s/#/wifi", kvm_sys_state.wifi_addr);
	qrencode(cmd);
}

void show_wifi_starting(void)
{
	OLED_Clear();
	OLED_ShowString(0, 1, "WiFi AP is", 8);
	OLED_ShowString(0, 2, "Starting..", 8);
}

void show_wifi_connecting(void)
{
	OLED_Clear();
	OLED_ShowString(0, 1, "WiFi", 8);
	OLED_ShowString(0, 2, "Connect...", 8);
}

void kvm_wifi_config_ui_disp(uint8_t first_disp, uint8_t subpage_changed)
{
	static char cmd[70];
	// printf("[kvmd]kvm_wifi_config_ui_disp %d | %d\n", first_disp, subpage_changed);
	if(first_disp) kvm_start_wifi_config_process(); // 略有不妥,就这样吧
	if(first_disp || subpage_changed){
		switch(kvm_oled_state.sub_page){
			case 0: // wifi ap is starting
				show_wifi_starting();
				break;
			case 1: // QRcode
				printf("WIFI:T:WPA2;S:NanoKVM;P:%s;;\n", kvm_sys_state.wifi_ap_pass);
				sprintf(cmd, "WIFI:T:WPA2;S:NanoKVM;P:%s;;", kvm_sys_state.wifi_ap_pass);
				qrencode(cmd);
				break;
			case 2: // Textcode
				show_text_wifi_config(kvm_sys_state.wifi_ap_pass);
				break;
			case 3: // open IP with QR Code
				show_wifi_config_QR();
				break;
			case 4: // open IP
				show_wifi_config_ip();
				break;
			case 5: // Connecting...
				show_wifi_connecting();
				break;
		}
	}
	// switch(show_which_page())
}

void oled_auto_sleep_time_update(void)
{
	kvm_oled_state.oled_sleep_start = time::time_ms();
}

void oled_auto_sleep(void)
{
	uint8_t tmp8;
	uint8_t sleep_close_signal = 0;
	FILE *fp;
	int file_size;
	uint8_t RW_Data[10];	
	if(access("/etc/kvm/oled_sleep", F_OK) == 0){
        fp = fopen("/etc/kvm/oled_sleep", "r");
		fseek(fp, 0, SEEK_END);
		file_size = ftell(fp); 
		fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
		if(file_size != 0){
			tmp8 = atoi((char*)RW_Data);
		} else {
			tmp8 = OLED_SLEEP_DELAY_DEFAULT;
		}
		if(tmp8 != kvm_oled_state.oled_sleep_param){
			// printf("/etc/kvm/oled_sleep = %d\n", tmp8);
			kvm_oled_state.oled_sleep_param = tmp8;
			if(kvm_oled_state.oled_sleep_param < OLED_SLEEP_DELAY_MIN){
				sleep_close_signal = 1;
			} else {
				// printf("oled_auto_sleep_time_update\n");
				oled_auto_sleep_time_update();
			}
		}
    } else {
		if(kvm_oled_state.oled_sleep_param != 0){
        	kvm_oled_state.oled_sleep_param = 0;
			sleep_close_signal = 1;
		}	
    }
	
	if(kvm_oled_state.page == 0){
		if(kvm_oled_state.oled_sleep_param < OLED_SLEEP_DELAY_MIN){
			if(sleep_close_signal == 1){
				kvm_sys_state.sub_page = 0;
			}
		} else {
			if((time::time_ms() - kvm_oled_state.oled_sleep_start)/1000 >= kvm_oled_state.oled_sleep_param){
				// kvm_oled_state.oled_sleep_state = 1;
				kvm_sys_state.sub_page = 1;
			} else {
				kvm_sys_state.sub_page = 0;
			}
		}
	}
}
