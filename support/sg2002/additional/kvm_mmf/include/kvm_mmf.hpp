#pragma once

#include <stdint.h>

// VI -> VPSS -> VENC, with no application queue of encoded frames.
namespace kvm_mmf __attribute__((visibility("default"))) {

enum Codec { MJPEG = 0, H264 = 1 };

struct InputTiming {
    uint32_t width = 0, height = 0;
    uint32_t htotal = 0, vtotal = 0;
    uint32_t fps_millihz = 0; // Zero means unknown, not 60 Hz.
};

inline bool supported_input(const InputTiming &input)
{
    return input.width >= 32 && input.width <= 1920 && input.width % 2 == 0 &&
           input.height >= 4 && input.height <= 1080 && input.height % 2 == 0;
}

inline bool same_input(const InputTiming &a, const InputTiming &b)
{
    // Match the driver's tolerance for clock measurement noise.
    return a.width == b.width && a.height == b.height &&
           a.htotal == b.htotal && a.vtotal == b.vtotal &&
           (uint64_t(a.fps_millihz) + 500) / 1000 ==
           (uint64_t(b.fps_millihz) + 500) / 1000 &&
           (a.fps_millihz == 0) == (b.fps_millihz == 0);
}

struct Frame {
    uint8_t *data = nullptr;
    uint32_t size = 0;
    uint64_t timestamp = 0; // SDK capture PTS, in microseconds.
    uint64_t token = 0;
    bool keyframe = false;
};

// Configure only confirmed CSI input; identical timing keeps the pipeline.
// Failure leaves acquisition disabled. No implicit initialization in acquire.
bool configure(const InputTiming &input);
bool deinitialize();
void stop(Codec codec);

int acquire(Codec codec, uint16_t width, uint16_t height, uint16_t quality,
            uint16_t fps, uint8_t gop, Frame *frame);
void release(Codec codec, uint64_t token);

} // namespace kvm_mmf
