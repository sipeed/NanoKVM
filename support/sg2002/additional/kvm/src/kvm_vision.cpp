#include "kvm_vision.h"
#include "maix_basic.hpp"
#include "maix_i2c.hpp"
#include "vi_state_shared.hpp"
#include "internal/vi_state_writer.hpp"
#include "kvm_mmf.hpp"

#include <atomic>
#include <cstdarg>
#include <mutex>
#include <pthread.h>
#include <errno.h>
#include <sys/stat.h>

#define VENC_MJPEG              0
#define VENC_H264               1

#define vi_min_width            32
#define vi_min_height           3
#define vi_max_width            1920
#define vi_max_height           1080

#define default_vi_width        1920
#define default_vi_height       1080
#define default_h264_gop        30

#define Try_rounds_HDMI_err_res 5

#define vi_width_path           "/kvmapp/kvm/width"
#define vi_height_path          "/kvmapp/kvm/height"
#define hdmi_mode_path          "/etc/kvm/hdmi_mode"
#define hdmi_state_path         "/proc/lt_int"
#define hdmi_signal_file_path   "/kvmapp/kvm/state"
#define watchdog_mode_path      "/etc/kvm/watchdog"
#define watchdog_temp_path      "/tmp/watchdog"
#define watchdog_file           "/tmp/nanokvm_wd"
#define vi_state_publish_interval_ms 10000U

#define LT6911_ADDR 	0x2B
#define LT6911_READ 	0xFF
#define LT6911_WRITE 	0x00

std::mutex capture_mutex[2];
pthread_t detection_thread, watchdog_thread;
bool detection_started = false, watchdog_started = false;
pthread_mutex_t hdmi_signal_mutex = PTHREAD_MUTEX_INITIALIZER;

static char NanoKVM_edit[] = {
	0x00,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0x00,0x41,0x0C,0x33,0xC2,0x66,0xBA,0x00,0x00,
	0x2B,0x1F,0x01,0x04,0xA5,0x50,0x22,0x78,0x3B,0xCC,0xE5,0xAB,0x51,0x48,0xA6,0x26,
	0x0C,0x50,0x54,0xBF,0xEF,0x00,0xD1,0xC0,0xB3,0x00,0x95,0x00,0x81,0x80,0x81,0x40,
	0x81,0xC0,0x01,0x01,0x01,0x01,0xD8,0x59,0x00,0x60,0xA3,0x38,0x28,0x40,0xA0,0x10,
	0x3A,0x10,0x20,0x4F,0x31,0x00,0x00,0x1A,0x00,0x00,0x00,0xFF,0x00,0x55,0x4B,0x30,
	0x32,0x31,0x34,0x33,0x30,0x34,0x37,0x37,0x31,0x38,0x00,0x00,0x00,0xFC,0x00,0x50,
	0x48,0x4C,0x20,0x33,0x34,0x32,0x45,0x32,0x0A,0x20,0x20,0x20,0x00,0x00,0x00,0xFD,
	0x00,0x30,0x4B,0x63,0x63,0x1E,0x01,0x0A,0x20,0x20,0x20,0x20,0x20,0x20,0x01,0x8E
};

using namespace maix;
using namespace maix::sys;
using namespace maix::peripheral;
i2c::I2C LT6911_i2c(4, i2c::Mode::MASTER);

enum ResolutionState { NORMAL_RES, NEW_RES, UNSUPPORT_RES, UNKNOWN_RES, ERROR_RES };

struct {
    std::atomic<uint16_t> vi_width{default_vi_width};
    std::atomic<uint16_t> vi_height{default_vi_height};
    uint8_t frame_detact = 0;
    std::atomic<bool> reopen_cam_flag{false};
    std::atomic<bool> try_exit_thread{false};
    uint8_t hdmi_version = 0;
    uint8_t hw_version = 0;
    std::atomic<bool> hdmi_stop_flag{false};
    std::atomic<bool> hdmi_reading_flag{false};
    uint8_t hdmi_mode = 0;
    std::atomic<uint8_t> hdmi_res_type{NORMAL_RES};
    std::atomic<uint8_t> hdmi_res_err{NORMAL_RES};
    uint8_t hdmi_try_rounds = 0;
    std::atomic<uint8_t> vi_detect_state{0};
} kvmv_cfg;

struct {
    uint64_t hash = 0;
    uint8_t count = 0;
    bool unchanged = false;
} jpeg_detection;

uint8_t debug_en = 0;
uint8_t last_vi_state_code = 0;
uint32_t last_vi_state_refresh_ms = 0;
uint8_t hdmi_capture_enabled = 0;
uint8_t hdmi_signal_active = 0;

void debug(const char *format, ...);

static bool write_hdmi_signal_file(uint8_t active)
{
    char temp_path[] = "/kvmapp/kvm/.state.tmp.XXXXXX";
    const char *state = active != 0 ? "1\n" : "0\n";
    const size_t state_size = 2;
    int fd = mkstemp(temp_path);
    if(fd < 0){
        debug("[hdmi] failed to create state file: %d\n", errno);
        return false;
    }

    int failure = 0;
    if(fchmod(fd, 0644) != 0){
        failure = errno;
    }

    size_t written = 0;
    while(failure == 0 && written < state_size){
        ssize_t result = write(fd, state + written, state_size - written);
        if(result > 0){
            written += (size_t)result;
        } else if(result < 0 && errno == EINTR){
            continue;
        } else {
            failure = result < 0 ? errno : EIO;
        }
    }

    if(failure == 0 && fsync(fd) != 0){
        failure = errno;
    }
    if(close(fd) != 0 && failure == 0){
        failure = errno;
    }
    if(failure == 0 && rename(temp_path, hdmi_signal_file_path) != 0){
        failure = errno;
    }
    if(failure != 0){
        unlink(temp_path);
        debug("[hdmi] failed to publish state file: %d\n", failure);
        return false;
    }
    return true;
}

