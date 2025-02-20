/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */

#pragma once

#include "maix_err.hpp"
#include <vector>
#include <valarray>

namespace maix::image
{
    /**
     * Line class
     * @maixpy maix.image.Line
     */
    class Line
    {
    private:
        int _x1;
        int _y1;
        int _x2;
        int _y2;
        int _length;
        int _magnitude;
        int _theta;
        int _rho;

    public:
        /**
         * Line constructor
         *
         * @param x1 coordinate x1 of the straight line
         * @param y1 coordinate y1 of the straight line
         * @param x2 coordinate x2 of the straight line
         * @param y2 coordinate y2 of the straight line
         * @param magnitude magnitude of the straight line after Hough transformation
         * @param theta angle of the straight line after Hough transformation
         * @param rho p-value of the straight line after Hough transformation
         * @maixpy maix.image.Line.__init__
         */
        Line(int x1, int y1, int x2, int y2, int magnitude = 0, int theta = 0, int rho = 0)
        {
            _x1 = x1;
            _y1 = y1;
            _x2 = x2;
            _y2 = y2;
            int x_diff = x2 - x1;
            int y_diff = y2 - y1;
            _length = (int)sqrtf(x_diff * x_diff + y_diff * y_diff);
            _magnitude = magnitude;
            _theta = theta;
            _rho = rho;
        }
        ~Line(){};

        /**
         * Subscript operator
         * @param index
         * [0] get x1 of line
         * [1] get y1 of line
         * [2] get x2 of line
         * [3] get y2 of line
         * [4] get length of line
         * [5] get magnitude of the straight line after Hough transformation
         * [6] get angle of the straight line after Hough transformation (0-179 degrees)
         * [7] get p-value of the straight line after Hough transformation
         * @return int&
         * @maixpy maix.image.Line.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x1;
            case 1: return _y1;
            case 2: return _x2;
            case 3: return _y2;
            case 4: return _length;
            case 5: return _magnitude;
            case 6: return _theta;
            case 7: return _rho;
            default:throw std::out_of_range("Line index out of range");
            }
        }

        /**
         * @brief get x1 of line
         * @return return x1 of the line, type is int
         * @maixpy maix.image.Line.x1
         */
        int x1()
        {
            return _x1;
        };

        /**
         * @brief get y1 of line
         * @return return y1 of the line, type is int
         * @maixpy maix.image.Line.y1
         */
        int y1()
        {
            return _y1;
        };

        /**
         * @brief get x2 of line
         * @return return x2 of the line, type is int
         * @maixpy maix.image.Line.x2
         */
        int x2()
        {
            return _x2;
        };

        /**
         * @brief get y2 of line
         * @return return y2 of the line, type is int
         * @maixpy maix.image.Line.y2
         */
        int y2()
        {
            return _y2;
        };

        /**
         * @brief get length of line
         * @return return length of the line, type is int
         * @maixpy maix.image.Line.length
         */
        int length()
        {
            return _length;
        };

        /**
         * @brief get magnitude of the straight line after Hough transformation
         * @return return magnitude, type is int
         * @maixpy maix.image.Line.magnitude
         */
        int magnitude()
        {
            return _magnitude;
        };

        /**
         * @brief get angle of the straight line after Hough transformation (0-179 degrees)
         * @return return angle, type is int
         * @maixpy maix.image.Line.theta
         */
        int theta()
        {
            return _theta;
        };

        /**
         * @brief get p-value of the straight line after Hough transformation
         * @return return p-value, type is int
         * @maixpy maix.image.Line.rho
         */
        int rho()
        {
            return _rho;
        };
    };

    /**
     * Rect class
     * @maixpy maix.image.Rect
    */
    class Rect
    {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        int _magnitude;
        std::vector<std::vector<int>> _corners;
    public:
        /**
         * Rect constructor
         * @param corners corners of rect
         * @param x coordinate x of the straight line
         * @param y coordinate y of the straight line
         * @param w coordinate w of the straight line
         * @param h coordinate h of the straight line
         * @param magnitude magnitude of the straight line after Hough transformation
         * @maixpy maix.image.Rect.__init__
        */
        Rect(std::vector<std::vector<int>> &corners, int x, int y, int w, int h, int magnitude = 0)
        {
            _x = x;
            _y = y;
            _w = w;
            _h = h;
            _magnitude = magnitude;
            _corners = corners;
        }
        ~Rect(){};

        /**
         * Subscript operator
         * @param index
         * [0] get x of rect
         * [1] get y of rect
         * [2] get w of rect
         * [3] get h of rect
         * [4] get magnitude of the straight line after Hough transformation
         * @return int&
         * @maixpy maix.image.Rect.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _w;
            case 3: return _h;
            case 4: return _magnitude;
            default:throw std::out_of_range("Rect index out of range");
            }
        }


        /**
         * @brief get corners of rect
         * @return return the coordinate of the rect.
         * @maixpy maix.image.Rect.corners
         */
        std::vector<std::vector<int>> corners() {
            return _corners;
        }

        /**
         * @brief get rectangle of rect
         * @return return the rectangle of the rect. format is {x, y, w, h}, type is std::vector<int>
         * @maixpy maix.image.Rect.rect
         */
        std::vector<int> rect() {
            std::vector<int> coord = {_x, _y, _w, _h};
            return coord;
        };

        /**
         * @brief get x of rect
         * @return return x of the rect, type is int
         * @maixpy maix.image.Rect.x
         */
        int x() {
            return _x;
        };

        /**
         * @brief get y of rect
         * @return return y of the rect, type is int
         * @maixpy maix.image.Rect.y
         */
         int y() {
            return _y;
         }

        /**
         * @brief get w of rect
         * @return return w of the rect, type is int
         * @maixpy maix.image.Rect.w
        */
        int w() {
            return _w;
        }

        /**
         * @brief get h of rect
         * @return return h of the rect, type is int
         * @maixpy maix.image.Rect.h
        */
        int h() {
            return _h;
        }

        /**
         * @brief get magnitude of the straight line after Hough transformation
         * @return return magnitude, type is int
         * @maixpy maix.image.Rect.magnitude
        */
        int magnitude() {
            return _magnitude;
        }
    };

    /**
     * circle class
     * @maixpy maix.image.Circle
     */
    class Circle
    {
    private:
        int _x;
        int _y;
        int _r;
        int _magnitude;
    public:
        /**
         * Circle constructor
         *
         * @param x coordinate x of the circle
         * @param y coordinate y of the circle
         * @param r coordinate r of the circle
         * @param magnitude coordinate y2 of the straight line
         * @maixpy maix.image.Circle.__init__
         */
        Circle(int x, int y, int r, int magnitude)
        {
            _x = x;
            _y = y;
            _r = r;
            _magnitude = magnitude;
        }
        ~Circle(){};

        /**
         * Subscript operator
         * @param index
         * [0] get x of circle
         * [1] get y of circle
         * [2] get r of circle
         * [3] get magnitude of the circle after Hough transformation
         * @return int&
         * @maixpy maix.image.Circle.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _r;
            case 3: return _magnitude;
            default:throw std::out_of_range("Circle index out of range");
            }
        }

        /**
         * @brief get x of circle
         * @return return x of the circle, type is int
         * @maixpy maix.image.Circle.x
         */
        int x()
        {
            return _x;
        };

        /**
         * @brief get y of circle
         * @return return y of the circle, type is int
         * @maixpy maix.image.Circle.y
         */
        int y()
        {
            return _y;
        };

        /**
         * @brief get r of circle
         * @return return r of the circle, type is int
         * @maixpy maix.image.Circle.r
         */
        int r()
        {
            return _r;
        };

        /**
         * @brief get magnitude of the circle after Hough transformation
         * @return return magnitude, type is int
         * @maixpy maix.image.Circle.magnitude
         */
        int magnitude()
        {
            return _magnitude;
        };
    };

