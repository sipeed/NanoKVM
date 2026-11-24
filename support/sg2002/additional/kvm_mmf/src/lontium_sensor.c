// Sophgo sensor metadata adapter. Receiver identification, I2C and reset belong
// to lontium_hdmi in the kernel; this adapter only configures the CSI receiver.
#include <string.h>

#include <linux/vi_snsr.h>
#include "cvi_sns_ctrl.h"
#include "cvi_ae.h"
#include "cvi_isp.h"
#include "source_config.h"

#define LONTIUM_SENSOR_ID 6911

static CVI_BOOL sync_initialized[VI_MAX_PIPE_NUM];
static SNS_COMBO_DEV_ATTR_S rx_attr = {
    .input_mode = INPUT_MODE_MIPI,
    .mac_clk = RX_MAC_CLK_600M,
    .mipi_attr = {
        .raw_data_type = YUV422_8BIT,
        .lane_id = {2, 4, 3, 1, 0},
        .pn_swap = {0, 0, 0, 0, 0},
        .wdr_mode = CVI_MIPI_WDR_MODE_NONE,
        .dphy = {.enable = 1, .hs_settle = 8},
    },
    .mclk = {.cam = 0, .freq = CAMPLL_FREQ_NONE},
    .devno = 1,
};

static void sensor_init(VI_PIPE pipe)
{
    (void)pipe;
}

static void sensor_global_init(VI_PIPE pipe)
{
    if (pipe >= 0 && pipe < VI_MAX_PIPE_NUM) sync_initialized[pipe] = CVI_FALSE;
}

static CVI_S32 set_image_mode(VI_PIPE pipe, ISP_CMOS_SENSOR_IMAGE_MODE_S *mode)
{
    struct kvm_source_config source;
    if (pipe < 0 || pipe >= VI_MAX_PIPE_NUM || !mode || kvm_source_get(&source) != 0)
        return CVI_FAILURE;
    return mode->u16Width == source.width && mode->u16Height == source.height ?
           CVI_SUCCESS : CVI_FAILURE;
}

static CVI_S32 set_wdr_mode(VI_PIPE pipe, CVI_U8 mode)
{
    (void)pipe;
    return mode == WDR_MODE_NONE ? CVI_SUCCESS : CVI_FAILURE;
}

static CVI_S32 get_isp_default(VI_PIPE pipe, ISP_CMOS_DEFAULT_S *defaults)
{
    (void)pipe;
    if (!defaults) return CVI_FAILURE;
    memset(defaults, 0, sizeof(*defaults));
    return CVI_SUCCESS;
}

static CVI_S32 get_sensor_info(VI_PIPE pipe, ISP_SNS_SYNC_INFO_S *info)
{
    struct kvm_source_config source;
    if (pipe < 0 || pipe >= VI_MAX_PIPE_NUM || !info || kvm_source_get(&source) != 0)
        return CVI_FAILURE;
    memset(info, 0, sizeof(*info));
    // Zero register entries: the ISP must never schedule receiver I2C writes.
    info->snsCfg.enSnsType = SNS_I2C_TYPE;
    info->ispCfg.frm_num = 1;
    info->ispCfg.img_size[0].stSnsSize.u32Width = source.width;
    info->ispCfg.img_size[0].stSnsSize.u32Height = source.height;
    info->ispCfg.img_size[0].stWndRect.u32Width = source.width;
    info->ispCfg.img_size[0].stWndRect.u32Height = source.height;
    info->ispCfg.img_size[0].stMaxSize = info->ispCfg.img_size[0].stSnsSize;
    info->ispCfg.need_update = !sync_initialized[pipe];
    sync_initialized[pipe] = CVI_TRUE;
    return CVI_SUCCESS;
}

static CVI_S32 sensor_callbacks(ISP_SENSOR_EXP_FUNC_S *callbacks)
{
    if (!callbacks) return CVI_FAILURE;
    memset(callbacks, 0, sizeof(*callbacks));
    callbacks->pfn_cmos_sensor_init = sensor_init;
    callbacks->pfn_cmos_sensor_exit = sensor_init;
    callbacks->pfn_cmos_sensor_global_init = sensor_global_init;
    callbacks->pfn_cmos_set_image_mode = set_image_mode;
    callbacks->pfn_cmos_set_wdr_mode = set_wdr_mode;
    callbacks->pfn_cmos_get_isp_default = get_isp_default;
    callbacks->pfn_cmos_get_sns_reg_info = get_sensor_info;
    return CVI_SUCCESS;
}

