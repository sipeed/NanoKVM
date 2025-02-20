/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#pragma once

#include "maix_image_def.hpp"
#include "maix_log.hpp"

namespace maix::image
{
    /**
     * Color class
     * @maixpy maix.image.Color
    */
    class Color
    {
    public:
        /**
         * Color constructor
         * @param alpha alpha channel, value range: 0 ~ 1
         * @maixpy maix.image.Color.__init__
         */
        Color(uint8_t ch1, uint8_t ch2 = 0, uint8_t ch3 = 0, float alpha = 0, image::Format format = image::FMT_GRAYSCALE)
        {
            if(alpha > 1 || alpha < 0)
                throw std::runtime_error("alpha value range: 0 ~ 1");
            this->format = format;
            switch (format)
            {
            case image::FMT_RGB888:
                r = ch1;
                g = ch2;
                b = ch3;
                this->alpha = 1;
                break;
            case image::FMT_BGR888:
                b = ch1;
                g = ch2;
                r = ch3;
                this->alpha = 1;
                break;
            case image::FMT_GRAYSCALE:
                gray = ch1;
                break;
            case image::FMT_BGRA8888:
                b = ch1;
                g = ch2;
                r = ch3;
                this->alpha = alpha;
                break;
            case image::FMT_RGBA8888:
                r = ch1;
                g = ch2;
                b = ch3;
                this->alpha = alpha;
                break;
            default:
                throw std::runtime_error("not support format");
                break;
            }
        }

        /**
         * Color red channel
         * @maixpy maix.image.Color.r
        */
        uint8_t r;

        /**
         * Color green channel
         * @maixpy maix.image.Color.g
        */
        uint8_t g;

        /**
         * Color blue channel
         * @maixpy maix.image.Color.b
        */
        uint8_t b;

        /**
         * Color alpha channel, value from 0.0 to 1.0, float value
         * @maixpy maix.image.Color.alpha
        */
        float alpha;

        /**
         * Color gray channel
         * @maixpy maix.image.Color.gray
        */
        uint8_t gray;

        /**
         * Color format
         * @maixpy maix.image.Color.format
        */
        image::Format format;

        /**
         * Get color's hex value
         * @maixpy maix.image.Color.hex
        */
        uint32_t hex()
        {
            uint32_t hex = 0;
            switch (format)
            {
            case image::FMT_RGB888:
                hex = r | (g << 8) | (b << 16);
                break;
            case image::FMT_BGR888:
                hex = b | (g << 8) | (r << 16);
                break;
            case image::FMT_GRAYSCALE:
                hex = gray;
                break;
            case image::FMT_BGRA8888:
                hex = b | (g << 8) | (r << 16) | ((uint8_t)(alpha*255) << 24);
                break;
            case image::FMT_RGBA8888:
                hex = r | (g << 8) | (b << 16) | ((uint8_t)(alpha*255) << 24);
                break;
            default:
                throw std::runtime_error("not support format");
                break;
            }
            return hex;
        }

        /**
         * Create Color object from RGB channels
         * @maixpy maix.image.Color.from_rgb
        */
        static image::Color from_rgb(uint8_t r, uint8_t g, uint8_t b)
        {
            return Color(r, g, b, 1, image::Format::FMT_RGB888);
        }

        /**
         * Create Color object from BGR channels
         * @maixpy maix.image.Color.from_bgr
        */
        static image::Color from_bgr(uint8_t b, uint8_t g, uint8_t r)
        {
            return Color(b, g, r, 1, image::Format::FMT_BGR888);
        }

        /**
         * Create Color object from gray channel
         * @maixpy maix.image.Color.from_gray
        */
        static image::Color from_gray(uint8_t gray)
        {
            return Color(gray);
        }

        /**
         * Create Color object from RGBA channels
         * @param alpha alpha channel, float value, value range: 0 ~ 1
         * @maixpy maix.image.Color.from_rgba
        */
        static image::Color from_rgba(uint8_t r, uint8_t g, uint8_t b, float alpha)
        {
            return Color(r, g, b, alpha, image::Format::FMT_RGBA8888);
        }

        /**
         * Create Color object from BGRA channels
         * * @param alpha alpha channel, float value, value range: 0 ~ 1
         * @maixpy maix.image.Color.from_bgra
        */
        static image::Color from_bgra(uint8_t b, uint8_t g, uint8_t r, float alpha)
        {
            return Color(b, g, r, alpha, image::Format::FMT_BGRA8888);
        }

