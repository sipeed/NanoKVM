/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */


#include "maix_camera.hpp"
#include <dirent.h>
#ifdef PLATFORM_LINUX
    #include "maix_camera_v4l2.hpp"
#endif
#ifdef PLATFORM_MAIXCAM
    #include "maix_camera_mmf.hpp"
#endif

namespace maix::camera
{
    static bool set_regs_flag = false;

    std::vector<std::string> list_devices()
    {
        // find to /dev/video*
        std::vector<std::string> devices;
        std::string path = "/dev";
        DIR *dir = opendir(path.c_str());
        if (dir == NULL)
        {
            return devices;
        }
        struct dirent *ptr;
        while ((ptr = readdir(dir)) != NULL)
        {
            if (ptr->d_type == DT_CHR)
            {
                std::string name = ptr->d_name;
                if (name.find("video") != std::string::npos)
                {
                    devices.push_back( path + "/" + name );
                }
            }
        }
        closedir(dir);
        // sort devices with name
        std::sort(devices.begin(), devices.end());
        // print devices
        for (size_t i = 0; i < devices.size(); i++)
        {
            log::debug("find device: %s\n", devices[i].c_str());
        }
        return devices;
    }

    void set_regs_enable(bool enable) {
        set_regs_flag = enable;
    }

    err::Err Camera::show_colorbar(bool enable)
    {
        // only set variable now
        // should control camera to show colorbar
        _show_colorbar = enable;
        return err::ERR_NONE;
    }

    static void generate_colorbar(image::Image &img)
    {
        int width = img.width();
        int height = img.height();
        int step = width / 8;
        int color_step = 255 / 7;
        int color = 0;
        uint8_t colors[8][3] = {
            {255, 255, 255},
            {255, 0, 0},
            {255, 127, 0},
            {255, 255, 0},
            {0, 255, 0},
            {0, 0, 255},
            {143, 0, 255},
            {0, 0, 0},
        };
        for (int i = 0; i < 8; i++)
        {
            image::Color _color(colors[i][0], colors[i][1], colors[i][2], 0, image::FMT_RGB888);
            img.draw_rect(i * step, 0, step, height, _color, -1);
            color += color_step;
        }
    }
#ifdef PLATFORM_LINUX
    static char * _get_device(const char *device)
    {
        if (device)
        {
            return (char *)device;
        }
        else
        {
            std::vector<std::string> devices = list_devices();
            err::check_bool_raise(devices.size() > 0, "No camera device");
            return (char *)devices[0].c_str();
        }
    }
#endif

    Camera::Camera(int width, int height, image::Format format, const char *device, int fps, int buff_num, bool open)
    {
        err::Err e;
        err::check_bool_raise(_check_format(format), "Format not support");

        if (format == image::Format::FMT_RGB888 && width * height * 3 > 640 * 640 * 3) {
            log::warn("Note that we do not recommend using large resolution RGB888 images, which can take up a lot of memory!\r\n");
        }

        _width = (width == -1) ? 640 : width;
        _height = (height == -1) ? 480 : height;
        _format = format;
        _fps = (fps == -1) ? 30 : fps;
        _buff_num = buff_num;

        _show_colorbar = false;
        _open_set_regs = set_regs_flag;
        _impl = NULL;

#ifdef PLATFORM_LINUX
        _device = _get_device(device);
        _impl = new CameraV4L2(_device, _width, _height, _format, _buff_num);
#endif

#ifdef PLATFORM_MAIXCAM
        _device = "";
        _impl = new CameraCviMmf(_device, _width, _height, _format, _buff_num);
#endif

        if (open) {
            e = this->open(_width, _height, _format, _buff_num);

            // err::check_raise(e, "camera open failed");
        }
    }

    Camera::Camera(const char *device, CameraBase *base, int width, int height, image::Format format, int fps, int buff_num, bool open)
    {
        err::Err e;
        err::check_bool_raise(_check_format(format), "Format not support");

        _width = (width == -1) ? 640 : width;
        _height = (height == -1) ? 480 : height;
        _format = format;
        _fps = (fps == -1) ? 30 : fps;
        _buff_num = buff_num;

        _show_colorbar = false;
        _open_set_regs = set_regs_flag;
        _impl = base;

        if (open) {
            e = this->open(_width, _height, _format, _buff_num);
            err::check_raise(e, "camera open failed");
        }
    }

