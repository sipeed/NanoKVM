/**
 * @author lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#include "maix_image.hpp"
#include "maix_image_util.hpp"
#include "maix_err.hpp"
#include <omv.hpp>
#include <opencv2/opencv.hpp>

namespace maix::image {
    void convert_to_imlib_image(image::Image *image, image_t *imlib_image) {
        if (!image || !imlib_image) {
            return;
        }

        pixformat_t imlib_format;
        switch (image->format()) {
        case Format::FMT_GRAYSCALE:
            imlib_format = PIXFORMAT_GRAYSCALE;
            break;
        case Format::FMT_RGB565:
            imlib_format = PIXFORMAT_RGB565;
            break;
        case Format::FMT_BGR888:    // fall through
        case Format::FMT_RGB888:
            imlib_format = PIXFORMAT_RGB888;
            break;
        default:
            log::error("convert_to_imlib_image format not support: %d", image->format());
            return;
        }

        image_init(imlib_image, image->width(), image->height(), imlib_format, image->data_size(), image->data());
    }

    image::Image *Image::mean_pool(int x_div, int y_div, bool copy) {
        err::check_bool_raise(x_div > 0 && x_div <= _width && y_div > 0 && y_div <= _height, "mean pool get invalid param");

        image_t src_img, out_img;
        uint8_t *buffer = NULL;
        convert_to_imlib_image(this, &src_img);

        out_img.w = src_img.w / x_div;
        out_img.h = src_img.h / y_div;
        out_img.pixfmt = src_img.pixfmt;
        if (copy) {
            buffer = (uint8_t *)malloc(out_img.w * out_img.h * image::fmt_size[_format]);
            if (!buffer) {
                log::error("mean pool malloc failed\r\n");
                return nullptr;
            }
            out_img.pixels = buffer;
        } else {
            out_img.pixels = src_img.pixels;
        }

        imlib_mean_pool(&src_img, &out_img, x_div, y_div);

        if (copy) {
            image::Image *dst = new image::Image(out_img.w, out_img.h, _format, out_img.pixels, -1, true);
        return dst;
        } else {
            _width = out_img.w;
            _height = out_img.h;
        }
        return this;
    }

    image::Image *Image::midpoint_pool(int x_div, int y_div, double bias, bool copy) {
        if (x_div <= 0 || x_div > _width || y_div <= 0 || y_div > _height) {
            log::warn("midpoint pool invalid div: %d, %d", x_div, y_div);
            return nullptr;
        }

        if (!(_format == Format::FMT_RGB888 || _format == Format::FMT_BGR888 || _format == Format::FMT_GRAYSCALE)) {
            log::warn("midpoint pool not support format: %d", _format);
            return nullptr;
        }

        image::Image *dst;
        int _dst_width = _width / x_div;
        int _dst_height = _height / y_div;
        if (copy) {
            dst = new image::Image(_dst_width, _dst_height, _format);
        } else {
            dst = this;
        }

        bias *= 256;
        int min_bias = 256 - bias;
        int max_bias = bias;

        switch (_format) {
        case Format::FMT_GRAYSCALE:
            for (int y = 0, yy = _dst_height, yyy = (_height % y_div) / 2; y < yy; y++) {
                for (int x = 0, xx = _dst_width, xxx = (_width % x_div) / 2; x < xx; x++) {
                    int min = 255, max = 0;
                    uint8_t *src_data = (uint8_t *)_data;
                    uint8_t *dst_data = (uint8_t *)dst->data();
                    for (int i = 0; i < y_div; i++) {
                        for (int j = 0; j < x_div; j++) {
                            int pixel = src_data[(yyy + (y * y_div) + i) * _width + (xxx + (x * x_div) + j)];
                            min = std::min(min, pixel);
                            max = std::max(max, pixel);
                        }
                    }
                    dst_data[y * _dst_width + x] = (min_bias * min + max_bias * max) >> 8;
                }
            }
            break;
        case Format::FMT_RGB888: // fall through
        case Format::FMT_BGR888:
            for (int y = 0, yy = _dst_height, yyy = (_height % y_div) / 2; y < yy; y++) {
                for (int x = 0, xx = _dst_width, xxx = (_width % x_div) / 2; x < xx; x++) {
                    int v0_min = 255, v0_max = 0;
                    int v1_min = 255, v1_max = 0;
                    int v2_min = 255, v2_max = 0;
                    uint8_t *src_data = (uint8_t *)_data;
                    uint8_t *dst_data = (uint8_t *)dst->data();
                    for (int i = 0; i < y_div; i++) {
                        for (int j = 0; j < x_div; j++) {
                            int v0 = src_data[((yyy + (y * y_div) + i) * _width + (xxx + (x * x_div) + j)) * 3];
                            int v1 = src_data[((yyy + (y * y_div) + i) * _width + (xxx + (x * x_div) + j)) * 3 + 1];
                            int v2 = src_data[((yyy + (y * y_div) + i) * _width + (xxx + (x * x_div) + j)) * 3 + 2];
                            v0_min = std::min(v0_min, v0);
                            v0_max = std::max(v0_max, v0);
                            v1_min = std::min(v1_min, v1);
                            v1_max = std::max(v1_max, v1);
                            v2_min = std::min(v2_min, v2);
                            v2_max = std::max(v2_max, v2);
                        }
                    }

                    dst_data[(y * _dst_width + x) * 3] = ((v0_min * min_bias) + (v0_max * max_bias)) >> 8;
                    dst_data[(y * _dst_width + x) * 3 + 1] =((v1_min * min_bias) + (v1_max * max_bias)) >> 8;
                    dst_data[(y * _dst_width + x) * 3 + 2] = ((v2_min * min_bias) + (v2_max * max_bias)) >> 8;
                }
            }
        break;
        default:
            // should not be here
        break;
        }

        if (!copy) {
            _width = _dst_width;
            _height = _dst_height;
        }
        return dst;
    }

    image::Image *Image::compress(int quality) {
        return to_jpeg(quality);
    }

    err::Err image_zero(image::Image &src, image::Image &mask, bool invert) {
        image_t src_img, mask_img;
        convert_to_imlib_image(&src, &src_img);
        convert_to_imlib_image(&mask, &mask_img);
        imlib_zero(&src_img, &mask_img, invert);

        return err::Err::ERR_NONE;
    }

    image::Image *Image::clear(image::Image *mask) {
        if (!mask) {
            memset(_data, 0, _data_size);
        } else {
            image_zero(*this, *mask, false);
        }

        return this;
    }

    image::Image *Image::mask_rectange(int x, int y, int w, int h) {
        int use_default_setting = 0;
        if (x < 0 || y < 0 || w < 0 || h < 0) {
            use_default_setting = 1;
        }

        if (use_default_setting) {
            x = _width / 4;
            y = _height / 4;
            w = _width / 2;
            h = _height / 2;
        }

        draw_rect(x, y, w, h, image::COLOR_BLACK, -1);
        return this;
    }

    image::Image *Image::mask_circle(int x, int y, int radius) {
        int use_default_setting = 0;
        if (x < 0 || y < 0 || radius < 0) {
            use_default_setting = 1;
        }

        if (use_default_setting) {
            x = _width / 2;
            y = _height / 2;
            radius = std::min(_width, _height) / 2;
        }

        draw_circle(x, y, radius, image::COLOR_BLACK, -1);
        return this;
    }

    image::Image *Image::mask_ellipse(int x, int y, int radius_x, int radius_y, float rotation_angle_in_degrees) {
        int use_default_setting = 0;
        if (x < 0 || y < 0 || radius_x < 0 || radius_y < 0) {
            use_default_setting = 1;
        }

        if (use_default_setting) {
            x = _width / 2;
            y = _height / 2;
            radius_x = _width / 2;
            radius_y = _height / 2;
            rotation_angle_in_degrees = 0;
        }

        draw_ellipse(x, y, radius_x, radius_y, rotation_angle_in_degrees, 0, 360, image::COLOR_BLACK, -1);
        return this;
    }

    image::Image *Image::binary(std::vector<std::vector<int>> thresholds, bool invert, bool zero, image::Image *mask, bool to_bitmap, bool copy) {
        err::check_bool_raise(thresholds.size() != 0, "You need to set thresholds");
        err::check_bool_raise(to_bitmap == false, "Parameter to_bitmap is not supported");

        list_t thresholds_list;
        list_init(&thresholds_list, sizeof(color_thresholds_list_lnk_data_t));
        _convert_to_lab_thresholds(thresholds, &thresholds_list);

        image_t src_img, mask_img, out_img;
        image::Image *dst = nullptr;
        if (copy) {
            dst = new image::Image(_width, _height, _format);
        } else {
            dst = this;
        }

        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(dst, &out_img);
        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
        }

        imlib_binary(&out_img, &src_img, &thresholds_list, invert, zero, mask ? &mask_img : NULL);
        list_free(&thresholds_list);

        return dst;
    }

    image::Image *Image::invert() {
        int remain_len = _data_size % 4;
        int u32_len = (_data_size - remain_len) >> 2;
        uint8_t *remain_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
        uint32_t *u32_data = (uint32_t *)_data;
        for (int i = 0; i < u32_len; i ++) {
            u32_data[i] = ~u32_data[i];
        }

        for (int i = 0; i < remain_len; i ++) {
            remain_data[i] = ~remain_data[i];
        }

        return this;
    }

    image::Image *Image::b_and(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_and(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] & u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] & remain_other_data[i];
            }
        }

        return this;
    }

    image::Image *Image::b_nand(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_nand(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] & ~u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] & ~remain_other_data[i];
            }
        }

        return this;
    }

    image::Image *Image::b_or(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_or(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] | u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] | remain_other_data[i];
            }
        }


        return this;
    }

    image::Image *Image::b_nor(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_nor(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] | ~u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] | ~remain_other_data[i];
            }
        }


        return this;
    }

    image::Image *Image::b_xor(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_xor(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] ^ u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] ^ remain_other_data[i];
            }
        }

        return this;
    }

    image::Image *Image::b_xnor(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;

        err::check_bool_raise(other != NULL && other->data() != NULL, "Other image is null");
        err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
        err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");

        if (mask) {
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);
            err::check_bool_raise(_width == mask->width() && _height == mask->height(), "Mask image size is not match source image");
            convert_to_imlib_image(mask, &mask_img);
            imlib_b_xnor(&src_img, NULL, other ? &other_img : NULL, 0, mask ? &mask_img : NULL);
        } else {
            int remain_len = _data_size % 4;
            int u32_len = (_data_size - remain_len) >> 2;
            uint8_t *remain_src_data = (uint8_t *)((uint8_t *)_data + (u32_len << 2));
            uint32_t *u32_src_data = (uint32_t *)_data;
            uint8_t *remain_other_data = (uint8_t *)((uint8_t *)other->data() + (u32_len << 2));
            uint32_t *u32_other_data = (uint32_t *)other->data();
            for (int i = 0; i < u32_len; i ++) {
                u32_src_data[i] = u32_src_data[i] ^ ~u32_other_data[i];
            }

            for (int i = 0; i < remain_len; i ++) {
                remain_src_data[i] = remain_src_data[i] ^ ~remain_other_data[i];
            }
        }

        return this;
    }

    image::Image *Image::awb(bool max) {
        image_t src_img;
        Image *rgb565_img = nullptr;
        if (_format == image::FMT_RGB888 || _format == image::FMT_BGR888) {
            rgb565_img = to_format(image::FMT_RGB565);
            convert_to_imlib_image(rgb565_img, &src_img);
        } else {
            log::warn("awb not support format: %d", _format);
            return this;
        }

        imlib_awb(&src_img, max);

        if (_format == image::FMT_RGB888 || _format == image::FMT_BGR888) {
            Image *rgb888_img = rgb565_img->to_format(image::FMT_RGB888);
            memcpy(_data, rgb888_img->data(), _data_size);
            delete rgb888_img;
            delete rgb565_img;
        }
        return this;
    }

    image::Image *Image::ccm(std::vector<float> &matrix) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);

        float ccm[12] = {};
        float *matrix_data = (float *)matrix.data();
        size_t len = matrix.size();
        if (len != 9 && len != 12) {
            log::error("ccm matrix size not match: %d", len);
            return this;
        }

        for (size_t i = 0; i < len; i ++) {
            ccm[i] = matrix_data[i];
        }

        imlib_ccm(&src_img, ccm, len == 12);
        return this;
    }

    image::Image *Image::gamma(double gamma, double contrast, double brightness) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);

        imlib_gamma(&src_img, gamma, contrast, brightness);
        return this;
    }

    image::Image *Image::gamma_corr(double gamma, double contrast, double brightness) {
        return this->gamma(gamma, contrast, brightness);
    }

    image::Image *Image::negate(void) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);
        imlib_negate(&src_img);
        return this;
    }

    image::Image *Image::replace(image::Image *other, bool hmirror, bool vflip, bool transpose, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (other) {
            err::check_bool_raise(_format == other->format(), "Other image format is not match source image");
            err::check_bool_raise(_width == other->width() && _height == other->height(), "Other image size is not match source image");
            convert_to_imlib_image(other, &other_img);
        }

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
        }

        if (other && mask) {
            imlib_replace(&src_img, NULL, &other_img, 0, hmirror, vflip, transpose, &mask_img);
        } else if (other && !mask) {
            imlib_replace(&src_img, NULL, &other_img, 0, hmirror, vflip, transpose, NULL);
        } else if (!other && mask) {
            imlib_replace(&src_img, NULL, &src_img, 0, hmirror, vflip, transpose, &mask_img);
        } else {
            imlib_replace(&src_img, NULL, &src_img, 0, hmirror, vflip, transpose, NULL);
        }

        _width = src_img.w;
        _height = src_img.h;

        return this;
    }

    image::Image *Image::set(image::Image *other, bool hmirror, bool vflip, bool transpose, image::Image *mask) {
        return this->replace(other, hmirror, vflip, transpose, mask);
    }

    image::Image *Image::add(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_add(&src_img, NULL, &other_img, 0, &mask_img);
        } else {
            imlib_add(&src_img, NULL, &other_img, 0, NULL);
        }
        return this;
    }

    image::Image *Image::sub(image::Image *other, bool reverse, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_sub(&src_img, NULL, &other_img, 0, reverse, &mask_img);
        } else {
            imlib_sub(&src_img, NULL, &other_img, 0, reverse, NULL);
        }
        return this;
    }

    image::Image *Image::mul(image::Image *other, bool invert, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_mul(&src_img, NULL, &other_img, 0, invert, &mask_img);
        } else {
            imlib_mul(&src_img, NULL, &other_img, 0, invert, NULL);
        }
        return this;
    }

    image::Image *Image::div(image::Image *other, bool invert, bool mod, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_div(&src_img, NULL, &other_img, 0, invert, mod, &mask_img);
        } else {
            imlib_div(&src_img, NULL, &other_img, 0, invert, mod, NULL);
        }
        return this;
    }

    image::Image *Image::min(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_min(&src_img, NULL, &other_img, 0, &mask_img);
        } else {
            imlib_min(&src_img, NULL, &other_img, 0, NULL);
        }
        return this;
    }

    image::Image *Image::max(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_max(&src_img, NULL, &other_img, 0, &mask_img);
        } else {
            imlib_max(&src_img, NULL, &other_img, 0, NULL);
        }
        return this;
    }

    image::Image *Image::difference(image::Image *other, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_difference(&src_img, NULL, &other_img, 0, &mask_img);
        } else {
            imlib_difference(&src_img, NULL, &other_img, 0, NULL);
        }
        return this;
    }

    image::Image *Image::blend(image::Image *other, int alpha, image::Image *mask) {
        image_t src_img, other_img, mask_img;
        convert_to_imlib_image(this, &src_img);
        convert_to_imlib_image(other, &other_img);

        if (alpha < 0 || alpha > 256) {
            log::error("alpha value not valid: %d", alpha);
            return this;
        }

        float alpha_f = alpha / 256.0;
        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_blend(&src_img, NULL, &other_img, 0, alpha_f, &mask_img);
        } else {
            imlib_blend(&src_img, NULL, &other_img, 0, alpha_f, NULL);
        }
        return this;
    }

    image::Image *Image::histeq(bool adaptive, int clip_limit, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (adaptive) {
            if (mask) {
                convert_to_imlib_image(mask, &mask_img);
                imlib_clahe_histeq(&src_img, clip_limit, &mask_img);
            } else {
                imlib_clahe_histeq(&src_img, clip_limit, NULL);
            }

        } else {
            if (mask) {
                convert_to_imlib_image(mask, &mask_img);
                imlib_histeq(&src_img, &mask_img);
            } else {
                imlib_histeq(&src_img, NULL);
            }
        }
        return this;
    }

    image::Image *Image::mean(int size, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_mean_filter(&src_img, size, threshold, offset, invert, &mask_img);
        } else {
            imlib_mean_filter(&src_img, size, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::median(int size, double percentile, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_median_filter(&src_img, size, percentile, threshold, offset, invert, &mask_img);
        } else {
            imlib_median_filter(&src_img, size, percentile, threshold, offset, invert, NULL);
        }

        return this;
    }

    image::Image *Image::mode(int size, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_mode_filter(&src_img, size, threshold, offset, invert, &mask_img);
        } else {
            imlib_mode_filter(&src_img, size, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::midpoint(int size, double bias, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_midpoint_filter(&src_img, size, bias, threshold, offset, invert, &mask_img);
        } else {
            imlib_midpoint_filter(&src_img, size, bias, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::morph(int size, std::vector<int> kernel, float mul, float add, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        int *kernel_data = (int *)kernel.data();
        size_t len = kernel.size();

        err::check_bool_raise(len != 0, "You need to config values of kernel");
        err::check_bool_raise(len == ((size * 2) + 1) * ((size * 2) + 1), "Kernel size not match");

        int m = 0;
        for (size_t i = 0; i < len; i++) {
            m += kernel_data[i];
        }
        if (m == 0) {
            m = 1;
        }

        if (mul < 0) {
            mul = 1.0f / m;
        }
        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_morph(&src_img, size, kernel_data, mul, add, threshold, offset, invert, &mask_img);
        } else {
            imlib_morph(&src_img, size, kernel_data, mul, add, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::gaussian(int size, bool unsharp, float mul, float add, bool threshold, int offset, bool invert, image::Image *mask) {
        std::vector<int> pascal;
        std::vector<int> kernel;
        int m = 0;
        int k_2 = size * 2;
        int n = k_2 + 1;

        pascal.resize(n);
        pascal[0] = 1;
        for (int i = 0; i < k_2; i ++) {
            pascal[i + 1] = (pascal[i] * (k_2 - i)) / (i + 1);
        }

        kernel.resize(n * n);
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                int temp = pascal[i] * pascal[j];
                kernel[(i * n) + j] = temp;
                m += temp;
            }
        }

        if (unsharp == false) {
            kernel[((n / 2) * n) + (n / 2)] -= m * 2;
            m = -m;
        }

        if (mul < 0) {
            mul = 1.0f / m;
        }

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_morph(&src_img, size, kernel.data(), mul, add, threshold, offset, invert, &mask_img);
        } else {
            imlib_morph(&src_img, size, kernel.data(), mul, add, threshold, offset, invert, NULL);
        }

        return this;
    }

    image::Image *Image::laplacian(int size, bool sharpen, float mul, float add, bool threshold, int offset, bool invert, image::Image *mask) {
        std::vector<int> pascal;
        std::vector<int> kernel;
        int m = 0;
        int k_2 = size * 2;
        int n = k_2 + 1;

        pascal.resize(n);
        pascal[0] = 1;
        for (int i = 0; i < k_2; i ++) {
            pascal[i + 1] = (pascal[i] * (k_2 - i)) / (i + 1);
        }

        kernel.resize(n * n);
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                int temp = pascal[i] * pascal[j];
                kernel[(i * n) + j] = -temp;
                m += temp;
            }
        }

        kernel[((n / 2) * n) + (n / 2)] += m;
        m = kernel[((n / 2) * n) + (n / 2)];

        if (sharpen == false) {
            kernel[((n / 2) * n) + (n / 2)] += m;
        }

        if (mul < 0) {
            mul = 1.0f / m;
        }

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_morph(&src_img, size, kernel.data(), mul, add, threshold, offset, invert, &mask_img);
        } else {
            imlib_morph(&src_img, size, kernel.data(), mul, add, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::bilateral(int size, double color_sigma, double space_sigma, bool threshold, int offset, bool invert, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_bilateral_filter(&src_img, size, color_sigma, space_sigma, threshold, offset, invert, &mask_img);
        } else {
            imlib_bilateral_filter(&src_img, size, color_sigma, space_sigma, threshold, offset, invert, NULL);
        }
        return this;
    }

    image::Image *Image::linpolar(bool reverse) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);
        imlib_logpolar(&src_img, true, reverse);
        return this;
    }

    image::Image *Image::logpolar(bool reverse) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);
        imlib_logpolar(&src_img, false, reverse);
        return this;
    }

    image::Image *Image::lens_corr(double strength, double zoom, double x_corr, double y_corr) {
        if (_width % 2 || _height % 2) {
            log::error("lens_corr image size must be even");
            return this;
        }

        image_t src_img;
        convert_to_imlib_image(this, &src_img);
        imlib_lens_corr(&src_img, strength, zoom, x_corr, y_corr);
        return this;
    }

    image::Image *Image::rotation_corr(double x_rotation, double y_rotation, double z_rotation, double x_translation, double y_translation, double zoom, double fov, std::vector<float> corners) {
        image_t src_img;
        convert_to_imlib_image(this, &src_img);
        imlib_rotation_corr(&src_img, x_rotation, y_rotation, z_rotation, x_translation, y_translation, zoom, fov, (float *)corners.data());
        return this;
    }

    std::map<std::string, std::vector<float>> Image::get_histogram(std::vector<std::vector<int>> thresholds, bool invert, std::vector<int> roi, int bins, int l_bins, int a_bins, int b_bins, image::Image *difference) {
        std::map<std::string, std::vector<float>> result = std::map<std::string, std::vector<float>>();
        image_t src_img, *other_img = NULL;
        convert_to_imlib_image(this, &src_img);
        if (difference) {
            other_img = (image_t *)malloc(sizeof(image_t));
            if (!other_img) {
                log::error("malloc image_t failed");
                return result;
            }
            convert_to_imlib_image(difference, other_img);
        }

        rectangle_t roi_rect;
        std::vector<int> avail_roi = _get_available_roi(roi);
        roi_rect.x = avail_roi[0];
        roi_rect.y = avail_roi[1];
        roi_rect.w = avail_roi[2];
        roi_rect.h = avail_roi[3];

        list_t thresholds_list;
        list_init(&thresholds_list, sizeof(color_thresholds_list_lnk_data_t));
        _convert_to_lab_thresholds(thresholds, &thresholds_list);

        histogram_t hist;
        switch (_format) {
        case image::FMT_GRAYSCALE:
            // bins must be greater than 1
            bins = bins >= 2 ? bins : COLOR_GRAYSCALE_MAX - COLOR_GRAYSCALE_MIN + 1;
            hist.LBinCount = bins;
            hist.ABinCount = 0;
            hist.BBinCount = 0;
            hist.LBins = (float *)malloc(hist.LBinCount * sizeof(float));
            hist.ABins = NULL;
            hist.BBins = NULL;
            imlib_get_histogram(&hist, &src_img, &roi_rect, &thresholds_list, invert, other_img);
            break;
        case image::FMT_RGB888:
            bins = bins >= 2 ? bins : COLOR_L_MAX - COLOR_L_MIN + 1;
            l_bins = l_bins >= 2 ? l_bins : bins;
            a_bins = a_bins >= 2 ? a_bins : COLOR_A_MAX - COLOR_A_MIN + 1;
            b_bins = b_bins >= 2 ? b_bins : COLOR_B_MAX - COLOR_B_MIN + 1;
            hist.LBinCount = l_bins;
            hist.ABinCount = a_bins;
            hist.BBinCount = b_bins;
            hist.LBins = (float *)malloc(hist.LBinCount * sizeof(float));
            hist.ABins = (float *)malloc(hist.ABinCount * sizeof(float));
            hist.BBins = (float *)malloc(hist.BBinCount * sizeof(float));
            imlib_get_histogram(&hist, &src_img, &roi_rect, &thresholds_list, invert, other_img);
            break;
        default:
            log::error("format not support: %d", _format);
            return result;
        }

        std::vector<float> l_bins_data(hist.LBins, hist.LBins + hist.LBinCount);
        std::vector<float> a_bins_data(hist.ABins, hist.ABins + hist.ABinCount);
        std::vector<float> b_bins_data(hist.BBins, hist.BBins + hist.BBinCount);
        result["L"] = l_bins_data;
        result["A"] = a_bins_data;
        result["B"] = b_bins_data;

        list_free(&thresholds_list);
        if (difference && other_img) free(other_img);
        if (hist.LBins) free(hist.LBins);
        if (hist.ABins) free(hist.ABins);
        if (hist.BBins) free(hist.BBins);
        return result;
    }

    image::Statistics Image::get_statistics(std::vector<std::vector<int>> thresholds, bool invert, std::vector<int> roi, int bins, int l_bins, int a_bins, int b_bins, image::Image *difference) {
        image::Statistics result = image::Statistics();
        image_t src_img, *other_img = NULL;
        convert_to_imlib_image(this, &src_img);
        if (difference) {
            other_img = (image_t *)malloc(sizeof(image_t));
            if (!other_img) {
                log::error("malloc image_t failed");
                return result;
            }
            convert_to_imlib_image(difference, other_img);
        }

        rectangle_t roi_rect;
        std::vector<int> avail_roi = _get_available_roi(roi);
        roi_rect.x = avail_roi[0];
        roi_rect.y = avail_roi[1];
        roi_rect.w = avail_roi[2];
        roi_rect.h = avail_roi[3];

        list_t thresholds_list;
        list_init(&thresholds_list, sizeof(color_thresholds_list_lnk_data_t));
        _convert_to_lab_thresholds(thresholds, &thresholds_list);

        histogram_t hist = {0};
        switch (_format) {
        case image::FMT_GRAYSCALE:
            // bins must be greater than 1
            bins = bins >= 2 ? bins : COLOR_GRAYSCALE_MAX - COLOR_GRAYSCALE_MIN + 1;
            hist.LBinCount = bins;
            hist.ABinCount = 0;
            hist.BBinCount = 0;
            hist.LBins = (float *)malloc(hist.LBinCount * sizeof(float));
            hist.ABins = NULL;
            hist.BBins = NULL;
            imlib_get_histogram(&hist, &src_img, &roi_rect, &thresholds_list, invert, other_img);
            break;
        case image::FMT_RGB888:
            bins = bins >= 2 ? bins : COLOR_L_MAX - COLOR_L_MIN + 1;
            l_bins = l_bins >= 2 ? l_bins : bins;
            a_bins = a_bins >= 2 ? a_bins : COLOR_A_MAX - COLOR_A_MIN + 1;
            b_bins = b_bins >= 2 ? b_bins : COLOR_B_MAX - COLOR_B_MIN + 1;
            hist.LBinCount = l_bins;
            hist.ABinCount = a_bins;
            hist.BBinCount = b_bins;
            hist.LBins = (float *)malloc(hist.LBinCount * sizeof(float));
            hist.ABins = (float *)malloc(hist.ABinCount * sizeof(float));
            hist.BBins = (float *)malloc(hist.BBinCount * sizeof(float));
            imlib_get_histogram(&hist, &src_img, &roi_rect, &thresholds_list, invert, other_img);
            break;
        default:
            log::error("format not support: %d", _format);
            return result;
        }

        statistics_t stats = {0};
        imlib_get_statistics(&stats, (pixformat_t)src_img.pixfmt, &hist);

        std::vector<int> l_statistics = {stats.LMean, stats.LMedian, stats.LMode, stats.LSTDev, stats.LMin, stats.LMax, stats.LLQ, stats.LUQ};
        std::vector<int> a_statistics = {stats.AMean, stats.AMedian, stats.AMode, stats.ASTDev, stats.AMin, stats.AMax, stats.LLQ, stats.AUQ};
        std::vector<int> b_statistics = {stats.BMean, stats.BMedian, stats.BMode, stats.BSTDev, stats.BMin, stats.BMax, stats.LLQ, stats.BUQ};
        result = image::Statistics( _format,
                                    l_statistics,
                                    a_statistics,
                                    b_statistics);

        list_free(&thresholds_list);
        if (difference && other_img) free(other_img);
        if (hist.LBins) free(hist.LBins);
        if (hist.ABins) free(hist.ABins);
        if (hist.BBins) free(hist.BBins);
        return result;
    }

    std::vector<image::Line> Image::get_regression(std::vector<std::vector<int>> thresholds, bool invert, std::vector<int> roi, int x_stride, int y_stride, int area_threshold, int pixels_threshold, bool robust) {
        std::vector<image::Line> lines = std::vector<image::Line>();
        image_t src_img;
        if (_format != image::FMT_GRAYSCALE && _format != image::FMT_RGB888 && _format != image::FMT_RGB565) {
            log::error("get_regression only support GRAYSCALE RGB888 RGB565 format!\n");
        }
        convert_to_imlib_image(this, &src_img);

        rectangle_t roi_rect;
        std::vector<int> avail_roi = _get_available_roi(roi);
        roi_rect.x = avail_roi[0];
        roi_rect.y = avail_roi[1];
        roi_rect.w = avail_roi[2];
        roi_rect.h = avail_roi[3];

        list_t thresholds_list;
        list_init(&thresholds_list, sizeof(color_thresholds_list_lnk_data_t));
        _convert_to_lab_thresholds(thresholds, &thresholds_list);

        find_lines_list_lnk_data_t out;
        bool res = imlib_get_regression(&out, &src_img, &roi_rect, x_stride,
                                       y_stride, &thresholds_list, invert, area_threshold, pixels_threshold, robust);
        if (true == res) {
            Line line = Line(out.line.x1, out.line.y1, out.line.x2, out.line.y2, out.magnitude, out.theta, out.rho);
            lines.push_back(line);
        }

        list_free(&thresholds_list);
        return lines;
    }

    image::Image *Image::flood_fill(int x, int y, float seed_threshold, float floating_threshold, image::Color color , bool invert, bool clear_background, image::Image *mask) {
        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_flood_fill(&src_img, x, y, seed_threshold, floating_threshold, color.hex(), invert, clear_background, &mask_img);
        } else {
            imlib_flood_fill(&src_img, x, y, seed_threshold, floating_threshold, color.hex(), invert, clear_background, NULL);
        }
        return this;
    }

    image::Image *Image::erode(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "erode size must be greater than 0");
        err::check_bool_raise(threshold == -1 || threshold >= 0, "erode threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (threshold == -1) {
            threshold = ((size * 2) + 1) * ((size * 2) + 1) - 1;
        }

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_erode(&src_img, size, threshold, &mask_img);
        } else {
            imlib_erode(&src_img, size, threshold, NULL);
        }
        return this;
    }

    image::Image *Image::dilate(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "dilate size must be greater than 0");
        err::check_bool_raise(threshold >= 0, "dilate threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_dilate(&src_img, size, threshold, &mask_img);
        } else {
            imlib_dilate(&src_img, size, threshold, NULL);
        }
        return this;
    }

    image::Image *Image::open(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "open size must be greater than 0");
        err::check_bool_raise(threshold >= 0, "open threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_open(&src_img, size, threshold, &mask_img);
        } else {
            imlib_open(&src_img, size, threshold, NULL);
        }
        return this;
    }

    image::Image *Image::close(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "close size must be greater than 0");
        err::check_bool_raise(threshold >= 0, "close threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_close(&src_img, size, threshold, &mask_img);
        } else {
            imlib_close(&src_img, size, threshold, NULL);
        }
        return this;
    }

    image::Image *Image::top_hat(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "top_hat size must be greater than 0");
        err::check_bool_raise(threshold >= 0, "top_hat threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_top_hat(&src_img, size, threshold, &mask_img);
        } else {
            imlib_top_hat(&src_img, size, threshold, NULL);
        }
        return this;
    }

    image::Image *Image::black_hat(int size, int threshold, image::Image *mask) {
        err::check_bool_raise(size > 0, "black_hat size must be greater than 0");
        err::check_bool_raise(threshold >= 0, "black_hat threshold must be greater than or equal to 0");

        image_t src_img, mask_img;
        convert_to_imlib_image(this, &src_img);

        if (mask) {
            convert_to_imlib_image(mask, &mask_img);
            imlib_black_hat(&src_img, size, threshold, &mask_img);
        } else {
            imlib_black_hat(&src_img, size, threshold, NULL);
        }
        return this;
    }
}