    /**
     * Blob class
     * @maixpy maix.image.Blob
     */
    class Blob
    {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        int _cx;
        int _cy;
        int _rotation;
        float _cxf;
        float _cyf;
        int _pixels;
        float _rotation_f;
        int _code;
        int _count;
        int _merge_cnt;
        int _perimeter;
        int _roundness;
        std::vector<int> _x_hist_bins;
        std::vector<int> _y_hist_bins;
        std::vector<std::vector<int>> _corners;
        std::vector<std::vector<int>> _mini_corners;
    public:
        // /**
        //  * Blob constructor
        //  *
        //  * @param rect blob rect, type is 
        //  * @attention this constructor will be optimized in the future
        //  */
        // Blob(cv::RotatedRect &rect, int merge_cnt = 0)
        // {
        //     cv::Point2f box_points[4];
        //     rect.points(box_points);
        //     _x = box_points[0].x;
        //     _y = box_points[0].y;
        //     _w = rect.size.width;
        //     _h = rect.size.height;
        //     _cxf = rect.center.x;
        //     _cyf = rect.center.y;
        //     _cx = (int)rect.center.x;
        //     _cy = (int)rect.center.y;
        //     _rotation_f = rect.angle;
        //     _rotation = (int)_rotation_f;
        //     _merge_cnt = merge_cnt;
        //     for (int i = 0; i < 4; i++)
        //     {
        //         _corners.push_back({(int)box_points[i].x, (int)box_points[i].y});
        //     }
        // }

        /**
         * Blob constructor
         *
         * @param rect blob rect, type is std::vector<int>
         * @param corners blob corners, type is std::vector<std::vector<int>>
         * @param mini_corners blob mini_corners, type is std::vector<std::vector<int>>
         * @param cx blob center x, type is float
         * @param cy blob center y, type is float
         * @param pixels blob pixels, type is int
         * @param rotation blob rotation, type is float
         * @param code blob code, type is int
         * @param count blob count, type is int
         * @param perimeter blob perimeter, type is int
         * @param roundness blob roundness, type is float
         * @param x_hist_bins blob x_hist_bins, type is std::vector<int>
         * @param y_hist_bins blob y_hist_bins, type is std::vector<int>
         * @maixpy maix.image.Blob.__init__
         */
        Blob(std::vector<int> &rect, std::vector<std::vector<int>> &corners, std::vector<std::vector<int>> &mini_corners,float cx, float cy, int pixels, float rotation, int code, int count, int perimeter, float roundness, std::vector<int> &x_hist_bins, std::vector<int> &y_hist_bins)
        {
            _x = rect[0];
            _y = rect[1];
            _w = rect[2];
            _h = rect[3];
            _cxf = cx;
            _cyf = cy;
            _cx = (int)cx;
            _cy = (int)cy;
            _pixels = pixels;
            _rotation_f = rotation;
            _rotation = (int)_rotation_f;
            _code = code;
            _count = count;
            _perimeter = perimeter;
            _roundness = roundness;
            _x_hist_bins = x_hist_bins;
            _y_hist_bins = y_hist_bins;
            _corners = corners;
            _mini_corners = mini_corners;
        }

        ~Blob(){};

        /**
         * Subscript operator
         * @param index
         * [0] Returns the blob’s bounding box x coordinate
         * [1] Returns the blob’s bounding box y coordinate
         * [2] Returns the blob’s bounding box w coordinate
         * [3] Returns the blob’s bounding box h coordinate
         * [4] Returns the number of pixels that are part of this blob
         * [5] Returns the centroid x position of the blob
         * [6] Returns the centroid y position of the blob
         * @return int& width or height
         * @maixpy maix.image.Blob.__getitem__
         */
        int &__getitem__(int index)
        {
        switch (index) {
        case 0: return _x;
        case 1: return _y;
        case 2: return _w;
        case 3: return _h;
        case 4: return _pixels;
        case 5: return _cx;
        case 6: return _cy;
        case 7: return _rotation;
        default:throw std::out_of_range("Blob index out of range");
        }
        }

        /**
         * @brief get blob corners
         * @return Returns a list of 4 (x,y) tuples of the 4 corners of the object.
         *   (x0, y0)___________(x1, y1)
         *          |           |
         *          |           |
         *          |           |
         *          |___________|
         *   (x3, y3)           (x2, y2)
         * note: the order of corners may change
         * @maixpy maix.image.Blob.corners
         */
        std::vector<std::vector<int>> corners()
        {
            return _corners;
        }

        /**
         * @brief get blob mini corners
         * @return Returns a list of 4 (x,y) tuples of the 4 corners than bound the min area rectangle of the blob.
         *   (x0, y0)___________(x1, y1)
         *          |           |
         *          |           |
         *          |           |
         *          |___________|
         *   (x3, y3)           (x2, y2)
         * note: the order of corners may change
         * @maixpy maix.image.Blob.mini_corners
         */
        std::vector<std::vector<int>> mini_corners()
        {
            return _mini_corners;
        }

        /**
         * @brief get blob rect
         * @return Returns the center coordinates and width and height of the rectangle. format is (x, y, w, h)
         *               w
         *    (x, y) ___________
         *          |           |
         *          |           |  h
         *          |           |
         *          |___________|
         *
         * @maixpy maix.image.Blob.rect
         */
        std::vector<int> rect()
        {
            std::vector<int> rect = {_x, _y, _w, _h};
            return rect;
        };

        /**
         * @brief get blob x of the upper left coordinate
         * @return Returns the x coordinate of the upper left corner of the rectangle.
         * @maixpy maix.image.Blob.x
         */
        int x()
        {
            return _x;
        };

        /**
         * @brief get blob y of the upper left coordinate
         * @return Returns the y coordinate of the upper left corner of the rectangle.
         * @maixpy maix.image.Blob.y
         */
        int y()
        {
            return _y;
        };

        /**
         * @brief get blob width
         * @return Returns the blob’s bounding box w coordinate
         * @maixpy maix.image.Blob.w
         */
        int w()
        {
            return _w;
        };

        /**
         * @brief get blob height
         * @return Returns the blob’s bounding box h coordinate
         * @maixpy maix.image.Blob.h
         */
        int h()
        {
            return _h;
        };

        /**
         * @brief get blob pixels
         * @return Returns the number of pixels that are part of this blob.
         * @maixpy maix.image.Blob.pixels
         */
        int pixels()
        {
            return _pixels;
        };

        /**
         * @brief get blob center x
         * @return Returns the centroid x position of the blob
         * @maixpy maix.image.Blob.cx
         */
        int cx()
        {
            return _cx;
        };

        /**
         * @brief get blob center y
         * @return Returns the centroid y position of the blob
         * @maixpy maix.image.Blob.cy
         */
        int cy()
        {
            return _cy;
        };

        /**
         * @brief get blob center x
         * @return Returns the centroid x position of the blob
         * @maixpy maix.image.Blob.cxf
         */
        float cxf()
        {
            return _cxf;
        };

        /**
         * @brief get blob center y
         * @return Returns the centroid y position of the blob
         * @maixpy maix.image.Blob.cyf
         */
        float cyf()
        {
            return _cyf;
        };

        /**
         * @brief get blob rotation
         * @return Returns the rotation of the blob in radians (float). If the blob is like a pencil or pen this value will be unique for 0-180 degrees.
         * @maixpy maix.image.Blob.rotation
         */
        float rotation()
        {
            return _rotation_f;
        };

        /**
         * @brief get blob rotation_rad
         * @return Returns the rotation of the blob in radians
         * @maixpy maix.image.Blob.rotation_rad
         */
        float rotation_rad()
        {
            return _rotation_f;
        };

        /**
         * @brief get blob rotation_deg
         * @return Returns the rotation of the blob in degrees.
         * @maixpy maix.image.Blob.rotation_deg
         */
        int rotation_deg()
        {
            return _rotation * 180 / 3.1415926;
        };

        /**
         * @brief get blob code
         * @return Returns a 32-bit binary number with a bit set in it for each color threshold that’s part of this blob
         * @maixpy maix.image.Blob.code
         */
        int code() {
            return _code;
        }

