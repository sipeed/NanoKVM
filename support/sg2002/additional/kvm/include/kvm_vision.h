

#ifndef KVM_VISION_H_
#define KVM_VISION_H_

#include "kvm_mmf.hpp"
#include "maix_camera.hpp"
#include "maix_basic.hpp"

#include "maix_i2c.hpp"

#ifdef __cplusplus
extern "C" {
#endif
#include <fcntl.h> /* low-level i/o */
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>

// #include "kvm_mmf.hpp"

#define IMG_BUFFER_FULL			-3
#define IMG_VENC_ERROR			-2
#define IMG_NOT_EXIST			-1
#define IMG_MJPEG_TYPE			0
#define IMG_H264_TYPE_SPS		1
#define IMG_H264_TYPE_PPS		2
#define IMG_H264_TYPE_IF		3
#define IMG_H264_TYPE_PF		4

#define NORMAL_RES                      0
#define NEW_RES                         1
#define UNSUPPORT_RES                   2
#define UNKNOWN_RES                     3
#define ERROR_RES                       4

void kvmv_init(uint8_t _debug_info_en = 0);
void set_venc_auto_recyc(uint8_t _enable);
/**********************************************************************************
 * @name    kvmv_read_img
 * @author  Sipeed BuGu
 * @date    2024/10/25
 * @version R1.0
 * @brief   Acquire the encoded image with auto init
 * @param	_width				@input: 	Output image width
 * @param	_height				@input: 	Output image height
 * @param	_type				@input: 	Encode type
 * @param	_qlty				@input: 	MJPEG: (50-100) | H264:  (500-10000)
 * @param	_pp_kvm_data		@output: 	Encode data
 * @param	_p_kvmv_data_size	@output: 	Encode data size
 * @return
        -7: HDMI INPUT RES ERROR
        -6: Unsupported resolution, please modify it in the host settings.
        -5: Retrieving image, please wait
        -4: Modifying image resolution, please wait
        -3: img buffer full
        -2: VENC Errorl
        -1: No images were acquired
         0: Acquire MJPEG encoded images
         1: Acquire H264 encoded images(SPS)[Deprecated]
         2: Acquire H264 encoded images(PPS)[Deprecated]
         3: Acquire H264 encoded images(I)
         4: Acquire H264 encoded images(P)
         5: IMG not changed
 **********************************************************************************/
int kvmv_read_img(uint16_t _width, uint16_t _height, uint8_t _type, uint16_t _qlty, uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size);
int free_kvmv_data(uint8_t ** _pp_kvm_data);
void free_all_kvmv_data();
void set_h264_gop(uint8_t _gop);
void set_frame_detact(uint8_t _frame_detact);
void kvmv_deinit();
uint8_t kvmv_hdmi_control(uint8_t _en);

#ifdef __cplusplus
}
#endif

#endif // KVM_VISION_H_