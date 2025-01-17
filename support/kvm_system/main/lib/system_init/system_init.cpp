#include "config.h"
#include "system_init.h"

using namespace maix;
using namespace maix::sys;

extern kvm_sys_state_t kvm_sys_state;
extern kvm_oled_state_t kvm_oled_state;

void new_app_init(uint8_t safe_update)
{
	// first start
	system("cp -f /kvmapp/system/update-nanokvm.py /etc/kvm/");
	system("rm /etc/init.d/S02udisk");
	system("cp /kvmapp/system/init.d/S01fs /etc/init.d/");
	system("cp /kvmapp/system/init.d/S03usbdev /etc/init.d/");
	system("cp /kvmapp/system/init.d/S15kvmhwd /etc/init.d/");
	system("cp /kvmapp/system/init.d/S30eth /etc/init.d/");
	system("cp /kvmapp/system/init.d/S50sshd /etc/init.d/");
	if(kvm_wifi_exist()) system("cp /kvmapp/system/init.d/S30wifi /etc/init.d/");
	else system("rm /etc/init.d/S30wifi");
	system("cp /kvmapp/system/init.d/S98tailscaled /etc/init.d/");
	if(safe_update == 0){
		system("cp /kvmapp/system/init.d/S95nanokvm /etc/init.d/");	// /kvmapp/system/init.d/S95nanokvm还没跑完直接覆盖可能出问题
	}

	// system("rm /etc/init.d/S04backlight");
	// system("rm /etc/init.d/S05tp");
	// system("rm /etc/init.d/S40bluetoothd");
	// system("rm /etc/init.d/S99*");
	
	system("mkdir /kvmapp/kvm");
	system("mkdir /etc/kvm");
	system("echo 0 > /kvmapp/kvm/now_fps");
	system("echo 30 > /kvmapp/kvm/fps");
	system("echo 2000 > /kvmapp/kvm/qlty");
	system("echo 720 > /kvmapp/kvm/res");
	system("echo h264 > /kvmapp/kvm/type");
	system("echo 0 > /kvmapp/kvm/state");
	system("touch /etc/kvm/frame_detact");

	// rm jpg_stream & kvm_stream
	system("rm -r /kvmapp/jpg_stream");
	system("rm /kvmapp/kvm_system/kvm_stream");

	// rm kvm_new_app
	system("rm /kvmapp/kvm_new_app");
	system("sync");
	// system("/etc/init.d/S95nanokvm restart");

	// update ko
	FILE *fp;
	uint8_t RW_Data_0[30];	
	uint8_t RW_Data_1[30];	
	fp = popen("md5sum /mnt/system/ko/soph_mipi_rx.ko | grep 086ed01749188975afaa40fb569374f8 | awk '{print $2}'", "r");
	if ( NULL == fp )
	{
		pclose(fp);
		// return;
	}
	fgets((char*)RW_Data_0, 10, fp);
	pclose(fp);
	fp = popen("md5sum /mnt/system/ko/soph_mipi_rx.ko | grep 69be7eeded3777f750480a5dd5a1aa26 | awk '{print $2}'", "r");
	if ( NULL == fp )
	{
		pclose(fp);
		// return;
	}
	fgets((char*)RW_Data_1, 10, fp);
	pclose(fp);

	int8_t hdmi_ver = -1;

	if(access("/etc/kvm/hdmi_version", F_OK) == 0){
		uint8_t RW_Data[2];
		FILE *fp = fopen("/etc/kvm/hdmi_version", "r");
		fread(RW_Data, sizeof(char), 2, fp);
		fclose(fp);
		if(RW_Data[0] == 'c') hdmi_ver = 1;
		else if(RW_Data[0] == 'u') hdmi_ver = 2;
	}

	if(hdmi_ver == 2){
		if(RW_Data_1[0] != '/'){
			system("cp /kvmapp/system/ko/soph_mipi_rx.ko /mnt/system/ko/soph_mipi_rx.ko");
			system("sync");
			system("reboot");
		} else {
			system("sync");
			system("/etc/init.d/S15kvmhwd start");
			system("/etc/init.d/S95nanokvm restart");
		}
	} else {
		if((RW_Data_0[0] != '/') && (RW_Data_1[0] != '/')){
			system("cp /kvmapp/system/ko/soph_mipi_rx.ko /mnt/system/ko/soph_mipi_rx.ko");
			system("sync");
			system("reboot");
		} else {
			system("sync");
			system("/etc/init.d/S15kvmhwd start");
			system("/etc/init.d/S95nanokvm restart");
		}
	}

	if(access("/root/old/kvm_new_img", F_OK) == 0){
		system("rm -r /root/old");
	}	
}

