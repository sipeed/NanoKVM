#include <stdint.h>
#include <string.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <sys/time.h>
#include <sys/param.h>
#include "math.h"
#include <inttypes.h>

#include <fcntl.h>		/* low-level i/o */
#include "cvi_buffer.h"
#include "cvi_ae_comm.h"
#include "cvi_awb_comm.h"
#include "cvi_comm_isp.h"
#include "cvi_comm_sns.h"
#include "cvi_ae.h"
#include "cvi_awb.h"
#include "cvi_isp.h"
#include "cvi_sns_ctrl.h"
#include "cvi_ive.h"
#include "cvi_sys.h"
#include "sample_comm.h"
#include "kvm_mmf.hpp"
#include "global_config.h"

#define MMF_VI_MAX_CHN 			2		// manually limit the max channel number of vi
#define MMF_RGN_MAX_NUM			16
#define MMF_VENC_MAX_CHN		4

#define MMF_VB_VI_ID			0

#if VPSS_MAX_PHY_CHN_NUM < MMF_VI_MAX_CHN
#error "VPSS_MAX_PHY_CHN_NUM < MMF_VI_MAX_CHN"
#endif

typedef struct {
	uint8_t ch;
	SIZE_S input;
	SIZE_S output;
	int fps;
	uint8_t depth;
	uint8_t fit; 	// fit = 0, width to new width, height to new height, may be stretch
					// fit = 1, keep aspect ratio, fill blank area with black color
					// fit = 2, keep aspect ratio, crop image to fit new size
	int input_fmt;
	int output_fmt;
} vpss_info_t;

typedef struct {
	uint8_t ch;
	uint8_t type;	// 0, jpg; 1, h265; 2, h264
	uint8_t is_inited;
	uint8_t is_used;
	uint8_t is_running;
	uint8_t use_vpss;
	VIDEO_FRAME_INFO_S *capture_frame;
	VENC_STREAM_S capture_stream;
	mmf_venc_cfg_t cfg;
	vpss_info_t vpss;
	uint32_t pool_id;
} venc_info_t;

typedef enum {
	MMF_MOD_VO,
	MMF_MOD_VI,
	MMF_MOD_VPSS,
	MMF_MOD_VENC,
	MMF_MOD_VDEC,
	MMF_MOD_REGION,
} mmf_mod_type_t;

typedef struct {
	char name[15];
	uint8_t is_used;
	mmf_mod_type_t mod;
	uint32_t pool_id;
	uint32_t size;
	uint32_t max_num;
} mmf_vb_pool_t;

typedef struct {
	int mmf_used_cnt;
	bool vi_is_inited;
	bool vi_chn_is_inited[MMF_VI_MAX_CHN];
	int vi_chn_pool_id[MMF_VI_MAX_CHN];
	SIZE_S vi_size;
	VIDEO_FRAME_INFO_S vi_frame[MMF_VI_MAX_CHN];
	VB_CONFIG_S vb_conf;

	int ive_is_init;
	IVE_HANDLE ive_handle;
	IVE_IMAGE_S ive_rgb2yuv_rgb_img;
	IVE_IMAGE_S ive_rgb2yuv_yuv_img;
	int ive_rgb2yuv_w;
	int ive_rgb2yuv_h;

	bool rgn_is_init[MMF_RGN_MAX_NUM];
	bool rgn_is_bind[MMF_RGN_MAX_NUM];
	RGN_TYPE_E rgn_type[MMF_RGN_MAX_NUM];
	int rgn_id[MMF_RGN_MAX_NUM];
	MOD_ID_E rgn_mod_id[MMF_RGN_MAX_NUM];
	CVI_S32 rgn_dev_id[MMF_RGN_MAX_NUM];
	CVI_S32 rgn_chn_id[MMF_RGN_MAX_NUM];
	uint8_t* rgn_canvas_data[MMF_RGN_MAX_NUM];
	int rgn_canvas_w[MMF_RGN_MAX_NUM];
	int rgn_canvas_h[MMF_RGN_MAX_NUM];
	int rgn_canvas_format[MMF_RGN_MAX_NUM];

	int enc_jpg_is_init;
	VENC_STREAM_S enc_jpeg_frame;
	int enc_jpg_frame_w;
	int enc_jpg_frame_h;
	int enc_jpg_frame_fmt;
	int enc_jpg_running;
	int enc_jpg_quality;
	VIDEO_FRAME_INFO_S *enc_jpg_frame;
	int enc_jpg_input_pool_id;
	int enc_jpg_output_pool_id;

	int vb_of_vi_is_config : 1;
	int vb_of_private_is_config : 1;
	int vb_size_of_vi;
	int vb_count_of_vi;
	int vb_size_of_private;
	int vb_count_of_private;


	SAMPLE_SNS_TYPE_E sensor_type;

	venc_info_t venc[MMF_VENC_MAX_CHN];
	uint8_t h265_or_h264_is_used;

	mmf_vb_pool_t vb_pool[VB_MAX_COMM_POOLS];
} priv_t;

typedef struct {
	int enc_jpg_enable : 1;
	bool vi_hmirror[MMF_VI_MAX_CHN];
	bool vi_vflip[MMF_VI_MAX_CHN];
} g_priv_t;

static priv_t priv;
static g_priv_t g_priv;

#define MODULE_NAME "soph_vi"

static int _is_module_in_use(const char *module_name) {
    FILE *fp;
    char buffer[256];

    fp = fopen("/proc/modules", "r");
    if (fp == NULL) {
        perror("fopen");
        return -1;
    }

    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        char mod_name[256];
        int usage_count;

        sscanf(buffer, "%255s %*s %d", mod_name, &usage_count);

        if (strcmp(mod_name, module_name) == 0) {
            fclose(fp);
            return usage_count > 0;
        }
    }

    fclose(fp);
    return 0;
}

static int reinit_soph_vb(void)
{
	printf("mmf insmod..\r\n");
	system("rmmod soph_ive soph_vc_driver soph_rgn soph_dwa soph_vpss soph_vi soph_snsr_i2c soph_mipi_rx soph_fast_image soph_rtos_cmdqu soph_base");
	// system("insmod /mnt/system/ko/soph_sys.ko");
	system("insmod /mnt/system/ko/soph_base.ko");
	system("insmod /mnt/system/ko/soph_rtos_cmdqu.ko");
	system("insmod /mnt/system/ko/soph_fast_image.ko");
	system("insmod /mnt/system/ko/soph_mipi_rx.ko");
	system("insmod /mnt/system/ko/soph_snsr_i2c.ko");
	system("insmod /mnt/system/ko/soph_vi.ko");
	system("insmod /mnt/system/ko/soph_vpss.ko");
	system("insmod /mnt/system/ko/soph_dwa.ko");
	system("insmod /mnt/system/ko/soph_rgn.ko");
	system("insmod /mnt/system/ko/soph_vc_driver.ko");
	system("insmod /mnt/system/ko/soph_ive.ko");

	return 0;
}

static int _get_vb_pool_cnt(void)
{
    FILE *file;
    char line[1024];
    int poolIdCount = 0;

    file = fopen("/proc/cvitek/vb", "r");
    if (file == NULL) {
        perror("can not open /proc/cvitek/vb");
        return 0;
    }

    while (fgets(line, sizeof(line), file)) {
        if (strstr(line, "PoolId(") != NULL) {
            poolIdCount++;
        }
    }

    fclose(file);
    return poolIdCount;
}

static int _create_vb_pool(char *name, mmf_mod_type_t mod, uint32_t size, uint32_t max_num)
{
	uint32_t pool_id = -1;
	VB_POOL_CONFIG_S stVbPoolCfg;
	stVbPoolCfg.u32BlkCnt = max_num;
	stVbPoolCfg.u32BlkSize = size;
	stVbPoolCfg.enRemapMode = VB_REMAP_MODE_CACHED;

	if (max_num == 0 || size == 0) {
		return -1;
	}

	pool_id = CVI_VB_CreatePool(&stVbPoolCfg);
	if (pool_id == VB_INVALID_POOLID || pool_id >= VB_MAX_COMM_POOLS) {
		return -2;
	}

	mmf_vb_pool_t *info = (mmf_vb_pool_t *)&priv.vb_pool[pool_id];
	info->pool_id = pool_id;
	strncpy(info->name, name, sizeof(info->name));
	info->mod = mod;
	info->size = size;
	info->max_num = max_num;
	info->is_used = 1;

	return pool_id;
}

static int _destroy_vb_pool(uint32_t pool_id)
{
	CVI_S32 s32Ret;
	mmf_vb_pool_t *info = (mmf_vb_pool_t *)&priv.vb_pool[pool_id];
	if (info->is_used) {
		s32Ret =  CVI_VB_DestroyPool(pool_id);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VB_DestroyPool : %d fail!\n", pool_id);
			return -1;
		}
		memset(info, 0, sizeof(mmf_vb_pool_t));
	}

	return 0;
}

__attribute__((unused)) static void _list_vb_pool(void)
{
	printf("====== VB POOL =======\r\n");
	for (int pool_id = 0; pool_id < VB_MAX_COMM_POOLS; pool_id ++) {
		mmf_vb_pool_t *info = (mmf_vb_pool_t *)&priv.vb_pool[pool_id];
		if (info->is_used) {
			printf("[%d] name:%s size:%d num:%d\r\n", pool_id, info->name, info->size, info->max_num);
		}
	}
	printf("\r\n");
}

static SAMPLE_VI_CONFIG_S g_stViConfig;
static SAMPLE_INI_CFG_S g_stIniCfg;
static CVI_S32 _mmf_vpss_deinit_new(VPSS_GRP VpssGrp);

static int _free_leak_memory_of_ion(void)
{
	#define MAX_LINE_LENGTH 256
    FILE *fp;
    char line[MAX_LINE_LENGTH];
    char alloc_buf_size_str[20], phy_addr_str[20], buffer_name[20];
    int alloc_buf_size;
	uint64_t phy_addr;

    fp = fopen("/sys/kernel/debug/ion/cvi_carveout_heap_dump/summary", "r");
    if (fp == NULL) {
        fprintf(stderr, "Error opening file\n");
        return 1;
    }

    while (fgets(line, MAX_LINE_LENGTH, fp) != NULL) {
        if (sscanf(line, "%*d %s %s %*d %s", alloc_buf_size_str, phy_addr_str, buffer_name) == 3) {
			printf("[ION] %s  %s  %s\r\n", alloc_buf_size_str, phy_addr_str, buffer_name);
			// FIXME: release jpeg_ion
			if (strcmp(buffer_name, "VI_DMA_BUF")
				&& strcmp(buffer_name, "ISP_SHARED_BUFFER_0"))
				continue;
			struct sys_ion_data_new ion_data = {
				.cached = 1,
				.dmabuf_fd = (uint32_t)-1,
			};

            alloc_buf_size = atoi(alloc_buf_size_str);
            phy_addr = (unsigned int)strtol(phy_addr_str, NULL, 16);

			ion_data.size = alloc_buf_size;
			ion_data.addr_p = phy_addr;
			memset(ion_data.name, 0, sizeof(ion_data.name));
			strcpy((char *)ion_data.name, buffer_name);

            printf("alloc_buf_size(%s): %d, phy_addr(%s): %#lx, buffer_name: %s\n",
						alloc_buf_size_str, alloc_buf_size, phy_addr_str, phy_addr, buffer_name);

			printf("ion_data.size:%d, ion_data.addr_p:%#x, ion_data.name:%s\r\n", ion_data.size, (int)ion_data.addr_p, ion_data.name);

			int res = ionFree(&ion_data);
			if (res) {
				printf("ionFree failed! res:%#x\r\n", res);
				mmf_deinit();
				return -1;
			}

        }
    }

    fclose(fp);

	return 0;
}

