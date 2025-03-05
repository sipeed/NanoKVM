/*
 * QR Code Generator Library: Header for Utility
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#ifndef _QR_UTIL_H_
#define _QR_UTIL_H_

#include "qr.h"

#ifdef __cplusplus
extern "C" {
#endif

#include <stdarg.h>

/*
 * Determine the module is a dark module or not.
 */
#define qrIsBlack(qr, i, j) (((qr)->symbol[(i)][(j)] & QR_MM_BLACK) != 0)

/*
 * Deallocate and set to NULL.
 */
#define qrFree(ptr) { if ((ptr) != NULL) { free(ptr); (ptr) = NULL; } }

/*
 * Current function name macro.
 */
QR_API extern const char *(*qrGetCurrentFunctionName)(void);
#if defined(__FUNCTION__)
#define _QR_FUNCTION ((qrGetCurrentFunctionName) ? qrGetCurrentFunctionName() : __FUNCTION__)
#elif defined(__func__)
#define _QR_FUNCTION ((qrGetCurrentFunctionName) ? qrGetCurrentFunctionName() : __func__)
#else
#define _QR_FUNCTION ((qrGetCurrentFunctionName) ? qrGetCurrentFunctionName() : "?")
#endif

/*
 * Maximum length of filename extensions.
 */
#define QR_EXT_MAX_LEN 4

/*
 * Constatns.
 */
extern QR_API const qr_vertable_t qr_vertable[];
/*extern QR_API const char *qr_modename[]; */
extern QR_API const char *qr_eclname[];

/*
 * Functions for utility.
 */
QR_API const char *qrVersion(void);
QR_API const char *qrMimeType(int format);
QR_API const char *qrExtension(int format);
QR_API const char *qrStrError(int errcode);
QR_API void qrSetErrorInfo(QRCode *qr, int errnum, const char *param);
QR_API void qrSetErrorInfo2(QRCode *qr, int errnum, const char *param);
QR_API void qrSetErrorInfo3(QRCode *qr, int errnum, const char *fmt, ...);
QR_API int qrGetEncodedLength(QRCode *qr, int size);
QR_API int qrGetEncodedLength2(QRCode *qr, int size, int mode);
QR_API int qrGetEncodableLength(QRCode *qr, int size);
QR_API int qrGetEncodableLength2(QRCode *qr, int size, int mode);
QR_API int qrRemainedDataBits(QRCode *qr);

/*
 * Functions for checking datatype.
 */
QR_API int qrDetectDataType(const qr_byte_t *source, int size);
QR_API int qrStrPosNotNumeric(const qr_byte_t *source, int size);
QR_API int qrStrPosNotAlnum(const qr_byte_t *source, int size);
QR_API int qrStrPosNotKanji(const qr_byte_t *source, int size);
QR_API int qrStrPosNot8bit(const qr_byte_t *source, int size);

#ifdef __cplusplus
} // extern "C"
#endif

#endif /* _QR_UTIL_H_ */
