/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#pragma once

#include "maix_tensor.hpp"
#include "maix_log.hpp"
#include "maix_image.hpp"
#include "maix_err.hpp"
#include "maix_camera_base.hpp"
#include <stdlib.h>
#include <map>
#include <stdexcept>
#include <vector>
#include <opencv2/opencv.hpp>

/**
 * @brief maix.camera module, access camera device and get image from it
 * @maixpy maix.camera
*/
namespace maix::camera
{
    /**
     * List all supported camera devices.
     * @return Returns the path to the camera device.
     * @maixpy maix.camera.list_devices
    */
    std::vector<std::string> list_devices();

    /**
     * Enable set camera registers, default is false, if set to true, will not set camera registers, you can manually set registers by write_reg API.
     * @param enable enable/disable set camera registers
     * @maixpy maix.camera.set_regs_enable
    */
    void set_regs_enable(bool enable = true);

    /**
     * Camera class
     * @maixpy maix.camera.Camera
     */
    class Camera
    {
    public:
        /**
         * @brief Construct a new Camera object.
         * Maximum resolution support 2560x1440.
         * @param width camera width, default is -1, means auto, mostly means max width of camera support
         * @param height camera height, default is -1, means auto, mostly means max height of camera support
         * @param format camera output format, default is image.Format.FMT_RGB888
         * @param device camera device path, you can get devices by list_devices method, by default(value is NULL(None in MaixPy)) means the first device
         * @param fps camera fps, default is -1, means auto, mostly means max fps of camera support
         * @param buff_num camera buffer number, default is 3, means 3 buffer, one used by user, one used for cache the next frame,
         *                 more than one buffer will accelerate image read speed, but will cost more memory.
         * @param open If true, camera will automatically call open() after creation. default is true.
         * @maixpy maix.camera.Camera.__init__
         * @maixcdk maix.camera.Camera.Camera
         */
        Camera(int width = -1, int height = -1, image::Format format = image::FMT_RGB888, const char *device = nullptr, int fps = -1, int buff_num = 3, bool open = true);

        /**
         * @brief Construct a new Camera object.
         * @attention CameraBase * parameter need to be set manually, otherwise the operation of this object will be invalid.
         * @param device camera device path, you can get devices by list_devices method, by default(value is NULL(None in MaixPy)) means the first device
         * @param base basic operation objects.
         * @param width camera width, default is -1, means auto, mostly means max width of camera support
         * @param height camera height, default is -1, means auto, mostly means max height of camera support
         * @param format camera output format, default is image.Format.FMT_RGB888
         * @param fps camera fps, default is -1, means auto, mostly means max fps of camera support
         * @param buff_num camera buffer number, default is 3, means 3 buffer, one used by user, one used for cache the next frame,
         *                 more than one buffer will accelerate image read speed, but will cost more memory.
         * @param open If true, camera will automatically call open() after creation. default is true.
         * @maixcdk maix.camera.Camera.Camera
         */
        Camera(const char *device, CameraBase *base, int width = -1, int height = -1, image::Format format = image::FMT_RGB888, int fps = -1, int buff_num = -1, bool open = true);

        ~Camera();

        void restart(int width = -1, int height = -1, image::Format format = image::FMT_RGB888, const char *device = nullptr, int fps = -1, int buff_num = 3, bool open = true);

        /**
         * Get the number of channels supported by the camera.
         * @return Returns the maximum number of channels.
         * @maixpy maix.camera.Camera.get_ch_nums
         */
        int get_ch_nums();

        /**
         * Open camera and run
         * @param width camera width, default is -1, means auto, mostly means max width of camera support
         * @param height camera height, default is -1, means auto, mostly means max height of camera support
         * @param format camera output format, default same as the constructor's format argument
         * @param fps camera fps, default is -1, means auto, mostly means max fps of camera support
         * @param buff_num camera buffer number, default is 3, means 3 buffer, one used by user, one used for cache the next frame,
         *                 more than one buffer will accelerate image read speed, but will cost more memory.
         * @return error code, err::ERR_NONE means success, others means failed
         * @maixpy maix.camera.Camera.open
         */
        err::Err open(int width = -1, int height = -1, image::Format format = image::FMT_INVALID, int fps = -1, int buff_num = -1);

        /**
         * Get one frame image from camera buffer, must call open method before read.
         * If open method not called, will call it automatically, if open failed, will throw exception!
         * So call open method before read is recommended.
         * @param buff buffer to store image data, if buff is nullptr, will alloc memory automatically.
         *             In MaixPy, default to None, you can create a image.Image object, then pass img.data() to buff.
         * @param block block read, default is true, means block util read image successfully,
         *              if set to false, will return nullptr if no image in buffer
         * @return image::Image object, if failed, return nullptr, you should delete if manually in C++
         * @maixpy maix.camera.Camera.read
        */
        image::Image *read(void *buff = nullptr, size_t buff_size = 0, bool block = true);

