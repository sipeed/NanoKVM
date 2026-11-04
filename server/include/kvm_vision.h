#ifndef KVM_VISION_H_
#define KVM_VISION_H_

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define IMG_BUFFER_FULL -3
#define IMG_VENC_ERROR  -2
#define IMG_NOT_EXIST   -1
#define IMG_MJPEG_TYPE   0
#define IMG_H264_TYPE_IF 3
#define IMG_H264_TYPE_PF 4

typedef struct {
    uint8_t *data;
    uint32_t size;
    uint64_t timestamp;
    uint64_t token;
    uint8_t codec;
} kvmv_frame_t;

void kvmv_init(uint8_t debug_info);
void kvmv_deinit(void);

// type: 0 = MJPEG, 1 = H.264. A zero width/height follows the input size.
// quality: MJPEG 50..100, H.264 500..10000 Kbps. fps: 1..60.
// Returns -7 input error, -6 unsupported size, -5 busy, -4 reconfiguring,
// -3 allocation failure, -2 encoder error, -1 no frame, 0 JPEG, 3 IDR,
// 4 P-frame, or 5 unchanged JPEG. Release every successful frame once.
int kvmv_read_img(uint16_t width, uint16_t height, uint8_t type,
                  uint16_t quality, uint16_t fps, kvmv_frame_t *frame);
// Frees the copied bytes and releases the encoder lease. Safe after shutdown.
void kvmv_release_frame(kvmv_frame_t *frame);
void kvmv_stop_stream(uint8_t type);
void set_h264_gop(uint8_t gop);
void set_frame_detact(uint8_t interval);
uint8_t kvmv_hdmi_control(uint8_t enable);
uint8_t kvmv_hdmi_signal_active(void);

#ifdef __cplusplus
}
#endif

#endif // KVM_VISION_H_