static void set_hdmi_signal_state(uint8_t active)
{
    pthread_mutex_lock(&hdmi_signal_mutex);
    uint8_t enabled = __atomic_load_n(&hdmi_capture_enabled, __ATOMIC_ACQUIRE);
    uint8_t next = enabled != 0 && active != 0 ? 1 : 0;
    uint8_t previous = __atomic_exchange_n(&hdmi_signal_active, next, __ATOMIC_ACQ_REL);
    if(previous != next){
        write_hdmi_signal_file(next);
    }
    pthread_mutex_unlock(&hdmi_signal_mutex);
}

static void set_hdmi_capture_enabled(uint8_t enabled)
{
    pthread_mutex_lock(&hdmi_signal_mutex);
    __atomic_store_n(&hdmi_capture_enabled, enabled != 0 ? 1 : 0, __ATOMIC_RELEASE);
    __atomic_store_n(&hdmi_signal_active, 0, __ATOMIC_RELEASE);
    write_hdmi_signal_file(0);
    pthread_mutex_unlock(&hdmi_signal_mutex);
}

void debug(const char *format, ...)
{
    if(debug_en){
        va_list args;
        va_start(args, format);
        vprintf(format, args);
        va_end(args);
    }
}

uint8_t refresh_vi_state()
{
	// The driver read blocks for about a second; mark the deadline before it so
	// that the publication cadence measures wall-clock time, not read time plus it.
    last_vi_state_refresh_ms = vi_state_shared::monotonic_ms();
    last_vi_state_code = vi_state_shared::refresh();
    set_hdmi_signal_state(last_vi_state_code == 1 || last_vi_state_code >= 3);
    return last_vi_state_code;
}

int maxmin_data(int _max, int _min, int _data)
{
	if(_data > _max) return _max;
	if(_data < _min) return _min;
	return _data;
}

// ====HDMI RES==================================================

uint16_t hdmi_res_list[][2] = {
    {1920, 1080},
    {1600, 900},
    {1440, 1080},
    {1440, 900},
    {1280, 1024},
    {1280, 960},
    {1280, 800},
    {1280, 720},
    {1152, 864},
    {1024, 768},
    {800, 600},
	{640, 480},
};

uint16_t hdmi_unsupported_res_list[][2] = {
    {1680, 1050},
    {1440, 1050},
    {1400, 1050},
    {1368, 768},
    {1366, 768},
    {720, 576},
};

/* return 0 : normal res;
/* return 1 : new res;
 * return 2 : unsupport res;
 * return 3 : unknow res;
 */
uint8_t check_res(uint16_t _width, uint16_t _height)
{
    uint8_t i;
    uint8_t ret;

    for(i = 0; i < sizeof(hdmi_res_list)/4; i++){
        if(_width == hdmi_res_list[i][0] && _height == hdmi_res_list[i][1]) return NORMAL_RES;
    }
    for(i = 0; i < sizeof(hdmi_unsupported_res_list)/4; i++){
        if(_width == hdmi_unsupported_res_list[i][0] && _height == hdmi_unsupported_res_list[i][1]) return UNSUPPORT_RES;
    }
    return UNKNOWN_RES;
}

void write_res_to_file(uint16_t _width, uint16_t _height)
{
	char Cmd[100]={0};
    sprintf(Cmd, "echo %d > %s", _width, vi_width_path);
    system(Cmd);
    sprintf(Cmd, "echo %d > %s", _height, vi_height_path);
    system(Cmd);
    system("sync");
}

int set_hdmi_mode(uint8_t _hdmi_mode)
{
    if(_hdmi_mode >= 0 && _hdmi_mode <= 2){
        char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", _hdmi_mode, hdmi_mode_path);
        system(Cmd);
        return 1;
    } else {
        debug("[kvmv] Incorrect HDMI mode.\n");
        return 0;
    }
}

int get_hdmi_mode(void)
{
    if(access(hdmi_mode_path, F_OK) == 0){
        // exist
        FILE *fp;
        uint8_t tmp8;
        uint8_t RW_Data[3] = {0};

        fp = fopen(hdmi_mode_path, "r");
        if (fp == NULL) {
            kvmv_cfg.hdmi_mode = 0;
            return 0;
        }
        fread(RW_Data, sizeof(char), sizeof(RW_Data) - 1, fp);
        fclose(fp);
        tmp8 = atoi((char*)RW_Data);
        if(tmp8 > 2) {
            tmp8 = 0;
	        char Cmd[100]={0};
            sprintf(Cmd, "echo 0 > %s", hdmi_mode_path);
            system(Cmd);
        }
        if(tmp8 != kvmv_cfg.hdmi_mode){
            kvmv_cfg.hdmi_mode = tmp8;
            debug("[kvmv] hdmi mode = %d\n", kvmv_cfg.hdmi_mode);
            return 1;
        } else {
            return 0;
        }
    }
    kvmv_cfg.hdmi_mode = 0;
    return 0;
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

int get_manual_resolution(void)
{
    uint8_t RW_Data[35];
    FILE *fp;
    int file_size;
    uint16_t tmp_width, tmp_height;
    int res = 0;

    // get res
    if(access("/kvmapp/kvm/width", F_OK) == 0){
        fp = fopen("/kvmapp/kvm/width", "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp);
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp_width = atoi((char*)RW_Data);
    } else {
        tmp_width = 1920;
    }
    if(access("/kvmapp/kvm/height", F_OK) == 0){
        fp = fopen("/kvmapp/kvm/height", "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp);
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp_height = atoi((char*)RW_Data);
    } else {
        tmp_height = 1080;
    }

    // res min limit
    if(tmp_width < vi_min_width){
        tmp_width = vi_min_width;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_min_width, vi_width_path);
	    system(Cmd);
    }
    if(tmp_height < vi_min_height){
        tmp_height = vi_min_height;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_min_height, vi_height_path);
	    system(Cmd);
    }
    // res max limit
    if(tmp_width > vi_max_width){
        tmp_width = vi_max_width;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_max_width, vi_width_path);
	    system(Cmd);
    }
    if(tmp_height > vi_max_height){
        tmp_height = vi_max_height;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_max_height, vi_height_path);
	    system(Cmd);
    }

    // res change ?
    if(kvmv_cfg.vi_width != tmp_width){
        kvmv_cfg.vi_width = tmp_width;
        printf("[kvmk] get new width = %d\n", kvmv_cfg.vi_width.load());
        res = 1;
    }
    if(kvmv_cfg.vi_height != tmp_height){
        kvmv_cfg.vi_height = tmp_height;
        printf("[kvmk] get new height = %d\n", kvmv_cfg.vi_height.load());
        res = 1;
    }
    return res;
}