        /**
         * Clear buff to ensure the next read image is the latest image
         * @maixpy maix.camera.Camera.clear_buff
        */
        void clear_buff();

        /**
         * Read some frames and drop, this is usually used avoid read not stable image when camera just opened.
         * @param num number of frames to read and drop
         * @maixpy maix.camera.Camera.skip_frames
        */
        void skip_frames(int num);

        /**
         * Close camera
         * @maixpy maix.camera.Camera.close
        */
        void close();

        /**
         * Add a new channel and return a new Camera object, you can use close() to close this channel.
         * @param width camera width, default is -1, means auto, mostly means max width of camera support
         * @param height camera height, default is -1, means auto, mostly means max height of camera support
         * @param format camera output format, default is RGB888
         * @param fps camera fps, default is -1, means auto, mostly means max fps of camera support
         * @param buff_num camera buffer number, default is 3, means 3 buffer, one used by user, one used for cache the next frame,
         *                 more than one buffer will accelerate image read speed, but will cost more memory.
         * @param open If true, camera will automatically call open() after creation. default is true.
         * @return new Camera object
         * @maixpy maix.camera.Camera.add_channel
        */
        camera::Camera *add_channel(int width = -1, int height = -1, image::Format format = image::FMT_RGB888, int fps = -1, int buff_num = 3, bool open = true);

        /**
         * Check if camera is opened
         * @return true if camera is opened, false if not
         * @maixpy maix.camera.Camera.is_opened
        */
        bool is_opened();

        /**
         * @brief check camera device is closed or not
         * @return closed or not, bool type
         * @maixpy maix.camera.Camera.is_closed
        */
        bool is_closed() { return !is_opened();}

        /**
         * Get camera width
         * @return camera width
         * @maixpy maix.camera.Camera.width
        */
        int width()
        {
            return _width;
        }

        /**
         * Get camera height
         * @return camera height
         * @maixpy maix.camera.Camera.height
        */
        int height()
        {
            return _height;
        }

        /**
         * Get camera fps
         * @return camera fps
         * @maixpy maix.camera.Camera.fps
        */
        int fps()
        {
            return _fps;
        }

        /**
         * Get camera output format
         * @return camera output format, image::Format object
         * @maixpy maix.camera.Camera.format
        */
        image::Format format()
        {
            return _format;
        }

        /**
         * Get camera buffer number
         * @return camera buffer number
         * @maixpy maix.camera.Camera.buff_num
        */
        int buff_num()
        {
            return _buff_num;
        }

        /**
         * Set/Get camera horizontal mirror
         * @return camera horizontal mirror
         * @maixpy maix.camera.Camera.hmirror
         */
        int hmirror(int value = -1);

        /**
         * Set/Get camera vertical flip
         * @return camera vertical flip
         * @maixpy maix.camera.Camera.vflip
        */
        int vflip(int value = -1);

        /**
         * Get camera device path
         * @return camera device path
         * @maixpy maix.camera.Camera.device
        */
        std::string device()
        {
            return _device;
        }

        /**
         * Write camera register
         * @param addr register address
         * @param data register data
         * @param bit_width register data bit width, default is 8
         * @return error code, err::ERR_NONE means success, others means failed
         * @maixpy maix.camera.Camera.write_reg
         */
        err::Err write_reg(int addr, int data, int bit_width = 8)
        {
            return err::ERR_NONE;
        }

        /**
         * Read camera register
         * @param addr register address
         * @return register data, -1 means failed
         * @param bit_width register data bit width, default is 8
         * @maixpy maix.camera.Camera.read_reg
         */
        int read_reg(int addr, int bit_width = 8)
        {
            return -1;
        }

        /**
         * Camera output color bar image for test
         * @param enable enable/disable color bar
         * @return error code, err::ERR_NONE means success, others means failed
         * @maixpy maix.camera.Camera.show_colorbar
         */
        err::Err show_colorbar(bool enable);

        /**
         * Get channel of camera
         * @return channel number
         * @maixpy maix.camera.Camera.get_channel
         */
        int get_channel();

        /**
         * Set camera resolution
         * @param width new width
         * @param height new height
         * @return error code, err::ERR_NONE means success, others means failed
         * @maixpy maix.camera.Camera.set_resolution
        */
        err::Err set_resolution(int width, int height);

    private:
        std::string _device;
        int _ch;
        int _width;
        int _height;
        int _fps;
        int _buff_num;
        image::Format _format;
        image::Format _format_impl; // used by implement code and need convert to _format
        int _hmirror;
        int _vflip;
        float _exposure;
        float _gain;
        bool _show_colorbar;
        bool _open_set_regs;
        CameraBase *_impl; // used by implement code
        bool _check_format(image::Format format);
    };
}