static int _free_leak_memory_of_vb(void) {
	#define MAX_LINE_LENGTH 256
    FILE *fp;
    char line[MAX_LINE_LENGTH];
	int pool_id = 0;
	uint64_t phy_addr = 0;
	int blk_cnt = 0;
	int blk_size = 0;
	int free_cnt = 0;

    fp = fopen("/proc/cvitek/vb", "r");
    if (fp == NULL) {
        fprintf(stderr, "Error opening file\n");
        return 1;
    }

    while (fgets(line, MAX_LINE_LENGTH, fp) != NULL) {

        if (strstr(line, "PoolId    :")) {
            sscanf(line, "%*s    : %d", &pool_id);
        } else if (strstr(line, "PhysAddr  :")) {
            sscanf(line, "%*s  : %lx", &phy_addr);
        } else if (strstr(line, "BlkSz     :")) {
            sscanf(line, "%*s     : %d", &blk_size);
        } else if (strstr(line, "BlkCnt    : ")) {
            sscanf(line, "%*s    : %d", &blk_cnt);
        } else if (strstr(line, "Free      :")) {
            sscanf(line, "%*s      : %d", &free_cnt);

			CVI_SYS_Exit();
			CVI_VB_Exit();

			if (free_cnt != blk_cnt) {
				printf("relese PoolId: %d, PhysAddr: 0x%lx, BlkSize: %d, BlkCnt: %d Free: %d\n",
					pool_id, phy_addr, blk_size, blk_cnt, free_cnt);
				for (int i = 0; i < blk_cnt; i ++) {
					uint64_t try_release_phy_addr = phy_addr + i * blk_size;
					printf("try release poolid:%d phy:%#lx\r\n", pool_id, try_release_phy_addr);
					VB_BLK blk = CVI_VB_PhysAddr2Handle(try_release_phy_addr);
					if (0 != CVI_VB_ReleaseBlock(blk)) {
						printf("release poolid:%d phy:%#lx failed!\r\n", pool_id, try_release_phy_addr);
					}
				}
			}
        }
    }

    fclose(fp);

	return 0;
}

static inline CVI_VOID VENC_GetPicBufferConfig2(CVI_U32 u32Width, CVI_U32 u32Height,
	PIXEL_FORMAT_E enPixelFormat, DATA_BITWIDTH_E enBitWidth, COMPRESS_MODE_E enCmpMode,
	VB_CAL_CONFIG_S *pstVbCfg)
{
	CVI_U32 u32AlignWidth = ALIGN(u32Width, VENC_ALIGN_W);
	CVI_U32 u32AlignHeight = u32Height;
	CVI_U32 u32Align = VENC_ALIGN_W;

	COMMON_GetPicBufferConfig(u32AlignWidth, u32AlignHeight, enPixelFormat,
		enBitWidth, enCmpMode, u32Align, pstVbCfg);
}

static VIDEO_FRAME_INFO_S *_mmf_alloc_frame(int id, SIZE_S stSize, PIXEL_FORMAT_E enPixelFormat)
{
	VIDEO_FRAME_INFO_S *pstVideoFrame;
	VIDEO_FRAME_S *pstVFrame;
	VB_BLK blk;
	VB_CAL_CONFIG_S stVbCfg;

	pstVideoFrame = (VIDEO_FRAME_INFO_S *)calloc(sizeof(*pstVideoFrame), 1);
	if (pstVideoFrame == NULL) {
		SAMPLE_PRT("Failed to allocate VIDEO_FRAME_INFO_S\n");
		return NULL;
	}

	memset(&stVbCfg, 0, sizeof(stVbCfg));
	VENC_GetPicBufferConfig2(stSize.u32Width,
				stSize.u32Height,
				enPixelFormat,
				DATA_BITWIDTH_8,
				COMPRESS_MODE_NONE,
				&stVbCfg);

	pstVFrame = &pstVideoFrame->stVFrame;

	pstVFrame->enCompressMode = COMPRESS_MODE_NONE;
	pstVFrame->enPixelFormat = enPixelFormat;
	pstVFrame->enVideoFormat = VIDEO_FORMAT_LINEAR;
	pstVFrame->enColorGamut = COLOR_GAMUT_BT709;
	pstVFrame->u32Width = stSize.u32Width;
	pstVFrame->u32Height = stSize.u32Height;
	pstVFrame->u32TimeRef = 0;
	pstVFrame->u64PTS = 0;
	pstVFrame->enDynamicRange = DYNAMIC_RANGE_SDR8;

	blk = CVI_VB_GetBlock(id, stVbCfg.u32VBSize);
	if (blk == VB_INVALID_HANDLE) {
		SAMPLE_PRT("Can't acquire vb block. id: %d size:%d\n", id, stVbCfg.u32VBSize);
		free(pstVideoFrame);
		return NULL;
	}

	pstVideoFrame->u32PoolId = CVI_VB_Handle2PoolId(blk);
	pstVFrame->u64PhyAddr[0] = CVI_VB_Handle2PhysAddr(blk);
	pstVFrame->u32Stride[0] = stVbCfg.u32MainStride;
	pstVFrame->u32Length[0] = stVbCfg.u32MainYSize;
	pstVFrame->pu8VirAddr[0] = (CVI_U8 *)CVI_SYS_MmapCache(pstVFrame->u64PhyAddr[0], stVbCfg.u32VBSize);

	if (stVbCfg.plane_num > 1) {
		pstVFrame->u64PhyAddr[1] = ALIGN(pstVFrame->u64PhyAddr[0] + stVbCfg.u32MainYSize, stVbCfg.u16AddrAlign);
		pstVFrame->u32Stride[1] = stVbCfg.u32CStride;
		pstVFrame->u32Length[1] = stVbCfg.u32MainCSize;
		pstVFrame->pu8VirAddr[1] = (CVI_U8 *)pstVFrame->pu8VirAddr[0] + pstVFrame->u32Length[0];
	}

	if (stVbCfg.plane_num > 2) {
		pstVFrame->u64PhyAddr[2] = ALIGN(pstVFrame->u64PhyAddr[1] + stVbCfg.u32MainCSize, stVbCfg.u16AddrAlign);
		pstVFrame->u32Stride[2] = stVbCfg.u32CStride;
		pstVFrame->u32Length[2] = stVbCfg.u32MainCSize;
		pstVFrame->pu8VirAddr[2] = (CVI_U8 *)pstVFrame->pu8VirAddr[1] + pstVFrame->u32Length[1];
	}

	// CVI_VENC_TRACE("phy addr(%#llx, %#llx, %#llx), Size %x\n", (long long)pstVFrame->u64PhyAddr[0]
	// 	, (long long)pstVFrame->u64PhyAddr[1], (long long)pstVFrame->u64PhyAddr[2], stVbCfg.u32VBSize);
	// CVI_VENC_TRACE("vir addr(%p, %p, %p), Size %x\n", pstVFrame->pu8VirAddr[0]
	// 	, pstVFrame->pu8VirAddr[1], pstVFrame->pu8VirAddr[2], stVbCfg.u32MainSize);

	return pstVideoFrame;
}

static CVI_S32 _mmf_free_frame(VIDEO_FRAME_INFO_S *pstVideoFrame)
{
	VIDEO_FRAME_S *pstVFrame = &pstVideoFrame->stVFrame;
	VB_BLK blk;

	if (pstVFrame->pu8VirAddr[0])
		CVI_SYS_Munmap((CVI_VOID *)pstVFrame->pu8VirAddr[0], pstVFrame->u32Length[0]);
	if (pstVFrame->pu8VirAddr[1])
		CVI_SYS_Munmap((CVI_VOID *)pstVFrame->pu8VirAddr[1], pstVFrame->u32Length[1]);
	if (pstVFrame->pu8VirAddr[2])
		CVI_SYS_Munmap((CVI_VOID *)pstVFrame->pu8VirAddr[2], pstVFrame->u32Length[2]);

	blk = CVI_VB_PhysAddr2Handle(pstVFrame->u64PhyAddr[0]);
	if (blk != VB_INVALID_HANDLE) {
		CVI_VB_ReleaseBlock(blk);
	}

	free(pstVideoFrame);

	return CVI_SUCCESS;
}

static int cvi_ive_init(void)
{
	CVI_S32 s32Ret;
	if (priv.ive_is_init)
		return 0;

	priv.ive_rgb2yuv_w = 640;
	priv.ive_rgb2yuv_h = 480;
	priv.ive_handle = CVI_IVE_CreateHandle();
	if (priv.ive_handle == NULL) {
		printf("CVI_IVE_CreateHandle failed!\n");
		return -1;
	}

	s32Ret = CVI_IVE_CreateImage_Cached(priv.ive_handle, &priv.ive_rgb2yuv_rgb_img, IVE_IMAGE_TYPE_U8C3_PACKAGE, priv.ive_rgb2yuv_w, priv.ive_rgb2yuv_h);
	if (s32Ret != CVI_SUCCESS) {
		printf("Create src image failed!\n");
		CVI_IVE_DestroyHandle(priv.ive_handle);
		return -1;
	}

	s32Ret = CVI_IVE_CreateImage_Cached(priv.ive_handle, &priv.ive_rgb2yuv_yuv_img, IVE_IMAGE_TYPE_YUV420SP, priv.ive_rgb2yuv_w, priv.ive_rgb2yuv_h);
	if (s32Ret != CVI_SUCCESS) {
		printf("Create src image failed!\n");
		CVI_IVE_DestroyHandle(priv.ive_handle);
		return -1;
	}

	priv.ive_is_init = 1;
	return 0;
}

static int cvi_ive_deinit(void)
{
	if (priv.ive_is_init == 0)
		return 0;

	CVI_SYS_FreeI(priv.ive_handle, &priv.ive_rgb2yuv_rgb_img);
	CVI_SYS_FreeI(priv.ive_handle, &priv.ive_rgb2yuv_yuv_img);
	CVI_IVE_DestroyHandle(priv.ive_handle);

	priv.ive_is_init = 0;
	return 0;
}

static int cvi_rgb2nv21(uint8_t *src, int input_w, int input_h)
{
	CVI_S32 s32Ret;

	int width = ALIGN(input_w, DEFAULT_ALIGN);
	int height = input_h;

	if (width != priv.ive_rgb2yuv_w || height != priv.ive_rgb2yuv_h) {
		CVI_SYS_FreeI(priv.ive_handle, &priv.ive_rgb2yuv_rgb_img);
		CVI_SYS_FreeI(priv.ive_handle, &priv.ive_rgb2yuv_yuv_img);
		priv.ive_rgb2yuv_w = width;
		priv.ive_rgb2yuv_h = height;
		printf("reinit rgb2nv21 buffer, buff w:%d h:%d\n", priv.ive_rgb2yuv_w, priv.ive_rgb2yuv_h);
		s32Ret = CVI_IVE_CreateImage_Cached(priv.ive_handle, &priv.ive_rgb2yuv_rgb_img, IVE_IMAGE_TYPE_U8C3_PACKAGE, priv.ive_rgb2yuv_w, priv.ive_rgb2yuv_h);
		if (s32Ret != CVI_SUCCESS) {
			printf("Create src image failed!\n");
			return -1;
		}

		s32Ret = CVI_IVE_CreateImage_Cached(priv.ive_handle, &priv.ive_rgb2yuv_yuv_img, IVE_IMAGE_TYPE_YUV420SP, priv.ive_rgb2yuv_w, priv.ive_rgb2yuv_h);
		if (s32Ret != CVI_SUCCESS) {
			printf("Create src image failed!\n");
			return -1;
		}
	}

	if (width != input_w) {
		for (int h = 0; h < height; h++) {
			memcpy((uint8_t *)priv.ive_rgb2yuv_rgb_img.u64VirAddr[0] + width * h * 3, (uint8_t *)src + input_w * h * 3, input_w * 3);
		}
	} else {
		memcpy((uint8_t *)priv.ive_rgb2yuv_rgb_img.u64VirAddr[0], (uint8_t *)src, width * height * 3);
	}

	IVE_CSC_CTRL_S stCtrl;
	stCtrl.enMode = IVE_CSC_MODE_VIDEO_BT601_RGB2YUV;
	s32Ret = CVI_IVE_CSC(priv.ive_handle, &priv.ive_rgb2yuv_rgb_img, &priv.ive_rgb2yuv_yuv_img, &stCtrl, 1);
	if (s32Ret != CVI_SUCCESS) {
		printf("Run HW IVE CSC YUV2RGB failed!\n");
		return -1;
	}
	return 0;
}

