#include "config.h"
#include "system_init.h"

#include <errno.h>
#include <sys/stat.h>

using namespace maix;
using namespace maix::sys;

static bool write_hdmi_state(uint8_t active)
{
    char temp_path[] = "/kvmapp/kvm/.state.init.XXXXXX";
    const char *state = active != 0 ? "1\n" : "0\n";
    int fd = mkstemp(temp_path);
    if(fd < 0){
        printf("failed to create HDMI state file: %d\n", errno);
        return false;
    }

    int failure = 0;
    if(fchmod(fd, 0644) != 0){
        failure = errno;
    }
    if(failure == 0 && write(fd, state, 2) != 2){
        failure = errno != 0 ? errno : EIO;
    }
    if(failure == 0 && fsync(fd) != 0){
        failure = errno;
    }
    if(close(fd) != 0 && failure == 0){
        failure = errno;
    }
    if(failure == 0 && rename(temp_path, "/kvmapp/kvm/state") != 0){
        failure = errno;
    }
    if(failure != 0){
        unlink(temp_path);
        printf("failed to publish HDMI state file: %d\n", failure);
    }
    return failure == 0;
}

void Production_testing_patch(void)
{	
	// New products default to disabling mDNS functionality
	system("rm -f /etc/init.d/S50ssdpd");
	system("sync");
}

static bool init_command(const char *command)
{
	if(system(command) == 0) return true;
	fprintf(stderr, "[kvms] migration failed: %s\n", command);
	return false;
}

AppInitResult new_app_init(void)
{
	if(!init_command("/kvmapp/system/update-lontium-firmware.sh")) return APP_INIT_FAILED;
	// Apply changed board setup on the next boot, before loading the receiver.
	// This also releases any GPIOs exported by the old S15kvmhwd.
	const bool hardware_init_changed = access("/run/nanokvm-hardware-reboot", F_OK) == 0 || system(
	    "cmp -s /kvmapp/system/init.d/S15kvmhwd /etc/init.d/S15kvmhwd && "
	    "cmp -s /kvmapp/system/init.d/S16lontium /etc/init.d/S16lontium") != 0;
	// Keep the reboot requirement across failed migration retries in this boot.
	if(hardware_init_changed && !init_command("touch /run/nanokvm-hardware-reboot")) return APP_INIT_FAILED;

	// Update the necessary scripts
	system("rm -f /boot/logo.jpeg");
	if(!init_command("mkdir -p /etc/kvm /kvmapp/kvm")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/update-nanokvm.py /etc/kvm/")) return APP_INIT_FAILED;
	system("rm -f /etc/init.d/S02udisk");
	if(!init_command("cp -f /kvmapp/system/init.d/S00kmod /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S01fs /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S03usbdev /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S15kvmhwd /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S16lontium /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S30eth /etc/init.d/")) return APP_INIT_FAILED;
	if(!init_command("cp -f /kvmapp/system/init.d/S50sshd /etc/init.d/")) return APP_INIT_FAILED;
	if(kvm_wifi_exist()) {
		if(!init_command("cp -f /kvmapp/system/init.d/S30wifi /etc/init.d/")) return APP_INIT_FAILED;
	} else {
		system("rm -f /etc/init.d/S30wifi");
	}
	
	// if exit /etc/init.d/S98tailscaled then cp -f /kvmapp/system/init.d/S98tailscaled /etc/init.d/
	if(access("/etc/init.d/S98tailscaled", F_OK) == 0){
		if(!init_command("cp -f /kvmapp/system/init.d/S98tailscaled /etc/init.d/")) return APP_INIT_FAILED;
	}

	// rmmod soph_saradc
	system("rmmod soph_saradc");
	system("rm -f /mnt/system/ko/soph_saradc.ko");

	// Keep an already running legacy shell on its original script inode.
	if(!init_command("cp /kvmapp/system/init.d/S95nanokvm /etc/init.d/.S95nanokvm.new && "
	                 "chmod 755 /etc/init.d/.S95nanokvm.new && "
	                 "mv -f /etc/init.d/.S95nanokvm.new /etc/init.d/S95nanokvm")) return APP_INIT_FAILED;

	// Remove unnecessary components to speed up boot time
	system("rm -f /etc/init.d/S04backlight");
	system("rm -f /etc/init.d/S05tp");
	system("rm -f /etc/init.d/S40bluetoothd");
	system("rm -f /etc/init.d/S50ssdpd");
	system("rm -f /etc/init.d/S99*");
	if(!init_command("rm -f /etc/init.d/S96lontium-hdmi-test /etc/kvm/hdmi_version /etc/kvm/hdmi_mode")) return APP_INIT_FAILED;
	
	// Add necessary configuration files for program execution
	if(!init_command("echo 0 > /kvmapp/kvm/now_fps && echo 30 > /kvmapp/kvm/fps && "
	                 "echo 2000 > /kvmapp/kvm/qlty && echo h264 > /kvmapp/kvm/type && "
	                 "touch /etc/kvm/frame_detact")) return APP_INIT_FAILED;
	if(!write_hdmi_state(0)) return APP_INIT_FAILED;

	// rm jpg_stream & kvm_stream
	system("rm -rf /kvmapp/jpg_stream");
	system("rm -f /kvmapp/kvm_system/kvm_stream");	// Cannot delete temporarily; the old production test script uses this file to determine if the download is complete

	create_temp_watchdog();

	if(unlink("/kvmapp/kvm_new_app") != 0) return APP_INIT_FAILED;
	sync();
	return hardware_init_changed ? APP_INIT_REBOOT : APP_INIT_OK;
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
