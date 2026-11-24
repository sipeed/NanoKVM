#include "kvm_vision.h"
#include "lontium_hdmi.hpp"
#include "kvm_mmf.hpp"

#include <atomic>
#include <cerrno>
#include <chrono>
#include <cstdarg>
#include <cstdio>
#include <cstdlib>
#include <fcntl.h>
#include <mutex>
#include <pthread.h>
#include <thread>
#include <sys/stat.h>
#include <unistd.h>

#define VENC_MJPEG 0
#define VENC_H264 1
#define default_h264_gop 30
#define hdmi_signal_file_path "/kvmapp/kvm/state"
#define watchdog_mode_path "/etc/kvm/watchdog"
#define watchdog_temp_path "/tmp/watchdog"
#define watchdog_file "/tmp/nanokvm_wd"

namespace {

std::mutex capture_mutex[2];
pthread_t detection_thread, watchdog_thread;
bool detection_started = false, watchdog_started = false;
std::atomic<bool> try_exit_thread{true};
std::atomic<uint8_t> hdmi_signal_active{0};
std::atomic<uint8_t> kvmvenc_gop{default_h264_gop};
std::atomic<bool> debug_en{false};
uint8_t frame_detect = 0;

// Writers hold both capture mutexes, readers hold their codec's mutex.
int input_result = -4;
uint64_t input_sequence = 0;
kvm_mmf::InputTiming capture_input;
unsigned capture_attempts = 0;
std::chrono::steady_clock::time_point last_capture_attempt;
struct {
    uint64_t hash = 0;
    uint8_t count = 0;
    bool unchanged = false;
} jpeg_detection;

void sleep_ms(unsigned milliseconds)
{
    std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
}

void debug(const char *format, ...)
{
    if (debug_en) {
        va_list args;
        va_start(args, format);
        vprintf(format, args);
        va_end(args);
    }
}

int maxmin_data(int maximum, int minimum, int value)
{
    return value > maximum ? maximum : value < minimum ? minimum : value;
}

bool write_hdmi_signal_file(uint8_t active)
{
    char temp_path[] = "/kvmapp/kvm/.state.tmp.XXXXXX";
    const char *state = active ? "1\n" : "0\n";
    int fd = mkstemp(temp_path);
    if (fd < 0) return false;
    int failure = fchmod(fd, 0644) == 0 ? 0 : errno;
    size_t written = 0;
    while (!failure && written < 2) {
        ssize_t result = write(fd, state + written, 2 - written);
        if (result > 0) written += static_cast<size_t>(result);
        else if (result < 0 && errno == EINTR) continue;
        else failure = result < 0 ? errno : EIO;
    }
    if (!failure && fsync(fd) != 0) failure = errno;
    if (close(fd) != 0 && !failure) failure = errno;
    if (!failure && rename(temp_path, hdmi_signal_file_path) != 0) failure = errno;
    if (failure) {
        unlink(temp_path);
        debug("[hdmi] failed to publish state: %d\n", failure);
    }
    return failure == 0;
}

void set_hdmi_signal_state(bool active)
{
    // Compatibility for existing consumers; this is receiver signal state,
    // independent of whether VI or an encoder is running successfully.
    if (hdmi_signal_active.exchange(active) != active) write_hdmi_signal_file(active);
}

uint8_t watchdog_sf_is_open(void)
{
	if(access(watchdog_mode_path, F_OK) == 0) return 1;
    else if(access(watchdog_temp_path, F_OK) == 0) return 1;
	else return 0;
}

int vision_update_watchdog()
{
    FILE *file;

    file = fopen(watchdog_file, "w");
    if (file == NULL) {
        debug("[kvmv] watchdog open error\n");
        return -1;
    }
    // fprintf(file, "%s", 'v');
    fclose(file);
    return 1;
}

uint8_t chack_ion()
{
    // cat /sys/kernel/debug/ion/cvi_carveout_heap_dump/summary | grep "usage rate:" | awk -F '[:%]' '{print $2}'
	uint8_t RW_Data[10];
    uint8_t ATOI_Data[3] = {0};
    uint8_t ion_usage_rate;
    char Cmd[150]={0};
    // sprintf( Cmd, "cat /sys/kernel/debug/ion/cvi_carveout_heap_dump/summary | grep \"usage rate:\" | awk -F '[:%]' '{print $2}'");
    sprintf( Cmd, "cat /sys/kernel/debug/ion/cvi_carveout_heap_dump/summary | grep \"usage rate:\" | awk '{print $2}'");
    FILE* fp = popen( Cmd, "r" );
    if ( NULL == fp )
    {
        return 0;
    }
    fgets((char*)RW_Data, 8, fp);
    pclose(fp);
    RW_Data[8] = 0;
    if (RW_Data[6] == '&') return 1;
    else {
        ATOI_Data[0] = RW_Data[5];
        ATOI_Data[1] = RW_Data[6];
    }
    ion_usage_rate = atoi((char*)ATOI_Data);

    if(ion_usage_rate >= 95) return 1;
    else return 2;
}


void *watchdog_sf_feed(void *)
{
    while (!try_exit_thread) {
        sleep_ms(500);
        if (watchdog_sf_is_open()) {
            if (chack_ion() == 1) {
                debug("[kvmv] Ion memory is full reboot now!\n");
                system("reboot");
            }
            vision_update_watchdog();
        }
    }
    return nullptr;
}

// Called with both capture mutexes held, including when proc is unavailable.
void apply_hdmi_status(const lontium_hdmi::Status &status, int read_result)
{
    input_sequence = read_result == 0 ? status.sequence : 0;
    const bool valid = read_result == 0 && status.capture_ready();
    set_hdmi_signal_state(valid);
    if (!valid) {
        input_result = read_result < 0 || status.signal == lontium_hdmi::Signal::Error ? -7 :
            status.signal == lontium_hdmi::Signal::Off ||
            status.signal == lontium_hdmi::Signal::Absent ? IMG_NOT_EXIST : -4;
        capture_input = {};
        capture_attempts = 0;
        jpeg_detection = {};
        if (!kvm_mmf::deinitialize()) input_result = IMG_VENC_ERROR;
        return;
    }

    kvm_mmf::InputTiming next;
    next.width = status.csi.width;
    next.height = status.csi.height;
    next.htotal = status.csi.htotal;
    next.vtotal = status.csi.vtotal;
    next.fps_millihz = status.csi.fps_millihz;
    if (!kvm_mmf::same_input(capture_input, next)) {
        jpeg_detection = {};
        capture_attempts = 0;
        input_result = -4;
    }
    capture_input = next;
    if (!kvm_mmf::supported_input(next)) {
        input_result = -6;
        if (!kvm_mmf::deinitialize()) input_result = IMG_VENC_ERROR;
        return;
    }
    if (input_result == 0 || capture_attempts >= 3) return;
    const auto now = std::chrono::steady_clock::now();
    if (capture_attempts && now - last_capture_attempt < std::chrono::seconds(1)) return;
    ++capture_attempts;
    last_capture_attempt = now;
    input_result = kvm_mmf::configure(next) ? 0 : IMG_VENC_ERROR;
}

void *vi_subsystem_detection(void *)
{
    lontium_hdmi::StatusReader reader;
    bool opened = false;
    int last_error = 0;
    uint64_t last_sequence = 0;
    while (!try_exit_thread) {
        lontium_hdmi::Status status;
        int result = 0;
        if (!opened) {
            result = reader.open();
            opened = result == 0;
            last_sequence = 0;
        }
        {
            std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
            std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
            std::lock(h264, mjpeg);
            if (try_exit_thread) break;
            // Read inside the same lock used by HDMI power commands, so an
            // old pre-power snapshot cannot restart capture after shutdown.
            if (opened) result = reader.read(status);
            apply_hdmi_status(status, result);
        }
        if (result != last_error) {
            if (result < 0) fprintf(stderr, "[hdmi] status read failed: %d\n", result);
            last_error = result;
        }
        if (result < 0) {
            reader.close();
            opened = false;
            sleep_ms(250);
            continue;
        }
        if (status.sequence != last_sequence) {
            debug("[hdmi] %s power=%s signal=%s csi=%ux%u fps_millihz=%u error=%d\n",
                  status.chip.c_str(), status.powered ? "on" : "off",
                  lontium_hdmi::signal_name(status.signal), status.csi.width, status.csi.height,
                  status.csi.fps_millihz, status.error);
            last_sequence = status.sequence;
        }
        // Re-read on timeout too: retry setup at most three times per timing,
        // using the same confirmed source. A new signal or power-on retries.
        result = reader.wait(1000);
        if (result < 0 && result != -EINTR) {
            reader.close();
            opened = false;
            std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
            std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
            std::lock(h264, mjpeg);
            apply_hdmi_status(lontium_hdmi::Status(), result);
        }
    }
    return nullptr;
}

} // namespace