static int _try_release_sys(void)
{
	CVI_S32 s32Ret = CVI_FAILURE;
	SAMPLE_INI_CFG_S	   	stIniCfg;
	SAMPLE_VI_CONFIG_S 		stViConfig;
	if (SAMPLE_COMM_VI_ParseIni(&stIniCfg)) {
		SAMPLE_PRT("Parse complete\n");
		return s32Ret;
	}

	priv.sensor_type = stIniCfg.enSnsType[0];

	s32Ret = CVI_VI_SetDevNum(stIniCfg.devNum);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("VI_SetDevNum failed with %#x\n", s32Ret);
		return s32Ret;
	}

	s32Ret = SAMPLE_COMM_VI_IniToViCfg(&stIniCfg, &stViConfig);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("SAMPLE_COMM_VI_IniToViCfg failed with %#x\n", s32Ret);
		return s32Ret;
	}

	s32Ret = SAMPLE_COMM_VI_DestroyIsp(&stViConfig);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("SAMPLE_COMM_VI_DestroyIsp failed with %#x\n", s32Ret);
		return s32Ret;
	}

	s32Ret = SAMPLE_COMM_VI_DestroyVi(&stViConfig);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("SAMPLE_COMM_VI_DestroyVi failed with %#x\n", s32Ret);
		return s32Ret;
	}

	SAMPLE_COMM_SYS_Exit();
	return s32Ret;
}

int _try_release_vi(void)
{
	CVI_S32 s32Ret = CVI_FAILURE;
	s32Ret = mmf_del_vi_channel_all();
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("mmf_del_vi_channel_all failed with %#x\n", s32Ret);
		return s32Ret;
	}
	return s32Ret;
}

int _try_release_venc_all(void)
{
	for (int ch = 0; ch < VENC_MAX_CHN_NUM; ch ++) {
		CVI_VENC_StopRecvFrame(ch);
		CVI_VENC_ResetChn(ch);
		CVI_VENC_DestroyChn(ch);
	}
	return 0;
}

int _try_release_vpss_all(void)
{
	for (int ch = 0; ch < 4; ch ++) {
		_mmf_vpss_deinit_new(ch);
	}
	return 0;
}

static void _mmf_sys_exit(void)
{
	if (g_stViConfig.s32WorkingViNum != 0) {
		SAMPLE_COMM_VI_DestroyIsp(&g_stViConfig);
		SAMPLE_COMM_VI_DestroyVi(&g_stViConfig);
	}
	SAMPLE_COMM_SYS_Exit();
}

static CVI_S32 _mmf_sys_init(SIZE_S stSize)
{
	VB_CONFIG_S	   stVbConf;
	CVI_U32        u32BlkSize, u32BlkRotSize;
	CVI_S32 s32Ret = CVI_SUCCESS;
	COMPRESS_MODE_E    enCompressMode   = COMPRESS_MODE_NONE;

	memset(&stVbConf, 0, sizeof(VB_CONFIG_S));
	memcpy(&stVbConf, &priv.vb_conf, sizeof(VB_CONFIG_S));

	// vi
	u32BlkSize = COMMON_GetPicBufferSize(stSize.u32Width, stSize.u32Height, PIXEL_FORMAT_UYVY,
		DATA_BITWIDTH_12, enCompressMode, DEFAULT_ALIGN);
	u32BlkRotSize = COMMON_GetPicBufferSize(stSize.u32Height, stSize.u32Width, PIXEL_FORMAT_UYVY,
		DATA_BITWIDTH_12, enCompressMode, DEFAULT_ALIGN);
	u32BlkSize = MAX(u32BlkSize, u32BlkRotSize);
	stVbConf.astCommPool[MMF_VB_VI_ID].u32BlkSize	= u32BlkSize;
	stVbConf.astCommPool[MMF_VB_VI_ID].u32BlkCnt	= 4;
	stVbConf.astCommPool[MMF_VB_VI_ID].enRemapMode	= VB_REMAP_MODE_CACHED;
	stVbConf.u32MaxPoolCnt = 1;

	s32Ret = SAMPLE_COMM_SYS_Init(&stVbConf);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("system init failed with %#x\n", s32Ret);
		goto error;
	}

	return s32Ret;
error:
	_mmf_sys_exit();
	return s32Ret;
}

static CVI_S32 _mmf_vpss_deinit(VPSS_GRP VpssGrp, VPSS_CHN VpssChn)
{
	CVI_BOOL           abChnEnable[VPSS_MAX_PHY_CHN_NUM] = {0};
	CVI_S32 s32Ret = CVI_SUCCESS;

	/*start vpss*/
	abChnEnable[VpssChn] = CVI_TRUE;
	s32Ret = SAMPLE_COMM_VPSS_Stop(VpssGrp, abChnEnable);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("init vpss group failed. s32Ret: 0x%x !\n", s32Ret);
	}

	return s32Ret;
}

static CVI_S32 _mmf_vpss_deinit_new(VPSS_GRP VpssGrp)
{
	CVI_S32 s32Ret = CVI_SUCCESS;

	s32Ret = CVI_VPSS_StopGrp(VpssGrp);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("Vpss Stop Grp %d failed! Please check param\n", VpssGrp);
		return CVI_FAILURE;
	}

	s32Ret = CVI_VPSS_DestroyGrp(VpssGrp);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("Vpss Destroy Grp %d failed! Please check\n", VpssGrp);
		return CVI_FAILURE;
	}

	return s32Ret;
}

// fit = 0, width to new width, height to new height, may be stretch
// fit = 1, keep aspect ratio, fill blank area with black color
// fit = other, keep aspect ratio, crop image to fit new size
static CVI_S32 _mmf_vpss_init(VPSS_GRP VpssGrp, VPSS_CHN VpssChn, SIZE_S stSizeIn, SIZE_S stSizeOut, PIXEL_FORMAT_E formatIn, PIXEL_FORMAT_E formatOut,
int fps, int depth, bool mirror, bool flip, int fit)
{
	VPSS_GRP_ATTR_S    stVpssGrpAttr;
	VPSS_CROP_INFO_S   stGrpCropInfo;
	CVI_BOOL           abChnEnable[VPSS_MAX_PHY_CHN_NUM] = {0};
	VPSS_CHN_ATTR_S    astVpssChnAttr[VPSS_MAX_PHY_CHN_NUM];
	CVI_S32 s32Ret = CVI_SUCCESS;

	memset(&stVpssGrpAttr, 0, sizeof(VPSS_GRP_ATTR_S));
	stVpssGrpAttr.stFrameRate.s32SrcFrameRate    = -1;
	stVpssGrpAttr.stFrameRate.s32DstFrameRate    = -1;
	stVpssGrpAttr.enPixelFormat                  = formatIn;
	stVpssGrpAttr.u32MaxW                        = stSizeIn.u32Width;
	stVpssGrpAttr.u32MaxH                        = stSizeIn.u32Height;
	stVpssGrpAttr.u8VpssDev                      = 0;

	CVI_FLOAT corp_scale_w = (CVI_FLOAT)stSizeIn.u32Width / stSizeOut.u32Width;
	CVI_FLOAT corp_scale_h = (CVI_FLOAT)stSizeIn.u32Height / stSizeOut.u32Height;
	CVI_U32 crop_w = -1, crop_h = -1;
	if (fit == 0) {
		memset(astVpssChnAttr, 0, sizeof(VPSS_CHN_ATTR_S) * VPSS_MAX_PHY_CHN_NUM);
		astVpssChnAttr[VpssChn].u32Width                    = stSizeOut.u32Width;
		astVpssChnAttr[VpssChn].u32Height                   = stSizeOut.u32Height;
		astVpssChnAttr[VpssChn].enVideoFormat               = VIDEO_FORMAT_LINEAR;
		astVpssChnAttr[VpssChn].enPixelFormat               = formatOut;
		astVpssChnAttr[VpssChn].stFrameRate.s32SrcFrameRate = fps;
		astVpssChnAttr[VpssChn].stFrameRate.s32DstFrameRate = fps;
		astVpssChnAttr[VpssChn].u32Depth                    = depth;
		astVpssChnAttr[VpssChn].bMirror                     = mirror;
		astVpssChnAttr[VpssChn].bFlip                       = flip;
		astVpssChnAttr[VpssChn].stAspectRatio.enMode        = ASPECT_RATIO_MANUAL;
		astVpssChnAttr[VpssChn].stAspectRatio.stVideoRect.s32X       = 0;
		astVpssChnAttr[VpssChn].stAspectRatio.stVideoRect.s32Y       = 0;
		astVpssChnAttr[VpssChn].stAspectRatio.stVideoRect.u32Width   = stSizeOut.u32Width;
		astVpssChnAttr[VpssChn].stAspectRatio.stVideoRect.u32Height  = stSizeOut.u32Height;
		astVpssChnAttr[VpssChn].stAspectRatio.bEnableBgColor = CVI_TRUE;
		astVpssChnAttr[VpssChn].stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		astVpssChnAttr[VpssChn].stNormalize.bEnable         = CVI_FALSE;

		stGrpCropInfo.bEnable = false;
	} else if (fit == 1) {
		memset(astVpssChnAttr, 0, sizeof(VPSS_CHN_ATTR_S) * VPSS_MAX_PHY_CHN_NUM);
		astVpssChnAttr[VpssChn].u32Width                    = stSizeOut.u32Width;
		astVpssChnAttr[VpssChn].u32Height                   = stSizeOut.u32Height;
		astVpssChnAttr[VpssChn].enVideoFormat               = VIDEO_FORMAT_LINEAR;
		astVpssChnAttr[VpssChn].enPixelFormat               = formatOut;
		astVpssChnAttr[VpssChn].stFrameRate.s32SrcFrameRate = fps;
		astVpssChnAttr[VpssChn].stFrameRate.s32DstFrameRate = fps;
		astVpssChnAttr[VpssChn].u32Depth                    = depth;
		astVpssChnAttr[VpssChn].bMirror                     = mirror;
		astVpssChnAttr[VpssChn].bFlip                       = flip;
		astVpssChnAttr[VpssChn].stAspectRatio.enMode        = ASPECT_RATIO_AUTO;
		astVpssChnAttr[VpssChn].stAspectRatio.bEnableBgColor = CVI_TRUE;
		astVpssChnAttr[VpssChn].stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		astVpssChnAttr[VpssChn].stNormalize.bEnable         = CVI_FALSE;

		stGrpCropInfo.bEnable = false;
	} else {
		memset(astVpssChnAttr, 0, sizeof(VPSS_CHN_ATTR_S) * VPSS_MAX_PHY_CHN_NUM);
		astVpssChnAttr[VpssChn].u32Width                    = stSizeOut.u32Width;
		astVpssChnAttr[VpssChn].u32Height                   = stSizeOut.u32Height;
		astVpssChnAttr[VpssChn].enVideoFormat               = VIDEO_FORMAT_LINEAR;
		astVpssChnAttr[VpssChn].enPixelFormat               = formatOut;
		astVpssChnAttr[VpssChn].stFrameRate.s32SrcFrameRate = fps;
		astVpssChnAttr[VpssChn].stFrameRate.s32DstFrameRate = fps;
		astVpssChnAttr[VpssChn].u32Depth                    = depth;
		astVpssChnAttr[VpssChn].bMirror                     = mirror;
		astVpssChnAttr[VpssChn].bFlip                       = flip;
		astVpssChnAttr[VpssChn].stAspectRatio.enMode        = ASPECT_RATIO_AUTO;
		astVpssChnAttr[VpssChn].stAspectRatio.bEnableBgColor = CVI_TRUE;
		astVpssChnAttr[VpssChn].stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		astVpssChnAttr[VpssChn].stNormalize.bEnable         = CVI_FALSE;

		crop_w = corp_scale_w < corp_scale_h ? stSizeOut.u32Width * corp_scale_w: stSizeOut.u32Width * corp_scale_h;
		crop_h = corp_scale_w < corp_scale_h ? stSizeOut.u32Height * corp_scale_w: stSizeOut.u32Height * corp_scale_h;
		if (corp_scale_h < 0 || corp_scale_w < 0) {
			SAMPLE_PRT("crop scale error. corp_scale_w: %f, corp_scale_h: %f\n", corp_scale_w, corp_scale_h);
			goto error;
		}

		stGrpCropInfo.bEnable = true;
		stGrpCropInfo.stCropRect.s32X = (stSizeIn.u32Width - crop_w) / 2;
		stGrpCropInfo.stCropRect.s32Y = (stSizeIn.u32Height - crop_h) / 2;
		stGrpCropInfo.stCropRect.u32Width = crop_w;
		stGrpCropInfo.stCropRect.u32Height = crop_h;
	}

	/*start vpss*/
	abChnEnable[0] = CVI_TRUE;
	s32Ret = SAMPLE_COMM_VPSS_Init(VpssGrp, abChnEnable, &stVpssGrpAttr, astVpssChnAttr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("init vpss group failed. s32Ret: 0x%x ! retry!!!\n", s32Ret);
		s32Ret = SAMPLE_COMM_VPSS_Stop(VpssGrp, abChnEnable);
		if (s32Ret != CVI_SUCCESS) {
			SAMPLE_PRT("stop vpss group failed. s32Ret: 0x%x !\n", s32Ret);
		}
		s32Ret = SAMPLE_COMM_VPSS_Init(VpssGrp, abChnEnable, &stVpssGrpAttr, astVpssChnAttr);
		if (s32Ret != CVI_SUCCESS) {
			SAMPLE_PRT("retry to init vpss group failed. s32Ret: 0x%x !\n", s32Ret);
			return s32Ret;
		} else {
			SAMPLE_PRT("retry to init vpss group ok!\n");
		}
	}

	if (crop_w != 0 && crop_h != 0) {
		s32Ret = CVI_VPSS_SetChnCrop(VpssGrp, VpssChn, &stGrpCropInfo);
		if (s32Ret != CVI_SUCCESS) {
			SAMPLE_PRT("set vpss group crop failed. s32Ret: 0x%x !\n", s32Ret);
			goto error;
		}
	}

	s32Ret = SAMPLE_COMM_VPSS_Start(VpssGrp, abChnEnable, &stVpssGrpAttr, astVpssChnAttr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("start vpss group failed. s32Ret: 0x%x !\n", s32Ret);
		goto error;
	}

	return s32Ret;
error:
	_mmf_vpss_deinit(VpssGrp, VpssChn);
	return s32Ret;
}

