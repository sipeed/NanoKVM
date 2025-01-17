#include "config.h"

using namespace maix;
using namespace maix::sys;
using namespace maix::peripheral;

kvm_sys_state_t kvm_sys_state;
kvm_oled_state_t kvm_oled_state;

/*
init.d:
/etc/init.d/S00kmod
/etc/init.d/S01fs

*/

void build_recovery(void)
{
	uint8_t need_recovery = 0;
	if (access("/recovery", F_OK) != 0) {
		printf("unexist /recovery\n");
		mkdir("/recovery", 0777);
		need_recovery = 1;
	} else {
		printf("exist /recovery\n");

	}
}

void* thread_oled_handle(void * arg)
{
	OLED_Init();
	OLED_ColorTurn(0);		//0正常显示 1 反色显示
	OLED_DisplayTurn(0);	//0正常显示 1 屏幕翻转显示
	OLED_Clear();

    while(kvm_sys_state.oled_thread_running)
    {
		oled_auto_sleep();
		// printf("[kvmd]thread_oled_handle - while\n");
		uint8_t page_changed = (kvm_oled_state.page == kvm_sys_state.page)? 0:1;
		uint8_t subpage_changed = (kvm_oled_state.sub_page == kvm_sys_state.sub_page)? 0:1;
		// printf("subpage_changed = %d", subpage_changed);
		// printf("kvm_oled_state.sub_page = %d", kvm_oled_state.sub_page);
		// printf("kvm_sys_state.sub_page = %d\n", kvm_sys_state.sub_page);
		kvm_oled_state.page = kvm_sys_state.page;
		kvm_oled_state.sub_page = kvm_sys_state.sub_page;


		switch(kvm_oled_state.page){
			case 0 : // main page
				kvm_main_ui_disp(page_changed, subpage_changed);
				break;
			case 1 : // wifi config page
				kvm_wifi_config_ui_disp(page_changed, subpage_changed);
				break;
			default:
				OLED_Clear();
		}
		time::sleep_ms(OLED_DELAY);
    }
	OLED_Clear();
	kvm_sys_state.oled_thread_running = -1;
}

void* thread_key_handle(void * arg)
{
	uint64_t __attribute__((unused)) press_time;
	uint32_t press_cycle;
	int fd = open ("/dev/input/event0", O_RDONLY);
	if (fd == -1) {
		kvm_sys_state.key_thread_running = 0;
	}
	struct input_event event;

    while(kvm_sys_state.key_thread_running)
    {
		read (fd, &event, sizeof (event));
		if (event.type == EV_KEY) {
			if (event.value == 1){
				// printf ("[kvmk]按键按下\n");
				press_time = time::time_ms();
			} else if (event.value == 0){
				oled_auto_sleep_time_update();
				// printf ("[kvmk]按键抬起\n");
				press_cycle = time::time_ms() - press_time;
				if(press_cycle >= KEY_LONGLONG_PRESS){
					kvm_reset_password();
				} else if (press_cycle >= KEY_LONG_PRESS && press_cycle < KEY_LONGLONG_PRESS){
					// long
					// printf ("[kvmk]按键长按\n");
					// printf("[kvmk]wifi_state = %d\n", kvm_sys_state.wifi_state);
					if(kvm_sys_state.wifi_state == -2){
						kvm_sys_state.page = 0;
						kvm_sys_state.sub_page = 0;
						continue;
					}
					switch(kvm_sys_state.page){
						case 0:	// main page
							kvm_sys_state.page = 1;
							kvm_sys_state.sub_page = 0;
							break;
						case 1:	// wifi coonfig page
							system("/etc/init.d/S30wifi restart");
							kvm_sys_state.page = 0;
							kvm_sys_state.sub_page = 0;
							kvm_sys_state.wifi_config_process = -1;
							break;
					}
				} else {
					// short
					// printf ("[kvmk]按键短按\n");
					// printf ("[kvmk]wifi_config_process = %d\n", kvm_sys_state.wifi_config_process);
					// printf ("[kvmk]page = %d\n", kvm_sys_state.page);
					// printf ("[kvmk]sub_page = %d\n", kvm_sys_state.sub_page);
					switch(kvm_sys_state.page){
						case 0:	// main page
							if(kvm_sys_state.sub_page == 0) kvm_sys_state.sub_page = 1;
							else kvm_sys_state.sub_page = 0;
							break;
						case 1:	// wifi coonfig page
							switch(kvm_sys_state.wifi_config_process){
								case 1:	// QR1<->TEXT2
									if(kvm_sys_state.sub_page == 1) kvm_sys_state.sub_page = 2;
									else kvm_sys_state.sub_page = 1;
									// printf("[kvmk]sub_page = %d\n", kvm_sys_state.sub_page);
									break;
								case 2:
									if(kvm_sys_state.sub_page == 1) kvm_sys_state.sub_page = 2;
									else if(kvm_sys_state.sub_page == 2) kvm_sys_state.sub_page = 3;
									else if(kvm_sys_state.sub_page == 3) kvm_sys_state.sub_page = 4;
									else kvm_sys_state.sub_page = 1;
									break;
							}
							break;
					}
				}
			}
		}
		time::sleep_ms(KEY_DELAY);
    }
	kvm_sys_state.key_thread_running = 0;
}

