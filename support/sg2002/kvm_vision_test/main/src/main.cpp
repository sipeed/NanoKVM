#include "kvm_vision.h"
#include "maix_basic.hpp"

using namespace maix;
using namespace maix::sys;

// #define NOT_GET_IMG

int main(int argc, char* argv[])
{
	uint64_t __attribute__((unused)) start_time;
	// Catch SIGINT signal(e.g. Ctrl + C), and set exit flag to true.
    signal(SIGINT, [](int sig){ app::set_exit_flag(true); 
	log::info("========================\n");
	});

	kvmv_hdmi_control(0);
	kvmv_hdmi_control(1);

	kvmv_init(0);
	set_h264_gop(30);

	uint16_t get_fream_count = 0;

	while(!app::need_exit()){
#ifdef NOT_GET_IMG
		printf("NOT_GET_IMG ...\n");
		time::sleep_ms(1000);
#else
		uint8_t* p_kvmv_img_data;
		uint32_t kvmv_img_data_size;
		int ret;

		printf("KVM-Vison Get Fream ...\n");
		
		start_time = time::time_ms();
		if(get_fream_count < 1){
			get_fream_count ++;
			ret = kvmv_read_img(1920, 1080, 1, 3000, &p_kvmv_img_data, &kvmv_img_data_size);
		} else if(get_fream_count >= 1 && get_fream_count < 2){
			get_fream_count ++;
			ret = kvmv_read_img(0, 0, 0, 60, &p_kvmv_img_data, &kvmv_img_data_size);
		} else {
			get_fream_count = 0;
		}
		
		// printf("kvmv_read_img(): %d \r\n", (int)(time::time_ms() - start_time));

		// ret = kvmv_read_img(1920, 1080, 1, 3000, &p_kvmv_img_data, &kvmv_img_data_size);
		// ret = kvmv_read_img(1920, 1080, 0, 60, &p_kvmv_img_data, &kvmv_img_data_size);

		printf("kvmv_read_img ret = %d\n", ret);

		// send...
		// if(ret >= 0){
			free_kvmv_data(&p_kvmv_img_data);
		// }
#endif
	}
	kvmv_deinit();
}