static CVI_S32 _mmf_init(void)
{
	MMF_VERSION_S stVersion;
	SAMPLE_INI_CFG_S	   stIniCfg;
	SAMPLE_VI_CONFIG_S stViConfig;

	PIC_SIZE_E enPicSize;
	SIZE_S stSize;
	CVI_S32 s32Ret = CVI_SUCCESS;
	LOG_LEVEL_CONF_S log_conf;

	int old_pool_cnt = _get_vb_pool_cnt();
	if (old_pool_cnt > 0) {
		if (_is_module_in_use("soph_vi") == 0) {
			reinit_soph_vb();
		} else {
			printf("You may have repeatedly initialized maix multi-media!");
		}
	}

	CVI_SYS_GetVersion(&stVersion);
	SAMPLE_PRT("maix multi-media version:%s\n", stVersion.version);

	log_conf.enModId = CVI_ID_LOG;
	log_conf.s32Level = CVI_DBG_DEBUG;
	CVI_LOG_SetLevelConf(&log_conf);

	// Get config from ini if found.
	if (SAMPLE_COMM_VI_ParseIni(&stIniCfg)) {
		SAMPLE_PRT("Parse complete\n");
	}

	//Set sensor number
	CVI_VI_SetDevNum(stIniCfg.devNum);

	/************************************************
	 * step1:  Config VI
	 ************************************************/
	s32Ret = SAMPLE_COMM_VI_IniToViCfg(&stIniCfg, &stViConfig);
	if (s32Ret != CVI_SUCCESS)
		return s32Ret;

	memcpy(&g_stViConfig, &stViConfig, sizeof(SAMPLE_VI_CONFIG_S));
	memcpy(&g_stIniCfg, &stIniCfg, sizeof(SAMPLE_INI_CFG_S));

	/************************************************
	 * step2:  Get input size
	 ************************************************/
	s32Ret = SAMPLE_COMM_VI_GetSizeBySensor(stIniCfg.enSnsType[0], &enPicSize);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("SAMPLE_COMM_VI_GetSizeBySensor failed with %#x\n", s32Ret);
		return s32Ret;
	}

	s32Ret = SAMPLE_COMM_SYS_GetPicSize(enPicSize, &stSize);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("SAMPLE_COMM_SYS_GetPicSize failed with %#x\n", s32Ret);
		return s32Ret;
	}

	/************************************************
	 * step3:  Init modules
	 ************************************************/
	if (0 != _free_leak_memory_of_ion()) {
		SAMPLE_PRT("free leak ion memory error\n");
	}

	if (0 != _free_leak_memory_of_vb()) {
		SAMPLE_PRT("free leak vb memory error\n");
	}

	s32Ret = _mmf_sys_init(stSize);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("sys init failed. s32Ret: 0x%x !\n", s32Ret);
		goto _need_exit_sys_and_deinit_vi;
	}

	s32Ret = SAMPLE_PLAT_VI_INIT(&stViConfig);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("vi init failed. s32Ret: 0x%x !\n", s32Ret);
		SAMPLE_PRT("Please try to check if the camera is working.\n");
		goto _need_exit_sys_and_deinit_vi;
	}

	priv.vi_size.u32Width = stSize.u32Width;
	priv.vi_size.u32Height = stSize.u32Height;

	return s32Ret;

_need_exit_sys_and_deinit_vi:
	_mmf_sys_exit();

	return s32Ret;
}

static void _mmf_deinit(void)
{
	UNUSED(cvi_ive_deinit);
	mmf_del_vi_channel_all();
	mmf_del_venc_channel_all();
	mmf_enc_jpg_deinit(0);
	_try_release_venc_all();
	_try_release_vpss_all();
	mmf_vi_deinit();
	// mmf_del_region_channel_all();		// need not release
	_mmf_sys_exit();
}

static int _vi_get_unused_ch() {
	for (int i = 0; i < MMF_VI_MAX_CHN; i++) {
		if (priv.vi_chn_is_inited[i] == false) {
			return i;
		}
	}
	return -1;
}

int mmf_init(void)
{
    if (priv.mmf_used_cnt) {
		priv.mmf_used_cnt ++;
        // printf("maix multi-media already inited(cnt:%d)\n", priv.mmf_used_cnt);
        return 0;
    }

	if (_try_release_sys() != CVI_SUCCESS) {
		printf("try release sys failed\n");
		return -1;
	} else {
		printf("try release sys ok\n");
	}

    if (_mmf_init() != CVI_SUCCESS) {
        printf("maix multi-media init failed\n");
        return -1;
    } else {
		printf("maix multi-media init ok\n");
	}

	UNUSED(cvi_ive_init);
	priv.mmf_used_cnt = 1;

	if (_try_release_vi() != CVI_SUCCESS) {
		printf("try release vio failed\n");
		return -1;
	} else {
		printf("try release vio ok\n");
	}

	if (_try_release_venc_all() != CVI_SUCCESS) {
		printf("try release venc failed\n");
		return -1;
	} else {
		printf("try release venc ok\n");
	}

    return 0;
}

bool mmf_is_init(void)
{
    return priv.mmf_used_cnt > 0 ? true : false;
}

int mmf_try_deinit(bool force) {
	if (!priv.mmf_used_cnt) {
		return 0;
	}

	if (force) {
		priv.mmf_used_cnt = 0;
		printf("maix multi-media driver destroyed.\n");
		_mmf_deinit();
	} else {
		priv.mmf_used_cnt --;
		if (priv.mmf_used_cnt) {
			return 0;
		} else {
			printf("maix multi-media driver destroyed.\n");
			_mmf_deinit();
		}
	}
	return 0;
}

int mmf_deinit(void) {
    return mmf_try_deinit(false);
}

int mmf_get_vi_unused_channel(void) {
	return _vi_get_unused_ch();
}

static CVI_S32 _mmf_vpss_chn_init(VPSS_GRP VpssGrp, VPSS_CHN VpssChn, int width, int height, PIXEL_FORMAT_E format, int fps, int depth, bool mirror, bool flip, int fit)
{
#if 1
	VPSS_GRP_ATTR_S stGrpAttr;
	VPSS_CROP_INFO_S   stChnCropInfo;
	VPSS_CHN_ATTR_S chn_attr = {0};
	CVI_S32 s32Ret = CVI_SUCCESS;

	s32Ret = CVI_VPSS_GetGrpAttr(VpssGrp, &stGrpAttr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_GetGrpAttr failed. s32Ret: 0x%x !\n", s32Ret);
		return s32Ret;
	}
	CVI_FLOAT corp_scale_w = (CVI_FLOAT)stGrpAttr.u32MaxW / width;
	CVI_FLOAT corp_scale_h = (CVI_FLOAT)stGrpAttr.u32MaxH / height;
	CVI_U32 crop_w = -1, crop_h = -1;
	if (fit == 0) {
		chn_attr.u32Width                    = width;
		chn_attr.u32Height                   = height;
		chn_attr.enVideoFormat               = VIDEO_FORMAT_LINEAR;
		chn_attr.enPixelFormat               = format;
		chn_attr.stFrameRate.s32SrcFrameRate = fps;
		chn_attr.stFrameRate.s32DstFrameRate = fps;
		chn_attr.u32Depth                    = depth;
		chn_attr.bMirror                     = mirror;
		chn_attr.bFlip                       = flip;
		chn_attr.stAspectRatio.enMode        = ASPECT_RATIO_MANUAL;
		chn_attr.stAspectRatio.stVideoRect.s32X       = 0;
		chn_attr.stAspectRatio.stVideoRect.s32Y       = 0;
		chn_attr.stAspectRatio.stVideoRect.u32Width   = width;
		chn_attr.stAspectRatio.stVideoRect.u32Height  = height;
		chn_attr.stAspectRatio.bEnableBgColor = CVI_TRUE;
		chn_attr.stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		chn_attr.stNormalize.bEnable         = CVI_FALSE;

		stChnCropInfo.bEnable = false;
	} else if (fit == 1) {
		chn_attr.u32Width                    = width;
		chn_attr.u32Height                   = height;
		chn_attr.enVideoFormat               = VIDEO_FORMAT_LINEAR;
		chn_attr.enPixelFormat               = format;
		chn_attr.stFrameRate.s32SrcFrameRate = fps;
		chn_attr.stFrameRate.s32DstFrameRate = fps;
		chn_attr.u32Depth                    = depth;
		chn_attr.bMirror                     = mirror;
		chn_attr.bFlip                       = flip;
		chn_attr.stAspectRatio.enMode        = ASPECT_RATIO_AUTO;
		chn_attr.stAspectRatio.bEnableBgColor = CVI_TRUE;
		chn_attr.stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		chn_attr.stNormalize.bEnable         = CVI_FALSE;

		stChnCropInfo.bEnable = false;
	} else {
		chn_attr.u32Width                    = width;
		chn_attr.u32Height                   = height;
		chn_attr.enVideoFormat               = VIDEO_FORMAT_LINEAR;
		chn_attr.enPixelFormat               = format;
		chn_attr.stFrameRate.s32SrcFrameRate = fps;
		chn_attr.stFrameRate.s32DstFrameRate = fps;
		chn_attr.u32Depth                    = depth;
		chn_attr.bMirror                     = mirror;
		chn_attr.bFlip                       = flip;
		chn_attr.stAspectRatio.enMode        = ASPECT_RATIO_AUTO;
		chn_attr.stAspectRatio.bEnableBgColor = CVI_TRUE;
		chn_attr.stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
		chn_attr.stNormalize.bEnable         = CVI_FALSE;

		crop_w = corp_scale_w < corp_scale_h ? width * corp_scale_w: width * corp_scale_h;
		crop_h = corp_scale_w < corp_scale_h ? height * corp_scale_w: height * corp_scale_h;
		if (corp_scale_h < 0 || corp_scale_w < 0) {
			SAMPLE_PRT("crop scale error. corp_scale_w: %f, corp_scale_h: %f\n", corp_scale_w, corp_scale_h);
			return -1;
		}

		stChnCropInfo.bEnable = true;
		stChnCropInfo.stCropRect.s32X = (stGrpAttr.u32MaxW - crop_w) / 2;
		stChnCropInfo.stCropRect.s32Y = (stGrpAttr.u32MaxH - crop_h) / 2;
		stChnCropInfo.stCropRect.u32Width = crop_w;
		stChnCropInfo.stCropRect.u32Height = crop_h;
	}

	if (crop_w != 0 && crop_h != 0) {
		s32Ret = CVI_VPSS_SetChnCrop(VpssGrp, VpssChn, &stChnCropInfo);
		if (s32Ret != CVI_SUCCESS) {
			SAMPLE_PRT("set vpss group crop failed. s32Ret: 0x%x !\n", s32Ret);
			return -1;
		}
	}

	s32Ret = CVI_VPSS_SetChnAttr(VpssGrp, VpssChn, &chn_attr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_SetChnAttr failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}

	s32Ret = CVI_VPSS_EnableChn(VpssGrp, VpssChn);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_EnableChn failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}

	return s32Ret;
