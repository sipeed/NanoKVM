/**
 * @author lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */


#pragma once

#include <stdint.h>
#include "maix_err.hpp"
#include "maix_basic.hpp"
#include "maix_log.hpp"
#include "maix_image.hpp"
#include "maix_time.hpp"
#include "maix_camera_base.hpp"
#include "kvm_mmf.hpp"
#include <signal.h>

static void try_deinit_mmf()
{
    static uint8_t is_called = 0;
    if (!is_called) {
        mmf_try_deinit(true);
        is_called = 1;
    }
}

static void signal_handle(int signal)
{
    const char *signal_msg = NULL;
    switch (signal) {
    case SIGILL: signal_msg = "SIGILL"; break;
    case SIGTRAP: signal_msg = "SIGTRAP"; break;
    case SIGABRT: signal_msg = "SIGABRT"; break;
    case SIGBUS: signal_msg = "SIGBUS"; break;
    case SIGFPE: signal_msg = "SIGFPE"; break;
    case SIGKILL: signal_msg = "SIGKILL"; break;
    case SIGSEGV: signal_msg = "SIGSEGV"; break;
    default: signal_msg = "UNKNOWN"; break;
    }

    maix::log::error("Trigger signal, code:%s(%d)!\r\n", signal_msg, signal);
    try_deinit_mmf();
    exit(1);
}

// FIXME: move this function to port/maix_vision_maixcam.cpp ?
static __attribute__((constructor)) void maix_vision_register_signal(void)
{
    signal(SIGILL, signal_handle);
    signal(SIGTRAP, signal_handle);
    signal(SIGABRT, signal_handle);
    signal(SIGBUS, signal_handle);
    signal(SIGFPE, signal_handle);
    signal(SIGKILL, signal_handle);
    signal(SIGSEGV, signal_handle);

    maix::util::register_exit_function(try_deinit_mmf);
}

namespace maix::camera
{
    class CameraCviMmf final : public CameraBase
    {
    public:
        CameraCviMmf(const std::string device, int width, int height, image::Format format, int buff_num)
        {
            this->device = device;
            this->format = format;
            this->width = width;
            this->height = height;
            this->buffer_num = buff_num;
            this->ch = -1;

            if (0 != mmf_init()) {
                err::check_raise(err::ERR_RUNTIME, "mmf init failed");
            }

            if (0 != mmf_vi_init()) {
                err::check_raise(err::ERR_RUNTIME, "mmf vi init failed");
            }
        }

        CameraCviMmf(const std::string device, int ch, int width, int height, image::Format format, int buff_num)
        {
            this->device = device;
            this->format = format;
            this->width = width;
            this->height = height;
            this->buffer_num = buff_num;
            this->ch = ch;

            if (0 != mmf_init()) {
                err::check_raise(err::ERR_RUNTIME, "mmf init failed");
            }

            if (0 != mmf_vi_init()) {
                err::check_raise(err::ERR_RUNTIME, "mmf vi init failed");
            }
        }

        ~CameraCviMmf()
        {
            mmf_del_vi_channel(this->ch);
            if (0 != mmf_vi_deinit()) {
                err::check_raise(err::ERR_RUNTIME, "mmf vi init failed");
            }
            mmf_try_deinit(true);
        }

        err::Err open(int width, int height, image::Format format, int buff_num)
        {
            if (format == image::FMT_GRAYSCALE) {
                format = image::FMT_YVU420SP;
            }
            int ch = mmf_get_vi_unused_channel();
            if (ch < 0) {
                log::error("camera open: mmf get vi channel failed");
                return err::ERR_RUNTIME;
            }
            if (0 != mmf_add_vi_channel(ch, width, height, mmf_invert_format_to_mmf(format))) {
                log::error("camera open: mmf add vi channel failed");
                return err::ERR_RUNTIME;
            }

            this->ch = ch;
            this->width = (width == -1) ? this->width : width;
            this->height = (height == -1) ? this->height : height;
            this->align_width = mmf_vi_aligned_width(this->ch);
            this->align_need = (this->width % this->align_width == 0) ? false : true;   // Width need align only
            return err::ERR_NONE;
        } // open

        bool is_support_format(image::Format format)
        {
            if(format == image::Format::FMT_RGB888 || format == image::Format::FMT_BGR888
            || format == image::Format::FMT_YVU420SP|| format == image::Format::FMT_GRAYSCALE)
                return true;
            return false;
        }

        void close()
        {
            if (mmf_vi_chn_is_open(this->ch) == true) {
                if (0 != mmf_del_vi_channel(this->ch)) {
                    log::error("mmf del vi channel failed");
                }
            }
        } // close

