/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#pragma once

#include <vector>
#include <string>
#include <map>
#include <stdint.h>
#include <stdexcept>

namespace maix::image
{

    /**
     * Image formats
     * @attention for MaixPy firmware developers, update this enum will also need to update the fmt_size and fmt_names too !!!
     * @maixpy maix.image.Format
     */
    enum Format
    {
        FMT_RGB888 = 0, // RGBRGB...RGB, R at the lowest address
        FMT_BGR888,     // BGRBGR...BGR, B at the lowest address
        FMT_RGBA8888,   // RGBARGBA...RGBA, R at the lowest address
        FMT_BGRA8888,   // BGRABGRA...BGRA, B at the lowest address
        FMT_RGB565,
        FMT_BGR565,
        FMT_YUV422SP, // YYY...UVUVUV...UVUV
        FMT_YUV422P,  // YYY...UUU...VVV
        FMT_YVU420SP, // YYY...VUVUVU...VUVU, NV21
        FMT_YUV420SP, // YYY...UVUVUV...UVUV, NV12
        FMT_YVU420P,  // YYY...VVV...UUU
        FMT_YUV420P,  // YYY...UUU...VVV
        FMT_GRAYSCALE,
        FMT_BGGR6,      // 6-bit Bayer format with a BGGR pattern.
        FMT_GBRG6,      // 6-bit Bayer format with a GBRG pattern.
        FMT_GRBG6,      // 6-bit Bayer format with a GRBG pattern.
        FMT_RGGB6,      // 6-bit Bayer format with a RGGB pattern.
        FMT_BGGR8,      // 8-bit Bayer format with a BGGR pattern.
        FMT_GBRG8,      // 8-bit Bayer format with a GBRG pattern.
        FMT_GRBG8,      // 8-bit Bayer format with a GRBG pattern.
        FMT_RGGB8,      // 8-bit Bayer format with a RGGB pattern.
        FMT_BGGR10,     // 10-bit Bayer format with a BGGR pattern.
        FMT_GBRG10,     // 10-bit Bayer format with a GBRG pattern.
        FMT_GRBG10,     // 10-bit Bayer format with a GRBG pattern.
        FMT_RGGB10,     // 10-bit Bayer format with a RGGB pattern.
        FMT_BGGR12,     // 12-bit Bayer format with a BGGR pattern.
        FMT_GBRG12,     // 12-bit Bayer format with a GBRG pattern.
        FMT_GRBG12,     // 12-bit Bayer format with a GRBG pattern.
        FMT_RGGB12,     // 12-bit Bayer format with a RGGB pattern.
        FMT_UNCOMPRESSED_MAX,

        // compressed format below, not compressed should define upper
        FMT_COMPRESSED_MIN,
        FMT_JPEG,
        FMT_PNG,
        FMT_COMPRESSED_MAX,

        FMT_INVALID = 0xFF  // format not valid
    }; // !!!! update this section please update fmt_size and fmt_names too !!!!

    /**
     * Image format size in bytes
     * @attention It's a copy of this variable in MaixPy,
     *            so change it in C++ (e.g. update var in hello function) will not take effect the var inMaixPy.
     *            So we add const for this var to avoid this mistake.
     * @maixpy maix.image.fmt_size
     */
    const std::vector<float> fmt_size = {
        3,
        3,
        4,
        4,
        2,
        2,
        2,
        2,
        1.5,
        1.5,
        1.5,
        1.5,
        1, // grayscale
        0.75,   // 6-bit Bayer format
        0.75,   // 6-bit Bayer format
        0.75,   // 6-bit Bayer format
        0.75,   // 6-bit Bayer format
        1,      // 8-bit Bayer format
        1,      // 8-bit Bayer format
        1,      // 8-bit Bayer format
        1,      // 8-bit Bayer format
        1.25,   // 10-bit Bayer format
        1.25,   // 10-bit Bayer format
        1.25,   // 10-bit Bayer format
        1.25,   // 10-bit Bayer format
        1.5,    // 12-bit Bayer format
        1.5,    // 12-bit Bayer format
        1.5,    // 12-bit Bayer format
        1.5,    // 12-bit Bayer format
        0, // uncompereed_max
        0, // compressed_min
        1, // jpeg
        1, // png
        0, // compressed_max
        0  // invalid
        };

