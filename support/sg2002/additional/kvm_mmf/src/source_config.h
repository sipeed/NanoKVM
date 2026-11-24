#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

struct kvm_source_config {
    uint32_t width, height, fps_millihz;
};

// Changed only after the previous VI/ISP has stopped. All SDK callbacks read
// this latch instead of opening proc or mixing separate width/height files.
void kvm_source_set(const struct kvm_source_config *config);
int kvm_source_get(struct kvm_source_config *config);
float kvm_source_sdk_fps(const struct kvm_source_config *config);

#ifdef __cplusplus
}
#endif