    Camera::~Camera()
    {
        if (this->is_opened()) {
            this->close();
        }
#ifdef PLATFORM_LINUX
        delete (CameraV4L2*)_impl;
#endif

#ifdef PLATFORM_MAIXCAM
        delete (CameraCviMmf*)_impl;
#endif
    }

    void Camera::restart(int width, int height, image::Format format, const char *device, int fps, int buff_num, bool open)
    {
        if (this->is_opened()) {
            this->close();
        }
#ifdef PLATFORM_LINUX
        delete (CameraV4L2*)_impl;
#endif

#ifdef PLATFORM_MAIXCAM
        delete (CameraCviMmf*)_impl;
#endif

        err::Err e;
        err::check_bool_raise(_check_format(format), "Format not support");

        if (format == image::Format::FMT_RGB888 && width * height * 3 > 640 * 640 * 3) {
            log::warn("Note that we do not recommend using large resolution RGB888 images, which can take up a lot of memory!\r\n");
        }

        _width = (width == -1) ? 640 : width;
        _height = (height == -1) ? 480 : height;
        _format = format;
        _fps = (fps == -1) ? 30 : fps;
        _buff_num = buff_num;

        _show_colorbar = false;
        _open_set_regs = set_regs_flag;
        _impl = NULL;

#ifdef PLATFORM_LINUX
        _device = _get_device(device);
        _impl = new CameraV4L2(_device, _width, _height, _format, _buff_num);
#endif

#ifdef PLATFORM_MAIXCAM
        _device = "";
        _impl = new CameraCviMmf(_device, _width, _height, _format, _buff_num);
#endif

        if (open) {
            e = this->open(_width, _height, _format, _buff_num);

            // err::check_raise(e, "camera open failed");
        }
    }

    int Camera::get_ch_nums()
    {
        return 2;
    }

    int Camera::get_channel()
    {
        if (_impl == NULL)
            return err::ERR_NOT_INIT;

        if (!this->is_opened()) {
            return err::ERR_NOT_OPEN;
        }

        return _impl->get_channel();
    }

    bool Camera::_check_format(image::Format format) {
        if (format == image::FMT_RGB888 || format == image::FMT_BGR888
        || format == image::FMT_RGBA8888 || format == image::FMT_BGRA8888
        || format == image::FMT_YVU420SP || format == image::FMT_GRAYSCALE) {
            return true;
        } else {
            return false;
        }
    }

    err::Err Camera::open(int width, int height, image::Format format, int fps, int buff_num)
    {
        if (_impl == NULL)
            return err::Err::ERR_RUNTIME;

        int width_tmp = (width == -1) ? _width : width;
        int height_tmp = (height == -1) ? _height : height;
        image::Format format_tmp = (format == image::FMT_INVALID) ? _format : format;
        int fps_tmp = (fps == -1) ? 30 : fps;
        int buff_num_tmp =( buff_num == -1) ? _buff_num : buff_num;

        err::check_bool_raise(_check_format(format_tmp), "Format not support");

        if (this->is_opened()) {
            if (width == width_tmp && height == height_tmp && format == format_tmp && fps == fps_tmp && buff_num == buff_num_tmp) {
                return err::ERR_NONE;
            }
            this->close();  // Get new param, close and reopen
        }

        _width = width_tmp;
        _height = height_tmp;
        _fps = fps_tmp;
        _buff_num = buff_num_tmp;
        _format = format_tmp;
        _format_impl = _format;
        if(!_impl->is_support_format(_format))
        {
            if(_impl->is_support_format(image::FMT_RGB888))
                _format_impl = image::FMT_RGB888;
            else if(_impl->is_support_format(image::FMT_BGR888))
                _format_impl = image::FMT_BGR888;
            else if(_impl->is_support_format(image::FMT_YVU420SP))
                _format_impl = image::FMT_YVU420SP;
            else if(_impl->is_support_format(image::FMT_YUV420SP))
                _format_impl = image::FMT_YUV420SP;
            else if(_impl->is_support_format(image::FMT_RGBA8888))
                _format_impl = image::FMT_RGBA8888;
            else if(_impl->is_support_format(image::FMT_BGRA8888))
                _format_impl = image::FMT_BGRA8888;
            else if(_impl->is_support_format(image::FMT_GRAYSCALE))
                _format_impl = image::FMT_GRAYSCALE;
            else
                return err::ERR_ARGS;
        }

        return _impl->open(_width, _height, _format_impl, _buff_num);;
    }