    /**
     * Image format string
     * @maixpy maix.image.fmt_names
     */
    const std::vector<std::string> fmt_names = {
        "RGB888",
        "BGR888",
        "RGBA8888",
        "BGRA8888",
        "RGB565",
        "BGR565",
        "YUV422SP",
        "YUV422P",
        "YVU420SP",
        "YUV420SP",
        "YVU420P",
        "YUV420P",
        "GRAYSCALE",
        "BGGR6",
        "GBRG6",
        "GRBG6",
        "RG6B6",
        "BGGR8",
        "GBRG8",
        "GRBG8",
        "RG6B8",
        "BGGR10",
        "GBRG10",
        "GRBG10",
        "RG6B10",
        "BGGR12",
        "GBRG12",
        "GRBG12",
        "RG6B12",
        "UNCOMPRESSED_MAX",
        "COMPRESSED_MIN",
        "JPEG",
        "PNG",
        "COMPRESSED_MAX",
        "INVALID"
        };

    /**
     * Image size type
     * @maixpy maix.image.Size
     */
    class Size
    {
    public:
        /**
         * Construct a new Size object
         * @param width image width
         * @param height image height
         * @maixpy maix.image.Size.__init__
        */
        Size(int width = 0, int height = 0)
        {
            this->_width = width;
            this->_height = height;
        }

        /**
         * width of size
         * @param width set new width, if not set, only return current width
         * @maixpy maix.image.Size.width
         */
        int width(int width = -1)
        {
            if(width != -1)
            {
                this->_width = width;
            }
            return this->_width;
        }

        /**
         * height of size
         * @param height set new height, if not set, only return current height
         * @maixpy maix.image.Size.height
         */
        int height(int height = -1)
        {
            if(height != -1)
            {
                this->_height = height;
            }
            return this->_height;
        }

         /**
          * Subscript operator
          * @param index 0 for width, 1 for height
          * @return int& width or height
          * @maixpy maix.image.Size.__getitem__
          * @maixcdk maix.image.Size.operator[]
          */
        int &operator[](int index)
        {
            if (index == 0)
                return _width;
            else if (index == 1)
                return _height;
            else
                throw std::out_of_range("Size index out of range");
        }

        /**
         * to string
         * @maixpy maix.image.Size.__str__
         */
        std::string __str__()
        {
            return "Size(" + std::to_string(_width) + "x" + std::to_string(_height) + ")";
        }
    private:
        int _width;
        int _height;
    };

    /**
     * Object fit method
     * @maixpy maix.image.Fit
     */
    enum Fit
    {
        FIT_NONE = -1, // no object fit, keep original
        FIT_FILL = 0,  // width to new width, height to new height, may be stretch
        FIT_CONTAIN,   // keep aspect ratio, fill blank area with black color
        FIT_COVER,     // keep aspect ratio, crop image to fit new size
        FIT_MAX
    };

    /**
     * Resize method
     * @maixpy maix.image.ResizeMethod
     */
    enum ResizeMethod
    {
        NEAREST = 0,
        BILINEAR,
        BICUBIC,
        AREA,
        LANCZOS,
        HAMMING,
        RESIZE_METHOD_MAX
    };

    /**
     * Family of apriltag
     * @maixpy maix.image.ApriltagFamilies
     */
    enum ApriltagFamilies
    {
        TAG16H5   = 1,
        TAG25H7   = 2,
        TAG25H9   = 4,
        TAG36H10  = 8,
        TAG36H11  = 16,
        ARTOOLKIT = 32
    };

    /**
     * Template match method
     * @maixpy maix.image.TemplateMatch
     */
    enum TemplateMatch
    {
        SEARCH_EX,  // Exhaustive search
        SEARCH_DS,  // Diamond search
    };

    /**
     * CornerDetector class
     * @maixpy maix.image.CornerDetector
     */
    enum CornerDetector
    {
        CORNER_FAST,
        CORNER_AGAST
    };

    /**
     * EdgeDetector class
     * @maixpy maix.image.EdgeDetector
     */
    enum EdgeDetector
    {
        EDGE_CANNY,
        EDGE_SIMPLE,
    };

    /**
     * FlipDir
     * @maixpy maix.image.FlipDir
     */
    enum class FlipDir
    {
        X,
        Y,
        XY
    };

}
