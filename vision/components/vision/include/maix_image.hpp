/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#pragma once

#include "maix_tensor.hpp"
#include "maix_log.hpp"
#include "maix_err.hpp"
#include "maix_fs.hpp"
#include "maix_image_def.hpp"
#include "maix_image_color.hpp"
#include "maix_image_obj.hpp"
#include "maix_type.hpp"
#include <stdlib.h>

/**
 * @brief maix.image module, image related definition and functions
 * @maixpy maix.image
 */
namespace maix::image
{

    /**
     * map point position or rectangle position from one image size to another image size(resize)
     * @param int w_in original image width
     * @param int h_in original image height
     * @param int w_out target image width
     * @param int h_out target image height
     * @param fit resize method, see maix.image.Fit
     * @param x original point x, or rectagle left-top point's x
     * @param y original point y, or rectagle left-top point's y
     * @param w original rectagle width, can be -1 if not use this arg, default -1.
     * @param h original rectagle height, can be -1 if not use this arg, default -1.
     * @return list type, [x, y] if map point, [x, y, w, h] if resize rectangle.
     * @maixpy maix.image.resize_map_pos
    */
    std::vector<int> resize_map_pos(int w_in, int h_in, int w_out, int h_out, image::Fit fit, int x, int y, int w = -1, int h = -1);

    /**
     * reverse resize_map_pos method, when we call image.resize method resiz image 'a' to image 'b', we want to known the original position on 'a' whith a knew point on 'b'
     * @param int w_in original image width
     * @param int h_in original image height
     * @param int w_out image width after resized
     * @param int h_out image height after resized
     * @param fit resize method, see maix.image.Fit
     * @param x point on resized image x, or rectagle left-top point's x
     * @param y original point y, or rectagle left-top point's y
     * @param w original rectagle width, can be -1 if not use this arg, default -1.
     * @param h original rectagle height, can be -1 if not use this arg, default -1.
     * @return list type, [x, y] if map point, [x, y, w, h] if resize rectangle.
     * @maixpy maix.image.resize_map_pos_reverse
    */
    std::vector<int> resize_map_pos_reverse(int w_in, int h_in, int w_out, int h_out, image::Fit fit, int x, int y, int w = -1, int h = -1);

    /**
     * Image class
     * @maixpy maix.image.Image
     */
    class Image
    {
    public:
        /**
         * Image constructor
         *
         * @param width image width, should > 0
         * @param height image height, should > 0
         * @param format image format @see image::Format
         * @maixpy maix.image.Image.__init__
         * @maixcdk maix.image.Image.Image
         */
        Image(int width, int height, image::Format format = image::Format::FMT_RGB888);
        // Image(int width, int height, image::Format format = image::Format::FMT_RGB888, Bytes *data = nullptr, bool copy = true);

        /**
         * Image constructor
         *
         * @param width image width, should > 0
         * @param height image height, should > 0
         * @param format image format @see image::Format
         * @param data image data, if data is nullptr, will malloc memory for image data
         * If the image is in jpeg format, data must be filled in.
         * @param data_size image data size, only for compressed format like jpeg png, data_size must be filled in, or should be -1, default is -1.
         * @param copy if true and data is not nullptr, will copy data to new buffer, else will use data directly. default is true to avoid memory leak.
         * @maixcdk maix.image.Image.Image
         */
        Image(int width, int height, image::Format format, uint8_t *data, int data_size, bool copy);

        Image() {
            _width = 0;
            _height = 0;
            _format = image::Format::FMT_INVALID;
            _data = nullptr;
            _data_size = 0;
            _is_malloc = false;
        }
        ~Image();

        void operator=(const image::Image &img);

        //************************** get and set basic info **************************//

        /**
         * Get image's format @see image.Format
         * @maixpy maix.image.Image.format
         */
        image::Format format() { return this->_format; }

        /**
         * Get image's size, [width, height]
         * @maixpy maix.image.Image.size
         */
        image::Size size() { return Size(_width, _height); }

        std::vector<int> shape() { return std::vector<int>{_height, _width, (int)fmt_size[_format]}; }

        /**
         * Get image's data size
         * @maixpy maix.image.Image.data_size
         */
        int data_size() { return _data_size; }

        /**
         * Get image's width
         * @maixpy maix.image.Image.width
         */
        int width() { return _width; }

        /**
         * Get image's height
         * @maixpy maix.image.Image.height
         */
        int height() { return _height; }

        /**
         * Get image's data pointer.
         * In MaixPy is capsule object.
         * @maixpy maix.image.Image.data
         */
        void *data(){ return _data; }

        /**
         * To string method
         * @maixpy maix.image.Image.__str__
         */
        std::string __str__();

        /**
         * To string method
         * @maixpy maix.image.Image.to_str
         */
        std::string to_str() { return __str__(); }

        /**
         * Get pixel of image
         * @param x pixel's coordinate x. x must less than image's width
         * @param y pixel's coordinate y. y must less than image's height
         * @param rgbtuple switch return value method. rgbtuple decides whether to split the return or not. default is false.
         * @return pixel value,
         * According to image format and rgbtuple, return different value:
         * format is FMT_RGB888, rgbtuple is true, return [R, G, B]; rgbtuple is false, return [RGB]
         * foramt is FMT_BGR888, rgbtuple is true, return [B, G, R]; rgbtuple is false, return [BGR]
         * format is FMT_GRAYSCALE, return [GRAY];
         *
         * @maixpy maix.image.Image.get_pixel
        */
        std::vector<int> get_pixel(int x, int y, bool rgbtuple = false) {
            std::vector<int> pixels;
            if (!(_format == image::Format::FMT_RGB888 || _format == image::Format::FMT_BGR888 ||
                _format == image::Format::FMT_RGB565 || _format == image::Format::FMT_BGR565 ||
                _format == image::Format::FMT_GRAYSCALE)) {
                log::error("get_pixel not support format: %d\r\n", _format);
                return pixels;
            }

            if (x < 0 || x >= _width || y < 0 || y >= _height) {
                log::error("get_pixel out of range: (%d, %d)\r\n", x, y);
                return pixels;
            }

            switch (_format) {
            case image::Format::FMT_RGB888: // fall through
            case image::Format::FMT_BGR888:
            {
                uint8_t v0 = ((uint8_t *)_data)[y * _width * 3 + x * 3 + 0];
                uint8_t v1 = ((uint8_t *)_data)[y * _width * 3 + x * 3 + 1];
                uint8_t v2 = ((uint8_t *)_data)[y * _width * 3 + x * 3 + 2];
                if (!rgbtuple) {
                    int value = v0 << 16 | v1 << 8 | v2;
                    pixels.push_back(value);
                } else {
                    pixels.push_back(v0);
                    pixels.push_back(v1);
                    pixels.push_back(v2);
                }
                break;
            }
            case image::Format::FMT_GRAYSCALE:
                pixels.push_back(((uint8_t *)_data)[y * _width + x]);
                break;
            case image::Format::FMT_BGR565: // fall through
            case image::Format::FMT_RGB565:
            {
                if (!rgbtuple) {
                    int value = ((uint16_t *)_data)[y * _width + x] & 0xffff;
                    pixels.push_back(value);
                } else {
                    int value = ((uint16_t *)_data)[y * _width + x] & 0xffff;
                    int v0 = (value >> 11) & 0x1F;
                    int v1 = (value >> 5) & 0x3F;
                    int v2 = value & 0x1F;
                    pixels.push_back(v0);
                    pixels.push_back(v1);
                    pixels.push_back(v2);
                }
                break;
            }
            default:
                log::error("get_pixel not support format: %d\r\n", _format);
                break;
            }

            return pixels;
        }