    void Camera::close()
    {
        if (this->is_closed())
            return;

        _impl->close();
    }

    camera::Camera *Camera::add_channel(int width, int height, image::Format format, int fps, int buff_num, bool open)
    {
        err::check_bool_raise(_check_format(format), "Format not support");

        int width_tmp = (width == -1) ? _width : width;
        int height_tmp = (height == -1) ? _height : height;
        image::Format format_tmp = (format == image::Format::FMT_INVALID) ? _format : format;
        int fps_tmp = (fps == -1) ? _fps : fps;
        int buff_num_tmp = buff_num == -1 ? _buff_num : buff_num;

        Camera *cam = NULL;
        if (_impl) {
            CameraBase *cam_base = _impl->add_channel(width_tmp, height_tmp, format_tmp, buff_num);
            err::check_bool_raise(cam_base, "Unable to add a new channel. Please check the maximum number of supported channels.");
            cam = new Camera(_device.c_str(), cam_base, width_tmp, height_tmp, format_tmp, fps_tmp, buff_num_tmp, open);
        }
        return cam;
    }

    bool Camera::is_opened()
    {
        if (_impl == NULL)
            return false;

        return _impl->is_opened();
    }

    image::Image *Camera::read(void *buff, size_t buff_size, bool block)
    {
        if (!this->is_opened()) {
            // err::Err e = open(_width, _height, _format, _buff_num);
            // err::check_raise(e, "open camera failed");
            return NULL;
        }

        if (_show_colorbar) {
            image::Image *img = new image::Image(_width, _height);
            generate_colorbar(*img);
            err::check_null_raise(img, "camera read failed");
            return img;
        } else {
            // it's better all done by impl to faster read, but if impl not support, we have to convert it
            if(_format_impl == _format)
            {
                image::Image *img = _impl->read(buff, buff_size);
                // err::check_null_raise(img, "camera read failed");
                return img;
            }
            else
            {
                image::Image *img = _impl->read();
                image::Image *img2 = img->to_format(_format, buff, buff_size);
                delete img;
                // err::check_null_raise(img2, "camera read failed");
                return img2;
            }
        }
    }

    void Camera::clear_buff()
    {
        if (_impl == NULL)
            return;
        _impl->clear_buff();
    }

    void Camera::skip_frames(int num)
    {
        if (_impl == NULL)
            return;
        for(int i = 0; i < num; i++)
        {
            image::Image *img = _impl->read();
            delete img;
        }
    }

    err::Err Camera::set_resolution(int width, int height)
    {
        err::Err e;
        if (_impl == NULL)
            return err::ERR_NOT_INIT;

        if (this->is_opened()) {
            this->close();
        }

        _width = width;
        _height = height;
        e = this->open(_width, _height, _format, _buff_num);
        err::check_raise(e, "camera open failed");
        return err::ERR_NONE;
    }

    int Camera::hmirror(int value) {
        if (_impl == NULL)
            return err::ERR_NOT_INIT;

        if (!this->is_opened()) {
            return err::ERR_NOT_OPEN;
        }

        return _impl->hmirror(value);
    }

    int Camera::vflip(int value) {
        if (_impl == NULL)
            return err::ERR_NOT_INIT;

        if (!this->is_opened()) {
            return err::ERR_NOT_OPEN;
        }

        return _impl->vflip(value);
    }
}

