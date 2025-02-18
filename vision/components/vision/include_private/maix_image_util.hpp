#pragma once

#include "maix_image.hpp"
#include "omv.hpp"

namespace maix::image
{
    /**
     * Convert image to openmv image format
     * @param image image
     * @param imlib_image openmv image
     * @return
    */
    extern void convert_to_imlib_image(image::Image *image, image_t *imlib_image);
    extern void _convert_to_lab_thresholds(std::vector<std::vector<int>> &in, list_t *out);
}