uint8_t auto_try_res()
{
    char Cmd[100]={0};
    uint8_t err_code;
    uint8_t auto_trying_times = 0;

    for (auto_trying_times = 0; auto_trying_times < sizeof(hdmi_res_list)/4 && !kvmv_cfg.try_exit_thread.load(); auto_trying_times++){
        err_code = refresh_vi_state();
        switch(err_code){
        case 0:
            // shouldn't be possible to run here
            kvm_mmf::restart();
            printf("[kvmv] VI not init\n");
            break;
        case 1:
            printf("[kvmv] VI subsystem is normal\n");
            return 1;
            break;
        case 2:
            // HDMI not detected or resolution not supported; interval checks will continue
            printf("[kvmv] Cannot obtain HDMI input\n");
            auto_trying_times--;
            time::sleep_ms(1000);
            break;
        case 3: // width too small
        case 4: // width too large
        case 5: // height too small
        case 6: // height too large
            // CSI abnormal due to resolution error
            // The test list is short; sequential testing can be performed
            printf("[kvmv] Trying %d * %d res ..\n", hdmi_res_list[auto_trying_times][0], hdmi_res_list[auto_trying_times][1]);
            sprintf(Cmd, "echo %d > %s", hdmi_res_list[auto_trying_times][0], vi_width_path);
            system(Cmd);
            sprintf(Cmd, "echo %d > %s", hdmi_res_list[auto_trying_times][1], vi_height_path);
            system(Cmd);

            kvmv_cfg.vi_width = hdmi_res_list[auto_trying_times][0];
            kvmv_cfg.vi_height = hdmi_res_list[auto_trying_times][1];
            printf("[kvmv] restart video...\n");
            kvm_mmf::restart();
            time::sleep_ms(50);
            break;
        case 7: // Unknown reason
            printf("[kvmv] CSI abnormal: Unknown reason\n");
            break;
        }
    }
    err_code = refresh_vi_state();
    if (err_code == 1 || err_code == 2) return err_code;
    return 0;
}

/* return :
 * 0 : error
 * 1 : out of mem
 * 2 : normal
*/
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
        pclose(fp);
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

void lt6911_enable()
{
	uint8_t buf[2];

    if(kvmv_cfg.hdmi_version == 3){
        return;
    }

	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0xee;
	buf[1] = 0x01;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

    if(kvmv_cfg.hdmi_version == 1){
        // disable watchdog
        buf[0] = 0x10;
        buf[1] = 0x00;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
    }
}

void lt6911_disable()
{
	uint8_t buf[2];

    if(kvmv_cfg.hdmi_version == 3){
        return;
    }

	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0xee;
	buf[1] = 0x00;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_get_hdmi_errer()
{
	uint8_t buf[6];

	buf[0] = 0xff;
	buf[1] = 0xC0;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x20;
	buf[1] = 0x01;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	time::sleep_ms(100);

	buf[0] = 0x24;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 6);

	buf[0] = 0x20;
	buf[1] = 0x07;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	for(int i = 0; i < 6; i++){
		buf[i] = (uint8_t)dat->data[i];
	}
	delete dat;

	debug("hdmi_errer_code = %x, %x, %x, %x, %x, %x\n", buf[0], buf[1], buf[2], buf[3], buf[4], buf[5]);
}

uint8_t lt6911_get_hdmi_res()
{
	uint8_t buf[2];
	uint8_t revbuf[4];
	uint16_t Vactive;
	uint16_t Hactive;


    if(kvmv_cfg.hdmi_version == 0){
        // LT6911C
        buf[0] = 0xff;
        buf[1] = 0xd2;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        buf[0] = 0x83;
        buf[1] = 0x11;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        time::sleep_ms(5);

        // Vactive
        buf[0] = 0x96;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Hactive
        buf[0] = 0x8b;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = (revbuf[2] << 8)|revbuf[3];
        Hactive *= 2;

        debug("[hdmi]HDMI res modification event\n");
        debug("[hdmi]new res: %d * %d\n", Hactive, Vactive);

        delete dat0;
        delete dat1;

        if (Vactive != 0 && Hactive != 0){
            return 1;
        } else {
            // system("echo 0 > %s", vi_height_path);
            // system("echo 0 > %s", vi_width_path);
            return 0;
        }
    } else if (kvmv_cfg.hdmi_version == 1){
        // LT6911UXC
        buf[0] = 0xff;
        buf[1] = 0x86;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        buf[0] = 0xff;
        buf[1] = 0x86;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // HDMI signal disappear/stable
        buf[0] = 0xA3;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 1);

        revbuf[0] = (uint8_t)dat0->data[0];
        delete dat0;

        debug("[hdmi]HDMI-UXC res modification event\n");

        if(revbuf[0] == 0x55)       return 1;
        else if(revbuf[0] == 0x88)  return 0;
        else return 0;
    } else if (kvmv_cfg.hdmi_version == 3){
        // LT6911D
        buf[0] = 0xff;
        buf[1] = 0xe0;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // Hactive
        buf[0] = 0x8c;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Vactive
        buf[0] = 0x8e;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        Hactive = ((revbuf[0] << 8)|revbuf[1]) * 2;
        Vactive = (revbuf[2] << 8)|revbuf[3];

        debug("[hdmi]HDMI-D res modification event\n");
        debug("[hdmi]new res: %d * %d\n", Hactive, Vactive);

        delete dat0;
        delete dat1;

        if(Hactive != 0 || Vactive != 0) return 1;
        else return 0;
    } else {
        return 0;
    }
}