#else
	CVI_S32 s32Ret;
	VPSS_CHN_ATTR_S chn_attr = {0};
	chn_attr.u32Width                    = width;
	chn_attr.u32Height                   = height;
	chn_attr.enVideoFormat               = VIDEO_FORMAT_LINEAR;
	chn_attr.enPixelFormat               = format;
	chn_attr.stFrameRate.s32SrcFrameRate = fps;
	chn_attr.stFrameRate.s32DstFrameRate = fps;
	chn_attr.u32Depth                    = depth;
	chn_attr.bMirror                     = mirror;
	chn_attr.bFlip                       = flip;
	chn_attr.stAspectRatio.enMode        = ASPECT_RATIO_MANUAL;
	chn_attr.stAspectRatio.stVideoRect.s32X       = 0;
	chn_attr.stAspectRatio.stVideoRect.s32Y       = 0;
	chn_attr.stAspectRatio.stVideoRect.u32Width   = width;
	chn_attr.stAspectRatio.stVideoRect.u32Height  = height;
	chn_attr.stAspectRatio.bEnableBgColor = CVI_TRUE;
	chn_attr.stAspectRatio.u32BgColor    = COLOR_RGB_BLACK;
	chn_attr.stNormalize.bEnable         = CVI_FALSE;

	s32Ret = CVI_VPSS_SetChnAttr(VpssGrp, VpssChn, &chn_attr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_SetChnAttr failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}

	s32Ret = CVI_VPSS_EnableChn(VpssGrp, VpssChn);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_EnableChn failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}

	return CVI_SUCCESS;
#endif
}

static CVI_S32 _mmf_vpss_chn_deinit(VPSS_GRP VpssGrp, VPSS_CHN VpssChn)
{
	return CVI_VPSS_DisableChn(VpssGrp, VpssChn);
}

static CVI_S32 _mmf_vpss_init_new(VPSS_GRP VpssGrp, CVI_U32 width, CVI_U32 height, PIXEL_FORMAT_E format)
{
	VPSS_GRP_ATTR_S    stVpssGrpAttr;
	CVI_S32 s32Ret = CVI_SUCCESS;

	memset(&stVpssGrpAttr, 0, sizeof(VPSS_GRP_ATTR_S));
	stVpssGrpAttr.stFrameRate.s32SrcFrameRate    = -1;
	stVpssGrpAttr.stFrameRate.s32DstFrameRate    = -1;
	stVpssGrpAttr.enPixelFormat                  = format;
	stVpssGrpAttr.u32MaxW                        = width;
	stVpssGrpAttr.u32MaxH                        = height;
	stVpssGrpAttr.u8VpssDev                      = 0;

	s32Ret = CVI_VPSS_CreateGrp(VpssGrp, &stVpssGrpAttr);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_CreateGrp(grp:%d) retry(%#x)!\n", VpssGrp, s32Ret);
		CVI_VPSS_DestroyGrp(VpssGrp);

		s32Ret = CVI_VPSS_CreateGrp(VpssGrp, &stVpssGrpAttr);
		if (s32Ret != CVI_SUCCESS) {
			SAMPLE_PRT("CVI_VPSS_CreateGrp(grp:%d) failed with %#x!\n", VpssGrp, s32Ret);
			return CVI_FAILURE;
		}
	}

	s32Ret = CVI_VPSS_ResetGrp(VpssGrp);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_ResetGrp(grp:%d) failed with %#x!%d\n", VpssGrp, s32Ret, CVI_ERR_VPSS_ILLEGAL_PARAM);
		return CVI_FAILURE;
	}

	s32Ret = CVI_VPSS_StartGrp(VpssGrp);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_StartGrp failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}
	return s32Ret;
}

int mmf_vi_init(void)
{
	if (priv.vi_is_inited) {
		return 0;
	}

	CVI_S32 s32Ret = CVI_SUCCESS;
	s32Ret = _mmf_vpss_init_new(0, priv.vi_size.u32Width, priv.vi_size.u32Height, PIXEL_FORMAT_UYVY);		// PIXEL_FORMAT_UYVY  PIXEL_FORMAT_NV21
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("_mmf_vpss_init_new failed. s32Ret: 0x%x !\n", s32Ret);
	}

	priv.vi_is_inited = true;

	return s32Ret;
}

int mmf_vi_deinit(void)
{
	if (!priv.vi_is_inited) {
		return 0;
	}

	CVI_S32 s32Ret = CVI_SUCCESS;
	s32Ret = _mmf_vpss_deinit_new(0);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("_mmf_vpss_deinit_new failed with %#x!\n", s32Ret);
		return CVI_FAILURE;
	}

	priv.vi_is_inited = false;

	return s32Ret;
}

static int _mmf_add_vi_channel(int ch, int width, int height, int format) {
	uint32_t pool_size_out = 0;
	int pool_id = -1;

	if (!priv.mmf_used_cnt) {
		printf("%s: maix multi-media or vi not inited\n", __func__);
		return -1;
	}

	if (!priv.vi_is_inited) {
		if (0 != mmf_vi_init()) {
			printf("mmf_vi_init failed!\r\n");
			return -1;
		}
	}

	if (width <= 0 || height <= 0) {
		printf("invalid width or height\n");
		return -1;
	}

	if (format != PIXEL_FORMAT_NV21
		&& format != PIXEL_FORMAT_RGB_888) {
		printf("invalid format\n");
		return -1;
	}

	// if ((format == PIXEL_FORMAT_RGB_888 && width * height * 3 > 640 * 640 * 3)
	// 	|| (format == PIXEL_FORMAT_RGB_888 && width * height * 3 / 2 > 2560 * 1440 * 3 / 2)) {
	// 	printf("camera size is too large, for NV21, maximum resolution 2560x1440, for RGB888, maximum resolution 640x640!\n");
	// 	return -1;
	// }

	if (mmf_vi_chn_is_open(ch)) {
		printf("vi ch %d already open\n", ch);
		return -1;
	}

	CVI_S32 s32Ret = CVI_SUCCESS;
	int fps = 30;
	int depth = 2;
	int width_out = ALIGN(width, DEFAULT_ALIGN);
	int height_out = height;
	PIXEL_FORMAT_E format_out = (PIXEL_FORMAT_E)format;
	bool mirror = !g_priv.vi_hmirror[ch];
	bool flip = !g_priv.vi_vflip[ch];
	s32Ret = _mmf_vpss_chn_deinit(0, ch);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("_mmf_vpss_chn_deinit failed with %#x!\n", s32Ret);
		return CVI_FAILURE;
	}

	s32Ret = _mmf_vpss_chn_init(0, ch, width_out, height_out, format_out, fps, depth, mirror, flip, 2);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("_mmf_vpss_chn_init failed with %#x!\n", s32Ret);
		return CVI_FAILURE;
	}

	s32Ret = SAMPLE_COMM_VI_Bind_VPSS(0, ch, 0);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("vi bind vpss failed. s32Ret: 0x%x !\n", s32Ret);
		goto _need_deinit_vpss_chn;
	}

	char name[20];
	snprintf(name, 20, "vi_vpss%.1d", ch);
	pool_size_out = COMMON_GetPicBufferSize(width_out, height_out, format_out, DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN);
	pool_id = _create_vb_pool(name, MMF_MOD_VI, pool_size_out, 2);
	if (pool_id < 0) {
		printf("[%s][%d]_create_vb_pool failed, id %d\n", __func__, __LINE__, pool_id);
		goto _need_deinit_vpss_chn;
	}

	s32Ret = CVI_VPSS_AttachVbPool(0, ch, pool_id);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_VPSS_AttachVbPool failed. s32Ret: 0x%x !\n", s32Ret);
		goto _need_deinit_vpss_chn;
	}

	// VIDEO_FRAME_INFO_S frame;
	// if ((s32Ret = CVI_VPSS_GetChnFrame(0, ch, &frame, 3000)) != CVI_SUCCESS) {
	// 	SAMPLE_PRT("vi get frame failed: 0x%x !\n", s32Ret);
	// 	if ((s32Ret = SAMPLE_COMM_VI_UnBind_VPSS(0, ch, 0)) != CVI_SUCCESS) {
	// 		SAMPLE_PRT("vi unbind vpss failed. s32Ret: 0x%x !\n", s32Ret);
	// 	}
	// 	goto _need_deinit_vpss_chn;
	// }
	// CVI_VPSS_ReleaseChnFrame(0, ch, &frame);

	priv.vi_chn_pool_id[ch] = pool_id;
	priv.vi_chn_is_inited[ch] = true;

	return 0;
_need_deinit_vpss_chn:
	_mmf_vpss_chn_deinit(0, ch);
	return -1;
}

int mmf_add_vi_channel(int ch, int width, int height, int format) {
	printf("mmf_add_vi_channel..\r\n");
	return _mmf_add_vi_channel(ch, width, height, format);
}

int mmf_del_vi_channel(int ch) {
	if (ch < 0 || ch >= MMF_VI_MAX_CHN) {
		printf("[%d] invalid ch %d\n", __LINE__, ch);
		return -1;
	}

	if (priv.vi_chn_is_inited[ch] == false) {
		return 0;
	}

	CVI_S32 s32Ret = CVI_SUCCESS;
	s32Ret = SAMPLE_COMM_VI_UnBind_VPSS(0, ch, 0);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("vi unbind vpss failed. s32Ret: 0x%x !\n", s32Ret);
		// return -1; // continue to deinit vpss
	}

	if (0 != _mmf_vpss_chn_deinit(0, ch)) {
		SAMPLE_PRT("_mmf_vpss_chn_deinit failed. s32Ret: 0x%x !\n", s32Ret);
	}

	_destroy_vb_pool(priv.vi_chn_pool_id[ch]);

	priv.vi_chn_pool_id[ch] = -1;
	priv.vi_chn_is_inited[ch] = false;
	return s32Ret;
}

int mmf_del_vi_channel_all() {
	for (int i = 0; i < MMF_VI_MAX_CHN; i++) {
		if (priv.vi_chn_is_inited[i] == true) {
			mmf_del_vi_channel(i);
		}
	}
	return 0;
}

bool mmf_vi_chn_is_open(int ch) {
	if (ch < 0 || ch >= MMF_VI_MAX_CHN) {
		return false;
	}

	return priv.vi_chn_is_inited[ch];
}

int mmf_reset_vi_channel(int ch, int width, int height, int format)
{
	mmf_del_vi_channel(ch);
	return mmf_add_vi_channel(ch, width, height, format);
}

int mmf_vi_aligned_width(int ch) {
	UNUSED(ch);
	return DEFAULT_ALIGN;
}