void set_h264_gop(uint8_t gop)
{
    kvmvenc_gop = maxmin_data(100, 1, gop);
}

void set_frame_detact(uint8_t interval)
{
    std::lock_guard<std::mutex> lock(capture_mutex[VENC_MJPEG]);
    frame_detect = maxmin_data(100, 0, interval);
    jpeg_detection = {};
}

void kvmv_init(uint8_t debug_info)
{
    debug_en = debug_info != 0;
    try_exit_thread = false;
    if (!detection_started) {
        hdmi_signal_active = 0;
        write_hdmi_signal_file(0);
        detection_started = pthread_create(&detection_thread, nullptr, vi_subsystem_detection, nullptr) == 0;
        if (!detection_started) fprintf(stderr, "[kvmv] cannot start HDMI monitoring\n");
    }
    if (!watchdog_started) {
        watchdog_started = pthread_create(&watchdog_thread, nullptr, watchdog_sf_feed, nullptr) == 0;
    }
}

int kvmv_read_img(uint16_t width, uint16_t height, uint8_t type,
                  uint16_t quality, uint16_t fps, kvmv_frame_t *out)
{
    if (!out) return IMG_VENC_ERROR;
    *out = {};
    if (type > VENC_H264) return IMG_VENC_ERROR;
    std::lock_guard<std::mutex> lock(capture_mutex[type]);
    if (try_exit_thread) return IMG_NOT_EXIST;
    if (input_result != 0) return input_result;
    if (width == 0 || height == 0) {
        width = capture_input.width;
        height = capture_input.height;
    }
    quality = type == VENC_H264 ? maxmin_data(10000, 500, quality) : maxmin_data(100, 50, quality);
    fps = maxmin_data(60, 1, fps);
    auto codec = static_cast<kvm_mmf::Codec>(type);
    kvm_mmf::Frame frame;
    int result = kvm_mmf::acquire(codec, width, height, quality, fps, kvmvenc_gop, &frame);
    if (result < 0) return result;

    if (codec == kvm_mmf::MJPEG) {
        if (frame_detect == 0) {
            jpeg_detection = {};
        } else if (jpeg_detection.unchanged || ++jpeg_detection.count >= frame_detect) {
            jpeg_detection.count = 0;
            uint64_t hash = 14695981039346656037ULL;
            for (uint32_t i = 0; i < frame.size; ++i) hash = (hash ^ frame.data[i]) * 1099511628211ULL;
            jpeg_detection.unchanged = hash == jpeg_detection.hash;
            jpeg_detection.hash = hash;
            if (jpeg_detection.unchanged) {
                kvm_mmf::release(codec, frame.token);
                free(frame.data);
                return 5;
            }
        }
    }
    *out = {frame.data, frame.size, frame.timestamp, frame.token, type};
    return codec == kvm_mmf::MJPEG ? IMG_MJPEG_TYPE :
           (frame.keyframe ? IMG_H264_TYPE_IF : IMG_H264_TYPE_PF);
}