void lt6911_get_hdmi_clk()
{
	uint8_t buf[2];
	uint8_t revbuf[3];
	uint32_t clk;

	buf[0] = 0xff;
	buf[1] = 0xa0;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x34;
	buf[1] = 0x0b;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	time::sleep_ms(50);

	// clk
	buf[0] = 0xff;
	buf[1] = 0xb8;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0xb1;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 3);

	revbuf[0] = (uint8_t)dat0->data[0];
	revbuf[1] = (uint8_t)dat0->data[1];
	revbuf[2] = (uint8_t)dat0->data[2];
	revbuf[0] &= 0x07;

	clk = revbuf[0];
	clk <<= 8;
	clk |= revbuf[1];
	clk <<= 8;
	clk |= revbuf[2];

	debug("[hdmi]HDMI CLK = %d\n", clk);

	delete dat0;
}

uint8_t lt6911_get_csi_res(uint16_t *p_width, uint16_t *p_height)
{
	uint8_t buf[2];
	uint8_t revbuf[4];
    uint8_t res_type;
	static uint16_t old_Vactive;
	static uint16_t old_Hactive;
	uint16_t Vactive;
	uint16_t Hactive;

    if(kvmv_cfg.hdmi_version == 0){
        // LT6911C
        buf[0] = 0xff;
        buf[1] = 0xc2;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // Vactive
        buf[0] = 0x06;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Hactive
        buf[0] = 0x38;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        delete dat0;
        delete dat1;

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = (revbuf[2] << 8)|revbuf[3];
    } else if(kvmv_cfg.hdmi_version == 1) {
        // LT6911UXC
        debug("[hdmi]UXC get csi res\n");
        buf[0] = 0xff;
        buf[1] = 0x85;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // Vactive
        buf[0] = 0xF0;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Hactive
        buf[0] = 0xEA;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        delete dat0;
        delete dat1;

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = (revbuf[2] << 8)|revbuf[3];
    } else if(kvmv_cfg.hdmi_version == 3) {
        // LT6911D
        debug("[hdmi]D get csi res\n");
        buf[0] = 0xff;
        buf[1] = 0xe0;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // Vactive
        buf[0] = 0x8e;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Hactive
        buf[0] = 0x8c;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        delete dat0;
        delete dat1;

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = ((revbuf[2] << 8)|revbuf[3]) * 2;
    } else {
        return UNKNOWN_RES;
    }

    res_type = check_res(Hactive, Vactive);
    if(res_type == NORMAL_RES)
    {
        if(old_Hactive != Hactive || old_Vactive != Vactive){
            old_Hactive = Hactive;
            old_Vactive = Vactive;
            // p_kvm_cfg->width = Hactive;
            // p_kvm_cfg->height = Vactive;
            *p_width = Hactive;
            *p_height = Vactive;
            res_type = NEW_RES;
        }
    }

    switch (res_type)
    {
    case NORMAL_RES:
        printf("[hdmi] get res : %d * %d\n", Hactive, Vactive);
        break;
    case NEW_RES:
        printf("[hdmi] get new res : %d * %d\n", Hactive, Vactive);
        write_res_to_file(Hactive, Vactive);
        break;
    case UNSUPPORT_RES:
        printf("[hdmi] get unsupport res : %d * %d\n", Hactive, Vactive);
        break;
    case UNKNOWN_RES:
        printf("[hdmi] get unknown res : %d * %d\n", Hactive, Vactive);
        break;
    }

	return res_type;
}

void lt6911_write_reg(uint8_t reg, uint8_t val)
{
	uint8_t buf[2];
	buf[0] = reg;
	buf[1] = val;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_read_reg(uint8_t reg)
{
	uint8_t buf[16];
	buf[0] = reg;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 16);

	for(int i = 0; i < 16; i++){
		buf[i] = (uint8_t)dat->data[i];
	}

	delete dat;

	debug("[hdmi]%3x %3x %3x %3x %3x %3x %3x %3x |%3x %3x %3x %3x %3x %3x %3x %3x \n", \
			buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6], buf[7], \
			buf[8], buf[9], buf[10], buf[11], buf[12], buf[13], buf[14], buf[15]);
}

uint8_t lt6911_read_one_reg(uint8_t reg)
{
	uint8_t ret;
	ret = reg;
	LT6911_i2c.writeto(LT6911_ADDR, &ret, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 1);

	ret = (uint8_t)dat->data[0];

	delete dat;
	return ret;
}

