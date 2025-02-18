#include "config.h"
#include "system_init.h"

using namespace maix;
using namespace maix::sys;

extern kvm_sys_state_t kvm_sys_state;
extern kvm_oled_state_t kvm_oled_state;

void new_app_init(void)
{
	// Update the necessary scripts
	system("cp -f /kvmapp/system/update-nanokvm.py /etc/kvm/");
	system("rm /etc/init.d/S02udisk");
	system("cp /kvmapp/system/init.d/S01fs /etc/init.d/");
	system("cp /kvmapp/system/init.d/S03usbdev /etc/init.d/");
	system("cp /kvmapp/system/init.d/S15kvmhwd /etc/init.d/");
	system("cp /kvmapp/system/init.d/S30eth /etc/init.d/");
	system("cp /kvmapp/system/init.d/S50sshd /etc/init.d/");
	if(kvm_wifi_exist()) {
		system("cp /kvmapp/system/init.d/S30wifi /etc/init.d/");
	} else {
		system("rm /etc/init.d/S30wifi");
	}

	// PCIe Patch
	// system("cp /kvmapp/system/init.d/S95nanokvm /etc/init.d/");
	if(access("/kvmapp/jpg_stream/dl_lib/libmaixcam_lib.so", F_OK) != 0){
		system("cp /kvmapp/system/init.d/S95nanokvm /etc/init.d/");
	}

	// Remove unnecessary components to speed up boot time
	system("rm /etc/init.d/S04backlight");
	system("rm /etc/init.d/S05tp");
	system("rm /etc/init.d/S40bluetoothd");
	system("rm /etc/init.d/S50ssdpd");
	system("rm /etc/init.d/S99*");
	
	// Add necessary configuration files for program execution
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
	system("rm /kvmapp/kvm_system/kvm_stream");	// Cannot delete temporarily; the old production test script uses this file to determine if the download is complete

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
	
	system("sync");
	system("killall NanoKVM-Server");
	system("rm -r /tmp/server");
	system("cp -r /kvmapp/server /tmp/");
	system("/tmp/server/NanoKVM-Server &");
}

void build_complete_resolv(void)
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

void new_img_init(void)
{
	build_complete_resolv();
	system("rm /kvmapp/kvm_new_img");
}