void kvmv_release_frame(kvmv_frame_t *frame)
{
    if (!frame || !frame->data) return;
    kvm_mmf::release(static_cast<kvm_mmf::Codec>(frame->codec), frame->token);
    free(frame->data);
    *frame = {};
}

void kvmv_stop_stream(uint8_t type)
{
    if (type > VENC_H264) return;
    std::lock_guard<std::mutex> lock(capture_mutex[type]);
    kvm_mmf::stop(static_cast<kvm_mmf::Codec>(type));
    if (type == VENC_MJPEG) jpeg_detection = {};
}

void kvmv_deinit()
{
    try_exit_thread = true;
    if (detection_started) { pthread_join(detection_thread, nullptr); detection_started = false; }
    if (watchdog_started) { pthread_join(watchdog_thread, nullptr); watchdog_started = false; }
    std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
    std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
    std::lock(h264, mjpeg);
    if (!kvm_mmf::deinitialize()) fprintf(stderr, "[kvmv] video shutdown failed\n");
    set_hdmi_signal_state(false);
    input_result = -4;
    input_sequence = 0;
    capture_input = {};
    capture_attempts = 0;
    jpeg_detection = {};
}

int kvmv_hdmi_control(uint8_t enable)
{
    if (enable > 1) return -EINVAL;
    std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
    std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
    std::lock(h264, mjpeg);
    if (!enable) {
        input_result = IMG_VENC_ERROR;
        // Stop the whole VI/VPSS/VENC pipeline before holding the chip in reset.
        if (!kvm_mmf::deinitialize()) return -EIO;
    }
    int fd = open("/proc/lontium/power", O_WRONLY | O_CLOEXEC);
    if (fd < 0) return -errno;
    const char *command = enable ? "1\n" : "0\n";
    ssize_t count;
    do { count = write(fd, command, 2); } while (count < 0 && errno == EINTR);
    int result = count < 0 ? -errno : count == 2 ? 0 : -EIO;
    close(fd);
    if (result < 0) return result;
    input_result = enable ? (input_result == 0 ? 0 : -4) : IMG_NOT_EXIST;
    if (!enable || input_result != 0) input_sequence = 0;
    capture_attempts = 0;
    if (!enable) {
        set_hdmi_signal_state(false);
        capture_input = {};
        jpeg_detection = {};
    }
    return 0;
}

uint8_t kvmv_hdmi_signal_active()
{
    return hdmi_signal_active.load();
}

int kvmv_capture_state(uint64_t *receiver_sequence)
{
    std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
    std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
    std::lock(h264, mjpeg);
    if (receiver_sequence) *receiver_sequence = input_sequence;
    return input_result;
}