void lt6911_write_edid(void)
{
	uint8_t i, j;
	uint8_t buf[2];
	lt6911_enable();

	// to 90
	lt6911_write_reg(0xff, 0x90);
	buf[0] = lt6911_read_one_reg(0x02);
	buf[0] &= 0xDF;
	lt6911_write_reg(0x02, buf[0]);
	buf[0] |= 0x20;
	lt6911_write_reg(0x02, buf[0]);

	// to 80
	lt6911_write_reg(0xff, 0x80);
	// wren enable
	lt6911_write_reg(0x5A, 0x86);
	lt6911_write_reg(0x5A, 0x82);

	for(i = 0; i < 16; i++){
		// 写wren命令(为一个pulse，此时不需要考虑wrrd_mode，spi_paddr[1:0]的值)
		lt6911_write_reg(0x5A, 0x86);
		lt6911_write_reg(0x5A, 0x82);

		// 配置spi_len[3:0]= 15，可配置，spi内部加1，即配置一次写入16个字节
		lt6911_write_reg(0x5E, 0xEF);
		lt6911_write_reg(0x5A, 0xA2);
		lt6911_write_reg(0x5A, 0x82);

		lt6911_write_reg(0x58, 0x01);

		if(i < 8) {
			for(j = 0; j < 16; j++){
				lt6911_write_reg(0x59, NanoKVM_edit[i*16+j]);
			}
		} else {
			for(j = 0; j < 16; j++){
				lt6911_write_reg(0x59, 0x00);
			}
		}

		// 把fifo数据写到flash(当wrrd_mode = 1，spi_paddr= 2’b10,addr[23:0](地址在写入过程中需要保持不变)准备好的情况下，给一个spi_sta的pulse，就开始写入flash)
		lt6911_write_reg(0x5B, 0x00);
		lt6911_write_reg(0x5C, 0x21);
		lt6911_write_reg(0x5D, i*16);
		lt6911_write_reg(0x5E, 0xE0);
		lt6911_write_reg(0x5A, 0x92);
		lt6911_write_reg(0x5A, 0x82);

	}

	lt6911_write_reg(0x5A, 0x8A);
	lt6911_write_reg(0x5A, 0x82);

	lt6911_disable();
	debug("[hdmi]lt6911_write_edid OK\n");
}

void lt6911_read_edid(void)
{
	uint8_t i, j;
	lt6911_enable();

	// to 80
	lt6911_write_reg(0xff, 0x80);
	lt6911_write_reg(0xEE, 0x01);

	// configure parameter
	lt6911_write_reg(0x5A, 0x80);
	lt6911_write_reg(0x5E, 0xC0);
	lt6911_write_reg(0x58, 0x00);
	lt6911_write_reg(0x59, 0x51);
	lt6911_write_reg(0x5A, 0x90);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	for(i = 0; i < 16; i++){
		// to 90
		lt6911_write_reg(0xff, 0x90);
		// fifo rst_n
		lt6911_write_reg(0x02, 0xdf);
		time::sleep_ms(1);
		lt6911_write_reg(0x02, 0xff);

		// wren
		// to 80
		lt6911_write_reg(0xff, 0x80);
		// fifo rst_n
		lt6911_write_reg(0x5A, 0x84);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);

		// flash to fifo
		lt6911_write_reg(0x5E, 0x6F);
		lt6911_write_reg(0x5A, 0xA0);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x5B, 0x00);
		lt6911_write_reg(0x5C, 0x21);
		lt6911_write_reg(0x5D, 16*i);
		lt6911_write_reg(0x5A, 0x90);
		time::sleep_ms(5);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x58, 0x01);

		// for(j = 0; j < 16; j++){
		debug("[hdmi] EDID: ");
		lt6911_read_reg(0x5F);
		// }
		time::sleep_ms(10);
	}

	// wrdi
	lt6911_write_reg(0x5A, 0x88);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	lt6911_disable();
	debug("[hdmi]lt6911_read_edid OK\n");
}

void lt6911_read_fw(void)
{
	uint32_t i, j;
	uint8_t buf[3];
	lt6911_enable();

	// to 80
	lt6911_write_reg(0xff, 0x80);
	lt6911_write_reg(0xEE, 0x01);

	// configure parameter
	lt6911_write_reg(0x5A, 0x80);
	lt6911_write_reg(0x5E, 0xC0);
	lt6911_write_reg(0x58, 0x00);
	lt6911_write_reg(0x59, 0x51);
	lt6911_write_reg(0x5A, 0x90);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	for(i = 0x1; i < 50000; i++){
		buf[0] = ((i*16) & 0xFF0000) >> 16;
		buf[1] = ((i*16) & 0xFF00) >> 8;
		buf[2] = ((i*16) & 0xFF);
		// to 90
		lt6911_write_reg(0xff, 0x90);
		// fifo rst_n
		lt6911_write_reg(0x02, 0xdf);
		time::sleep_ms(1);
		lt6911_write_reg(0x02, 0xff);

		// wren
		// to 80
		lt6911_write_reg(0xff, 0x80);
		// fifo rst_n
		lt6911_write_reg(0x5A, 0x84);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);

		// flash to fifo
		lt6911_write_reg(0x5E, 0x6F);
		lt6911_write_reg(0x5A, 0xA0);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x5B, buf[0]);
		lt6911_write_reg(0x5C, buf[1]);
		lt6911_write_reg(0x5D, buf[2]);
		lt6911_write_reg(0x5A, 0x90);
		time::sleep_ms(5);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x58, 0x01);

		// for(j = 0; j < 16; j++){
		debug("[hdmi]REG %6x: ", i*16);
		lt6911_read_reg(0x5F);
		// }
		time::sleep_ms(10);
	}

	// wrdi
	lt6911_write_reg(0x5A, 0x88);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	lt6911_disable();
	debug("[hdmi]lt6911_read_edid OK\n");
}

// ==============================================================

void* watchdog_sf_feed(void * arg)
{
    while(true)
    {
        if(kvmv_cfg.try_exit_thread.load() == 1)
            break;
        time::sleep_ms(500);
        if (watchdog_sf_is_open()){
            if (chack_ion() == 1){
                debug("[kvmv] Ion memory is full reboot now!\n");
                system("reboot");
            }
            // debug("[kvmv] watchdog_sf_feed now!\n");
            vision_update_watchdog();
        }
    }
    return nullptr;
}