void* thread_sys_handle(void * arg)
{
    while(kvm_sys_state.sys_thread_running)
    {
		// printf("[kvmsys]main while start!\n");
		// net
		if(kvm_sys_state.page == 0){
			kvm_update_eth_state();
			kvm_update_wifi_state();
			// kvm_update_rndis_state();
			// kvm_update_tailscale_state();
			// sys_state
			kvm_update_usb_state();
			kvm_update_hdmi_state();
			kvm_update_stream_fps();
			kvm_update_hdmi_res();
			kvm_update_stream_type();
			kvm_update_stream_qlty();

			kvm_wifi_web_config_process();
		} else if(kvm_sys_state.page == 1){
			kvm_wifi_config_process();
		}

		time::sleep_ms(STATE_DELAY);
    }
	kvm_sys_state.sys_thread_running = 0;
}

int main(int argc, char* argv[])
{
    // Catch SIGINT signal(e.g. Ctrl + C), and set exit flag to true.
    signal(SIGINT, [](int sig){ 
	kvm_sys_state.oled_thread_running = 0;
	kvm_sys_state.key_thread_running = 0;
	kvm_sys_state.sys_thread_running = 0;
	app::set_exit_flag(true); 
	log::info("[kvms]Prepare to exit\n");
	});	

	pthread_t sys_state_thread;
	pthread_t display_thread;
	pthread_t key_thread;

	// first_start();

	init_upadte();

	OLED_state = oled_exist();
	if(OLED_state){
		printf("oled exist\r\n");
		system("touch /etc/kvm/oled_exist");
	} else {
		printf("oled not exist\r\n");
		system("rm /etc/kvm/oled_exist");
	}

	if(kvm_sys_state.sys_thread_running == 0){
		kvm_sys_state.sys_thread_running = 1;
		if (0 != pthread_create(&sys_state_thread, NULL, thread_sys_handle, NULL)) {
			kvm_sys_state.sys_thread_running = 0;
			printf("[kvms]create thread failed!\r\n");
		}
	}
	if(OLED_state == 1 && kvm_sys_state.oled_thread_running == 0){
		kvm_sys_state.oled_thread_running = 1;
		if (0 != pthread_create(&display_thread, NULL, thread_oled_handle, NULL)) {
			kvm_sys_state.oled_thread_running = 0;
			printf("[kvms]create thread failed!\r\n");
		}
	}
	if(kvm_sys_state.key_thread_running == 0){
		kvm_sys_state.key_thread_running = 1;
		if (0 != pthread_create(&key_thread, NULL, thread_key_handle, NULL)) {
			kvm_sys_state.key_thread_running = 0;
			printf("[kvms]create thread failed!\r\n");
		}
	}

	// while(!app::need_exit()){
	while(kvm_sys_state.sys_thread_running){
		time::sleep_ms(1000);
	}
	kvm_sys_state.sys_thread_running = 0;
	kvm_sys_state.oled_thread_running = 0;
	kvm_sys_state.key_thread_running = 0;
	while(kvm_sys_state.oled_thread_running != -1) time::sleep_ms(100);
}