void update_resolv_conf(void)
{
	FILE *fp = NULL;
	// fp = fopen("/boot/resolv.conf", "w+");
	fp = fopen("/boot/resolv.conf", "w");
	// 阿里: 223.5.5.5
	// 腾讯: 119.29.29.29
	fprintf(fp, "nameserver 192.168.0.1\nnameserver 8.8.4.4\nnameserver 8.8.8.8\nnameserver 114.114.114.114\nnameserver 119.29.29.29\nnameserver 223.5.5.5");
	fclose(fp);
	system("rm -rf /etc/resolv.conf");
	system("cp -vf /etc/resolv.conf /etc/resolv.conf.old");
	system("cp -vf /boot/resolv.conf /etc/resolv.conf");
}

void init_upadte(void)
{
	if(access("/kvmapp/kvm_new_app", F_OK) == 0){
		new_app_init(0);
	}

	// PCIe Patch
	if(access("/kvmapp/jpg_stream/dl_lib/libmaixcam_lib.so", F_OK) == 0){
		system("cp -f /kvmapp/jpg_stream/dl_lib/libmaixcam_lib.so /kvmapp/kvm_system/dl_lib/");
		new_app_init(1);
	}

	// DNS Patch
	system("tailscale set --accept-dns=false");
	if(access("/boot/resolv.conf", F_OK) != 0){
		// 不存在直接覆盖
		update_resolv_conf();
	} else {
		// 存在则检测是否拷贝/DNS是否正确
		uint8_t RW_Data[10] = {0};	
		FILE *fp;
		fp = popen("cat /etc/resolv.conf | grep 119.29.29.29", "r");
		fgets((char*)RW_Data, 2, fp);
		pclose(fp);
		if(RW_Data[0] != 'n') {
			update_resolv_conf();
		}
	}

	// libmaixcam_lib.so
	if(access("/kvmapp/kvm_system/dl_lib/libmaixcam_lib.so", F_OK) == 0){
		// exist
		system("cp -f /kvmapp/kvm_system/dl_lib/libmaixcam_lib.so /kvmapp/server/dl_lib");
	} else {
		printf("kvm_system not exist lib!\n");
	}
	system("sync");
	system("killall NanoKVM-Server");
	system("rm -r /tmp/server");
	system("cp -r /kvmapp/server /tmp/");
	system("/tmp/server/NanoKVM-Server &");
}

void first_start(void)
{
	if(access("/kvmapp/kvm_new_img", F_OK) == 0){
		// init oled
		OLED_state = oled_exist();
		if(OLED_state){
			printf("oled exist\r\n");
		} else {
			printf("oled not exist\r\n");
		}
		if(OLED_state){
			OLED_Init();
			OLED_ColorTurn(0);		//0正常显示 1 反色显示
			OLED_DisplayTurn(0);	//0正常显示 1 屏幕翻转显示
			// OLED_INIT_UI();
			
			if(kvm_hw_ver == 2){
				OLED_Revolve();
			}
		}
		uint8_t update_begin = 0;
		while(1){
			if(chack_net_state(ETH_ROUTE) && get_ip_addr(ETH_IP)){
				OLED_Clear();
				if(kvm_hw_ver != 2){
					if(update_begin == 0){
						update_begin = 1;
						OLED_ShowString(1, 2, "Auto-updating...", 16);
						OLED_ShowStringtoend(1, 4, (char*)kvm_sys_state.eth_addr, 16, 0);
						system("python /kvmapp/system/update-nanokvm.py");
					} else {
						OLED_ShowString(1, 0, "Auto-update fail", 16);
						OLED_ShowString(1, 2, "Please open the ", 16);
						OLED_ShowStringtoend(1, 4, (char*)kvm_sys_state.eth_addr, 16, 0);
						OLED_ShowString(1, 6, "update KVM APP  ", 16);
					}
				} else {
					// PCIe
					if(update_begin == 0){
						update_begin = 1;
						OLED_ShowString(0, 1, "Updating...",  8);
						OLED_ShowString_AlignRight(AlignRightEND_P, 2, (char*)kvm_sys_state.eth_addr, 4);
						system("python /kvmapp/system/update-nanokvm.py");
					} else {
						OLED_ShowString(0, 0, "Update fail",  8);
						OLED_ShowString(0, 1, "Please open",  8);
						OLED_ShowString_AlignRight(AlignRightEND_P, 2, (char*)kvm_sys_state.eth_addr, 4);
						OLED_ShowString(0, 3, "update APP" ,  8);
					}
				}
				while(1){
					time::sleep_ms(1000);
					if(chack_net_state(ETH_ROUTE) == 0) {
						OLED_Clear();
						break;
					}
				}
			} else {
				get_ip_addr(ETH_ROUTE);
				if(kvm_hw_ver != 2){
					OLED_ShowString(1, 2, " Please connect ", 16);
					OLED_ShowString(1, 4, " to the network ", 16);
					OLED_ShowString(1, 6, " to update app  ", 16);
				} else {
					// PCIe
					OLED_ShowString(0, 0, "Please link",  8);
					OLED_ShowString(0, 1, "to network",  8);
					OLED_ShowString(0, 2, "update APP" ,  8);
				}

				time::sleep_ms(10);
			}
		}
	}
}