void get_hdmi_version()
{
	FILE *fp;
	uint8_t RW_Data[2];
    system("/kvmapp/system/init.d/S15kvmhwd get_hdmi_version");
	if(access("/etc/kvm/hdmi_version", F_OK) == 0){
        fp = fopen("/etc/kvm/hdmi_version", "r");
        fread(RW_Data, sizeof(char), 2, fp);
        fclose(fp);
        if(RW_Data[0] == 'u'){
            // 6911uxc
            if(RW_Data[1] == 'e'){
                kvmv_cfg.hdmi_version = 2;
                debug("[hdmi]HDMI-UE exist!\n");
                set_hdmi_mode(1);
            } else if(RW_Data[1] == 'x') {
                kvmv_cfg.hdmi_version = 1;
                debug("[hdmi]HDMI-UX exist!\n");
            } else {
                kvmv_cfg.hdmi_version = 1;
                debug("[hdmi]Incomplete version number, set to 'ux'\n");
            }
        } else if(RW_Data[0] == 'd'){
            // 6911d
            kvmv_cfg.hdmi_version = 3;
            debug("[hdmi]HDMI-D exist!\n");
        } else {
            // 6911c
            kvmv_cfg.hdmi_version = 0;
            debug("[hdmi]HDMI-C exist!\n");
        }
        RW_Data[0] = 0;
    } else {
        kvmv_cfg.hdmi_version = 0;
    }
}

static uint8_t update_hdmi_resolution()
{
    uint16_t width = kvmv_cfg.vi_width;
    uint16_t height = kvmv_cfg.vi_height;
    uint8_t result = lt6911_get_csi_res(&width, &height);
    kvmv_cfg.vi_width = width;
    kvmv_cfg.vi_height = height;
    return result;
}