int mmf_vi_frame_pop(int ch, void **data, int *len, int *width, int *height, int *format) {
	if (!priv.vi_chn_is_inited[ch]) {
        // printf("vi ch %d not open\n", ch);
        return -1;
    }
    if (ch < 0 || ch >= MMF_VI_MAX_CHN) {
        printf("[%d] invalid ch %d\n", __LINE__, ch);
        return -1;
    }
    if (data == NULL || len == NULL || width == NULL || height == NULL || format == NULL) {
        printf("invalid param\n");
        return -1;
    }

	int ret = -1;
	VIDEO_FRAME_INFO_S *frame = &priv.vi_frame[ch];
	if (CVI_VPSS_GetChnFrame(0, ch, frame, 1000) == 0) {
        int image_size = frame->stVFrame.u32Length[0]
                        + frame->stVFrame.u32Length[1]
				        + frame->stVFrame.u32Length[2];
        CVI_VOID *vir_addr;
        vir_addr = CVI_SYS_MmapCache(frame->stVFrame.u64PhyAddr[0], image_size);
        CVI_SYS_IonInvalidateCache(frame->stVFrame.u64PhyAddr[0], vir_addr, image_size);

		frame->stVFrame.pu8VirAddr[0] = (CVI_U8 *)vir_addr;		// save virtual address for munmap
		// printf("width: %d, height: %d, total_buf_length: %d, phy:%#lx  vir:%p\n",
		// 	   frame->stVFrame.u32Width,
		// 	   frame->stVFrame.u32Height, image_size,
        //        frame->stVFrame.u64PhyAddr[0], vir_addr);

		*data = vir_addr;
        *len = image_size;
        *width = frame->stVFrame.u32Width;
        *height = frame->stVFrame.u32Height;
        *format = frame->stVFrame.enPixelFormat;
		return 0;
    }
	return ret;
}

void mmf_vi_frame_free(int ch) {
	VIDEO_FRAME_INFO_S *frame = &priv.vi_frame[ch];
	int image_size = frame->stVFrame.u32Length[0]
                        + frame->stVFrame.u32Length[1]
				        + frame->stVFrame.u32Length[2];
	CVI_SYS_Munmap(frame->stVFrame.pu8VirAddr[0], image_size);
	if (CVI_VPSS_ReleaseChnFrame(0, ch, frame) != 0) {
		SAMPLE_PRT("CVI_VI_ReleaseChnFrame NG\n");
	}
}

int mmf_region_frame_push(int ch, void *data, int len)
{
	CVI_S32 s32Ret;
	RGN_CANVAS_INFO_S stCanvasInfo;

	if (ch < 0 || ch >= MMF_RGN_MAX_NUM) {
		SAMPLE_PRT("Handle ch is illegal %d!\n", ch);
		return CVI_FAILURE;
	}

	if (!priv.rgn_is_init[ch]) {
		return 0;
	}

	if (!priv.rgn_is_bind[ch]) {
		return 0;
	}

	s32Ret = CVI_RGN_GetCanvasInfo(ch, &stCanvasInfo);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_RGN_GetCanvasInfo failed with %#x!\n", s32Ret);
		return CVI_FAILURE;
	}

	if (stCanvasInfo.enPixelFormat == PIXEL_FORMAT_ARGB_8888) {
		if (!data || (CVI_U32)len != stCanvasInfo.stSize.u32Width * stCanvasInfo.stSize.u32Height * 4) {
			printf("Param is error!\r\n");
			return CVI_FAILURE;
		}
		memcpy(stCanvasInfo.pu8VirtAddr, data, len);
	} else {
		printf("Not support format!\r\n");
		return CVI_FAILURE;
	}

	s32Ret = CVI_RGN_UpdateCanvas(ch);
	if (s32Ret != CVI_SUCCESS) {
		SAMPLE_PRT("CVI_RGN_UpdateCanvas failed with %#x!\n", s32Ret);
		return CVI_FAILURE;
	}
	return s32Ret;
}

int mmf_enc_jpg_init(int ch, int w, int h, int format, int quality)
{
	if (priv.enc_jpg_is_init)
		return 0;

	if (quality <= 50) {
		printf("quality range is (50, 100]\n");
		return -1;
	}

	if (mmf_init()) {
		return -1;
	}

	// if ((format == PIXEL_FORMAT_RGB_888 && w * h * 3 > 640 * 640 * 3)
	// 	|| (format == PIXEL_FORMAT_RGB_888 && w * h * 3 / 2 > 2560 * 1440 * 3 / 2)) {
	// 	printf("image size is too large, for NV21, maximum resolution 2560x1440, for RGB888, maximum resolution 640x640!\n");
	// 	return -1;
	// }

	CVI_S32 s32Ret = CVI_SUCCESS;

	VENC_CHN_ATTR_S stVencChnAttr;
	memset(&stVencChnAttr, 0, sizeof(VENC_CHN_ATTR_S));
	stVencChnAttr.stVencAttr.enType = PT_JPEG;
	stVencChnAttr.stVencAttr.u32MaxPicWidth = w;
	stVencChnAttr.stVencAttr.u32MaxPicHeight = h;
	stVencChnAttr.stVencAttr.u32PicWidth = w;
	stVencChnAttr.stVencAttr.u32PicHeight = h;
	stVencChnAttr.stVencAttr.bEsBufQueueEn = CVI_FALSE;
	stVencChnAttr.stVencAttr.bIsoSendFrmEn = CVI_FALSE;
	stVencChnAttr.stVencAttr.bByFrame = 1;
	stVencChnAttr.stRcAttr.enRcMode = VENC_RC_MODE_MJPEGFIXQP;

	s32Ret = CVI_VENC_CreateChn(ch, &stVencChnAttr);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_CreateChn [%d] failed with %#x\n", ch, s32Ret);
		return s32Ret;
	}

	s32Ret = CVI_VENC_ResetChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_CreateChn [%d] failed with %#x\n", ch, s32Ret);
		return s32Ret;
	}

	s32Ret = CVI_VENC_DestroyChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_destroyChn [%d] failed with %#x\n", ch, s32Ret);
	}

	s32Ret = CVI_VENC_CreateChn(ch, &stVencChnAttr);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_CreateChn [%d] failed with %#x\n", ch, s32Ret);
		return s32Ret;
	}

	VENC_JPEG_PARAM_S stJpegParam;
	memset(&stJpegParam, 0, sizeof(VENC_JPEG_PARAM_S));
	s32Ret = CVI_VENC_GetJpegParam(ch, &stJpegParam);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_GetJpegParam failed with %#x\n", s32Ret);
		CVI_VENC_DestroyChn(ch);
		return s32Ret;
	}
	stJpegParam.u32Qfactor = quality;
	s32Ret = CVI_VENC_SetJpegParam(ch, &stJpegParam);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_SetJpegParam failed with %#x\n", s32Ret);
		CVI_VENC_DestroyChn(ch);
		return s32Ret;
	}

	switch (format) {
	case PIXEL_FORMAT_RGB_888:
		{
			s32Ret = _mmf_vpss_init(2, ch, (SIZE_S){(CVI_U32)w, (CVI_U32)h}, (SIZE_S){(CVI_U32)w, (CVI_U32)h}, PIXEL_FORMAT_RGB_888, PIXEL_FORMAT_YUV_PLANAR_420, 30, 0, CVI_FALSE, CVI_FALSE, 0);
			if (s32Ret != CVI_SUCCESS) {
				printf("VPSS init failed with %#x\n", s32Ret);
				CVI_VENC_StopRecvFrame(ch);
				CVI_VENC_DestroyChn(ch);
				return s32Ret;
			}

			s32Ret = SAMPLE_COMM_VPSS_Bind_VENC(2, ch, ch);
			if (s32Ret != CVI_SUCCESS) {
				printf("VPSS bind VENC failed with %#x\n", s32Ret);
				_mmf_vpss_deinit(2, ch);
				CVI_VENC_StopRecvFrame(ch);
				CVI_VENC_DestroyChn(ch);
				return s32Ret;
			}

			uint32_t input_size = 0, output_size = 0;
			input_size = COMMON_GetPicBufferSize(w, h, (PIXEL_FORMAT_E)format, DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN);
			output_size = COMMON_GetPicBufferSize(w, h, (PIXEL_FORMAT_E)PIXEL_FORMAT_YUV_PLANAR_420, DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN);
			int pool_id = _create_vb_pool((char *)"enc_jpeg_in", MMF_MOD_VENC, input_size, 1);
			if (pool_id < 0) {
				printf("[%s][%d]_create_vb_pool failed, id %d\n", __func__, __LINE__, pool_id);
				return -1;
			}
			priv.enc_jpg_input_pool_id = pool_id;

			pool_id = _create_vb_pool((char *)"enc_jpeg_out", MMF_MOD_VENC, output_size, 1);
			if (pool_id < 0) {
				printf("[%s][%d]_create_vb_pool failed, id %d\n", __func__, __LINE__, pool_id);
				return -1;
			}
			priv.enc_jpg_output_pool_id = pool_id;

			s32Ret = CVI_VPSS_AttachVbPool(2, ch, priv.enc_jpg_output_pool_id);
			if (s32Ret != CVI_SUCCESS) {
				SAMPLE_PRT("CVI_VPSS_AttachVbPool failed. s32Ret: 0x%x !\n", s32Ret);
				_destroy_vb_pool(priv.enc_jpg_output_pool_id);
				_destroy_vb_pool(priv.enc_jpg_input_pool_id);
				return CVI_FAILURE;
			}
		}
		break;
	case PIXEL_FORMAT_NV21:
		{
			uint32_t size = COMMON_GetPicBufferSize(w, h, (PIXEL_FORMAT_E)format, DATA_BITWIDTH_8, COMPRESS_MODE_NONE, DEFAULT_ALIGN);
			int pool_id = _create_vb_pool((char *)"enc_jpeg_in", MMF_MOD_VENC, size, 1);
			if (pool_id < 0) {
				printf("[%s][%d]_create_vb_pool failed, id %d\n", __func__, __LINE__, pool_id);
				return -1;
			}
			priv.enc_jpg_input_pool_id = pool_id;
		}
		break;
	default:
		printf("unknown format!\n");
		CVI_VENC_StopRecvFrame(ch);
		CVI_VENC_DestroyChn(ch);
		return -1;
	}

	VENC_RECV_PIC_PARAM_S stRecvParam;
	stRecvParam.s32RecvPicNum = -1;
	s32Ret = CVI_VENC_StartRecvFrame(ch, &stRecvParam);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_StartRecvPic failed with %#x\n", s32Ret);
		return CVI_FAILURE;
	}

	if (priv.enc_jpg_frame) {
		_mmf_free_frame(priv.enc_jpg_frame);
		priv.enc_jpg_frame = NULL;
	}

	priv.enc_jpg_frame_w = w;
	priv.enc_jpg_frame_h = h;
	priv.enc_jpg_frame_fmt = format;
	priv.enc_jpg_quality = quality;
	priv.enc_jpg_is_init = 1;
	priv.enc_jpg_running = 0;

	return s32Ret;
}

