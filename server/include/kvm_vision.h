#ifndef KVM_VISION_H_
#define KVM_VISION_H_

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

#define IMG_BUFFER_FULL			-3
#define IMG_VENC_ERROR			-2
#define IMG_NOT_EXIST			-1
#define IMG_MJPEG_TYPE			0
#define IMG_H264_TYPE_SPS		1
#define IMG_H264_TYPE_PPS		2
#define IMG_H264_TYPE_IF		3
#define IMG_H264_TYPE_PF		4

void kvmv_init(uint8_t _debug_info_en);
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
        -3: img buffer full
        -2: VENC Error
        -1: No images were acquired
         0: Acquire MJPEG encoded images
         1: Acquire H264 encoded images(SPS)
         2: Acquire H264 encoded images(PPS)
         3: Acquire H264 encoded images(I)
         4: Acquire H264 encoded images(P)
 **********************************************************************************/
int kvmv_read_img(uint16_t _width, uint16_t _height, uint8_t _type, uint16_t _qlty, uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size);
int kvmv_get_sps_frame(uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size);
int kvmv_get_pps_frame(uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size);
int free_kvmv_data(uint8_t ** _pp_kvm_data);
void free_all_kvmv_data();
void set_h264_gop(uint8_t _gop);
void kvmv_deinit();

#ifdef __cplusplus
}
#endif

#endif // KVM_VISION_H_