void* vi_subsystem_detection(void * arg)
{
	uint64_t __attribute__((unused)) int_time;

	FILE *fp;
	uint8_t RW_Data[2];
    uint8_t file_size;
    uint8_t tmp8;
    uint8_t rising_times = 0;
    uint8_t falling_times = 0;
	uint8_t cam_need_restart = 0;
    uint8_t auto_change_mode = 0;
	if(access("/proc/lt_int", F_OK) != 0){
		time::sleep_ms(10);
		debug("[hdmi]/proc/lt_int not ok\n");
	}

    get_hdmi_version();

    // Refresh on elapsed time, not loop iterations whose work varies widely.
    last_vi_state_refresh_ms = vi_state_shared::monotonic_ms() - vi_state_publish_interval_ms;
    while(true)
    {
        if(kvmv_cfg.try_exit_thread.load() == 1)
            break;

        uint8_t get_new_hdmi_mode = get_hdmi_mode();
        uint8_t try_res;
        uint8_t err_code;
        uint8_t vi_state_refreshed = 0;
        uint8_t vi_state_due = vi_state_shared::monotonic_ms() - last_vi_state_refresh_ms >= vi_state_publish_interval_ms;
        uint8_t manual_vi_init_now =
            (kvmv_cfg.hdmi_mode == 2 &&
             (get_new_hdmi_mode == 1 || kvmv_cfg.vi_detect_state == 0));
        uint8_t defer_vi_state_refresh =
            (kvmv_cfg.hdmi_mode == 1 &&
             (kvmv_cfg.vi_detect_state == 1 || get_new_hdmi_mode == 1)) ||
            (kvmv_cfg.hdmi_mode == 2 &&
             (manual_vi_init_now || kvmv_cfg.vi_detect_state == 1));

        if (vi_state_due && !defer_vi_state_refresh) {
            refresh_vi_state();
            vi_state_refreshed = 1;
        }

        switch (kvmv_cfg.hdmi_mode){
        case 0:
            // Switching to Mode 0 requires restarting HDMI (effective only for PCIe version)
            // Handling of automatic detection situations
            if(get_new_hdmi_mode == 1){
                kvmv_cfg.vi_detect_state = 0;
                // reset hdmi_state
                char Cmd[100]={0};
                sprintf(Cmd, "echo 0 > %s", hdmi_state_path);
                system(Cmd);
                // reset hdmi
                kvmv_hdmi_control(0);
                time::sleep_ms(10);
                kvmv_hdmi_control(1);
            }
            // Initialize VI with I2C information after HDMI insertion
            fp = fopen(hdmi_state_path, "r+");
            if(fp != NULL){
                // fseek(fp, 0, SEEK_END);
                // file_size = ftell(fp);
                // fseek(fp, 0, SEEK_SET);
                fread(RW_Data, sizeof(char), 2, fp);
                tmp8 = atoi((char*)RW_Data);
                // debug("[hdmi]UXC tmp8 = %d\n", tmp8);
                if(tmp8 != 0){
                    // reset hdmi_state
                    fputs("0", fp);
                    // count edge ints
                    rising_times = tmp8%10;   // RISING times
                    falling_times = tmp8/10;   // FALLING times

                    if(kvmv_cfg.hdmi_stop_flag != 1){
                        kvmv_cfg.hdmi_reading_flag = 1;
                        if(kvmv_cfg.hdmi_version == 0){
                            // LT6911C
                            if(rising_times != 0){
                                lt6911_enable();
                                if(lt6911_get_hdmi_res()){
                                    // hdmi get res
                                    debug("[hdmi] C HDMI cable insertion!\n");
                                    set_hdmi_signal_state(1);
                                    kvmv_cfg.hdmi_res_type = update_hdmi_resolution();
                                    if (kvmv_cfg.hdmi_res_type == NEW_RES) kvmv_cfg.reopen_cam_flag = 1;
                                    else if (kvmv_cfg.hdmi_res_type == UNKNOWN_RES){
                                        /* Move HDMI resolution modification directly
                                            to mode1 to solve deadlock problem */
                                        auto_change_mode = 1;
                                        set_hdmi_mode(1);
                                    }
                                } else {
                                    // HDMI res = 0*0/x*0
                                    debug("[hdmi] C HDMI cable unplugged!\n");
                                    set_hdmi_signal_state(0);
                                }
                                lt6911_disable();
                            }
                        } else if (kvmv_cfg.hdmi_version == 1){
                            // LT6911UXC
                                debug("[hdmi] UXC int\n");
                            if(falling_times != 0){
                                debug("[hdmi] UXC int && \n");
                                lt6911_enable();
                                if(lt6911_get_hdmi_res()){
                                    // hdmi get res
                                    debug("[hdmi] UXC HDMI cable insertion!\n");
                                    set_hdmi_signal_state(1);
                                    kvmv_cfg.hdmi_res_type = update_hdmi_resolution();
                                    if (kvmv_cfg.hdmi_res_type == NEW_RES) kvmv_cfg.reopen_cam_flag = 1;
                                    else if (kvmv_cfg.hdmi_res_type == UNKNOWN_RES){
                                        /* Move HDMI resolution modification directly
                                            to mode1 to solve deadlock problem */
                                        auto_change_mode = 1;
                                        set_hdmi_mode(1);
                                    }
                                } else {
                                    // HDMI res = 0*0/x*0
                                    debug("[hdmi] UXC HDMI cable unplugged!\n");
                                    set_hdmi_signal_state(0);
                                }
                                lt6911_disable();
                            }
                        } else if (kvmv_cfg.hdmi_version == 3){
                            // LT6911D
                                debug("[hdmi] D int\n");
                            if(falling_times != 0){
                                debug("[hdmi] D int && \n");
                                lt6911_enable();
                                if(lt6911_get_hdmi_res()){
                                    // hdmi get res
                                    debug("[hdmi] D HDMI cable insertion!\n");
                                    set_hdmi_signal_state(1);
                                    kvmv_cfg.hdmi_res_type = update_hdmi_resolution();
                                    if (kvmv_cfg.hdmi_res_type == NEW_RES) kvmv_cfg.reopen_cam_flag = 1;
                                    else if (kvmv_cfg.hdmi_res_type == UNKNOWN_RES){
                                        /* Move HDMI resolution modification directly
                                            to mode1 to solve deadlock problem */
                                        auto_change_mode = 1;
                                        set_hdmi_mode(1);
                                    }
                                } else {
                                    // HDMI res = 0*0/x*0
                                    debug("[hdmi] D HDMI cable unplugged!\n");
                                    set_hdmi_signal_state(0);
                                }
                                lt6911_disable();
                            }
                        } else {
                            debug("[hdmi] Chip not supported for reading \n");
                        }
                        kvmv_cfg.hdmi_reading_flag = 0;
                    }
                }
                fclose(fp);
            }
            break;
        /* Mode 1 & 2 will disable API access to the image during detection,
           and will output -4: Modifying image resolution, please wait.*/
        case 1: // Automatically trying common resolutions
            /* kvmv_cfg.vi_detect_state :
             * 0: HDMI standard mode, detection program does not interfere with the camera
             * 1: Preparing / Testing in progress
             * 2: Test completed: Suitable resolution found,
             */

            if(get_new_hdmi_mode == 1){
                kvmv_cfg.vi_detect_state = 1;
            }
            if(kvmv_cfg.vi_detect_state == 1){
                try_res = auto_try_res();
                if (try_res == 1) {
                    kvmv_cfg.hdmi_res_err = NORMAL_RES;
                    kvmv_cfg.hdmi_try_rounds = 0;
                    kvmv_cfg.vi_detect_state = 2;
                } else if (try_res == 0) {
                    /*  There may be a situation where the correct resolution cannot be recognized
                        after one round of detection. By default, Try_rounds_HDMI_err_res rounds will be detected,
                        and if it cannot be detected, jump to the next mode */
                    kvmv_cfg.hdmi_res_err = ERROR_RES;
                    kvmv_cfg.hdmi_try_rounds++;
                    if(kvmv_cfg.hdmi_try_rounds >= Try_rounds_HDMI_err_res){
                        kvmv_cfg.hdmi_try_rounds = 0;
                        kvmv_cfg.vi_detect_state = 1;
                        // printf("[kvmv] Suitable resolution not found, switching to manual input mode automatically\n");
                        if(auto_change_mode == 1){
                            auto_change_mode = 0;
                            set_hdmi_mode(0);
                        } else {
                            set_hdmi_mode(2);
                        }
                    }
                } else if (try_res == 2) {
                    kvmv_cfg.hdmi_try_rounds = 0;
                    // Cannot obtain HDMI input / No signal on HDMI
                }
            } else if (kvmv_cfg.vi_detect_state == 2){
                // Low-frequency detection of HDMI status, no log output
                if (vi_state_refreshed && last_vi_state_code != 1) {
                    kvmv_cfg.vi_detect_state = 1;
                }
            } else {
                kvmv_cfg.vi_detect_state = 1;
            }
            break;
        case 2:
            // Manually initialize VI.
            if (manual_vi_init_now) {
                // Initialize immediately when entering manual mode instead of
                // waiting for the next periodic state refresh.
                kvmv_cfg.vi_detect_state = 1;
            }
            if(manual_vi_init_now || vi_state_due){
                if (kvmv_cfg.vi_detect_state == 1){
                    // detect_res
                    if (get_manual_resolution()) {
                        debug("[kvmv] restart video...\n");
                        kvm_mmf::restart();
                    }

                    // Sample after a manual resolution change.
                    err_code = refresh_vi_state();
                    switch(err_code){
                    case 0:
                        debug("[kvmv] VI not init\n");
                        break;
                    case 1:
                        debug("[kvmv] HDMI and CSI status are normal\n");
                        kvmv_cfg.vi_detect_state = 2;
                        break;
                    case 2:
                        debug("[kvmv] HDMI abnormal\n");
                        break;
                    case 3:
                        debug("[kvmv] CSI abnormal: width too small\n");
                        break;
                    case 4:
                        debug("[kvmv] CSI abnormal: width too large\n");
                        break;
                    case 5:
                        debug("[kvmv] CSI abnormal: height too small\n");
                        break;
                    case 6:
                        debug("[kvmv] CSI abnormal: height too large\n");
                        break;
                    case 7:
                        debug("[kvmv] CSI abnormal: Unknown reason\n");
                        break;
                    }
                } else if (kvmv_cfg.vi_detect_state == 2){
                    // detection of HDMI status, no log output
                    err_code = last_vi_state_code;
                    if (err_code != 1) kvmv_cfg.vi_detect_state = 1;
                } else {
                    kvmv_cfg.vi_detect_state = 1;
                }
            }
            break;

        default:
            debug("Non-existent hdmi state = %d\n", kvmv_cfg.hdmi_mode);
            break;
        }

		time::sleep_ms(10);
    }
    return nullptr;
}

