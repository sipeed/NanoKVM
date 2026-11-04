#include "kvm_vision.h"
#include "maix_basic.hpp"

using namespace maix;

int main()
{
    signal(SIGINT, [](int) { app::set_exit_flag(true); });
    kvmv_hdmi_control(1);
    kvmv_init(0);
    set_h264_gop(30);

    uint8_t codec = 0;
    while (!app::need_exit()) {
        kvmv_frame_t frame = {};
        int result = kvmv_read_img(1920, 1080, codec, codec ? 3000 : 60, 60, &frame);
        printf("codec=%u result=%d size=%u pts=%llu\n", codec, result, frame.size,
               static_cast<unsigned long long>(frame.timestamp));
        kvmv_release_frame(&frame);
        codec ^= 1;
    }
    kvmv_deinit();
}