        /**
         * Set pixel of image
         * @param x pixel's coordinate x. x must less than image's width
         * @param y pixel's coordinate y. y must less than image's height
         * @param pixel pixel value, according to image format and size of pixel, has different operation:
         * format is FMT_RGB888, pixel size must be 1 or 3, if size is 1, will split pixel[0] to [R, G, B]; if size is 3, will use pixel directly
         * format is FMT_BGR888, pixel size must be 1 or 3, if size is 1, will split pixel[0] to [B, G, R]; if size is 3, will use pixel directly
         * format is FMT_GRAYSCALE, pixel size must be 1, will use pixel directly
         * @return error code, Err::ERR_NONE is ok, other is error
         * @maixpy maix.image.Image.set_pixel
        */
        err::Err set_pixel(int x, int y, std::vector<int> pixel) {
            if (!(_format == image::Format::FMT_RGB888 || _format == image::Format::FMT_BGR888 ||
                _format == image::Format::FMT_RGB565 || _format == image::Format::FMT_BGR565 ||
                _format == image::Format::FMT_GRAYSCALE)) {
                log::error("get_pixel not support format: %d\r\n", _format);
                return err::Err::ERR_RUNTIME;
            }

            if (x < 0 || x >= _width || y < 0 || y >= _height) {
                log::error("get_pixel out of range: (%d, %d)\r\n", x, y);
                return err::Err::ERR_RUNTIME;
            }

            switch (_format) {
            case image::Format::FMT_RGB888: // fall through
            case image::Format::FMT_BGR888:
                if (pixel.size() == 1) {
                    uint8_t v0 = pixel[0];
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 0] = (v0 >> 16) & 0xFF;
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 1] = (v0 >> 8) & 0xFF;
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 2] = v0 & 0xFF;
                } else if (pixel.size() == 3) {
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 0] = pixel[0];
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 1] = pixel[1];
                    ((uint8_t *)_data)[y * _width * 3 + x * 3 + 2] = pixel[2];
                } else {
                    log::error("set_pixel pixel size must be 1 or 3, but %d\r\n", pixel.size());
                    return err::Err::ERR_RUNTIME;
                }
                break;
            case image::Format::FMT_GRAYSCALE:
                if (pixel.size() == 1) {
                    ((uint8_t *)_data)[y * _width + x] = pixel[0];
                } else {
                    log::error("set_pixel pixel size must be 1, but %d\r\n", pixel.size());
                    return err::Err::ERR_RUNTIME;
                }
                break;
            case image::Format::FMT_BGR565: // fall through
            case image::Format::FMT_RGB565:
            {
                if (pixel.size() == 1) {
                    ((uint16_t *)_data)[y * _width + x] = pixel[0];
                } else if (pixel.size() == 3) {
                    int num = ((pixel[0] & 0x1F) << 11) | ((pixel[1] & 0x3F) << 5) | (pixel[2] & 0x1F);
                    ((uint16_t *)_data)[y * _width + x] = num;
                } else {
                    log::error("set_pixel pixel size must be 1 or 3, but %d\r\n", pixel.size());
                    return err::Err::ERR_RUNTIME;
                }
                break;
            }

            default:
                log::error("get_pixel not support format: %d\r\n", _format);
                break;
            }

            return err::Err::ERR_NONE;
        }

        //************************** convert format **************************//
        // more maixpy convert func in MaixPy project's convert_image.hpp

        /**
         * Convert Image object to tensor::Tensor object
         * @param chw if true, the shape of tensor is [C, H, W], else [H, W, C]
         * @param copy if true, will alloc memory for tensor data, else will use the memory of Image object
         * @return tensor::Tensor object pointer, an allocated tensor object
         * @maixpy maix.image.Image.to_tensor
         */
        tensor::Tensor *to_tensor(bool chw = false, bool copy = true);

        /**
         * Get image's data and convert to array bytes
         * @param copy if true, will alloc memory and copy data to new buffer,
         *             else will use the memory of Image object, delete bytes object will not affect Image object，
         *             but delete Image object will make bytes object invalid, it may cause program crash !!!!
         *             So use this param carefully.
         * @return image's data bytes, need be delete by caller in C++.
         * @maixpy maix.image.Image.to_bytes
         */
        Bytes *to_bytes(bool copy = true);

        /**
         * Convert image to specific format
         * @param format format want to convert to, @see image::Format, only support RGB888, BGR888, RGBA8888, BGRA8888, GRAYSCALE, JPEG.
         * @return new image object. Need be delete by caller in C++.
         * @throw err.Exception, if two images' format not support, **or already the format**, will raise exception
         * @maixpy maix.image.Image.to_format
         */
        image::Image *to_format(const image::Format &format);


        /**
         * Convert image to specific format
         * @param format format want to convert to, @see image::Format, only support RGB888, BGR888, RGBA8888, BGRA8888, GRAYSCALE, JPEG.
         * @param buff user's buffer, if buff is nullptr, will malloc memory for new image data, else will use buff directly
         * @return new image object. Need be delete by caller in C++.
         * @throw err.Exception, if two images' format not support, **or already the format**, will raise exception
         * @maixcdk maix.image.Image.to_format
         */
        image::Image *to_format(const image::Format &format, void *buff, size_t buff_size);

        /**
         * Convert image to jpeg
         * @param quality the quality of jpg, default is 95. range is (50, 100].
         * @return new image object. Need be delete by caller in C++.
         * @throw err.Exception, if two images' format not support, **or already the format**, will raise exception
         * @maixpy maix.image.Image.to_jpeg
        */
        image::Image *to_jpeg(int quality = 95);

        //************************** draw **************************//

        /**
         * Draw image on this image
         * @param x left top corner of image point's coordinate x
         * @param y left top corner of image point's coordinate y
         * @param img image object to draw, the caller's channel must <= the args' channel,
         *            e.g. caller is RGB888, args is RGBA8888, will throw exception, but caller is RGBA8888, args is RGB888 or RGBA8888 is ok
         * @return this image object self
         * @maixpy maix.image.Image.draw_image
         */
        image::Image *draw_image(int x, int y, image::Image &img);

        /**
         * Fill rectangle color to image
         * @param x left top corner of rectangle point's coordinate x
         * @param y left top corner of rectangle point's coordinate y
         * @param w rectangle width
         * @param h rectangle height
         * @param color rectangle color
         * @param thickness rectangle thickness(line width), by default(value is 1), -1 means fill rectangle
         * @return this image object self
         * @maixpy maix.image.Image.draw_rect
         */
        image::Image *draw_rect(int x, int y, int w, int h, const image::Color &color, int thickness = 1);

        /**
         * Draw line on image
         * @param x1 start point's coordinate x
         * @param y1 start point's coordinate y
         * @param x2 end point's coordinate x
         * @param y2 end point's coordinate y
         * @param color line color @see image::Color
         * @param thickness line thickness(line width), by default(value is 1)
         * @return this image object self
         * @maixpy maix.image.Image.draw_line
         */
        image::Image *draw_line(int x1, int y1, int x2, int y2, const image::Color &color, int thickness = 1);

        /**
         * Draw circle on image
         * @param x circle center point's coordinate x
         * @param y circle center point's coordinate y
         * @param radius circle radius
         * @param color circle color @see image::Color
         * @param thickness circle thickness(line width), by default(value is 1), -1 means fill circle
         * @return this image object self
         * @maixpy maix.image.Image.draw_circle
         */
        image::Image *draw_circle(int x, int y, int radius, const image::Color &color, int thickness = 1);

        /**
         * Draw ellipse on image
         * @param x ellipse center point's coordinate x
         * @param y ellipse center point's coordinate y
         * @param a ellipse major axis length
         * @param b ellipse minor axis length
         * @param angle ellipse rotation angle
         * @param start_angle ellipse start angle
         * @param end_angle ellipse end angle
         * @param color ellipse color @see image::Color
         * @param thickness ellipse thickness(line width), by default(value is 1), -1 means fill ellipse
         * @return this image object self
         * @maixpy maix.image.Image.draw_ellipse
         */
        image::Image *draw_ellipse(int x, int y, int a, int b, float angle, float start_angle, float end_angle, const image::Color &color, int thickness = 1);

        /**
         * Draw text on image
         * @param x text left top point's coordinate x
         * @param y text left top point's coordinate y
         * @param string text content
         * @param color text color @see image::Color, default is white
         * @param scale font scale, by default(value is 1)
         * @param thickness text thickness(line width), if negative, the glyph is filled, by default(value is -1)
         * @param wrap if true, will auto wrap text to next line if text width > image width, by default(value is true)
         * @return this image object self
         * @maixpy maix.image.Image.draw_string
         */
        image::Image *draw_string(int x, int y, const std::string &textstring, const image::Color &color = image::COLOR_WHITE, float scale = 1, int thickness = -1,
                                bool wrap = true, int wrap_space = 4, const std::string &font = "");

        /**
         * Draw cross on image
         * @param x cross center point's coordinate x
         * @param y cross center point's coordinate y
         * @param color cross color @see image::Color
         * @param size how long the lines of the cross extend, by default(value is 5). So the line length is `2 * size + thickness`
         * @param thickness cross thickness(line width), by default(value is 1)
         * @maixpy maix.image.Image.draw_cross
         */
        image::Image *draw_cross(int x, int y, const image::Color &color, int size = 5, int thickness = 1);

        /**
         * Draw arrow on image
         * @param x0 start coordinate of the arrow x0
         * @param y0 start coordinate of the arrow y0
         * @param x1 end coordinate of the arrow x1
         * @param y1 end coordinate of the arrow y1
         * @param color cross color @see image::Color
         * @param thickness cross thickness(line width), by default(value is 1)
         * @return this image object self
         * @maixpy maix.image.Image.draw_arrow
         */
        image::Image *draw_arrow(int x0, int y0, int x1, int y1, const image::Color &color, int thickness = 1);

        /**
         * Draw edges on image
         * @param corners edges, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]
         * @param color edges color @see image::Color
         * @param size the circle of radius size. TODO: support in the feature
         * @param thickness edges thickness(line width), by default(value is 1)
         * @param fill if true, will fill edges, by default(value is false)
         * @return this image object self
         * @maixpy maix.image.Image.draw_edges
        */
        image::Image *draw_edges(std::vector<std::vector<int>> corners, const image::Color &color, int size = 0, int thickness = 1, bool fill = false);

        /**
         * Draw keypoints on image
         * @param keypoints keypoints, [x1, y1, x2, y2...] or [x, y, rotation_andle_in_degrees, x2, y2, rotation_andle_in_degrees2](TODO: rotation_andle_in_degrees support in the feature)
         * @param color keypoints color @see image::Color
         * @param size size of keypoints
         * @param thickness keypoints thickness(line width), by default(value is -1 means fill circle)
         * @return this image object self
         * @maixpy maix.image.Image.draw_keypoints
        */
        image::Image *draw_keypoints(std::vector<int> keypoints, const image::Color &color, int size = 10, int thickness = -1);

        //************************** image operations **************************//

        /**
         * Resize image, will create a new resized image object
         * @param width new width, if value is -1, will use height to calculate aspect ratio
         * @param height new height, if value is -1, will use width to calculate aspect ratio
         * @param object_fit fill, contain, cover, by default is fill
         * @param method resize method, by default is bilinear
         * @return Always return a new resized image object even size not change, So in C++ you should take care of the return value to avoid memory leak.
         *         And it's better to judge whether the size has changed before calling this function to make the program more efficient.
         *         e.g.
         * if img->width() != width || img->height() != height:
         *     img = img->resize(width, height);
         * @maixpy maix.image.Image.resize
         */
        image::Image *resize(int width, int height, image::Fit object_fit = image::Fit::FIT_FILL, image::ResizeMethod method = image::ResizeMethod::NEAREST);

        /**
         * Affine transform image, will create a new transformed image object
         * @param src_points three source points, [x1, y1, x2, y2, x3, y3]
         * @param dst_points three destination points, [x1, y1, x2, y2, x3, y3]
         * @param width new width, if value is -1, will use height to calculate aspect ratio
         * @param height new height, if value is -1, will use width to calculate aspect ratio
         * @param method resize method, by default is bilinear
         * @return new transformed image object
         * @maixpy maix.image.Image.affine
         */
        image::Image *affine(std::vector<int> src_points, std::vector<int> dst_points, int width = -1, int height = -1, image::ResizeMethod method = image::ResizeMethod::BILINEAR);

        /**
         * Copy image, will create a new copied image object
         * @return new copied image object
         * @maixpy maix.image.Image.copy
         */
        image::Image *copy();

        /**
         * Crop image, will create a new cropped image object
         * @param x left top corner of crop rectangle point's coordinate x
         * @param y left top corner of crop rectangle point's coordinate y
         * @param w crop rectangle width
         * @param h crop rectangle height
         * @return new cropped image object
         * @maixpy maix.image.Image.crop
         */
        image::Image *crop(int x, int y, int w, int h);

        /**
         * Rotate image, will create a new rotated image object
         * @param angle anti-clock wise rotate angle, if angle is 90 or 270, and width or height is -1, will swap width and height, or will throw exception
         * @param width new width, if value is -1, will use height to calculate aspect ratio
         * @param height new height, if value is -1, will use width to calculate aspect ratio
         * @param method resize method, by default is bilinear
         * @return new rotated image object
         * @maixpy maix.image.Image.rotate
         */
        image::Image *rotate(float angle, int width = -1, int height = -1, image::ResizeMethod method = image::ResizeMethod::BILINEAR);

        /**
         * @brief Finds the mean of x_div * y_div squares in the image and returns the modified image composed of the mean of each square.
         * @param x_div The width of the squares.
         * @param y_div The height of the squares.
         * @param copy Select whether to return a new image or modify the original image. default is false.
         * If true, returns a new image composed of the mean of each square; If false, returns the modified image composed of the mean of each square.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mean_pool
        */
        image::Image *mean_pool(int x_div, int y_div, bool copy = false);

        /**
         * @brief Finds the midpoint of x_div * y_div squares in the image and returns the modified image composed of the mean of each square.
         * @param x_div The width of the squares.
         * @param y_div The height of the squares.
         * @param bias The bias of the midpoint. default is 0.5.
         *  midpoint value is equal to (max * bias + min * (1 - bias))
         * @param copy Select whether to return a new image or modify the original image. default is false.
         * If true, returns a new image composed of the midpoint of each square; If false, returns the modified image composed of the midpoint of each square.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.midpoint_pool
        */
        image::Image *midpoint_pool(int x_div, int y_div, double bias = 0.5, bool copy = false);

        /**
         * @brief JPEG compresses the image in place, the same as to_jpeg functioin, it's recommend to use to_jpeg instead.
         * @param quality The quality of the compressed image. default is 95.
         * @return Returns the compressed JPEG image
         * @maixpy maix.image.Image.compress
        */
        image::Image *compress(int quality = 95);

        /**
         * @brief Sets all pixels in the image to zero
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.clear
        */
        image::Image *clear(image::Image *mask = nullptr);

        /**
         * @brief Zeros a rectangular part of the image. If no arguments are supplied this method zeros the center of the image.
         * @param x The x coordinate of the top left corner of the rectangle.
         * @param y The y coordinate of the top left corner of the rectangle.
         * @param w The width of the rectangle.
         * @param h The height of the rectangle.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mask_rectange
        */
        image::Image *mask_rectange(int x = -1, int y = -1, int w = -1, int h = -1);

        /**
         * @brief Zeros a circular part of the image. If no arguments are supplied this method zeros the center of the image.
         * @param x The x coordinate of the center of the circle.
         * @param y The y coordinate of the center of the circle.
         * @param radius The radius of the circle.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mask_circle
        */
        image::Image *mask_circle(int x = -1, int y = -1, int radius = -1);

        /**
         * @brief Zeros a ellipse part of the image. If no arguments are supplied this method zeros the center of the image.
         * @param x The x coordinate of the center of the ellipse.
         * @param y The y coordinate of the center of the ellipse.
         * @param radius_x The radius of the ellipse in the x direction.
         * @param radius_y The radius of the ellipse in the y direction.
         * @param rotation_angle_in_degrees The rotation angle of the ellipse in degrees.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mask_ellipse
        */
        image::Image *mask_ellipse(int x = -1, int y = -1, int radius_x = -1, int radius_y = -1, float rotation_angle_in_degrees = 0);

        /**
         * @brief Sets all pixels in the image to black or white depending on if the pixel is inside of a threshold in the threshold list thresholds or not.
         * @param thresholds You can define multiple thresholds.
         * For GRAYSCALE format, you can use {{Lmin, Lmax}, ...} to define one or more thresholds.
         * For RGB888 format, you can use {{Lmin, Lmax, Amin, Amax, Bmin, Bmax}, ...} to define one or more thresholds.
         * Where the upper case L,A,B represent the L,A,B channels of the LAB image format, and min, max represent the minimum and maximum values of the corresponding channels.
         * @param invert If true, the thresholds will be inverted before the operation. default is false.
         * @param zero If zero is true, the image will be set the pixels within the threshold to 0, other pixels remain unchanged. If zero is false, the image will be set to black or white. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @param to_bitmap If true, the image will be converted to a bitmap image before thresholding. default is false. TODO: support in the feature
         * @param copy Select whether to return a new image or modify the original image. default is false.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.binary
        */
        image::Image *binary(std::vector<std::vector<int>> thresholds = std::vector<std::vector<int>>(), bool invert = false, bool zero = false, image::Image *mask = nullptr, bool to_bitmap = false, bool copy = false);

        /**
         * @brief Inverts the image in place.
         * @return Returns the image after the operation is completed
         * @maixpy maix.image.Image.invert
        */
        image::Image *invert();

        /**
         * @brief Performs a bitwise and operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_and
        */
        image::Image *b_and(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs a bitwise nand operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_nand
        */
        image::Image *b_nand(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs a bitwise or operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_or
        */
        image::Image *b_or(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs a bitwise nor operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_nor
        */
        image::Image *b_nor(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs a bitwise xor operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_xor
        */
        image::Image *b_xor(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs a bitwise xnor operation between the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.        TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.b_xnor
        */
        image::Image *b_xnor(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Performs an auto white balance operation on the image. TODO: support in the feature
         * @param max  if True uses the white-patch algorithm instead. default is false.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.awb
        */
        image::Image *awb(bool max = false);

        /**
         * @brief Multiples the passed (3x3) or (4x3) floating-point color-correction-matrix with the image.
         * note: Grayscale format is not support.
         * @param matrix The color correction matrix to use. 3x3 or 4x3 matrix.
         * Weights may either be positive or negative, and the sum of each column in the 3x3 matrix should generally be 1.
         * example:
         * {
         *   1, 0, 0,
         *   0, 1, 0,
         *   0, 0, 1,
         * }
         *
         * Where the last row of the 4x3 matrix is an offset per color channel. If you add an offset you may wish to make the
         * weights sum to less than 1 to account for the offset.
         * example:
         * {
         *   1, 0, 0,
         *   0, 1, 0,
         *   0, 0, 1,
         *   0, 0, 0,
         * }
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.ccm
        */
        image::Image *ccm(std::vector<float> &matrix);

        /**
         * @brief Quickly changes the image gamma, contrast, and brightness. Create a array whose size is usually 255,
         * and use the parameters gamma, contrast, and brightness to calculate the value of the array, and then map the
         * image pixel value through the value of the array.
         * The calculation method for array is: array[array_idx] = (powf((array_idx / 255.0), (1 / gamma)) * contrast + brightness) * scale,
         * `powf` is a function used to calculate floating point power.
         * `array` is the array used for mapping.
         * `array_idx` is the index of the array, the maximum value is determined according to the image format, usually 255.
         * `scale` is a constant, the value is determined by the image format, usually 255.
         * Mapping method:
         *  Assume that a pixel value in the image is 128, then map the pixel value to the value of array[128]
         * Users can adjust the value of the array through the gamma, contrast, and brightness parameters.
         * @param gamma The contrast gamma greater than 1.0 makes the image darker in a non-linear manner while less than 1.0 makes the image brighter. default is 1.0.
         * @param contrast The contrast value greater than 1.0 makes the image brighter in a linear manner while less than 1.0 makes the image darker. default is 1.0.
         * @param brightness The brightness value greater than 0.0 makes the image brighter in a constant manner while less than 0.0 makes the image darker. default is 0.0.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.gamma
        */
        image::Image *gamma(double gamma = 1.0, double contrast = 1.0, double brightness = 0.0);

        /**
         * @brief Alias for Image.gamma.
         * @param gamma The contrast gamma greater than 1.0 makes the image darker in a non-linear manner while less than 1.0 makes the image brighter. default is 1.0.
         * @param contrast The contrast value greater than 1.0 makes the image brighter in a linear manner while less than 1.0 makes the image darker. default is 1.0.
         * @param brightness The brightness value greater than 0.0 makes the image brighter in a constant manner while less than 0.0 makes the image darker. default is 0.0.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.gamma_corr
        */
        image::Image *gamma_corr(double gamma, double contrast = 1.0, double brightness = 0.0);

        /**
         * @brief Flips (numerically inverts) all pixels values in an image
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.negate
        */
        image::Image *negate();

        /**
         * @brief Replaces all pixels in the image with the corresponding pixels in the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param hmirror If true, the image will be horizontally mirrored before the operation. default is false.
         * @param vflip If true, the image will be vertically flipped before the operation. default is false.
         * @param transpose If true, the image can be used to rotate 90 degrees or 270 degrees.
         * hmirror = false, vflip = false, transpose = false, the image will not be rotated.
         * hmirror = false, vflip = true, transpose = true, the image will be rotated 90 degrees.
         * hmirror = true, vflip = true, transpose = false, the image will be rotated 180 degrees.
         * hmirror = true, vflip = false, transpose = true, the image will be rotated 270 degrees.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.replace
        */
        image::Image *replace(image::Image *other = nullptr, bool hmirror = false, bool vflip = false, bool transpose = false, image::Image *mask = nullptr);

        /**
         * @brief Alias for Image::replace.
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param hmirror If true, the image will be horizontally mirrored before the operation. default is false.
         * @param vflip If true, the image will be vertically flipped before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.set
        */
        image::Image *set(image::Image *other, bool hmirror = false, bool vflip = false, bool transpose = false, image::Image *mask = nullptr);

        /**
         * @brief Adds the other image to the image.
         * @param other The other image should be an image and should be the same size as the image being operated on.    TODO: support path?
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.add
        */
        image::Image *add(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Subtracts the other image from the image.
         * @param other The other image should be an image and should be the same size as the image being operated on.    TODO: support path?
         * @param reverse If true, the image will be reversed before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.sub
        */
        image::Image *sub(image::Image *other, bool reverse = false, image::Image *mask = nullptr);

        /**
         * @brief Multiplies the image by the other image.
         * Note: This method is meant for image blending and cannot multiply the pixels in the image by a scalar like 2.
         * @param other The other image should be an image and should be the same size as the image being operated on.    TODO: support path?
         * @param invert If true, the image will be change the multiplication operation from a*b to 1/((1/a)*(1/b)).
         * In particular, this lightens the image instead of darkening it (e.g. multiply versus burn operations). default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mul
        */
        image::Image *mul(image::Image *other, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Divides the image by the other image.
         * This method is meant for image blending and cannot divide the pixels in the image by a scalar like 2.
         * @param other The other image should be an image and should be the same size as the image being operated on.    TODO: support path?
         * @param invert If true, the image will be change the division direction from a/b to b/a. default is false.
         * @param mod If true, the image will be change the division operation to the modulus operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.div
        */
        image::Image *div(image::Image *other, bool invert = false, bool mod = false, image::Image *mask = nullptr);

        /**
         * @brief Caculate the minimum of each pixel in the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.min
        */
        image::Image *min(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Caculate the maximum of each pixel in the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.max
        */
        image::Image *max(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Caculate the absolute value of the difference between each pixel in the image and the other image.
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.difference
        */
        image::Image *difference(image::Image *other, image::Image *mask = nullptr);

        /**
         * @brief Blends the image with the other image.
         * res = alpha * this_img / 256 + (256 - alpha) * other_img / 256
         * @param other The other image should be an image and should be the same size as the image being operated on.
         * @param alpha The alpha value of the blend, the value range is [0, 256],default is 128.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.blend
        */
        image::Image *blend(image::Image *other, int alpha = 128, image::Image *mask = nullptr);

        /**
         * @brief Runs the histogram equalization algorithm on the image.
         * @param adaptive If true, an adaptive histogram equalization method will be run on the image instead which as generally better results than non-adaptive histogram qualization but a longer run time. default is false.
         * @param clip_limit Provides a way to limit the contrast of the adaptive histogram qualization. Use a small value for this, like 10, to produce good histogram equalized contrast limited images. default is -1.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.histeq
        */
        image::Image *histeq(bool adaptive = false, int clip_limit = -1, image::Image *mask = nullptr);

        /**
         * @brief Standard mean blurring filter using a box filter.
         * The parameters offset and invert are valid when threshold is True.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mean
        */
        image::Image *mean(int size, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Runs the median filter on the image. The median filter is the best filter for smoothing surfaces while preserving edges but it is very slow.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param percentile This parameter controls the percentile of the value used in the kernel. You can set this to 0 for a min filter, 0.25 for a lower quartile filter, 0.75 for an upper quartile filter, and 1.0 for a max filter. default is 0.5.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.median
        */
        image::Image *median(int size, double percentile = 0.5, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Runs the mode filter on the image by replacing each pixel with the mode of their neighbors.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.mode
        */
        image::Image *mode(int size, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Runs the midpoint filter on the image.This filter finds the midpoint (max * bias + min * (1 - bias)) of each pixel neighborhood in the image.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param bias The bias of the midpoint. default is 0.5.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.midpoint
        */
        image::Image *midpoint(int size, double bias = 0.5, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Convolves the image by a filter kernel. This allows you to do general purpose convolutions on an image.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param kernel The kernel used for convolution. The kernel should be a list of lists of numbers. The kernel should be the same size as the actual kernel size.
         * @param mul This parameter is used to multiply the convolved pixel results. default is auto.
         * @param add This parameter is the value to be added to each convolution pixel result. default is 0.0.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.morph
        */
        image::Image *morph(int size, std::vector<int> kernel, float mul = -1, float add = 0.0, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Convolves the image by a smoothing guassian kernel.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param unsharp If true, this method will perform an unsharp mask operation instead of gaussian filtering operation, this improves the clarity of image edges. default is false.
         * @param mul This parameter is used to multiply the convolved pixel results. default is auto.
         * @param add This parameter is the value to be added to each convolution pixel result. default is 0.0.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.gaussian
        */
        image::Image *gaussian(int size, bool unsharp = false, float mul = -1, float add = 0.0, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Convolves the image by a edge detecting laplacian kernel.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param sharpen If True, this method will sharpen the image instead of an unthresholded edge detection image. Then increase the kernel size to improve image clarity. default is false.
         * @param mul This parameter is used to multiply the convolved pixel results. default is auto.
         * @param add This parameter is the value to be added to each convolution pixel result. default is 0.0.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.laplacian
        */
        image::Image *laplacian(int size, bool sharpen = false, float mul = -1, float add = 0.0, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Convolves the image by a bilateral filter.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param color_sigma Controls how closely colors are matched using the bilateral filter. default is 0.1.
         * @param space_sigma Controls how closely pixels space-wise are blurred with each other. default is 1.
         * @param threshold If true, which will enable adaptive thresholding of the image which sets pixels to white or black based on a pixel’s brightness in relation to the brightness of the kernel of pixels around them.
         * default is false.
         * @param offset The larger the offset value, the lower brightness pixels on the original image will be set to white. default is 0.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.bilateral
        */
        image::Image *bilateral(int size, double color_sigma = 0.1, double space_sigma = 1, bool threshold = false, int offset = 0, bool invert = false, image::Image *mask = nullptr);

        /**
         * @brief Re-project’s and image from cartessian coordinates to linear polar coordinates.
         * @param reverse If true, the image will be reverse polar transformed. default is false.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.linpolar
        */
        image::Image *linpolar(bool reverse = false);

        /**
         * @brief Re-project’s and image from cartessian coordinates to log polar coordinates.
         * @param reverse If true, the image will be reverse polar transformed. default is false.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.logpolar
        */
        image::Image *logpolar(bool reverse = false);

        /**
         * @brief Performs a lens correction operation on the image. TODO: support in the feature
         * @param strength The strength of the lens correction. default is 1.8.
         * @param zoom The zoom of the lens correction. default is 1.0.
         * @param x_corr The x correction of the lens correction. default is 0.0.
         * @param y_corr The y correction of the lens correction. default is 0.0.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.lens_corr
        */
        image::Image *lens_corr(double strength = 1.8, double zoom = 1.0, double x_corr = 0.0, double y_corr = 0.0);

        /**
         * @brief Performs a rotation correction operation on the image. TODO: support in the feature
         * @param x_rotation The x rotation of the rotation correction. default is 0.0.
         * @param y_rotation The y rotation of the rotation correction. default is 0.0.
         * @param z_rotation The z rotation of the rotation correction. default is 0.0.
         * @param x_translation The x translation of the rotation correction. default is 0.0.
         * @param y_translation The y translation of the rotation correction. default is 0.0.
         * @param zoom The zoom of the rotation correction. default is 1.0.
         * @param fov The fov of the rotation correction. default is 60.0.
         * @param corners The corners of the rotation correction. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.rotation_corr
        */
        image::Image *rotation_corr(double x_rotation = 0.0, double y_rotation = 0.0, double z_rotation = 0.0, double x_translation = 0.0, double y_translation = 0.0, double zoom = 1.0, double fov = 60.0, std::vector<float> corners = std::vector<float>());

        /**
         * @brief Gets the histogram of the image.
         * @param thresholds You can define multiple thresholds.
         * For GRAYSCALE format, you can use {{Lmin, Lmax}, ...} to define one or more thresholds.
         * For RGB888 format, you can use {{Lmin, Lmax, Amin, Amax, Bmin, Bmax}, ...} to define one or more thresholds.
         * Where the upper case L,A,B represent the L,A,B channels of the LAB image format, and min, max represent the minimum and maximum values of the corresponding channels.
         * @param invert If true, the thresholds will be inverted before the operation. default is false.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param bins The number of bins to use for the histogram.
         * In GRAYSCALE format, setting range is [2, 256], default is 100.
         * In rgb888 format, setting range is [2, 100], default is 100.
         * @param l_bins The number of bins to use for the l channel of the histogram. Only valid in RGB888 format.
         * If an invalid value is set, bins will be used instead. The setting range is [2, 100], default is 100.
         * @param a_bins The number of bins to use for the a channel of the histogram.
         * Only valid in RGB888 format.The setting range is [2, 256],  default is 256.
         * @param b_bins The number of bins to use for the b channel of the histogram.
         * Only valid in RGB888 format. The setting range is [2, 256], default is 256.
         * @param difference difference may be set to an image object to cause this method to operate on the difference image between the current image and the difference image object.
         * default is None.
         * @return Returns the histogram of the image
         * @maixpy maix.image.Image.get_histogram
        */
        std::map<std::string, std::vector<float>> get_histogram(std::vector<std::vector<int>> thresholds = std::vector<std::vector<int>>(), bool invert = false, std::vector<int> roi = std::vector<int>(), int bins = -1, int l_bins = 100, int a_bins = 256, int b_bins = 256, image::Image *difference = nullptr);

        /**
         * @brief Gets the statistics of the image. TODO: support in the feature
         * @param thresholds You can define multiple thresholds.
         * For GRAYSCALE format, you can use {{Lmin, Lmax}, ...} to define one or more thresholds.
         * For RGB888 format, you can use {{Lmin, Lmax, Amin, Amax, Bmin, Bmax}, ...} to define one or more thresholds.
         * Where the upper case L,A,B represent the L,A,B channels of the LAB image format, and min, max represent the minimum and maximum values of the corresponding channels.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param bins The number of bins to use for the statistics. default is -1.
         * @param l_bins The number of bins to use for the l channel of the statistics. default is -1.
         * @param a_bins The number of bins to use for the a channel of the statistics. default is -1.
         * @param b_bins The number of bins to use for the b channel of the statistics. default is -1.
         * @param difference The difference image to use for the statistics. default is None.
         * @return Returns the statistics of the image
         * @maixpy maix.image.Image.get_statistics
        */
        image::Statistics get_statistics(std::vector<std::vector<int>> thresholds = std::vector<std::vector<int>>(), bool invert = false, std::vector<int> roi = std::vector<int>(), int bins = -1, int l_bins = -1, int a_bins = -1, int b_bins = -1, image::Image *difference = nullptr);

        /**
         * @brief Gets the regression of the image.
         * @param thresholds You can define multiple thresholds.
         * For GRAYSCALE format, you can use {{Lmin, Lmax}, ...} to define one or more thresholds.
         * For RGB888 format, you can use {{Lmin, Lmax, Amin, Amax, Bmin, Bmax}, ...} to define one or more thresholds.
         * Where the upper case L,A,B represent the L,A,B channels of the LAB image format, and min, max represent the minimum and maximum values of the corresponding channels.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param x_stride The x stride to use for the regression. default is 2.
         * @param y_stride The y stride to use for the regression. default is 1.
         * @param area_threshold The area threshold to use for the regression. default is 10.
         * @param pixels_threshold The pixels threshold to use for the regression. default is 10.
         * @param robust If true, the regression will be robust. default is false.
         * @return Returns the regression of the image
         * @maixpy maix.image.Image.get_regression
        */
        std::vector<image::Line> get_regression(std::vector<std::vector<int>> thresholds = std::vector<std::vector<int>>(), bool invert = false, std::vector<int> roi = std::vector<int>(), int x_stride = 2, int y_stride = 1, int area_threshold = 10, int pixels_threshold = 10, bool robust = false);

        //************************** image with filesystem **************************//
        /**
         * Save image to file
         * @param path file path
         * @param quality image quality, by default(value is 95), support jpeg and png format
         * @return error code, err::ERR_NONE is ok, other is error
         * @maixpy maix.image.Image.save
         */
        err::Err save(const char *path, int quality = 95);

        //************************** application algorithms **************************//
        /**
         * @brief Flood fills a region of the image starting from location x, y.
         * @param x The x coordinate of the seed point.
         * @param y The y coordinate of the seed point.
         * @param seed_threshold The seed_threshold value controls how different any pixel in the fill area may be from the original starting pixel. default is 0.05.
         * @param floating_threshold The floating_threshold value controls how different any pixel in the fill area may be from any neighbor pixels. default is 0.05.
         * @param color The color to fill the region with. default is white.
         * @param invert If true, the image will be inverted before the operation. default is false.
         * @param clear_background If true, the background will be cleared before the operation. default is false.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None. FIXME: the mask image works abnormally
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.flood_fill
        */
        image::Image *flood_fill(int x, int y, float seed_threshold = 0.05, float floating_threshold = 0.05, image::Color color = image::COLOR_WHITE, bool invert = false, bool clear_background = false, image::Image *mask = nullptr);

        /**
         * @brief Erodes the image in place.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold The number of pixels in the kernel that are not 0. If it is less than or equal to the threshold, set the center pixel to black. default is (kernel_size - 1).
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.erode
        */
        image::Image *erode(int size, int threshold = -1, image::Image *mask = nullptr);

        /**
         * @brief Dilates the image in place.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold The number of pixels in the kernel that are not 0. If it is greater than or equal to the threshold, set the center pixel to white. default is 0.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.dilate
        */
        image::Image *dilate(int size, int threshold = 0, image::Image *mask = nullptr);

        /**
         * @brief Performs erosion and dilation on an image in order.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold As the threshold for erosion and dilation, the actual threshold for erosion is (kernel_size - 1 - threshold), the actual threshold for dialation is threshold. default is 0.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.open
        */
        image::Image *open(int size, int threshold = 0, image::Image *mask = nullptr);

        /**
         * @brief Performs dilation and erosion on an image in order.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold As the threshold for erosion and dilation, the actual threshold for erosion is (kernel_size - 1 - threshold), the actual threshold for dialation is threshold. default is 0.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.close
        */
        image::Image *close(int size, int threshold = 0, image::Image *mask = nullptr);

        /**
         * @brief Returns the image difference of the image and Image.open()’ed image.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold As the threshold for open method. default is 0.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.top_hat
        */
        image::Image *top_hat(int size, int threshold = 0, image::Image *mask = nullptr);

        /**
         * @brief Returns the image difference of the image and Image.close()’ed image.
         * @param size Kernel size. The actual kernel size is ((size * 2) + 1) * ((size * 2) + 1). Use 1(3x3 kernel), 2(5x5 kernel).
         * @param threshold As the threshold for close method. default is 0.
         * @param mask Mask is another image to use as a pixel level mask for the operation. The mask should be an image with just black or white pixels and should be the same size as the image being operated on.
         * Only pixels set in the mask are modified. default is None.
         * @return Returns the image after the operation is completed.
         * @maixpy maix.image.Image.black_hat
        */
        image::Image *black_hat(int size, int threshold = 0, image::Image *mask = nullptr);

        /**
         * Finds all blobs in the image and returns a list of image.Blob class which describe each Blob.
         * Please see the image.Blob object more more information.
         *
         * @param thresholds You can define multiple thresholds.
         * For GRAYSCALE format, you can use {{Lmin, Lmax}, ...} to define one or more thresholds.
         * For RGB888 format, you can use {{Lmin, Lmax, Amin, Amax, Bmin, Bmax}, ...} to define one or more thresholds.
         * Where the upper case L,A,B represent the L,A,B channels of the LAB image format, and min, max represent the minimum and maximum values of the corresponding channels.
         * @param invert if true, will invert thresholds before find blobs, default is false
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param x_stride x stride is the number of x pixels to skip when doing the hough transform. default is 2
         * @param y_stride y_stride is the number of y pixels to skip when doing the hough transform. default is 1
         * @param area_threshold area threshold, if the blob area is smaller than area_threshold, the blob is not returned, default is 10
         * @param pixels_threshold pixels threshold, if the blob pixels is smaller than area_threshold, the blob is not returned,, default is 10.
         * when x_stride and y_stride is equal to 1, pixels_threshold is equivalent to area_threshold
         * @param merge if True merges all not filtered out blobs whos bounding rectangles intersect each other. default is false
         * @param margin margin can be used to increase or decrease the size of the bounding rectangles for blobs during the intersection test.
         * For example, with a margin of 1 blobs whos bounding rectangles are 1 pixel away from each other will be merged. default is 0
         * @param x_hist_bins_max if set to non-zero populates a histogram buffer in each blob object with an x_histogram projection of all columns in the object. This value then sets the number of bins for that projection.
         * @param y_hist_bins_max if set to non-zero populates a histogram buffer in each blob object with an y_histogram projection of all rows in the object. This value then sets the number of bins for that projection.
         *
         * @return Return the blob when found blobs, format is (blob1, blob2, ...), you can use blob class methods to do more operations.
         * @maixpy maix.image.Image.find_blobs
         */
        std::vector<image::Blob> find_blobs(std::vector<std::vector<int>> thresholds = std::vector<std::vector<int>>(), bool invert = false, std::vector<int> roi = std::vector<int>(), int x_stride = 2, int y_stride = 1, int area_threshold = 10, int pixels_threshold = 10, bool merge = false, int margin = 0, int x_hist_bins_max = 0, int y_hist_bins_max = 0);

        /**
         * Find lines in image
         *
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param x_stride x stride is the number of x pixels to skip when doing the hough transform. default is 2
         * @param y_stride y_stride is the number of y pixels to skip when doing the hough transform. default is 1
         * @param threshold threshold threshold controls what lines are detected from the hough transform. Only lines with a magnitude greater than or equal to threshold are returned.
         * The right value of threshold for your application is image dependent. default is 1000.
         * @param theta_margin theta_margin controls the merging of detected lines. default is 25.
         * @param rho_margin rho_margin controls the merging of detected lines. default is 25.
         *
         * @return Return the line when found lines, format is (line1, line2, ...), you can use line class methods to do more operations
         * @maixpy maix.image.Image.find_lines
         */
        std::vector<image::Line> find_lines(std::vector<int> roi = std::vector<int>(), int x_stride = 2, int y_stride = 1, double threshold = 1000, double theta_margin = 25, double rho_margin = 25);

        /**
         * @brief Finds all line segments in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param merge_distance The maximum distance between two lines to merge them. default is 0.
         * @param max_theta_difference The maximum difference between two lines to merge them. default is 15.
         * @return Return the line when found lines, format is (line1, line2, ...), you can use line class methods to do more operations
         * @maixpy maix.image.Image.find_line_segments
        */
        std::vector<image::Line> find_line_segments(std::vector<int> roi = std::vector<int>(), int merge_distance = 0, int max_theta_difference = 15);

        /**
         * Find circles in image
         *
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param x_stride x stride is the number of x pixels to skip when doing the hough transform. default is 2
         * @param y_stride y_stride is the number of y pixels to skip when doing the hough transform. default is 1
         * @param threshold threshold controls what circles are detected from the hough transform. Only circles with a magnitude greater than or equal to threshold are returned.
         * The right value of threshold for your application is image dependent.
         * @param x_margin x_margin controls the merging of detected circles. Circles which are x_margin, y_margin, and r_margin pixels apart are merged. default is 10
         * @param y_margin y_margin controls the merging of detected circles. Circles which are x_margin, y_margin, and r_margin pixels apart are merged. default is 10
         * @param r_margin r_margin controls the merging of detected circles. Circles which are x_margin, y_margin, and r_margin pixels apart are merged. default is 10
         * @param r_min r_min controls the minimum circle radius detected. Increase this to speed up the algorithm. default is 2
         * @param r_max r_max controls the maximum circle radius detected. Decrease this to speed up the algorithm. default is min(roi.w / 2, roi.h / 2)
         * @param r_step r_step controls how to step the radius detection by. default is 2.
         *
         * @return Return the circle when found circles, format is (circle1, circle2, ...), you can use circle class methods to do more operations
         * @maixpy maix.image.Image.find_circles
         */
        std::vector<image::Circle> find_circles(std::vector<int> roi = std::vector<int>(), int x_stride = 2, int y_stride = 1, int threshold = 2000, int x_margin = 10, int y_margin = 10, int r_margin = 10, int r_min = 2, int r_max = -1, int r_step = 2);

        /**
         * @brief Finds all rects in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param threshold The threshold to use for the rects. default is 10000.
         * @return Returns the rects of the image
         * @maixpy maix.image.Image.find_rects
        */
        std::vector<image::Rect> find_rects(std::vector<int> roi = std::vector<int>(), int threshold = 10000);

        /**
         * @brief Finds all qrcodes in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @return Returns the qrcodes of the image
         * @maixpy maix.image.Image.find_qrcodes
        */
        std::vector<image::QRCode> find_qrcodes(std::vector<int> roi = std::vector<int>());

        /**
         * @brief Finds all apriltags in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param families The families to use for the apriltags. default is TAG36H11.
         * @param fx The camera X focal length in pixels, default is -1.
         * @param fy The camera Y focal length in pixels, default is -1.
         * @param cx The camera X center in pixels, default is image.width / 2.
         * @param cy The camera Y center in pixels, default is image.height / 2.
         * @return Returns the apriltags of the image
         * @maixpy maix.image.Image.find_apriltags
        */
        std::vector<image::AprilTag> find_apriltags(std::vector<int> roi = std::vector<int>(), image::ApriltagFamilies families = image::ApriltagFamilies::TAG36H11, float fx = -1, float fy = -1, int cx = -1, int cy = -1);

        /**
         * @brief Finds all datamatrices in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param effort Controls how much time to spend trying to find data matrix matches. default is 200.
         * @return Returns the datamatrices of the image
         * @maixpy maix.image.Image.find_datamatrices
        */
        std::vector<image::DataMatrix> find_datamatrices(std::vector<int> roi = std::vector<int>(), int effort = 200);

        /**
         * @brief Finds all barcodes in the image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @return Returns the barcodes of the image
         * @maixpy maix.image.Image.find_barcodes
        */
        std::vector<image::BarCode> find_barcodes(std::vector<int> roi = std::vector<int>());

        /**
         * @brief Finds the displacement between the image and the template.    TODO: support in the feature
         * note: this method must be used on power-of-2 image sizes
         * @param template_image The template image.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param template_roi The region-of-interest rectangle (x, y, w, h) to work in. If not specified, it is equal to the image rectangle.
         * @param logpolar If true, it will instead find rotation and scale changes between the two images. default is false.
         * @return Returns the displacement of the image
         * @maixpy maix.image.Image.find_displacement
        */
        image::Displacement find_displacement(image::Image &template_image, std::vector<int> roi = std::vector<int>(), std::vector<int> template_roi = std::vector<int>(), bool logpolar = false);

        /**
         * @brief Finds the template in the image.
         * @param template_image The template image.
         * @param threshold Threshold is floating point number (0.0-1.0) where a higher threshold prevents false positives while lowering the detection rate while a lower threshold does the opposite.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image. Only valid in SEARCH_EX mode.
         * @param step The step size to use for the template. default is 2. Only valid in SEARCH_EX mode
         * @param search The search method to use for the template. default is SEARCH_EX.
         * @return Returns a bounding box tuple (x, y, w, h) for the matching location otherwise None.
         * @maixpy maix.image.Image.find_template
        */
        std::vector<int> find_template(image::Image &template_image, float threshold, std::vector<int> roi = std::vector<int>(), int step = 2, image::TemplateMatch search = image::TemplateMatch::SEARCH_EX);

        /**
         * @brief Finds the features in the image.  TODO: support in the feature
         * @param cascade The cascade to use for the features. default is CASCADE_FRONTALFACE_ALT.
         * @param threshold The threshold to use for the features. default is 0.5.
         * @param scale The scale to use for the features. default is 1.5.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @return Returns the features of the image
         * @maixpy maix.image.Image.find_features
        */
        std::vector<int> find_features(int cascade, float threshold = 0.5, float scale = 1.5, std::vector<int> roi = std::vector<int>());

        /**
         * @brief Finds the lbp in the image. TODO: support in the feature.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @return Returns the lbp of the image
         * @maixpy maix.image.Image.find_lbp
        */
        image::LBPKeyPoint find_lbp(std::vector<int> roi = std::vector<int>());

        /**
         * @brief Finds the keypoints in the image. TODO: support in the feature.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param threshold The threshold to use for the keypoints. default is 20.
         * @param normalized If true, the image will be normalized before the operation. default is false.
         * @param scale_factor The scale factor to use for the keypoints. default is 1.5.
         * @param max_keypoints The maximum number of keypoints to use for the keypoints. default is 100.
         * @param corner_detector The corner detector to use for the keypoints. default is CORNER_AGAST.
         * @return Returns the keypoints of the image
         * @maixpy maix.image.Image.find_keypoints
        */
        image::ORBKeyPoint find_keypoints(std::vector<int> roi = std::vector<int>(), int threshold = 20, bool normalized = false, float scale_factor = 1.5, int max_keypoints = 100, image::CornerDetector corner_detector = image::CornerDetector::CORNER_AGAST);

        /**
         * @brief Finds the edges in the image.
         * @param edge_type The edge type to use for the edges. default is EDGE_CANNY.
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param threshold The threshold to use for the edges. default is 20.
         * @return Returns the edges of the image
         * @maixpy maix.image.Image.find_edges
        */
        image::Image* find_edges(image::EdgeDetector edge_type, std::vector<int> roi = std::vector<int>(), std::vector<int> threshold = std::vector<int>({100, 200}));

        /**
         * @brief Finds the hog in the image.   TODO: support in the feature
         * @param roi The region of interest, input in the format of (x, y, w, h), x and y are the coordinates of the upper left corner, w and h are the width and height of roi.
         * default is None, means whole image.
         * @param size The size to use for the hog. default is 8.
         * @return Returns the hog of the image
         * @maixpy maix.image.Image.find_hog
        */
        image::Image* find_hog(std::vector<int> roi = std::vector<int>(), int size = 8);

        /**
         * @brief Matches the lbp descriptor of the image.  TODO: support in the feature
         * @param desc1 The descriptor to use for the match.
         * @param desc2 The descriptor to use for the match.
         * @return Returns the match of the image
         * @maixpy maix.image.Image.match_lbp_descriptor
        */
        int match_lbp_descriptor(image::LBPKeyPoint &desc1, image::LBPKeyPoint &desc2);

        /**
         * @brief Matches the orb descriptor of the image. TODO: support in the feature
         * @param desc1 The descriptor to use for the match.
         * @param desc2 The descriptor to use for the match.
         * @param threshold The threshold to use for the match. default is 95.
         * @param filter_outliers If true, the image will be filter_outliers before the operation. default is false.
         * @return Returns the match of the image
         * @maixpy maix.image.Image.match_orb_descriptor
        */
        image::KPTMatch match_orb_descriptor(image::ORBKeyPoint &desc1, image::ORBKeyPoint &desc2, int threshold = 95, bool filter_outliers = false);

        /**
         * map point position or rectangle position from this image size to another image size(resize)
         * @param int w_out target image width
         * @param int h_out target image height
         * @param fit resize method, see maix.image.Fit
         * @param x original point x, or rectagle left-top point's x
         * @param y original point y, or rectagle left-top point's y
         * @param w original rectagle width, can be -1 if not use this arg, default -1.
         * @param h original rectagle height, can be -1 if not use this arg, default -1.
         * @return list type, [x, y] if map point, [x, y, w, h] if resize rectangle.
         * @maixpy maix.image.resize_map_pos
        */
        std::vector<int> resize_map_pos(int w_out, int h_out, image::Fit fit, int x, int y, int w = -1, int h = -1)
        {
            return image::resize_map_pos(_width, _height, w_out, h_out, fit, x, y, w, h);
        }

    private:
        void *_actual_data;
        void *_data;
        int _width;
        int _height;
        int _data_size;
        Format _format;
        bool _is_malloc;

        int _get_cv_pixel_num(image::Format &format);
        std::vector<int> _get_available_roi(std::vector<int> roi, std::vector<int> other_roi = std::vector<int>());
        void _create_image(int width, int height, image::Format format, uint8_t *data, int data_size, bool copy);
    }; // class Image

    /**
     * Load image from file, and convert to Image object
     * @param path image file path
     * @param format read as this format, if not match, will convert to this format, by default is RGB888
     * @return Image object, if load failed, will return None(nullptr in C++), so you should care about it.
     * @maixpy maix.image.load
     */
    image::Image *load(const char *path, image::Format format = image::Format::FMT_RGB888);

    /**
     * Create image from bytes
     * @param width image width
     * @param height image height
     * @param format image format
     * @param data image data, if data is None, will malloc memory for image data
     * If the image is in jpeg format, data must be filled in.
     * @param copy if true and data is not None, will copy data to new buffer, else will use data directly. default is true to avoid memory leak.
     *             Use it carefully!!!
     * @return Image object
     * @maixpy maix.image.from_bytes
    */
    image::Image *from_bytes(int width, int height, image::Format format, Bytes *data, bool copy = true);

    /**
     * Load font from file
     * @param name font name, used to identify font
     * @param path font file path, support ttf, ttc, otf
     * @param size font size, font height, by default is 16
     * @return error code, err::ERR_NONE is ok, other is error
     * @maixpy maix.image.load_font
     */
    err::Err load_font(const std::string &name, const char *path, int size = 16);

    /**
     * Set default font, if not call this method, default is hershey_plain
     * @param name font name, supported names can be get by fonts()
     * @return error code, err::ERR_NONE is ok, other is error
     * @maixpy maix.image.set_default_font
     */
    err::Err set_default_font(const std::string &name);

    /**
     * Get all loaded fonts
     * @return all loaded fonts, string list type
     * @maixpy maix.image.fonts
     */
    std::vector<std::string> *fonts();

    /**
     * Get text rendered width and height
     * @param string text content
     * @param scale font scale, by default(value is 1)
     * @param thickness text thickness(line width), by default(value is 1)
     * @return text rendered width and height, [width, height]
     * @maixpy maix.image.string_size
     */
    image::Size string_size(std::string string, float scale = 1, int thickness = 1, const std::string &font = "");
} // namespace maix::image
