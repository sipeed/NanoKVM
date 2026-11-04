#include "kvm_mmf.hpp"

#include "cvi_buffer.h"
#include "cvi_venc.h"
#include "sample_comm.h"

#include <algorithm>
#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <limits>
#include <mutex>
#include <sys/file.h>
#include <sys/ioctl.h>
#include <time.h>
#include <unistd.h>

#include <linux/cvi_vc_drv_ioctl.h>

namespace kvm_mmf {
namespace {

constexpr int group = 0;
constexpr int source_fps = 60; // LT6911's configured VI rate.
constexpr unsigned max_packs = 8;

struct Channel {
    VB_POOL pool = VB_INVALID_POOLID;
    bool attached = false, enabled = false, created = false;
    bool bound = false, receiving = false, acquired = false, failed = false;
    uint16_t width = 0, height = 0, quality = 0, fps = 0;
    uint8_t gop = 0;
    uint64_t token = 0, pts_offset = 0;
    bool first_pts = true;
    VENC_STREAM_S stream = {};
    VENC_PACK_S packs[max_packs] = {};
};

std::mutex channel_mutex[2];
Channel channels[2];
SAMPLE_VI_CONFIG_S vi_config = {};
bool system_ready = false, group_created = false, group_started = false;
bool vi_bound = false, vi_started = false;
uint64_t next_token[2] = {}, last_pts[2] = {};
int owner_fd = -1; // Held until process exit, including across HDMI restarts.
bool stale_resources_cleared = false;

int channel_id(Codec codec) { return codec == H264 ? 0 : 1; }
bool valid_codec(Codec codec) { return codec == H264 || codec == MJPEG; }

bool check(int result, const char *operation)
{
    if (result == CVI_SUCCESS) return true;
    fprintf(stderr, "[kvm_mmf] %s failed: %#x\n", operation, result);
    return false;
}

bool unbind_source(MOD_ID_E module, int device, int channel)
{
    MMF_CHN_S source = {module, device, channel};
    MMF_BIND_DEST_S destinations = {};
    if (!check(CVI_SYS_GetBindbySrc(&source, &destinations), "GetBindbySrc")) return false;
    for (unsigned i = 0; i < destinations.u32Num; ++i) {
        if (!check(CVI_SYS_UnBind(&source, &destinations.astMmfChn[i]), "UnBind stale stream")) return false;
    }
    return true;
}

bool clear_stale_encoder(int channel)
{
    char device[32];
    snprintf(device, sizeof(device), "/dev/%s%d", CVI_VC_DRV_ENCODER_DEV_NAME, channel);
    int fd = open(device, O_RDWR | O_CLOEXEC);
    if (fd < 0) return check(CVI_FAILURE, "open stale encoder");
    VENC_CHN_ATTR_S attr = {};
    int result = ioctl(fd, CVI_VC_VENC_GET_CHN_ATTR, &attr);
    if (result == CVI_SUCCESS) {
        fprintf(stderr, "[kvm_mmf] clearing stale VENC channel %d\n", channel);
        // The SDK wrapper counts channels created in this process. Its
        // DestroyChn cannot adopt an orphan without corrupting that count.
        // Use the SDK's kernel ABI only for recovery of the previous owner.
        result = ioctl(fd, CVI_VC_VENC_STOP_RECV_FRAME);
        if (result == CVI_SUCCESS) result = ioctl(fd, CVI_VC_VENC_RESET_CHN);
        if (result == CVI_SUCCESS) result = ioctl(fd, CVI_VC_VENC_DESTROY_CHN);
    } else if (result == CVI_ERR_VENC_UNEXIST) {
        result = CVI_SUCCESS;
    }
    close(fd);
    return check(result, "clear stale VENC channel");
}

bool clear_stale_resources()
{
    if (!unbind_source(CVI_ID_VI, 0, 0)) return false;
    for (int channel = 0; channel < VPSS_MAX_CHN_NUM; ++channel) {
        if (!unbind_source(CVI_ID_VPSS, group, channel)) return false;
    }
    for (int channel = 0; channel < 2; ++channel) {
        if (!clear_stale_encoder(channel)) return false;
    }
    VPSS_GRP_ATTR_S attr = {};
    int result = CVI_VPSS_GetGrpAttr(group, &attr);
    if (result == CVI_SUCCESS) {
        fprintf(stderr, "[kvm_mmf] clearing stale VPSS group %d\n", group);
        for (int channel = 0; channel < VPSS_MAX_CHN_NUM; ++channel) {
            if (!check(CVI_VPSS_DisableChn(group, channel), "Disable stale VPSS channel")) return false;
        }
        if (!check(CVI_VPSS_StopGrp(group), "Stop stale VPSS group") ||
            !check(CVI_VPSS_DestroyGrp(group), "Destroy stale VPSS group")) return false;
    } else if (result != CVI_ERR_VPSS_UNEXIST) {
        return check(result, "Get stale VPSS group");
    }
    return true;
}

bool release_locked(Codec codec)
{
    Channel &ch = channels[codec];
    if (!ch.acquired) return true;
    if (!check(CVI_VENC_ReleaseStream(channel_id(codec), &ch.stream), "ReleaseStream")) {
        ch.failed = true;
        return false;
    }
    ch.acquired = false;
    ch.token = 0;
    return true;
}

bool stop_locked(Codec codec)
{
    Channel &ch = channels[codec];
    const int id = channel_id(codec);
    ch.failed = true;
    if (ch.bound && check(SAMPLE_COMM_VPSS_UnBind_VENC(group, id, id), "UnBind_VENC")) ch.bound = false;
    release_locked(codec);
    if (ch.receiving && check(CVI_VENC_StopRecvFrame(id), "StopRecvFrame")) ch.receiving = false;
    if (ch.created) {
        check(CVI_VENC_ResetChn(id), "ResetChn");
        if (check(CVI_VENC_DestroyChn(id), "DestroyChn")) {
            ch.created = ch.receiving = ch.acquired = false;
            ch.token = 0;
        }
    }
    // Never recycle an input pool while its encoder may still reference it.
    if (ch.created || ch.bound) return false;
    if (ch.enabled && check(CVI_VPSS_DisableChn(group, id), "DisableChn")) ch.enabled = false;
    if (ch.enabled) return false;
    if (ch.attached && check(CVI_VPSS_DetachVbPool(group, id), "DetachVbPool")) ch.attached = false;
    if (ch.attached) return false;
    if (ch.pool != VB_INVALID_POOLID && check(CVI_VB_DestroyPool(ch.pool), "DestroyPool")) ch.pool = VB_INVALID_POOLID;
    if (ch.pool != VB_INVALID_POOLID) return false;
    ch = Channel{};
    return true;
}

bool configure_output(Codec codec, uint16_t width, uint16_t height, uint16_t fps)
{
    Channel &ch = channels[codec];
    const int id = channel_id(codec);
    VPSS_CHN_ATTR_S attr = {};
    attr.u32Width = width;
    attr.u32Height = height;
    attr.enVideoFormat = VIDEO_FORMAT_LINEAR;
    attr.enPixelFormat = PIXEL_FORMAT_NV21;
    attr.stFrameRate.s32SrcFrameRate = source_fps;
    attr.stFrameRate.s32DstFrameRate = fps;
    attr.u32Depth = 0; // No userspace raw-frame queue.
    // The old Maix wrapper inverted its mirror/flip flags. Direct SDK calls
    // use false for the same normal LT6911 orientation, as in the demo.
    attr.bMirror = CVI_FALSE;
    attr.bFlip = CVI_FALSE;
    if (!check(CVI_VPSS_SetChnAttr(group, id, &attr), "SetChnAttr")) return false;

    VB_POOL_CONFIG_S pool = {};
    pool.u32BlkSize = COMMON_GetPicBufferSize(width, height, PIXEL_FORMAT_NV21,
                                            DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN);
    pool.u32BlkCnt = 2; // SDK working buffers, as in demo_main_stream.c.
    pool.enRemapMode = VB_REMAP_MODE_CACHED;
    snprintf(pool.acName, sizeof(pool.acName), "kvm_%s", codec == H264 ? "h264" : "mjpeg");
    ch.pool = CVI_VB_CreatePool(&pool);
    if (ch.pool == VB_INVALID_POOLID) return check(CVI_FAILURE, "CreatePool");
    if (!check(CVI_VPSS_AttachVbPool(group, id, ch.pool), "AttachVbPool")) return false;
    ch.attached = true;
    if (!check(CVI_VPSS_EnableChn(group, id), "EnableChn")) return false;
    ch.enabled = true;
    return true;
}

bool deinitialize_locked()
{
    bool h264_stopped = stop_locked(H264);
    bool mjpeg_stopped = stop_locked(MJPEG);
    if (!h264_stopped || !mjpeg_stopped) return false;
    if (vi_bound) {
        if (!check(SAMPLE_COMM_VI_UnBind_VPSS(0, 0, group), "VI_UnBind_VPSS")) return false;
        vi_bound = false;
    }
    if (vi_started) {
        SAMPLE_COMM_VI_DestroyIsp(&vi_config);
        SAMPLE_COMM_VI_DestroyVi(&vi_config);
        vi_started = false;
    }
    if (group_started) {
        if (!check(CVI_VPSS_StopGrp(group), "StopGrp")) return false;
        group_started = false;
    }
    if (group_created) {
        if (!check(CVI_VPSS_DestroyGrp(group), "DestroyGrp")) return false;
        group_created = false;
    }
    if (system_ready) {
        if (!check(CVI_SYS_Exit(), "SYS_Exit") || !check(CVI_VB_Exit(), "VB_Exit")) return false;
        system_ready = false;
    }
    return true;
}

bool initialize_locked()
{
    if (vi_started) return true;
    if (owner_fd < 0) {
        int fd = open("/run/nanokvm-video.lock", O_CREAT | O_RDWR | O_CLOEXEC, 0600);
        if (fd < 0 || flock(fd, LOCK_EX | LOCK_NB) != 0) {
            fprintf(stderr, "[kvm_mmf] cannot acquire video ownership: %s\n", strerror(errno));
            if (fd >= 0) close(fd);
            return false;
        }
        owner_fd = fd;
    }
    if (!stale_resources_cleared) {
        if (!check(CVI_SYS_Init(), "SYS_Init for recovery")) return false;
        const bool cleared = clear_stale_resources();
        const bool exited = check(CVI_SYS_Exit(), "SYS_Exit after recovery");
        if (!cleared || !exited) return false;
        stale_resources_cleared = true;
    }
    if (system_ready && !deinitialize_locked()) return false;
    SAMPLE_INI_CFG_S ini = {};
    PIC_SIZE_E picture;
    SIZE_S size = {};
    if (!check(SAMPLE_COMM_VI_ParseIni(&ini), "ParseIni")) return false;
    if (ini.devNum != 1 || ini.enSnsType[0] != LONTIUM_LT6911_2M_60FPS_8BIT) {
        fprintf(stderr, "[kvm_mmf] expected one LT6911 input in sensor_cfg.ini\n");
        return false;
    }
    vi_config = {};
    if (!check(CVI_VI_SetDevNum(ini.devNum), "SetDevNum") ||
        !check(SAMPLE_COMM_VI_IniToViCfg(&ini, &vi_config), "IniToViCfg") ||
        !check(SAMPLE_COMM_VI_GetSizeBySensor(ini.enSnsType[0], &picture), "GetSizeBySensor") ||
        !check(SAMPLE_COMM_SYS_GetPicSize(picture, &size), "GetPicSize")) return false;

    VB_CONFIG_S vb = {};
    vb.u32MaxPoolCnt = 1;
    vb.astCommPool[0].u32BlkSize = std::max(
        COMMON_GetPicBufferSize(size.u32Width, size.u32Height, PIXEL_FORMAT_UYVY,
                               DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN),
        COMMON_GetPicBufferSize(size.u32Height, size.u32Width, PIXEL_FORMAT_UYVY,
                               DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN));
    vb.astCommPool[0].u32BlkCnt = 2;
    vb.astCommPool[0].enRemapMode = VB_REMAP_MODE_CACHED;
    if (!check(SAMPLE_COMM_SYS_Init(&vb), "SYS_Init")) return false;
    system_ready = true;

    VPSS_GRP_ATTR_S attr = {};
    attr.u32MaxW = size.u32Width;
    attr.u32MaxH = size.u32Height;
    attr.enPixelFormat = PIXEL_FORMAT_UYVY;
    attr.stFrameRate.s32SrcFrameRate = -1;
    attr.stFrameRate.s32DstFrameRate = -1;
    if (!check(CVI_VPSS_CreateGrp(group, &attr), "CreateGrp")) goto failed;
    group_created = true;
    if (!check(CVI_VPSS_ResetGrp(group), "ResetGrp")) goto failed;
    // Outputs are created only when a codec is requested. An enabled output
    // without a bound encoder can retain buffers and stall later consumers.
    if (!check(CVI_VPSS_StartGrp(group), "StartGrp")) goto failed;
    group_started = true;
    if (!check(SAMPLE_COMM_VI_Bind_VPSS(0, 0, group), "VI_Bind_VPSS")) goto failed;
    vi_bound = true;
    // The SDK helper unwinds its own partial VI initialization on failure.
    if (!check(SAMPLE_PLAT_VI_INIT(&vi_config), "VI_INIT")) goto failed;
    vi_started = true;
    return true;
failed:
    deinitialize_locked();
    return false;
}

bool start_locked(Codec codec, uint16_t width, uint16_t height,
                  uint16_t quality, uint16_t fps, uint8_t gop)
{
    if (!stop_locked(codec)) return false;
    Channel &ch = channels[codec];
    const int id = channel_id(codec);
    ch.width = width;
    ch.height = height;
    ch.quality = quality;
    ch.fps = fps;
    ch.gop = gop;
    if (!configure_output(codec, width, height, fps)) return false;

    VENC_CHN_ATTR_S attr = {};
    attr.stVencAttr.enType = codec == H264 ? PT_H264 : PT_MJPEG;
    attr.stVencAttr.u32MaxPicWidth = attr.stVencAttr.u32PicWidth = width;
    attr.stVencAttr.u32MaxPicHeight = attr.stVencAttr.u32PicHeight = height;
    // High-quality MJPEG can exceed half the uncompressed pixel count.
    // The JPEG engine requires a 1024-byte aligned bitstream buffer size.
    const uint32_t buffer_size = uint32_t(width) * height * (codec == H264 ? 1 : 3) / 2;
    attr.stVencAttr.u32BufSize = (buffer_size + 1023) & ~1023U;
    attr.stVencAttr.u32Profile = 0;
    attr.stVencAttr.bByFrame = CVI_TRUE;
    // bEsBufQueueEn and bIsoSendFrmEn remain disabled, as in the demo.
    if (codec == H264) {
        attr.stRcAttr.enRcMode = VENC_RC_MODE_H264CBR;
        auto &cbr = attr.stRcAttr.stH264Cbr;
        cbr.u32Gop = gop;
        cbr.u32StatTime = 2;
        cbr.u32SrcFrameRate = cbr.fr32DstFrameRate = fps;
        cbr.u32BitRate = quality;
        attr.stGopAttr.enGopMode = VENC_GOPMODE_NORMALP;
        attr.stGopAttr.stNormalP.s32IPQpDelta = 2;
    } else {
        attr.stRcAttr.enRcMode = VENC_RC_MODE_MJPEGFIXQP;
        attr.stRcAttr.stMjpegFixQp.u32Qfactor = quality;
        attr.stRcAttr.stMjpegFixQp.u32SrcFrameRate = fps;
        attr.stRcAttr.stMjpegFixQp.fr32DstFrameRate = fps;
    }
    if (!check(CVI_VENC_CreateChn(id, &attr), "CreateChn")) return false;
    ch.created = true;
    if (codec == H264) {
        VENC_H264_VUI_S vui = {};
        if (!check(CVI_VENC_GetH264Vui(id, &vui), "GetH264Vui")) return false;
        vui.stVuiTimeInfo.timing_info_present_flag = 1;
        vui.stVuiTimeInfo.fixed_frame_rate_flag = 1;
        vui.stVuiTimeInfo.num_units_in_tick = 1000;
        vui.stVuiTimeInfo.time_scale = 2000 * fps;
        if (!check(CVI_VENC_SetH264Vui(id, &vui), "SetH264Vui")) return false;
    }
    if (!check(SAMPLE_COMM_VPSS_Bind_VENC(group, id, id), "Bind_VENC")) return false;
    ch.bound = true;
    VENC_RECV_PIC_PARAM_S receive = {};
    receive.s32RecvPicNum = -1;
    if (!check(CVI_VENC_StartRecvFrame(id, &receive), "StartRecvFrame")) return false;
    ch.receiving = true;
    return true;
}

uint64_t timestamp_locked(Codec codec, uint64_t pts)
{
    Channel &ch = channels[codec];
    if (pts == 0) {
        struct timespec now;
        clock_gettime(CLOCK_MONOTONIC, &now);
        pts = uint64_t(now.tv_sec) * 1000000 + now.tv_nsec / 1000;
    }
    if (ch.first_pts) {
        ch.first_pts = false;
        if (pts <= last_pts[codec]) ch.pts_offset = last_pts[codec] + 1 - pts;
    }
    pts += ch.pts_offset;
    if (pts <= last_pts[codec]) pts = last_pts[codec] + 1;
    return last_pts[codec] = pts;
}

} // namespace

bool initialize()
{
    std::scoped_lock lock(channel_mutex[H264], channel_mutex[MJPEG]);
    return initialize_locked();
}

bool restart()
{
    std::scoped_lock lock(channel_mutex[H264], channel_mutex[MJPEG]);
    if (!deinitialize_locked()) return false;
    return initialize_locked();
}

void deinitialize()
{
    std::scoped_lock lock(channel_mutex[H264], channel_mutex[MJPEG]);
    deinitialize_locked();
}

void stop(Codec codec)
{
    if (!valid_codec(codec)) return;
    std::lock_guard<std::mutex> lock(channel_mutex[codec]);
    stop_locked(codec);
}

int acquire(Codec codec, uint16_t width, uint16_t height, uint16_t quality,
            uint16_t fps, uint8_t gop, Frame *frame)
{
    if (frame) *frame = Frame{};
    if (!frame || !valid_codec(codec) || width == 0 || height == 0 ||
        width > 1920 || height > 1080 || width % 2 || height % 2 || fps == 0 || fps > source_fps ||
        quality == 0 || (codec == MJPEG && quality > 100) || (codec == H264 && gop == 0)) return -2;
    std::unique_lock<std::mutex> lock(channel_mutex[codec]);
    if (!vi_started) {
        lock.unlock();
        if (!initialize()) return -2;
        lock.lock();
        if (!vi_started) return -2;
    }
    Channel &ch = channels[codec];
    // Recover even if ReleaseStream failed: the Go sender only releases once.
    if (ch.failed && !stop_locked(codec)) return -2;
    if (ch.acquired) return -5;
    if (!ch.receiving || ch.width != width || ch.height != height ||
        ch.quality != quality || ch.fps != fps || (codec == H264 && ch.gop != gop)) {
        if (!start_locked(codec, width, height, quality, fps, gop)) {
            stop_locked(codec);
            return -2;
        }
    }
    ch.stream = {};
    ch.stream.pstPack = ch.packs;
    ch.stream.u32PackCount = max_packs;
    if (CVI_VENC_GetStream(channel_id(codec), &ch.stream, 1000) != CVI_SUCCESS) return -1;
    ch.acquired = true;
    ch.token = ++next_token[codec];

    uint64_t size = 0;
    bool valid = ch.stream.u32PackCount > 0 && ch.stream.u32PackCount <= max_packs;
    for (unsigned i = 0; valid && i < ch.stream.u32PackCount; ++i) {
        const auto &pack = ch.packs[i];
        valid = pack.pu8Addr && pack.u32Offset <= pack.u32Len;
        if (valid) size += pack.u32Len - pack.u32Offset;
    }
    if (!valid || size == 0 || size > std::numeric_limits<uint32_t>::max()) {
        release_locked(codec);
        return -2;
    }
    frame->data = static_cast<uint8_t *>(malloc(size));
    if (!frame->data) {
        release_locked(codec);
        return -3;
    }
    uint32_t offset = 0;
    for (unsigned i = 0; i < ch.stream.u32PackCount; ++i) {
        const auto &pack = ch.packs[i];
        uint32_t length = pack.u32Len - pack.u32Offset;
        memcpy(frame->data + offset, pack.pu8Addr + pack.u32Offset, length);
        offset += length;
        if (codec == H264 && pack.DataType.enH264EType == H264E_NALU_IDRSLICE) frame->keyframe = true;
    }
    frame->size = offset;
    frame->timestamp = timestamp_locked(codec, ch.packs[0].u64PTS);
    frame->token = ch.token;
    return 0;
}

void release(Codec codec, uint64_t token)
{
    if (!valid_codec(codec)) return;
    std::lock_guard<std::mutex> lock(channel_mutex[codec]);
    // HDMI teardown may have released this generation. The caller has a copy;
    // a late release must not touch a newly created encoder's stream.
    if (token != 0 && channels[codec].token == token) release_locked(codec);
}

} // namespace kvm_mmf