static CVI_S32 get_ae_default(VI_PIPE pipe, AE_SENSOR_DEFAULT_S *defaults)
{
    (void)pipe;
    if (!defaults) return CVI_FAILURE;
    memset(defaults, 0, sizeof(*defaults));
    return CVI_SUCCESS;
}

static CVI_S32 ignore_gain(VI_PIPE pipe, CVI_U32 *linear, CVI_U32 *gain)
{
    (void)pipe;
    (void)linear;
    (void)gain;
    return CVI_SUCCESS;
}

static CVI_S32 ae_callbacks(AE_SENSOR_EXP_FUNC_S *callbacks)
{
    if (!callbacks) return CVI_FAILURE;
    memset(callbacks, 0, sizeof(*callbacks));
    callbacks->pfn_cmos_get_ae_default = get_ae_default;
    callbacks->pfn_cmos_gains_update = ignore_gain;
    callbacks->pfn_cmos_again_calc_table = ignore_gain;
    callbacks->pfn_cmos_dgain_calc_table = ignore_gain;
    return CVI_SUCCESS;
}

static CVI_S32 register_callbacks(VI_PIPE pipe, ALG_LIB_S *ae, ALG_LIB_S *awb)
{
    ISP_SENSOR_REGISTER_S isp_registration;
    AE_SENSOR_REGISTER_S ae_registration;
    ISP_SNS_ATTR_INFO_S sensor = {.eSensorId = LONTIUM_SENSOR_ID};
    struct kvm_source_config source;
    (void)awb;
    if (pipe < 0 || pipe >= VI_MAX_PIPE_NUM || !ae || kvm_source_get(&source) != 0)
        return CVI_FAILURE;
    sensor_global_init(pipe);
    sensor_callbacks(&isp_registration.stSnsExp);
    CVI_S32 result = CVI_ISP_SensorRegCallBack(pipe, &sensor, &isp_registration);
    if (result != CVI_SUCCESS) return result;
    ae_callbacks(&ae_registration.stAeExp);
    result = CVI_AE_SensorRegCallBack(pipe, ae, &sensor, &ae_registration);
    if (result != CVI_SUCCESS) CVI_ISP_SensorUnRegCallBack(pipe, LONTIUM_SENSOR_ID);
    return result;
}

static CVI_S32 unregister_callbacks(VI_PIPE pipe, ALG_LIB_S *ae, ALG_LIB_S *awb)
{
    (void)awb;
    CVI_S32 isp_result = CVI_ISP_SensorUnRegCallBack(pipe, LONTIUM_SENSOR_ID);
    CVI_S32 ae_result = CVI_AE_SensorUnRegCallBack(pipe, ae, LONTIUM_SENSOR_ID);
    return isp_result != CVI_SUCCESS ? isp_result : ae_result;
}

static CVI_S32 set_bus_info(VI_PIPE pipe, ISP_SNS_COMMBUS_U bus)
{
    (void)pipe;
    (void)bus;
    // Required SDK callback; no userspace I2C client is opened.
    return CVI_SUCCESS;
}

static CVI_S32 get_rx_attr(VI_PIPE pipe, SNS_COMBO_DEV_ATTR_S *attr)
{
    struct kvm_source_config source;
    if (pipe < 0 || pipe >= VI_MAX_PIPE_NUM || !attr || kvm_source_get(&source) != 0)
        return CVI_FAILURE;
    *attr = rx_attr;
    attr->img_size.width = source.width;
    attr->img_size.height = source.height;
    return CVI_SUCCESS;
}

static CVI_S32 patch_rx_attr(RX_INIT_ATTR_S *init)
{
    if (!init || init->MipiDev >= 2) return CVI_FAILURE;
    rx_attr.devno = init->MipiDev;
    if (init->stMclkAttr.bMclkEn) rx_attr.mclk.cam = init->stMclkAttr.u8Mclk;
    for (int i = 0; i < MIPI_LANE_NUM + 1; ++i) {
        rx_attr.mipi_attr.lane_id[i] = init->as16LaneId[i];
        rx_attr.mipi_attr.pn_swap[i] = init->as8PNSwap[i];
    }
    return CVI_SUCCESS;
}

// The SDK registers all four Lontium receivers through this sensor object.
ISP_SNS_OBJ_S stSnsLT6911_Obj = {
    .pfnRegisterCallback = register_callbacks,
    .pfnUnRegisterCallback = unregister_callbacks,
    .pfnSetBusInfo = set_bus_info,
    .pfnPatchRxAttr = patch_rx_attr,
    .pfnGetRxAttr = get_rx_attr,
    .pfnExpSensorCb = sensor_callbacks,
    .pfnExpAeCb = ae_callbacks,
};
