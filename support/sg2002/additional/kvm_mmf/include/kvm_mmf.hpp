#ifndef __KVM_MMF_HPP__
#define __KVM_MMF_HPP__

#include "stdint.h"

typedef struct {
    uint8_t *data[8];
    int data_size[8];
    int count;
} mmf_stream_t;

typedef struct {
    uint8_t type;           // 0, jpg; 1, h265; 2, h264
    int w;
	int h;
	int fmt;
	uint8_t jpg_quality;	// jpeg
	int gop;				// h264
	int intput_fps;			// h264
	int output_fps;			// h264
	int bitrate;			// h264
} mmf_venc_cfg_t;

// init sys
int mmf_init(void);
int mmf_deinit(void);
int mmf_try_deinit(bool force);
bool mmf_is_init(void);

// manage vi channels(vi->vpssgroup->vpss->frame)
int mmf_get_vi_unused_channel(void);
int mmf_vi_init(void);
int mmf_vi_deinit(void);
int mmf_add_vi_channel_with_enc(int ch, int width, int height, int format);
int mmf_add_vi_channel(int ch, int width, int height, int format);
int mmf_del_vi_channel(int ch);
int mmf_del_vi_channel_all(void);
int mmf_reset_vi_channel(int ch, int width, int height, int format);
bool mmf_vi_chn_is_open(int ch);
int mmf_vi_aligned_width(int ch);
void mmf_set_vi_hmirror(int ch, bool en);
void mmf_set_vi_vflip(int ch, bool en);
void mmf_get_vi_hmirror(int ch, bool *en);
void mmf_get_vi_vflip(int ch, bool *en);

// get vi frame
int mmf_vi_frame_pop(int ch, void **data, int *len, int *width, int *height, int *format);
void mmf_vi_frame_free(int ch);

// invert format
int mmf_invert_format_to_maix(int mmf_format);
int mmf_invert_format_to_mmf(int maix_format);

// venc
int mmf_enc_jpg_init(int ch, int w, int h, int format, int quality);
int mmf_enc_jpg_deinit(int ch);
int mmf_enc_jpg_push(int ch, uint8_t *data, int w, int h, int format);
int mmf_enc_jpg_push_with_quality(int ch, uint8_t *data, int w, int h, int format, int quality);
int mmf_enc_jpg_pop(int ch, uint8_t **data, int *size);
int mmf_enc_jpg_free(int ch);
int mmf_add_venc_channel(int ch, mmf_venc_cfg_t *cfg);
int mmf_del_venc_channel(int ch);
int mmf_del_venc_channel_all();
int mmf_venc_push(int ch, uint8_t *data, int w, int h, int format);
int mmf_venc_pop(int ch, mmf_stream_t *stream);
int mmf_venc_free(int ch);

#endif // __KVM_MMF_HPP__