        // read
        image::Image *read(void *buff = NULL, size_t buff_size = 0)
        {
            // printf("Func: maix_image.cpp read\r\n");
            image::Image *img = NULL;

            void *buffer = NULL;
            int buffer_len = 0, width = 0, height = 0, format = 0;

            if (0 == mmf_vi_frame_pop(this->ch, &buffer, &buffer_len, &width, &height, &format)) {
                if (buffer == NULL) {
                    mmf_vi_frame_free(this->ch);
                    printf("mmf_vi_frame_free error\r\n");
                    return NULL;
                }
                if(buff)
                {
                    if(buff_size < (size_t)buffer_len)
                    {
                        log::error("camera read: buff size not enough, need %d, but %d", buffer_len, buff_size);
                        mmf_vi_frame_free(this->ch);
                        return NULL;
                    }
                    img = new image::Image(width, height, this->format, (uint8_t*)buff, buff_size, false);
                }
                else
                {
                    img = new image::Image(this->width, this->height, this->format);
                }
                void *image_data = img->data();
                switch (img->format()) {
                    case image::Format::FMT_GRAYSCALE:
                        if (this->align_need) {
                            for (int h = 0; h < this->height; h ++) {
                                memcpy((uint8_t *)image_data + h * this->width, (uint8_t *)buffer + h * width, this->width);
                            }
                        } else {
                            memcpy(image_data, buffer, this->width * this->height);
                        }
                        break;
                    case image::Format::FMT_BGR888: // fall through
                    case image::Format::FMT_RGB888:
                        if (this->align_need) {
                            for (int h = 0; h < this->height; h++) {
                                memcpy((uint8_t *)image_data + h * this->width * 3, (uint8_t *)buffer + h * width * 3, this->width * 3);
                            }
                        } else {
                            memcpy(image_data, buffer, this->width * this->height * 3);
                        }
                        break;
                    case image::Format::FMT_YVU420SP:
                        if (this->align_need) {
                            for (int h = 0; h < this->height * 3 / 2; h ++) {
                                memcpy((uint8_t *)image_data + h * this->width, (uint8_t *)buffer + h * width, this->width);
                            }
                        } else {
                            memcpy(image_data, buffer, this->width * this->height * 3 / 2);
                        }
                        break;
                    default:
                        printf("unknown format\n");
                        delete img;
                        mmf_vi_frame_free(this->ch);
                        printf("switch (img->format()\r\n");
                        return NULL;
                }
                mmf_vi_frame_free(this->ch);
                // printf("mmf_vi_frame_free\r\n");
                return img;
            }

            return img;
        } // read

        camera::CameraCviMmf *add_channel(int width, int height, image::Format format, int buff_num)
        {
            int new_channel = mmf_get_vi_unused_channel();
            if (new_channel < 0) {
                log::error("Support not more channel!\r\n");
                return NULL;
            }
            return new camera::CameraCviMmf(this->device, new_channel, width, height, format, buff_num);
        }

        void clear_buff()
        {

        }

        bool is_opened() {
            return mmf_vi_chn_is_open(this->ch);
        }

        int get_ch_nums() {
            return 1;
        }

        int get_channel() {
            return this->ch;
        }

        int hmirror(int en)
        {
            bool out;
            if (en == -1) {
                mmf_get_vi_hmirror(this->ch, &out);
            } else {
                bool need_open = false;
                if (this->is_opened()) {
                    this->close();
                    need_open = true;
                }

                mmf_set_vi_hmirror(this->ch, en);

                if (need_open) {
                    err::check_raise(this->open(this->width, this->height, this->format, this->buffer_num), "Open failed");
                }
                out = en;
            }

            return out;
        }

        int vflip(int en)
        {
            bool out;
            if (en == -1) {
                mmf_get_vi_vflip(this->ch, &out);
            } else {
                bool need_open = false;
                if (this->is_opened()) {
                    this->close();
                    need_open = true;
                }

                mmf_set_vi_vflip(this->ch, en);

                if (need_open) {
                    err::check_raise(this->open(this->width, this->height, this->format, this->buffer_num), "Open failed");
                }
                out = en;
            }
            return out;
        }

    private:
        std::string device;
        image::Format format;
        int fd;
        int ch;
        uint32_t raw_format;
        std::vector<void*> buffers;
        std::vector<int> buffers_len;
        int buffer_num;
        int queue_id; // user directly used buffer id
        int width;
        int height;
        void *buff;
        bool buff_alloc;
        int align_width;
        bool align_need;
    };

} // namespace maix::camera