        /**
         * @brief get blob count
         * @return Returns the number of blobs merged into this blob.
         * @maixpy maix.image.Blob.count
         */
        int count() {
            return _count;
        }

        /**
         * @brief get blob merge_cnt
         * @return Returns the number of pixels on this blob’s perimeter.
         * @maixpy maix.image.Blob.perimeter
         */
        int perimeter() {
            return _perimeter;
        }

        /**
         * @brief get blob roundness
         * @return Returns a value between 0 and 1 representing how round the object is
         * @maixpy maix.image.Blob.roundness
         */
        float roundness() {
            return _roundness;
        }

        /**
         * @brief get blob elongation
         * @returnReturns a value between 0 and 1 representing how long (not round) the object is
         * @maixpy maix.image.Blob.elongation
         */
        float elongation() {
            return 1 - _roundness;
        }

        /**
         * @brief get blob area
         * @return Returns the area of the bounding box around the blob
         * @maixpy maix.image.Blob.area
         */
        int area()
        {
            return _w * _h;
        };

        /**
         * @brief get blob density
         * @return Returns the density ratio of the blob
         * @maixpy maix.image.Blob.density
         */
        float density() {
            int area = _w * _h;
            if (area == 0) {
                return 0;
            }
            return (float)_pixels / (float)(_w * _h);
        }

        /**
         * @brief Alias for blob.density()
         * @return Returns the density ratio of the blob
         * @maixpy maix.image.Blob.extent
         */
        float extent() {
            return this->density();
        }

        /**
         * @brief get blob compactness
         * @return Returns the compactness ratio of the blob
         * @maixpy maix.image.Blob.compactness
         */
        float compactness() {
            float perimeter = _perimeter;
            if (perimeter == 0) {
                return 0;
            }
            return (_pixels * 4 * 3.1415926) / (perimeter * perimeter);
        }

        /**
         * @brief get blob solidity
         * @return Returns the solidity ratio of the blob
         * @maixpy maix.image.Blob.solidity
         */
        float solidity()  {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];
            float min_area = (((x0 * y1) + (x1 * y2) + (x2 * y3) + (x3 * y0)) - ((y0 * x1) + (y1 * x2) + (y2 * x3) + (y3 * x0))) / 2.0f;
            if (min_area == 0) {
                return 0;
            }
            int pixels = _pixels;
            float solidity = (float)pixels / min_area;
            return solidity > 1 ? 1 : solidity;
        }

        /**
         * @brief get blob convexity
         * @return Returns a value between 0 and 1 representing how convex the object is
         * @maixpy maix.image.Blob.convexity
         */
        float convexity() {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];

            float d0 = sqrtf((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
            float d1 = sqrtf((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
            float d2 = sqrtf((x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3));
            float d3 = sqrtf((x3 - x0) * (x3 - x0) + (y3 - y0) * (y3 - y0));
            int perimeter = _perimeter;
            if (perimeter == 0) {
                return 0;
            }
            float convexity = (d0 + d1 + d2 + d3) / perimeter;
            return convexity > 1 ? convexity : 1;
        }

        /**
         * @brief get blob x_hist_bins
         * @return Returns the x_hist_bins of the blob
         * @maixpy maix.image.Blob.x_hist_bins
         */
        std::vector<int> x_hist_bins() {
            return _x_hist_bins;
        }

        /**
         * @brief get blob y_hist_bins
         * @return Returns the y_hist_bins of the blob
         * @maixpy maix.image.Blob.y_hist_bins
         */
        std::vector<int> y_hist_bins() {
            return _y_hist_bins;
        }

        /**
         * @brief get blob major_axis_line
         * @return Returns a line tuple (x1, y1, x2, y2) of the minor axis of the blob.
         * @maixpy maix.image.Blob.major_axis_line
         */
        std::vector<int> major_axis_line() {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];

            int m0x = (x0 + x1) / 2;
            int m0y = (y0 + y1) / 2;
            int m1x = (x1 + x2) / 2;
            int m1y = (y1 + y2) / 2;
            int m2x = (x2 + x3) / 2;
            int m2y = (y2 + y3) / 2;
            int m3x = (x3 + x0) / 2;
            int m3y = (y3 + y0) / 2;

            float l0 = sqrtf((m0x - m2x) * (m0x - m2x) + (m0y - m2y) * (m0y - m2y));
            float l1 = sqrtf((m1x - m3x) * (m1x - m3x) + (m1y - m3y) * (m1y - m3y));

            if (l0 > l1) {
                return {m0x, m0y, m2x, m2y};
            } else {
                return {m1x, m1y, m3x, m3y};
            }
        }

        /**
         * @brief get blob minor_axis_line
         * @return Returns a line tuple (x1, y1, x2, y2) of the minor axis of the blob.
         * @maixpy maix.image.Blob.minor_axis_line
         */
        std::vector<int> minor_axis_line() {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];

            int m0x = (x0 + x1) / 2;
            int m0y = (y0 + y1) / 2;
            int m1x = (x1 + x2) / 2;
            int m1y = (y1 + y2) / 2;
            int m2x = (x2 + x3) / 2;
            int m2y = (y2 + y3) / 2;
            int m3x = (x3 + x0) / 2;
            int m3y = (y3 + y0) / 2;

            float l0 = sqrtf((m0x - m2x) * (m0x - m2x) + (m0y - m2y) * (m0y - m2y));
            float l1 = sqrtf((m1x - m3x) * (m1x - m3x) + (m1y - m3y) * (m1y - m3y));

            if (l0 < l1) {
                return {m0x, m0y, m2x, m2y};
            } else {
                return {m1x, m1y, m3x, m3y};
            }
        }

        /**
         * @brief get blob enclosing_circle
         * @return Returns a circle tuple (x, y, r) of the circle that encloses the min area rectangle of a blob.
         * @maixpy maix.image.Blob.enclosing_circle
         */
        std::vector<int> enclosing_circle() {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];

            int cx = (x0 + x1 + x2 + x3) / 4;
            int cy = (y0 + y1 + y2 + y3) / 4;

            float d0 = sqrtf((x0 - cx) * (x0 - cx) + (y0 - cy) * (y0 - cy));
            float d1 = sqrtf((x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy));
            float d2 = sqrtf((x2 - cx) * (x2 - cx) + (y2 - cy) * (y2 - cy));
            float d3 = sqrtf((x3 - cx) * (x3 - cx) + (y3 - cy) * (y3 - cy));
            float d = std::max(d0, std::max(d1, std::max(d2, d3)));

            return {cx, cy, (int)d};
        }