int mmf_enc_jpg_deinit(int ch)
{
	if (!priv.enc_jpg_is_init)
		return 0;

	CVI_S32 s32Ret = CVI_SUCCESS;

	if (!mmf_enc_jpg_pop(ch, NULL, NULL)) {
		mmf_enc_jpg_free(ch);
	}

	switch (priv.enc_jpg_frame_fmt) {
	case PIXEL_FORMAT_RGB_888:
		s32Ret = SAMPLE_COMM_VPSS_UnBind_VENC(2, ch, ch);
		if (s32Ret != CVI_SUCCESS) {
			printf("VPSS unbind VENC failed with %d\n", s32Ret);
		}

		s32Ret = _mmf_vpss_deinit(2, ch);
		if (s32Ret != CVI_SUCCESS) {
			printf("VPSS deinit failed with %d\n", s32Ret);
		}
		break;
	case PIXEL_FORMAT_NV21:
		break;
	default:
		break;
	}

	s32Ret = CVI_VENC_StopRecvFrame(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_StopRecvPic failed with %d\n", s32Ret);
	}

	s32Ret = CVI_VENC_ResetChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_ResetChn vechn[%d] failed with %#x!\n",
				ch, s32Ret);
	}

	s32Ret = CVI_VENC_DestroyChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_DestroyChn [%d] failed with %d\n", ch, s32Ret);
	}

	if (priv.enc_jpg_frame) {
		_mmf_free_frame(priv.enc_jpg_frame);
		priv.enc_jpg_frame = NULL;
	}

	switch (priv.enc_jpg_frame_fmt) {
	case PIXEL_FORMAT_RGB_888:
		_destroy_vb_pool(priv.enc_jpg_output_pool_id);
		priv.enc_jpg_output_pool_id = -1;
		_destroy_vb_pool(priv.enc_jpg_input_pool_id);
		priv.enc_jpg_output_pool_id = -1;
		break;
	case PIXEL_FORMAT_NV21:
		_destroy_vb_pool(priv.enc_jpg_input_pool_id);
		priv.enc_jpg_output_pool_id = -1;
		break;
	default:
		break;
	}

	if (mmf_deinit()) {
		return -1;
	}

	priv.enc_jpg_frame_w = 0;
	priv.enc_jpg_frame_h = 0;
	priv.enc_jpg_frame_fmt = 0;
	priv.enc_jpg_quality = -1;
	priv.enc_jpg_is_init = 0;
	priv.enc_jpg_running = 0;

	return s32Ret;
}

int mmf_enc_jpg_push_with_quality(int ch, uint8_t *data, int w, int h, int format, int quality)
{
	UNUSED(ch);
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (priv.enc_jpg_running) {
		return s32Ret;
	}

	int real_format = format;
	if (format == PIXEL_FORMAT_UINT8_C1) {
		format = PIXEL_FORMAT_NV21;
	}

	SIZE_S stSize = {(CVI_U32)w, (CVI_U32)h};
	if (priv.enc_jpg_frame == NULL || priv.enc_jpg_frame_w != w || priv.enc_jpg_frame_h != h || priv.enc_jpg_frame_fmt != format
	|| priv.enc_jpg_quality != quality) {
		mmf_enc_jpg_deinit(ch);
		mmf_enc_jpg_init(ch, w, h, format, quality);
		priv.enc_jpg_frame_w = w;
		priv.enc_jpg_frame_h = h;
		priv.enc_jpg_frame_fmt = format;
		priv.enc_jpg_quality = quality;
		if (priv.enc_jpg_frame) {
			_mmf_free_frame(priv.enc_jpg_frame);
			priv.enc_jpg_frame = NULL;
		}
		priv.enc_jpg_frame = (VIDEO_FRAME_INFO_S *)_mmf_alloc_frame(priv.enc_jpg_input_pool_id, stSize, (PIXEL_FORMAT_E)format);
		if (!priv.enc_jpg_frame) {
			printf("Alloc frame failed!\r\n");
			return -1;
		}
	}

	switch (real_format) {
		case PIXEL_FORMAT_UINT8_C1:
			if (priv.enc_jpg_frame->stVFrame.u32Stride[0] != (CVI_U32)w) {
				for (int height = 0; height < h; height ++) {
					memcpy((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * height,
							((uint8_t *)data) + w * height, w);
				}

				for (int height = priv.enc_jpg_frame->stVFrame.u32Height; height < h / 2; height ++) {
					memset((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * height,
							128, w);
				}
			} else {
				memcpy(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0], ((uint8_t *)data), w * h);
				memset(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + w * h, 128, w * h / 2);
			}
			CVI_SYS_IonFlushCache(priv.enc_jpg_frame->stVFrame.u64PhyAddr[0],
								priv.enc_jpg_frame->stVFrame.pu8VirAddr[0],
								priv.enc_jpg_frame->stVFrame.u32Stride[0] * h * 3 / 2);
			s32Ret = CVI_VENC_SendFrame(ch, priv.enc_jpg_frame, 1000);
			if (s32Ret != CVI_SUCCESS) {
				printf("CVI_VENC_SendFrame failed with %d\n", s32Ret);
				return s32Ret;
			}
		break;
		case PIXEL_FORMAT_RGB_888:
		{
			if (priv.enc_jpg_frame->stVFrame.u32Stride[0] != (CVI_U32)w * 3) {
				for (CVI_U32 h = 0; h < priv.enc_jpg_frame->stVFrame.u32Height; h++) {
					memcpy((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * h, ((uint8_t *)data) + w * h * 3, w * 3);
				}
			} else {
				memcpy(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0], data, w * h * 3);
			}

			s32Ret = CVI_VPSS_SendFrame(2, priv.enc_jpg_frame, 1000);
			if (s32Ret != CVI_SUCCESS) {
				printf("CVI_VPSS_SendFrame failed with %#x\n", s32Ret);
				return s32Ret;
			}
		}
		break;
		case PIXEL_FORMAT_NV21:
			if (priv.enc_jpg_frame->stVFrame.u32Stride[0] != (CVI_U32)w) {
				for (CVI_U32 h = 0; h < priv.enc_jpg_frame->stVFrame.u32Height * 3 / 2; h ++) {
					memcpy((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * h,
							((uint8_t *)data) + w * h, w);
				}
			} else {
				memcpy(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0], ((uint8_t *)data), w * h * 3 / 2);
			}

			s32Ret = CVI_VENC_SendFrame(ch, priv.enc_jpg_frame, 1000);
			if (s32Ret != CVI_SUCCESS) {
				printf("CVI_VENC_SendFrame failed with %d\n", s32Ret);
				return s32Ret;
			}
		break;
		default: return -1;
	}

	priv.enc_jpg_running = 1;

	return s32Ret;
}

int mmf_enc_jpg_push(int ch, uint8_t *data, int w, int h, int format)
{
	UNUSED(ch);
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (priv.enc_jpg_running) {
		return s32Ret;
	}

	SIZE_S stSize = {(CVI_U32)w, (CVI_U32)h};
	if (priv.enc_jpg_frame == NULL || priv.enc_jpg_frame_w != w || priv.enc_jpg_frame_h != h || priv.enc_jpg_frame_fmt != format) {
		mmf_enc_jpg_deinit(ch);
		mmf_enc_jpg_init(ch, w, h, format, 80);
		priv.enc_jpg_frame_w = w;
		priv.enc_jpg_frame_h = h;
		priv.enc_jpg_frame_fmt = format;
		if (priv.enc_jpg_frame) {
			_mmf_free_frame(priv.enc_jpg_frame);
			priv.enc_jpg_frame = NULL;
		}
		priv.enc_jpg_frame = (VIDEO_FRAME_INFO_S *)_mmf_alloc_frame(priv.enc_jpg_input_pool_id, stSize, (PIXEL_FORMAT_E)format);
		if (!priv.enc_jpg_frame) {
			printf("Alloc frame failed!\r\n");
			return -1;
		}
	}

	switch (format) {
		case PIXEL_FORMAT_RGB_888:
		{
			if (priv.enc_jpg_frame->stVFrame.u32Stride[0] != (CVI_U32)w * 3) {
				for (CVI_U32 h = 0; h < priv.enc_jpg_frame->stVFrame.u32Height; h++) {
					memcpy((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * h, ((uint8_t *)data) + w * h * 3, w * 3);
				}
			} else {
				memcpy(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0], data, w * h * 3);
			}

			s32Ret = CVI_VPSS_SendFrame(2, priv.enc_jpg_frame, 1000);
			if (s32Ret != CVI_SUCCESS) {
				printf("CVI_VPSS_SendFrame failed with %#x\n", s32Ret);
				return s32Ret;
			}
		}
		break;
		case PIXEL_FORMAT_NV21:
			if (priv.enc_jpg_frame->stVFrame.u32Stride[0] != (CVI_U32)w) {
				for (CVI_U32 h = 0; h < priv.enc_jpg_frame->stVFrame.u32Height * 3 / 2; h ++) {
					memcpy((uint8_t *)priv.enc_jpg_frame->stVFrame.pu8VirAddr[0] + priv.enc_jpg_frame->stVFrame.u32Stride[0] * h,
							((uint8_t *)data) + w * h, w);
				}
			} else {
				memcpy(priv.enc_jpg_frame->stVFrame.pu8VirAddr[0], ((uint8_t *)data), w * h * 3 / 2);
			}

			s32Ret = CVI_VENC_SendFrame(ch, priv.enc_jpg_frame, 1000);
			if (s32Ret != CVI_SUCCESS) {
				printf("CVI_VENC_SendFrame failed with %d\n", s32Ret);
				return s32Ret;
			}
		break;
		default: return -1;
	}

	priv.enc_jpg_running = 1;

	return s32Ret;
}

int mmf_enc_jpg_pop(int ch, uint8_t **data, int *size)
{
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (!priv.enc_jpg_running) {
		return s32Ret;
	}

	priv.enc_jpeg_frame.pstPack = (VENC_PACK_S *)malloc(sizeof(VENC_PACK_S) * 1);
	if (!priv.enc_jpeg_frame.pstPack) {
		printf("Malloc failed!\r\n");
		return -1;
	}

	VENC_CHN_STATUS_S stStatus;
	s32Ret = CVI_VENC_QueryStatus(ch, &stStatus);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_QueryStatus failed with %#x\n", s32Ret);
		return s32Ret;
	}

	if (stStatus.u32CurPacks > 0) {
		s32Ret = CVI_VENC_GetStream(ch, &priv.enc_jpeg_frame, 1000);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_GetStream failed with %#x\n", s32Ret);
			return s32Ret;
		}
	} else {
		printf("CVI_VENC_QueryStatus find not pack\r\n");
		return -1;
	}

	if (data)
		*data = priv.enc_jpeg_frame.pstPack[0].pu8Addr;
	if (size)
		*size = priv.enc_jpeg_frame.pstPack[0].u32Len;

	return s32Ret;
}

int mmf_enc_jpg_free(int ch)
{
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (!priv.enc_jpg_running) {
		return s32Ret;
	}

	s32Ret = CVI_VENC_ReleaseStream(ch, &priv.enc_jpeg_frame);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_ReleaseStream failed with %#x\n", s32Ret);
		return s32Ret;
	}

	if (priv.enc_jpeg_frame.pstPack) {
		free(priv.enc_jpeg_frame.pstPack);
		priv.enc_jpeg_frame.pstPack = NULL;
	}

	priv.enc_jpg_running = 0;
	return s32Ret;
}

int mmf_invert_format_to_mmf(int maix_format) {
	switch (maix_format) {
		case 0:
			return PIXEL_FORMAT_RGB_888;
		case 1:
			return PIXEL_FORMAT_BGR_888;
		case 3:
			return PIXEL_FORMAT_ARGB_8888;
		case 8:
			return PIXEL_FORMAT_NV21;
		case 12:
			return PIXEL_FORMAT_UINT8_C1;
		default:
			return -1;
	}
}

void mmf_set_vi_hmirror(int ch, bool en)
{
	if (ch > MMF_VI_MAX_CHN) {
		printf("invalid ch, must be [0, %d)\r\n", ch);
		return;
	}

	g_priv.vi_hmirror[ch] = en;
}

void mmf_get_vi_hmirror(int ch, bool *en)
{
	if (ch > MMF_VI_MAX_CHN) {
		printf("invalid ch, must be [0, %d)\r\n", ch);
		return;
	}

	*en = (bool)g_priv.vi_hmirror[ch];
}

void mmf_set_vi_vflip(int ch, bool en)
{
	if (ch > MMF_VI_MAX_CHN) {
		printf("invalid ch, must be [0, %d)\r\n", ch);
		return;
	}

	g_priv.vi_vflip[ch] = en;
}

void mmf_get_vi_vflip(int ch, bool *en)
{
	if (ch > MMF_VI_MAX_CHN) {
		printf("invalid ch, must be [0, %d)\r\n", ch);
		return;
	}

	*en = (bool)g_priv.vi_vflip[ch];
}

