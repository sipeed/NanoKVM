#include "source_config.h"

#include <pthread.h>
#include <string.h>

static pthread_mutex_t source_mutex = PTHREAD_MUTEX_INITIALIZER;
static struct kvm_source_config source;

void kvm_source_set(const struct kvm_source_config *config)
{
    pthread_mutex_lock(&source_mutex);
    if (config) source = *config;
    else memset(&source, 0, sizeof(source));
    pthread_mutex_unlock(&source_mutex);
}

int kvm_source_get(struct kvm_source_config *config)
{
    if (!config) return -1;
    pthread_mutex_lock(&source_mutex);
    *config = source;
    pthread_mutex_unlock(&source_mutex);
    return config->width && config->height ? 0 : -1;
}

float kvm_source_sdk_fps(const struct kvm_source_config *config)
{
    // The SDK requires a positive nominal rate even when LT6911C cannot
    // measure it. This is SDK configuration only; detected FPS stays zero.
    return config->fps_millihz ? config->fps_millihz / 1000.0f : 60.0f;
}
