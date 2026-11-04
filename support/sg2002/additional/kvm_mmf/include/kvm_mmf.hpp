#pragma once

#include <stdint.h>

// VI -> VPSS -> VENC, with no application queue of encoded frames.
namespace kvm_mmf __attribute__((visibility("default"))) {

enum Codec { MJPEG = 0, H264 = 1 };

struct Frame {
    uint8_t *data = nullptr;
    uint32_t size = 0;
    uint64_t timestamp = 0; // SDK capture PTS, in microseconds.
    uint64_t token = 0;
    bool keyframe = false;
};

bool initialize();
bool restart();
void deinitialize();
void stop(Codec codec);

int acquire(Codec codec, uint16_t width, uint16_t height, uint16_t quality,
            uint16_t fps, uint8_t gop, Frame *frame);
void release(Codec codec, uint64_t token);

} // namespace kvm_mmf