uint8_t kvmvenc_gop = default_h264_gop;

void set_h264_gop(uint8_t gop)
{
    __atomic_store_n(&kvmvenc_gop, (uint8_t)maxmin_data(100, 1, gop), __ATOMIC_RELEASE);
}

void set_frame_detact(uint8_t interval)
{
    std::lock_guard<std::mutex> lock(capture_mutex[VENC_MJPEG]);
    kvmv_cfg.frame_detact = maxmin_data(100, 0, interval);
    jpeg_detection = {};
}

void kvmv_init(uint8_t debug_info)
{
    debug_en = debug_info != 0;
    kvmv_cfg.try_exit_thread = false;
    if (!kvm_mmf::initialize()) {
        fprintf(stderr, "[kvmv] video initialization failed\n");
    }
    if (!detection_started) {
        detection_started = pthread_create(&detection_thread, nullptr, vi_subsystem_detection, nullptr) == 0;
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
    if (kvmv_cfg.try_exit_thread || kvmv_cfg.hdmi_stop_flag) return IMG_NOT_EXIST;
    if (kvmv_cfg.hdmi_res_err == ERROR_RES) return -7;
    if (kvmv_cfg.hdmi_res_type == UNSUPPORT_RES) return -6;
    if (kvmv_cfg.vi_detect_state == 1) return -4;
    if (kvmv_cfg.reopen_cam_flag.exchange(false) && !kvm_mmf::restart()) return IMG_VENC_ERROR;
    if (width == 0 || height == 0) {
        width = kvmv_cfg.vi_width;
        height = kvmv_cfg.vi_height;
    }
    quality = type == VENC_H264 ? maxmin_data(10000, 500, quality) : maxmin_data(100, 50, quality);
    fps = maxmin_data(60, 1, fps);
    auto codec = static_cast<kvm_mmf::Codec>(type);
    kvm_mmf::Frame frame;
    int result = kvm_mmf::acquire(codec, width, height, quality, fps,
                                __atomic_load_n(&kvmvenc_gop, __ATOMIC_ACQUIRE), &frame);
    if (result < 0) return result;

    // Detect unchanged JPEGs without reading raw VPSS pixels.
    if (codec == kvm_mmf::MJPEG) {
        uint8_t interval = kvmv_cfg.frame_detact;
        if (interval == 0) {
            jpeg_detection = {};
        } else if (jpeg_detection.unchanged || ++jpeg_detection.count >= interval) {
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
    set_hdmi_capture_enabled(0);
    kvmv_cfg.try_exit_thread = true;
    if (detection_started) { pthread_join(detection_thread, nullptr); detection_started = false; }
    if (watchdog_started) { pthread_join(watchdog_thread, nullptr); watchdog_started = false; }
    std::unique_lock<std::mutex> h264(capture_mutex[VENC_H264], std::defer_lock);
    std::unique_lock<std::mutex> mjpeg(capture_mutex[VENC_MJPEG], std::defer_lock);
    std::lock(h264, mjpeg);
    kvm_mmf::deinitialize();
    jpeg_detection = {};
}

uint8_t kvmv_hdmi_control(uint8_t _en)
{
    if(_en == 0){
        set_hdmi_capture_enabled(0);
        kvm_mmf::stop(kvm_mmf::H264);
        kvm_mmf::stop(kvm_mmf::MJPEG);
    }

    if(kvmv_cfg.hw_version == 0){

        FILE *fp;
	    uint8_t RW_Data[2];
        if(access("/etc/kvm/hw", F_OK) == 0){
            fp = fopen("/etc/kvm/hw", "r");
            fread(RW_Data, sizeof(char), 1, fp);
            fclose(fp);
            switch(RW_Data[0]){
                case 'a':
                case 'b':
                case 'p':
                    kvmv_cfg.hw_version = RW_Data[0];
                    break;
                default :
                    kvmv_cfg.hw_version = 'a';
            }
        }
    }
    if(kvmv_cfg.hw_version != 'p'){
        debug("[kvmv]Hardware not support!\n");
        if(_en != 0){
            set_hdmi_capture_enabled(1);
        }
        return -1;
    }
    if(access("/sys/class/gpio/gpio451/value", F_OK) != 0){
        system("echo 451 > /sys/class/gpio/export");
        system("echo out > /sys/class/gpio/gpio451/direction");
    }
    if(_en == 0){
        kvmv_cfg.hdmi_stop_flag = 1;
        while(kvmv_cfg.hdmi_reading_flag == 1) time::sleep_ms(10);
        system("echo 0 > /sys/class/gpio/gpio451/value");
        return 0;
    } else {
        kvmv_cfg.hdmi_stop_flag = 0;
        system("echo 1 > /sys/class/gpio/gpio451/value");
        set_hdmi_capture_enabled(1);
        return 0;
    }
    return -1;
}

uint8_t kvmv_hdmi_signal_active()
{
    uint8_t enabled = __atomic_load_n(&hdmi_capture_enabled, __ATOMIC_ACQUIRE);
    uint8_t active = __atomic_load_n(&hdmi_signal_active, __ATOMIC_ACQUIRE);
    return enabled != 0 && active != 0 ? 1 : 0;
}