int mmf_add_venc_channel(int ch, mmf_venc_cfg_t *cfg) {
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (ch >= MMF_VENC_MAX_CHN || priv.venc[ch].is_used) {
		printf("Invalid venc ch:%d\r\n", ch);
		return -1;
	}

	switch (cfg->type) {
	case 2:
	{
		VENC_CHN_ATTR_S stVencChnAttr;
		memset(&stVencChnAttr, 0, sizeof(VENC_CHN_ATTR_S));
		stVencChnAttr.stVencAttr.enType = PT_H264;
		stVencChnAttr.stVencAttr.u32MaxPicWidth = cfg->w;
		stVencChnAttr.stVencAttr.u32MaxPicHeight = cfg->h;
		stVencChnAttr.stVencAttr.u32BufSize = 1024 * 1024;	// 1024Kb
		stVencChnAttr.stVencAttr.bByFrame = CVI_TRUE;
		stVencChnAttr.stVencAttr.u32PicWidth = cfg->w;
		stVencChnAttr.stVencAttr.u32PicHeight = cfg->h;
		stVencChnAttr.stVencAttr.bEsBufQueueEn = CVI_TRUE;
		stVencChnAttr.stVencAttr.bIsoSendFrmEn = CVI_TRUE;
		stVencChnAttr.stGopAttr.enGopMode = VENC_GOPMODE_NORMALP;
		stVencChnAttr.stGopAttr.stNormalP.s32IPQpDelta = 2;
		stVencChnAttr.stRcAttr.enRcMode = VENC_RC_MODE_H264CBR;
		stVencChnAttr.stRcAttr.stH264Cbr.u32Gop = cfg->gop;
		stVencChnAttr.stRcAttr.stH264Cbr.u32StatTime = 2;
		stVencChnAttr.stRcAttr.stH264Cbr.u32SrcFrameRate = cfg->intput_fps;
		stVencChnAttr.stRcAttr.stH264Cbr.fr32DstFrameRate = cfg->output_fps;
		stVencChnAttr.stRcAttr.stH264Cbr.u32BitRate = cfg->bitrate;
		stVencChnAttr.stRcAttr.stH264Cbr.bVariFpsEn = 0;
		s32Ret = CVI_VENC_CreateChn(ch, &stVencChnAttr);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_CreateChn [%d] failed with %d\n", ch, s32Ret);
			return s32Ret;
		}

		VENC_RECV_PIC_PARAM_S stRecvParam;
		stRecvParam.s32RecvPicNum = -1;
		s32Ret = CVI_VENC_StartRecvFrame(ch, &stRecvParam);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_StartRecvPic failed with %d\n", s32Ret);
			return CVI_FAILURE;
		}

		VENC_RC_PARAM_S stRcParam;
		s32Ret = CVI_VENC_GetRcParam(ch, &stRcParam);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_GetRcParam failed with %d\n", s32Ret);
			return s32Ret;
		}
		stRcParam.s32FirstFrameStartQp = 35;
		stRcParam.s32InitialDelay = 1000;
		stRcParam.stParamH264Cbr.u32MinIprop = 1;
		stRcParam.stParamH264Cbr.u32MaxIprop = 10;
		stRcParam.stParamH264Cbr.u32MaxQp = 51;
		stRcParam.stParamH264Cbr.u32MinQp = 20;
		stRcParam.stParamH264Cbr.u32MaxIQp = 51;
		stRcParam.stParamH264Cbr.u32MinIQp = 20;
		s32Ret = CVI_VENC_SetRcParam(ch, &stRcParam);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_SetRcParam failed with %d\n", s32Ret);
			return s32Ret;
		}

		VENC_FRAMELOST_S stFL;
		s32Ret = CVI_VENC_GetFrameLostStrategy(ch, &stFL);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_GetFrameLostStrategy failed with %d\n", s32Ret);
			return s32Ret;
		}
		stFL.enFrmLostMode = FRMLOST_PSKIP;
		s32Ret = CVI_VENC_SetFrameLostStrategy(ch, &stFL);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_SetFrameLostStrategy failed with %d\n", s32Ret);
			return s32Ret;
		}

		break;
	}
	default: printf("Only support h264 encode! type:%d\r\n", cfg->type);
		return -1;
	}

	char name[20];
	snprintf(name, 20, "venc%.1d", ch);
	uint32_t size = VDEC_GetPicBufferSize((PAYLOAD_TYPE_E)cfg->type, cfg->w, cfg->h, (PIXEL_FORMAT_E)cfg->fmt, DATA_BITWIDTH_8, COMPRESS_MODE_NONE);
	int pool_id = _create_vb_pool(name, MMF_MOD_VENC, size, 1);
	if (pool_id < 0) {
		printf("[%s][%d]_create_vb_pool failed, id %d\n", __func__, __LINE__, pool_id);
		return CVI_FAILURE;
	}

	venc_info_t *info = (venc_info_t *)&priv.venc[ch];
	info->ch = ch;
	info->type = cfg->type;
	info->pool_id = pool_id;
	memcpy(&info->cfg, cfg, sizeof(mmf_venc_cfg_t));
	info->capture_frame = (VIDEO_FRAME_INFO_S *)_mmf_alloc_frame(info->pool_id, (SIZE_S){(CVI_U32)cfg->w, (CVI_U32)cfg->h}, (PIXEL_FORMAT_E)cfg->fmt);
	if (!info->capture_frame) {
		printf("Alloc frame failed!\r\n");
		CVI_VENC_DestroyChn(ch);
		_destroy_vb_pool(pool_id);
		return -1;
	}
	info->is_used = 1;
	info->is_inited = 1;
	priv.h265_or_h264_is_used = 1;

	return 0;
}

int mmf_del_venc_channel(int ch) {
	if (!priv.venc[ch].is_inited) {
		return 0;
	}

	mmf_stream_t stream;
	if (!mmf_venc_pop(ch, &stream)) {
		mmf_venc_free(ch);
	}

	CVI_S32 s32Ret = CVI_SUCCESS;
	s32Ret = CVI_VENC_StopRecvFrame(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_StopRecvPic failed with %d\n", s32Ret);
	}

	s32Ret = CVI_VENC_ResetChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_ResetChn vechn[%d] failed with %#x!\n", ch, s32Ret);
	}

	s32Ret = CVI_VENC_DestroyChn(ch);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_DestroyChn [%d] failed with %d\n", ch, s32Ret);
	}

	if (priv.venc[ch].capture_frame) {
		_mmf_free_frame(priv.venc[ch].capture_frame);
		priv.venc[ch].capture_frame = NULL;
	}

	_destroy_vb_pool(priv.venc[ch].pool_id);

	if (priv.venc[ch].type == 2 || priv.venc[ch].type == 1) {
		priv.h265_or_h264_is_used = 0;
	}
	priv.venc[ch].is_inited = 0;
	priv.venc[ch].is_used = 0;

	return 0;
}

int mmf_del_venc_channel_all() {
	for (int i = 0; i < MMF_VENC_MAX_CHN; i ++) {
		mmf_del_venc_channel(i);
	}
	return 0;
}

int mmf_venc_push(int ch, uint8_t *data, int w, int h, int format) {
	int res = 0;
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (ch >= MMF_VENC_MAX_CHN || data == NULL
		|| (format != PIXEL_FORMAT_NV21 && format != PIXEL_FORMAT_RGB_888)) {
		printf("Invalid param. ch:%d data:%p format:%d\r\n", ch, data, format);
		return -1;
	}

	venc_info_t *info = (venc_info_t *)&priv.venc[ch];
	VIDEO_FRAME_INFO_S *frame_info = (VIDEO_FRAME_INFO_S *)info->capture_frame;
	if (frame_info == NULL) {
		printf("frame info is null!\r\n");
		return -1;
	}

	switch (format) {
		case PIXEL_FORMAT_NV21:
		{
			if (frame_info->stVFrame.u32Stride[0] != (CVI_U32)w) {
				for (int h0 = 0; h0 < h * 3 / 2; h0 ++) {
					memcpy((uint8_t *)frame_info->stVFrame.pu8VirAddr[0] + frame_info->stVFrame.u32Stride[0] * h,
							((uint8_t *)data) + w * h0, w);
				}
			} else {
				memcpy((uint8_t *)frame_info->stVFrame.pu8VirAddr[0], ((uint8_t *)data), w * h * 3 / 2);
			}
		}
		break;
		default:
			printf("Not support format:%d\r\n", format);
			return -1;
	}

	s32Ret = CVI_VENC_SendFrame(ch, frame_info, 1000);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_SendFrame failed with %#x\n", s32Ret);
		return s32Ret;
	}

	info->is_running = 1;

	return res;
}

int mmf_venc_pop(int ch, mmf_stream_t *stream) {
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (ch >= MMF_VENC_MAX_CHN || !priv.venc[ch].is_inited) {
		printf("Invalid venc ch:%d\r\n", ch);
		return -1;
	}

	venc_info_t *info = (venc_info_t *)&priv.venc[ch];
	VENC_STREAM_S *venc_stream = (VENC_STREAM_S *)&priv.venc[ch].capture_stream;
	if (!info->is_running) {
		return s32Ret;
	}

	int fd = CVI_VENC_GetFd(ch);
	if (fd < 0) {
		printf("CVI_VENC_GetFd failed with %d\n", fd);
		return -1;
	}

	fd_set readFds;
	struct timeval timeoutVal;
	FD_ZERO(&readFds);
	FD_SET(fd, &readFds);
	timeoutVal.tv_sec = 0;
	timeoutVal.tv_usec = 80*1000;
	s32Ret = select(fd + 1, &readFds, NULL, NULL, &timeoutVal);
	if (s32Ret < 0) {
		if (errno == EINTR) {
			printf("VencChn(%d) select failed!\n", ch);
			return -1;
		}
	} else if (s32Ret == 0) {
		printf("VencChn(%d) select timeout!\n", ch);
		return -1;
	}

	venc_stream->pstPack = (VENC_PACK_S *)malloc(sizeof(VENC_PACK_S) * 8);
	if (!venc_stream->pstPack) {
		printf("Malloc failed!\r\n");
		return -1;
	}


	VENC_CHN_STATUS_S stStatus;
	s32Ret = CVI_VENC_QueryStatus(ch, &stStatus);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_QueryStatus failed with %#x\n", s32Ret);
		return s32Ret;
	}

	if (stStatus.u32CurPacks > 0) {
		s32Ret = CVI_VENC_GetStream(ch, venc_stream, 1000);
		if (s32Ret != CVI_SUCCESS) {
			printf("CVI_VENC_GetStream failed with %#x\n", s32Ret);
			free(venc_stream->pstPack);
			return s32Ret;
		}
	} else {
		printf("CVI_VENC_QueryStatus find not pack\r\n");
		free(venc_stream->pstPack);
		return -1;
	}

	if (stream) {
		stream->count = venc_stream->u32PackCount;
		if (stream->count > 8) {
			printf("pack count is too large! cnt:%d\r\n", stream->count);
			free(venc_stream->pstPack);
			return -1;
		}
		for (int i = 0; i < stream->count; i++) {
			stream->data[i] = venc_stream->pstPack[i].pu8Addr + venc_stream->pstPack[i].u32Offset;
			stream->data_size[i] = venc_stream->pstPack[i].u32Len - venc_stream->pstPack[i].u32Offset;
		}
	}

	return 0;
}

int mmf_venc_free(int ch) {
	CVI_S32 s32Ret = CVI_SUCCESS;
	if (ch >= MMF_VENC_MAX_CHN || !priv.venc[ch].is_inited) {
		printf("Invalid venc ch:%d\r\n", ch);
		return -1;
	}

	venc_info_t *info = (venc_info_t *)&priv.venc[ch];
	VENC_STREAM_S *venc_stream = (VENC_STREAM_S *)&priv.venc[ch].capture_stream;
	if (!info->is_running) {
		return s32Ret;
	}

	s32Ret = CVI_VENC_ReleaseStream(ch, venc_stream);
	if (s32Ret != CVI_SUCCESS) {
		printf("CVI_VENC_ReleaseStream failed with %#x\n", s32Ret);
		return s32Ret;
	}

	if (venc_stream->pstPack) {
		free(venc_stream->pstPack);
		venc_stream->pstPack = NULL;
	}

	info->is_running = 0;
	return s32Ret;
}



 