        /**
         * Create Color object from hex value
         * @param hex hex value, e.g. 0x0000FF00, lower address if first channel
         * @param format color format, @see image::Format
         * @maixpy maix.image.Color.from_hex
        */
        static image::Color from_hex(uint32_t hex, image::Format &format)
        {
            return Color(hex & 0xFF, hex & 0xFF00, hex & 0xFF0000, (hex & 0xFF000000)/255.0, format);
        }

        /**
         * Convert Color format
         * @param format format want to convert to, @see image::Format, only support RGB888, BGR888, RGBA8888, BGRA8888, GRAYSCALE.
         * @maixpy maix.image.Color.to_format
        */
        void to_format(const image::Format &format)
        {
            if(!(format == image::FMT_RGB888 || format == image::FMT_BGR888 ||
                format == image::FMT_RGBA8888 || format == image::FMT_BGRA8888 ||
                format == image::FMT_GRAYSCALE))
            {
                log::error("convert format failed, not support format %d\n", format);
                return;
            }
            if(this->format == format)
                return;
            if((this->format == image::FMT_RGB888 || this->format  == image::FMT_BGR888) &&
                (format == image::FMT_RGBA8888 || format == image::FMT_BGRA8888))
            {
                this->alpha = 1;
            }
            else if(this->format == image::FMT_GRAYSCALE && format != image::FMT_GRAYSCALE)
            {
                this->r = this->gray;
                this->g = this->gray;
                this->b = this->gray;
                this->alpha = 1;
            }
            else if((this->format == image::FMT_RGBA8888 || this->format == image::FMT_BGRA8888) &&
                (format == image::FMT_RGB888 || format == image::FMT_BGR888))
            {
                this->alpha = 0;
            }
            else if(this->format != image::FMT_GRAYSCALE && format == image::FMT_GRAYSCALE)
            {
                this->gray = (this->r + this->g + this->b) / 3;
                this->r = this->gray;
                this->g = this->gray;
                this->b = this->gray;
                this->alpha = 0;
            }
            this->format = format;
        }

        /**
         * Convert color format and return a new Color object
         * @param format format want to convert to, @see image::Format, only support RGB888, BGR888, RGBA8888, BGRA8888, GRAYSCALE.
         * @return new Color object, you need to delete it manually in C++.
         * @maixpy maix.image.Color.to_format2
        */
        image::Color *to_format2(const image::Format &format)
        {
            image::Color *color = new image::Color(*this);
            color->to_format(format);
            return color;
        }
    };

    /**
     * Predefined color white
     * @maixpy maix.image.COLOR_WHITE
    */
    const image::Color COLOR_WHITE = image::Color::from_rgb(255, 255, 255);
    /**
     * Predefined color black
     * @maixpy maix.image.COLOR_BLACK
    */
    const image::Color COLOR_BLACK = image::Color::from_rgb(0, 0, 0);
    /**
     * Predefined color red
     * @maixpy maix.image.COLOR_RED
    */
    const image::Color COLOR_RED = image::Color::from_rgb(255, 0, 0);
    /**
     * Predefined color green
     * @maixpy maix.image.COLOR_GREEN
    */
    const image::Color COLOR_GREEN = image::Color::from_rgb(0, 255, 0);
    /**
     * Predefined color blue
     * @maixpy maix.image.COLOR_BLUE
    */
    const image::Color COLOR_BLUE = image::Color::from_rgb(0, 0, 255);
    /**
     * Predefined color yellow
     * @maixpy maix.image.COLOR_YELLOW
    */
    const image::Color COLOR_YELLOW = image::Color::from_rgb(255, 255, 0);
    /**
     * Predefined color purple
     * @maixpy maix.image.COLOR_PURPLE
    */
    const image::Color COLOR_PURPLE = image::Color::from_rgb(143, 0, 255);
    /**
     * Predefined color orange
     * @maixpy maix.image.COLOR_ORANGE
    */
    const image::Color COLOR_ORANGE = image::Color::from_rgb(255, 127, 0);
    /**
     * Predefined color gray
     * @maixpy maix.image.COLOR_GRAY
    */
    const image::Color COLOR_GRAY = image::Color::from_rgb(127, 127, 127);

}