        /**
         * @brief get blob enclosed_ellipse
         * @return Returns an ellipse tuple (x, y, rx, ry, rotation) of the ellipse that fits inside of the min area rectangle of a blob.
         * @maixpy maix.image.Blob.enclosed_ellipse
         */
        std::vector<int> enclosed_ellipse() {
            int x0, y0, x1, y1, x2, y2, x3, y3;
            x0 = _corners[0][0];
            y0 = _corners[0][1];
            x1 = _corners[1][0];
            y1 = _corners[1][1];
            x2 = _corners[2][0];
            y2 = _corners[2][1];
            x3 = _corners[3][0];
            y3 = _corners[3][1];

            int m0x = (x0 + x1) / 2;
            int m0y = (y0 + y1) / 2;
            int m1x = (x1 + x2) / 2;
            int m1y = (y1 + y2) / 2;
            int m2x = (x2 + x3) / 2;
            int m2y = (y2 + y3) / 2;
            int m3x = (x3 + x0) / 2;
            int m3y = (y3 + y0) / 2;

            int cx = (x0 + x1 + x2 + x3) / 4;
            int cy = (y0 + y1 + y2 + y3) / 4;

            float d0 = sqrtf((m0x - cx) * (m0x - cx) + (m0y - cy) * (m0y - cy));
            float d1 = sqrtf((m1x - cx) * (m1x - cx) + (m1y - cy) * (m1y - cy));
            float d2 = sqrtf((m2x - cx) * (m2x - cx) + (m2y - cy) * (m2y - cy));
            float d3 = sqrtf((m3x - cx) * (m3x - cx) + (m3y - cy) * (m3y - cy));
            float a = std::min(d0, d2);
            float b = std::min(d1, d3);

            float l0 = sqrtf((m0x - m2x) * (m0x - m2x) + (m0y - m2y) * (m0y - m2y));
            float l1 = sqrtf((m1x - m3x) * (m1x - m3x) + (m1y - m3y) * (m1y - m3y));

            float r;
            if (l0 >= l1) {
                if (m0x - m2x == 0)
                    r = 0;
                else
                    r = atan2f(m0y - m2y, m0x - m2x);
            } else {
                if (m1x - m3x == 0)
                    r = 3.1415926 / 2;
                else
                    r = atan2f(m1y - m3y, m1x - m3x) + 3.1415926 / 2;
            }
            return {cx, cy, (int)a, (int)b, (int)r};
        }
    }; // class Blob

    /**
     * QRCode class
     * @maixpy maix.image.QRCode
     */
    class QRCode
    {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        std::string _payload;
        int _version;
        int _ecc_level;
        int _mask;
        int _data_type;
        int _eci;
        std::vector<std::vector<int>> _corners;
    public:
        /**
         * QRCode constructor
         *
         * @param rect rect of corners, type is std::vector<int>
         * @param corners corners of QRCode
         * @param payload payload of the QRCode
         * @param version version of the QRCode
         * @param ecc_level ecc_level of the QRCode
         * @param mask mask of the QRCode
         * @param data_type data_type of the QRCode
         * @param eci eci of the QRCode
         * @maixpy maix.image.QRCode.__init__
         */
        QRCode(std::vector<int> &rect, std::vector<std::vector<int>> &corners, std::string &payload, int version, int ecc_level, int mask, int data_type, int eci)
        {
            _x = rect[0];
            _y = rect[1];
            _w = rect[2];
            _h = rect[3];
            _payload = payload;
            _version = version;
            _ecc_level = ecc_level;
            _mask = mask;
            _data_type = data_type;
            _eci = eci;
            _corners = corners;
        }

        ~QRCode(){};

        /**
         * Subscript operator
         * @param index
         * [0] Returns the qrcode’s bounding box x coordinate
         * [1] Returns the qrcode’s bounding box y coordinate
         * [2] Returns the qrcode’s bounding box w coordinate
         * [3] Returns the qrcode’s bounding box h coordinate
         * [4] Not support this index, try to use payload() method
         * [5] Returns the version of qrcode
         * [6] Returns the error correction level of qrcode
         * [7] Returns the mask of qrcode
         * [8] Returns the datatype of qrcode
         * [9] Returns the eci of qrcode
         * @return int&
         * @maixpy maix.image.QRCode.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _w;
            case 3: return _h;
            case 4: throw err::Exception("Not support this index, try to use payload() method");
            case 5: return _version;
            case 6: return _ecc_level;
            case 7: return _mask;
            case 8: return _data_type;
            case 9: return _eci;
            default:throw std::out_of_range("QRcode index out of range");
            }
        }

        /**
         * @brief get coordinate of QRCode
         * @return return the coordinate of the QRCode.
         * @maixpy maix.image.QRCode.corners
         */
        std::vector<std::vector<int>> corners() {
            return _corners;
        }

        /**
         * @brief get rectangle of QRCode
         * @return return the rectangle of the QRCode. format is {x, y, w, h}, type is std::vector<int>
         * @maixpy maix.image.QRCode.rect
         */
        std::vector<int> rect() {
            std::vector<int> coord = {_x, _y, _w, _h};
            return coord;
        }

        /**
         * @brief get x of QRCode
         * @return return x of the QRCode, type is int
         * @maixpy maix.image.QRCode.x
         */
        int x() {
            return _x;
        }

        /**
         * @brief get y of QRCode
         * @return return y of the QRCode, type is int
         * @maixpy maix.image.QRCode.y
         */
        int y() {
            return _y;
        }

        /**
         * @brief get w of QRCode
         * @return return w of the QRCode, type is int
         * @maixpy maix.image.QRCode.w
         */
        int w() {
            return _w;
        }

        /**
         * @brief get h of QRCode
         * @return return h of the QRCode, type is int
         * @maixpy maix.image.QRCode.h
         */
        int h() {
            return _h;
        }

        /**
         * @brief get QRCode payload
         * @return return area of the QRCode
         * @maixpy maix.image.QRCode.payload
         */
        std::string payload() {
            return _payload;
        }

        /**
         * @brief get QRCode version
         * @return return version of the QRCode
         * @maixpy maix.image.QRCode.version
         */
        int version() {
            return _version;
        }

        /**
         * @brief get QRCode error correction level
         * @return return error correction level of the QRCode
         * @maixpy maix.image.QRCode.ecc_level
         */
        int ecc_level() {
            return _ecc_level;
        }

        /**
         * @brief get QRCode mask
         * @return return mask of the QRCode
         * @maixpy maix.image.QRCode.mask
         */
        int mask() {
            return _mask;
        }

        /**
         * @brief get QRCode dataType
         * @return return mask of the QRCode
         * @maixpy maix.image.QRCode.data_type
         */
        int data_type() {
            return _data_type;
        }

        /**
         * @brief get QRCode eci
         * @return return data of the QRCode
         * @maixpy maix.image.QRCode.eci
         */
        int eci() {
            return _eci;
        }

        /**
         * @brief check QRCode is numeric
         * @return return true if the result type of the QRCode is numeric
         * @maixpy maix.image.QRCode.is_numeric
         */
        bool is_numeric() {
            return _data_type == 1;
        }

        /**
         * @brief check QRCode is alphanumeric
         * @return return true if the result type of the QRCode is alphanumeric
         * @maixpy maix.image.QRCode.is_alphanumeric
         */
        bool is_alphanumeric() {
            return _data_type == 2;
        }

        /**
         * @brief check QRCode is binary
         * @return return true if the result type of the QRCode is binary
         * @maixpy maix.image.QRCode.is_binary
         */
        bool is_binary() {
            return _data_type == 4;
        }

        /**
         * @brief check QRCode is kanji
         * @return return true if the result type of the QRCode is kanji
         * @maixpy maix.image.QRCode.is_kanji
         */
        bool is_kanji() {
            return _data_type == 8;
        }
    }; // class QRCode

    /**
     * AprilTag class
     * @maixpy maix.image.AprilTag
     */
    class AprilTag
    {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        int _id;
        std::vector<std::vector<int>> _corners;
        int _family;
        float _cx;
        float _cy;
        float _rotation;
        float _decision_margin;
        int _hamming;
        float _goodness;
        float _x_translation;
        float _y_translation;
        float _z_translation;
        float _x_rotation;
        float _y_rotation;
        float _z_rotation;
    public:
        /**
         * AprilTag constructor
         *
         * @param rect Inlucdes the top-left corner and the width and height of the rectangle. format is {x, y, w, h}, type is std::vector<int>
         * @param corners Includes the four corners of the rectangle. format is {{x0, y0}, {x1, y1}, {x2, y2}, {x3, y3}}, type is std::vector<std::vector<int>>
         * @param id The id of the AprilTag
         * @param famliy The family of the AprilTag
         * @param centroid_x The x coordinate of the center of the AprilTag
         * @param centroid_y The y coordinate of the center of the AprilTag
         * @param rotation The rotation of the AprilTag
         * @param decision_margin The decision_margin of the AprilTag
         * @param hamming The hamming of the AprilTag
         * @param goodness The goodness of the AprilTag
         * @param x_translation The x_translation of the AprilTag
         * @param y_translation The y_translation of the AprilTag
         * @param z_translation The z_translation of the AprilTag
         * @param x_rotation The x_rotation of the AprilTag
         * @param y_rotation The y_rotation of the AprilTag
         * @param z_rotation The z_rotation of the AprilTag
         * @maixpy maix.image.AprilTag.__init__
        */
        AprilTag(std::vector<int> &rect, std::vector<std::vector<int>> &corners, int id, int famliy, float centroid_x, float centroid_y, float rotation, float decision_margin, int hamming, float goodness, float x_translation, float y_translation, float z_translation, float x_rotation, float y_rotation, float z_rotation)
        {
            _x = rect[0];
            _y = rect[1];
            _w = rect[2];
            _h = rect[3];
            _corners = corners;
            _id = id;
            _family = famliy;
            _cx = centroid_x;
            _cy = centroid_y;
            _rotation = rotation;
            _decision_margin = decision_margin;
            _hamming = hamming;
            _goodness = goodness;
            _x_translation = x_translation;
            _y_translation = y_translation;
            _z_translation = z_translation;
            _x_rotation = x_rotation;
            _y_rotation = y_rotation;
            _z_rotation = z_rotation;
        }

        ~AprilTag(){};

        /**
         * Subscript operator
         * @param index
         * [0] Returns the apriltag’s bounding box x coordinate
         * [1] Returns the apriltag’s bounding box y coordinate
         * [2] Returns the apriltag’s bounding box w coordinate
         * [3] Returns the apriltag’s bounding box h coordinate
         * [4] Returns the apriltag’s id
         * [5] Returns the apriltag’s family
         * [6] Not support
         * [7] Not support
         * [8] Not support
         * [9] Not support
         * [10] Returns the apriltag’s hamming
         * [11] Not support
         * [12] Not support
         * [13] Not support
         * [14] Not support
         * [15] Not support
         * [16] Not support
         * [17] Not support
         * @return int&
         * @maixpy maix.image.AprilTag.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _w;
            case 3: return _h;
            case 4: return _id;
            case 5: return _family;
            case 6: throw err::Exception("Not support this index, try to use cxf() method");
            case 7: throw err::Exception("Not support this index, try to use cyf() method");
            case 8: throw err::Exception("Not support this index, try to use rotation() method");
            case 9: throw err::Exception("Not support this index, try to use decision_margin() method");
            case 10: return _hamming;
            case 11: throw err::Exception("Not support this index, try to use goodness() method");
            case 12: throw err::Exception("Not support this index, try to use x_translation() method");
            case 13: throw err::Exception("Not support this index, try to use y_translation() method");
            case 14: throw err::Exception("Not support this index, try to use z_translation() method");
            case 15: throw err::Exception("Not support this index, try to use x_rotation() method");
            case 16: throw err::Exception("Not support this index, try to use y_rotation() method");
            case 17: throw err::Exception("Not support this index, try to use z_rotation() method");
            default:throw std::out_of_range("Apriltag index out of range");
            }
        }

        /**
         * @brief get coordinate of AprilTag
         * @return return the coordinate of the AprilTag.
         * @maixpy maix.image.AprilTag.corners
         */
        std::vector<std::vector<int>> corners() {
            return _corners;
        }

        /**
         * @brief get rectangle of AprilTag
         * @return return the rectangle of the AprilTag. format is {x, y, w, h}, type is std::vector<int>
         * @maixpy maix.image.AprilTag.rect
         */
        std::vector<int> rect() {
            return {_x, _y, _w, _h};
        }

        /**
         * @brief get x of AprilTag
         * @return return x of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.x
         */
        int x() {
            return _x;
        }

        /**
         * @brief get y of AprilTag
         * @return return y of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.y
         */
        int y() {
            return _y;
        }

        /**
         * @brief get w of AprilTag
         * @return return w of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.w
         */
        int w() {
            return _w;
        }

        /**
         * @brief get h of AprilTag
         * @return return h of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.h
         */
        int h() {
            return _h;
        }

        /**
         * @brief get id of AprilTag
         * @return return id of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.id
         */
        int id() {
            return _id;
        }

        /**
         * @brief get family of AprilTag
         * @return return family of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.family
         */
        int family()  {
            return _family;
        }

        /**
         * @brief get cx of AprilTag
         * @return return cx of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.cx
        */
        int cx() {
            return (int)_cx;
        }

        /**
         * @brief get cxf of AprilTag
         * @return return cxf of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.cxf
        */
        float cxf() {
            return _cx;
        }

        /**
         * @brief get cy of AprilTag
         * @return return cy of the AprilTag, type is int
         * @maixpy maix.image.AprilTag.cy
        */
        int cy() {
            return (int)_cy;
        }

        /**
         * @brief get cyf of AprilTag
         * @return return cyf of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.cyf
        */
        float cyf() {
            return _cy;
        }

        /**
         * @brief get rotation of AprilTag
         * @return return rotation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.rotation
        */
        float rotation() {
            return _rotation;
        }

        /**
         * @brief Get decision_margin of AprilTag
         * @return Returns the quality of the apriltag match (0.0 - 1.0) where 1.0 is the best.
         * @maixpy maix.image.AprilTag.decision_margin
        */
        float decision_margin() {
            return _decision_margin;
        }

        /**
         * @brief get hamming of AprilTag
         * @return Returns the number of accepted bit errors for this tag.
         * return 0, means 0 bit errors will be accepted.
         * 1 is TAG25H7, means up to 1 bit error may be accepted
         * 2 is TAG25H9, means up to 3 bit errors may be accepted
         * 3 is TAG36H10, means up to 3 bit errors may be accepted
         * 4 is TAG36H11, means up to 4 bit errors may be accepted
         * 5 is ARTOOLKIT, means 0 bit errors will be accepted
         * @maixpy maix.image.AprilTag.hamming
         */
        int hamming() {
            return _hamming;
        }

        /**
         * @brief get goodness of AprilTag
         * @return return goodness of the AprilTag, type is float
         * Note: This value is always 0.0 for now.
         * @maixpy maix.image.AprilTag.goodness
         */
        float goodness() {
            return _goodness;
        }

        /**
         * @brief get x_translation of AprilTag
         * @return return x_translation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.x_translation
         */
        float x_translation() {
            return _x_translation;
        }

        /**
         * @brief get y_translation of AprilTag
         * @return return y_translation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.y_translation
         */
        float y_translation() {
            return _y_translation;
        }

        /**
         * @brief get z_translation of AprilTag
         * @return return z_translation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.z_translation
         */
        float z_translation() {
            return _z_translation;
        }

        /**
         * @brief get x_rotation of AprilTag
         * @return return x_rotation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.x_rotation
         */
        float x_rotation() {
            return _x_rotation;
        }

        /**
         * @brief get y_rotation of AprilTag
         * @return return y_rotation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.y_rotation
         */
        float y_rotation() {
            return _y_rotation;
        }

        /**
         * @brief get z_rotation of AprilTag
         * @return return z_rotation of the AprilTag, type is float
         * @maixpy maix.image.AprilTag.z_rotation
         */
        float z_rotation() {
            return _z_rotation;
        }
    };

    /**
     * DataMatrix class
     * @maixpy maix.image.DataMatrix
     */
    class DataMatrix
    {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        std::vector<std::vector<int>> _corners;
        std::string _payload;
        float _rotation;
        int _rows;
        int _columns;
        int _capacity;
        int _padding;
    public:
        /**
         * DataMatrix constructor
         *
         * @param rect Inlucdes the top-left corner and the width and height of the rectangle. format is {x, y, w, h}, type is std::vector<int>
         * @param corners Includes the four corners of the rectangle. format is {{x0, y0}, {x1, y1}, {x2, y2}, {x3, y3}}, type is std::vector<std::vector<int>>
         * @param payload The payload of the DataMatrix
         * @param rotation The rotation of the DataMatrix
         * @param rows The rows of the DataMatrix
         * @param columns The columns of the DataMatrix
         * @param capacity The capacity of the DataMatrix
         * @param padding The padding of the DataMatrix
         * @maixpy maix.image.DataMatrix.__init__
        */
        DataMatrix(std::vector<int> &rect, std::vector<std::vector<int>> &corners, std::string &payload, float rotation, int rows, int columns, int capacity, int padding)
        {
            _x = rect[0];
            _y = rect[1];
            _w = rect[2];
            _h = rect[3];
            _corners = corners;
            _payload = payload;
            _rotation = rotation;
            _rows = rows;
            _columns = columns;
            _capacity = capacity;
            _padding = padding;
        }

        ~DataMatrix(){};

        /**
         * Subscript operator
         * @param index
         * [0] get x of DataMatrix
         * [1] get y of DataMatrix
         * [2] get w of DataMatrix
         * [3] get h of DataMatrix
         * [4] Not support this index, try to use payload() method
         * [5] Not support this index, try to use rotation() method
         * [6] get rows of DataMatrix
         * [7] get columns of DataMatrix
         * [8] get capacity of DataMatrix
         * [9] get padding of DataMatrix
         * @return int&
         * @maixpy maix.image.DataMatrix.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _w;
            case 3: return _h;
            case 4: throw err::Exception("Not support this index, try to use payload() method");
            case 5: throw err::Exception("Not support this index, try to use ratation() method");
            case 6: return _rows;
            case 7: return _columns;
            case 8: return _capacity;
            case 9: return _padding;
            default:throw std::out_of_range("DataMatrix index out of range");
            }
        }

        /**
         * @brief get coordinate of DataMatrix
         * @return return the coordinate of the DataMatrix.
         * @maixpy maix.image.DataMatrix.corners
         */
        std::vector<std::vector<int>> corners() {
            return _corners;
        }

        /**
         * @brief get rectangle of DataMatrix
         * @return return the rectangle of the DataMatrix. format is {x, y, w, h}, type is std::vector<int>
         * @maixpy maix.image.DataMatrix.rect
         */
        std::vector<int> rect() {
            return {_x, _y, _w, _h};
        }

        /**
         * @brief get x of DataMatrix
         * @return return x of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.x
         */
        int x() {
            return _x;
        }

        /**
         * @brief get y of DataMatrix
         * @return return y of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.y
         */
        int y() {
            return _y;
        }

        /**
         * @brief get w of DataMatrix
         * @return return w of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.w
         */
        int w() {
            return _w;
        }

        /**
         * @brief get h of DataMatrix
         * @return return h of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.h
         */
        int h() {
            return _h;
        }

        /**
         * @brief get payload of DataMatrix
         * @return return payload of the DataMatrix, type is std::string
         * @maixpy maix.image.DataMatrix.payload
         */
        std::string payload() {
            return _payload;
        }

        /**
         * @brief get rotation of DataMatrix
         * @return return rotation of the DataMatrix, type is float
         * @maixpy maix.image.DataMatrix.rotation
         */
        float rotation() {
            return _rotation;
        }

        /**
         * @brief get rows of DataMatrix
         * @return return rows of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.rows
         */
        int rows() {
            return _rows;
        }

        /**
         * @brief get columns of DataMatrix
         * @return return columns of the DataMatrix, type is int
         * @maixpy maix.image.DataMatrix.columns
         */
        int columns() {
            return _columns;
        }

        /**
         * @brief get capacity of DataMatrix
         * @return returns how many characters could fit in this data matrix, type is int
         * @maixpy maix.image.DataMatrix.capacity
         */
        int capacity() {
            return _capacity;
        }

        /**
         * @brief get padding of DataMatrix
         * @return returns how many unused characters are in this data matrix, type is int
         * @maixpy maix.image.DataMatrix.padding
         */
        int padding() {
            return _padding;
        }
    };

    /**
     * BarCode class
     * @maixpy maix.image.BarCode
     */
    class BarCode {
    private:
        int _x;
        int _y;
        int _w;
        int _h;
        std::vector<std::vector<int>> _corners;
        std::string _payload;
        int _type;
        float _rotation;
        int _quality;
    public:
        /**
         * BarCode constructor
         *
         * @param rect Inlucdes the top-left corner and the width and height of the rectangle. format is {x, y, w, h}, type is std::vector<int>
         * @param corners Includes the four corners of the rectangle. format is {{x0, y0}, {x1, y1}, {x2, y2}, {x3, y3}}, type is std::vector<std::vector<int>>
         * @param payload The payload of the BarCode
         * @param type The type of the BarCode
         * @param rotation The rotation of the BarCode
         * @param quality The quality of the BarCode
         * @maixpy maix.image.BarCode.__init__
        */
        BarCode(std::vector<int> &rect, std::vector<std::vector<int>> &corners, std::string &payload, int type, float rotation, int quality)
        {
            _x = rect[0];
            _y = rect[1];
            _w = rect[2];
            _h = rect[3];
            _corners = corners;
            _payload = payload;
            _type = type;
            _rotation = rotation;
            _quality = quality;
        }

        ~BarCode(){};

        /**
         * Subscript operator
         * @param index
         * [0] get x of BarCode
         * [1] get y of BarCode
         * [2] get w of BarCode
         * [3] get h of BarCode
         * [4] Not support this index, try to use payload() method
         * [5] get type of BarCode
         * [6] Not support this index, try to use rotation() method
         * [7] get quality of BarCode
         * @return int&
         * @maixpy maix.image.BarCode.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _x;
            case 1: return _y;
            case 2: return _w;
            case 3: return _h;
            case 4: throw err::Exception("Not support this index, try to use payload() method");
            case 5: return _type;
            case 6: throw err::Exception("Not support this index, try to use rotation() method");
            case 7: return _quality;
            default:throw std::out_of_range("BarCode index out of range");
            }
        }

        /**
         * @brief get coordinate of BarCode
         * @return return the coordinate of the BarCode.
         * @maixpy maix.image.BarCode.corners
         */
        std::vector<std::vector<int>> corners() {
            return _corners;
        }

        /**
         * @brief get rectangle of BarCode
         * @return return the rectangle of the BarCode. format is {x, y, w, h}, type is std::vector<int>
         * @maixpy maix.image.BarCode.rect
         */
        std::vector<int> rect() {
            return {_x, _y, _w, _h};
        }

        /**
         * @brief get x of BarCode
         * @return return x of the BarCode, type is int
         * @maixpy maix.image.BarCode.x
         */
        int x() {
            return _x;
        }

        /**
         * @brief get y of BarCode
         * @return return y of the BarCode, type is int
         * @maixpy maix.image.BarCode.y
         */
        int y() {
            return _y;
        }

        /**
         * @brief get w of BarCode
         * @return return w of the BarCode, type is int
         * @maixpy maix.image.BarCode.w
         */
        int w() {
            return _w;
        }

        /**
         * @brief get h of BarCode
         * @return return h of the BarCode, type is int
         * @maixpy maix.image.BarCode.h
         */
        int h() {
            return _h;
        }

        /**
         * @brief get payload of BarCode
         * @return return payload of the BarCode, type is std::string
         * @maixpy maix.image.BarCode.payload
         */
        std::string payload() {
            return _payload;
        }

        /**
         * @brief get type of BarCode
         * @return return type of the BarCode, type is int
         * @maixpy maix.image.BarCode.type
         */
        int type() {
            return _type;
        }

        /**
         * @brief get rotation of BarCode
         * @return return rotation of the BarCode, type is float. FIXME: always return 0.0
         * @maixpy maix.image.BarCode.rotation
         */
        float rotation() {
            return _rotation;
        }

        /**
         * @brief get quality of BarCode
         * @return return quality of the BarCode, type is int
         * @maixpy maix.image.BarCode.quality
         */
        int quality() {
            return _quality;
        }
    };

    /**
     * Statistics class
     * @maixpy maix.image.Statistics
     */
    class Statistics {
    private:
        int _l_mean;
        int _l_median;
        int _l_mode;
        int _l_std_dev;
        int _l_min;
        int _l_max;
        int _l_lq;
        int _l_uq;

        int _a_mean;
        int _a_median;
        int _a_mode;
        int _a_std_dev;
        int _a_min;
        int _a_max;
        int _a_lq;
        int _a_uq;

        int _b_mean;
        int _b_median;
        int _b_mode;
        int _b_std_dev;
        int _b_min;
        int _b_max;
        int _b_lq;
        int _b_uq;

        image::Format _format;
    public:
        /**
         * Statistics constructor
         *
         * @param format The statistics source image format
         * @param l_statistics The statistics of the L channel. format is {mean, median, mode, std_dev, min, max, lq, uq}, type is std::vector<int>
         * @param a_statistics The statistics of the A channel. format is {mean, median, mode, std_dev, min, max, lq, uq}, type is std::vector<int>
         * @param b_statistics The statistics of the B channel. format is {mean, median, mode, std_dev, min, max, lq, uq}, type is std::vector<int>
         * @maixpy maix.image.Statistics.__init__
        */
        Statistics(image::Format format, std::vector<int> &l_statistics, std::vector<int> &a_statistics, std::vector<int> &b_statistics)
        {
            err::check_bool_raise((l_statistics.size() == 8) || (a_statistics.size() == 8) || (b_statistics.size() == 8), "statistics size must be 8");

            _l_mean = l_statistics[0];
            _l_median = l_statistics[1];
            _l_mode = l_statistics[2];
            _l_std_dev = l_statistics[3];
            _l_min = l_statistics[4];
            _l_max = l_statistics[5];
            _l_lq = l_statistics[6];
            _l_uq = l_statistics[7];

            _a_mean = a_statistics[0];
            _a_median = a_statistics[1];
            _a_mode = a_statistics[2];
            _a_std_dev = a_statistics[3];
            _a_min = a_statistics[4];
            _a_max = a_statistics[5];
            _a_lq = a_statistics[6];
            _a_uq = a_statistics[7];

            _b_mean = b_statistics[0];
            _b_median = b_statistics[1];
            _b_mode = b_statistics[2];
            _b_std_dev = b_statistics[3];
            _b_min = b_statistics[4];
            _b_max = b_statistics[5];
            _b_lq = b_statistics[6];
            _b_uq = b_statistics[7];

            _format = format;
        }
        Statistics(){};
        ~Statistics(){};

        /**
         * Subscript operator
         * @param index array index
         * @return int&
         * @maixpy maix.image.Statistics.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: return _l_mean;
            case 1: return _l_median;
            case 2: return _l_mode;
            case 3: return _l_std_dev;
            case 4: return _l_min;
            case 5: return _l_max;
            case 6: return _l_lq;
            case 7: return _l_uq;
            case 8: return _a_mean;
            case 9: return _a_median;
            case 10: return _a_mode;
            case 11: return _a_std_dev;
            case 12: return _a_min;
            case 13: return _a_max;
            case 14: return _a_lq;
            case 15: return _a_uq;
            case 16: return _b_mean;
            case 17: return _b_median;
            case 18: return _b_mode;
            case 19: return _b_std_dev;
            case 20: return _b_min;
            case 21: return _b_max;
            case 22: return _b_lq;
            case 23: return _b_uq;
            default:throw std::out_of_range("Statistics index out of range");
            }
        }

        /**
         * @brief get format of Statistics source image
         * @return return format of the Statistics source image, type is image::Format
         * @maixpy maix.image.Statistics.format
         */
        image::Format format() {
            return _format;
        }

        /**
         * @brief get L channel mean
         * @return return L channel mean, type is int
         * @maixpy maix.image.Statistics.l_mean
         */
        int l_mean() {
            return _l_mean;
        }

        /**
         * @brief get L channel median
         * @return return L channel median, type is int
         * @maixpy maix.image.Statistics.l_median
         */
        int l_median() {
            return _l_median;
        }

        /**
         * @brief get L channel mode
         * @return return L channel mode, type is int
         * @maixpy maix.image.Statistics.l_mode
         */
        int l_mode() {
            return _l_mode;
        }

        /**
         * @brief get L channel std_dev
         * @return return L channel std_dev, type is int
         * @maixpy maix.image.Statistics.l_std_dev
         */
        int l_std_dev() {
            return _l_std_dev;
        }

        /**
         * @brief get L channel min
         * @return return L channel min, type is int
         * @maixpy maix.image.Statistics.l_min
         */
        int l_min() {
            return _l_min;
        }

        /**
         * @brief get L channel max
         * @return return L channel max, type is int
         * @maixpy maix.image.Statistics.l_max
         */
        int l_max() {
            return _l_max;
        }

        /**
         * @brief get L channel lq
         * @return return L channel lq, type is int
         * @maixpy maix.image.Statistics.l_lq
         */
        int l_lq() {
            return _l_lq;
        }

        /**
         * @brief get L channel uq
         * @return return L channel uq, type is int
         * @maixpy maix.image.Statistics.l_uq
         */
        int l_uq() {
            return _l_uq;
        }

        /**
         * @brief get A channel mean
         * @return return A channel mean, type is int
         * @maixpy maix.image.Statistics.a_mean
         */
        int a_mean() {
            return _a_mean;
        }

        /**
         * @brief get A channea median
         * @return return A channel median, type is int
         * @maixpy maix.image.Statistics.a_median
         */
        int a_median() {
            return _a_median;
        }

        /**
         * @brief get A channel mode
         * @return return A channel mode, type is int
         * @maixpy maix.image.Statistics.a_mode
         */
        int a_mode() {
            return _a_mode;
        }

        /**
         * @brief get A channel std_dev
         * @return return A channel std_dev, type is int
         * @maixpy maix.image.Statistics.a_std_dev
         */
        int a_std_dev() {
            return _a_std_dev;
        }

        /**
         * @brief get A channel min
         * @return return A channel min, type is int
         * @maixpy maix.image.Statistics.a_min
         */
        int a_min() {
            return _a_min;
        }

        /**
         * @brief get A channel max
         * @return return A channel max, type is int
         * @maixpy maix.image.Statistics.a_max
         */
        int a_max() {
            return _a_max;
        }

        /**
         * @brief get A channel lq
         * @return return A channel lq, type is int
         * @maixpy maix.image.Statistics.a_lq
         */
        int a_lq() {
            return _a_lq;
        }

        /**
         * @brief get A channel uq
         * @return return A channel uq, type is int
         * @maixpy maix.image.Statistics.a_uq
         */
        int a_uq() {
            return _a_uq;
        }

        /**
         * @brief get B channel mean
         * @return return B channel mean, type is int
         * @maixpy maix.image.Statistics.b_mean
         */
        int b_mean() {
            return _b_mean;
        }

        /**
         * @brief get B channea median
         * @return return B channel median, type is int
         * @maixpy maix.image.Statistics.b_median
         */
        int b_median() {
            return _b_median;
        }

        /**
         * @brief get B channel mode
         * @return return B channel mode, type is int
         * @maixpy maix.image.Statistics.b_mode
         */
        int b_mode() {
            return _b_mode;
        }

        /**
         * @brief get B channel std_dev
         * @return return B channel std_dev, type is int
         * @maixpy maix.image.Statistics.b_std_dev
         */
        int b_std_dev() {
            return _b_std_dev;
        }

        /**
         * @brief get B channel min
         * @return return B channel min, type is int
         * @maixpy maix.image.Statistics.b_min
         */
        int b_min() {
            return _b_min;
        }

        /**
         * @brief get B channel max
         * @return return B channel max, type is int
         * @maixpy maix.image.Statistics.b_max
         */
        int b_max() {
            return _b_max;
        }

        /**
         * @brief get B channel lq
         * @return return B channel lq, type is int
         * @maixpy maix.image.Statistics.b_lq
         */
        int b_lq() {
            return _b_lq;
        }

        /**
         * @brief get B channel uq
         * @return return B channel uq, type is int
         * @maixpy maix.image.Statistics.b_uq
         */
        int b_uq() {
            return _b_uq;
        }
    };


    /**
     * Displacement class
     * @maixpy maix.image.Displacement
     */
    class Displacement {
    private:
        float _x_translation;
        float _y_translation;
        float _rotation;
        float _scale;
        float _response;
    public:
        Displacement(){};
        /**
         * Displacement constructor
         *
         * @param x_translation The x_translation of the Displacement
         * @param y_translation The y_translation of the Displacement
         * @param rotation The rotation of the Displacement
         * @param scale The scale of the Displacement
         * @param response The response of the Displacement
         * @maixpy maix.image.Displacement.__init__
        */
        Displacement(float x_translation, float y_translation, float rotation, float scale, float response)
        {
            _x_translation = x_translation;
            _y_translation = y_translation;
            _rotation = rotation;
            _scale = scale;
            _response = response;
        }

        ~Displacement(){};

        /**
         * Subscript operator
         * @param index array index
         * @return int&
         * @maixpy maix.image.Displacement.__getitem__
         */
        int &__getitem__(int index)
        {
            switch (index) {
            case 0: throw err::Exception("Not support this index, try to use x_translation() method");
            case 1: throw err::Exception("Not support this index, try to use y_translation() method");
            case 2: throw err::Exception("Not support this index, try to use rotation() method");
            case 3: throw err::Exception("Not support this index, try to use scale() method");
            case 4: throw err::Exception("Not support this index, try to use response() method");
            default:throw std::out_of_range("Displacement index out of range");
            }
        }

        /**
         * @brief get x_translation of Displacement
         * @return return x_translation of the Displacement, type is float
         * @maixpy maix.image.Displacement.x_translation
         */
        float x_translation() {
            return _x_translation;
        }

        /**
         * @brief get y_translation of Displacement
         * @return return y_translation of the Displacement, type is float
         * @maixpy maix.image.Displacement.y_translation
         */
        float y_translation() {
            return _y_translation;
        }

        /**
         * @brief get rotation of Displacement
         * @return return rotation of the Displacement, type is float
         * @maixpy maix.image.Displacement.rotation
         */
        float rotation() {
            return _rotation;
        }

        /**
         * @brief get scale of Displacement
         * @return return scale of the Displacement, type is float
         * @maixpy maix.image.Displacement.scale
         */
        float scale() {
            return _scale;
        }

        /**
         * @brief get response of Displacement
         * @return return response of the Displacement, type is float
         * @maixpy maix.image.Displacement.response
         */
        float response() {
            return _response;
        }
    };

    /**
     * LBPKeyPoint class
     * @maixpy maix.image.LBPKeyPoint
     */
    class LBPKeyPoint {
    private:
        std::valarray<uint8_t> data;
    public:
        LBPKeyPoint(){};

        /**
         * LBPKeyPoint constructor
         *
         * @param data The data of the LBPKeyPoint
         * @maixpy maix.image.LBPKeyPoint.__init__
        */
        LBPKeyPoint(std::valarray<uint8_t> &data)
        {
            this->data = data;
        }

        ~LBPKeyPoint(){};

        std::valarray<uint8_t> get_data() {
            return data;
        }
    };

    /**
     * KeyPoint class
     * @maixpy maix.image.KeyPoint
     */
    class KeyPoint {
    private:
        uint16_t _x;
        uint16_t _y;
        uint16_t _score;
        uint16_t _octave;
        uint16_t _angle;
        uint16_t _matched;
        std::vector<uint8_t> desc;
    public:
        /**
         * KeyPoint constructor
         *
         * @param x The x of the KeyPoint
         * @param y The y of the KeyPoint
         * @param score The score of the KeyPoint
         * @param octave The octave of the KeyPoint
         * @param angle The angle of the KeyPoint
         * @param matched The matched of the KeyPoint
         * @param desc The desc of the KeyPoint
         * @maixpy maix.image.KeyPoint.__init__
        */
        KeyPoint(uint16_t x, uint16_t y, uint16_t score, uint16_t octave, uint16_t angle, uint16_t matched, std::vector<uint8_t> &desc)
        {
            _x = x;
            _y = y;
            _score = score;
            _octave = octave;
            _angle = angle;
            _matched = matched;
            this->desc = desc;
        }

        ~KeyPoint(){};
    };

    /**
     * KPTMatch class
     * @maixpy maix.image.KPTMatch
     */
    class KPTMatch {
    private:
        int cx;
        int cy;
        int x;
        int y;
        int w;
        int h;
        int score;
        int theta;
        int match;
    public:
        KPTMatch() {}
        /**
         * KPTMatch constructor
         *
         * @param cx The cx of the KPTMatch
         * @param cy The cy of the KPTMatch
         * @param x The x of the KPTMatch
         * @param y The y of the KPTMatch
         * @param w The w of the KPTMatch
         * @param h The h of the KPTMatch
         * @param score The score of the KPTMatch
         * @param theta The theta of the KPTMatch
         * @param match The match of the KPTMatch
         * @maixpy maix.image.KPTMatch.__init__
        */
        KPTMatch(int cx, int cy, int x, int y, int w, int h, int score, int theta, int match)
        {
            this->cx = cx;
            this->cy = cy;
            this->x = x;
            this->y = y;
            this->w = w;
            this->h = h;
            this->score = score;
            this->theta = theta;
            this->match = match;
        }

        ~KPTMatch(){};
    };

    /**
     * ORBKeyPoint class
     * @maixpy maix.image.ORBKeyPoint
     */
    class ORBKeyPoint {
    private:
        std::vector<KeyPoint> data;
        int threshold;
        bool normalized;
    public:
        ORBKeyPoint(){};
        /**
         * ORBKeyPoint constructor
         *
         * @param data The data of the ORBKeyPoint
         * @param threshold The threshold of the ORBKeyPoint
         * @param normalized The normalized of the ORBKeyPoint
         * @maixpy maix.image.ORBKeyPoint.__init__
        */
        ORBKeyPoint(std::vector<image::KeyPoint> &data, int threshold, bool normalized)
        {
            this->data = data;
            this->threshold = threshold;
            this->normalized = normalized;
        }

        ~ORBKeyPoint(){};

        /**
         * @brief get data of ORBKeyPoint
         * @return return data of the ORBKeyPoint, type is std::vector<KeyPoint>
         * @maixpy maix.image.ORBKeyPoint.get_data
         */
        std::vector<image::KeyPoint> get_data() {
            return data;
        }
    };

    /**
     * HaarCascade class
     * @maixpy maix.image.HaarCascade
     */
    class HaarCascade {
    private:
        int std;                        // Image standard deviation.
        int step;                       // Image scanning factor.
        float threshold;                // Detection threshold.
        float scale_factor;             // Image scaling factor.
        int n_stages;                   // Number of stages in the cascade.
        int n_features;                 // Number of features in the cascade.
        int n_rectangles;               // Number of rectangles in the cascade.
        std::vector<int> window;        // Detection window size.
        // image::Image *img;              // Grayscale image.
        std::vector<int> sum;           // Integral image.
                                        // sum:[0] width, [1] height, [2] y_offs, [3] x_ratio, [4] y_ratio, [5] uint32_t **data, [6] uint32_t **swap
        std::vector<int> ssq;           // Squared integral image.
                                        // ssq:[0] width, [1] height, [2] y_offs, [3] x_ratio, [4] y_ratio, [5] uint32_t **data, [6] uint32_t **swap
        uint8_t *stages_array;          // Number of features per stage.
        int16_t *stages_thresh_array;   // Stages thresholds.
        int16_t *tree_thresh_array;     // Features threshold (1 per feature).
        int16_t *alpha1_array;          // Alpha1 array (1 per feature).
        int16_t *alpha2_array;          // Alpha2 array (1 per feature).
        int8_t *num_rectangles_array;   // Number of rectangles per features (1 per feature).
        int8_t *weights_array;          // Rectangles weights (1 per rectangle).
        int8_t *rectangles_array;       // Rectangles array.
    public:
        /**
         * HaarCascade constructor
         *
         * @param data The data of the HaarCascade
         * @param threshold The threshold of the HaarCascade
         * @param normalized The normalized of the HaarCascade
         * @maixpy maix.image.HaarCascade.__init__
        */
        HaarCascade()
        {

        }

        ~HaarCascade(){};
    };
}
