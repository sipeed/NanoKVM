/*
 * QR Code Generator Library: Symbol Converters for Windows Bitmap
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#include "qrcnv.h"
#if defined(__BIG_ENDIAN__) || defined(__LITTLE_ENDIAN__)
#include <stdint.h>
#endif

/* {{{ size constants */

#define QRCNV_BMP_BISIZE 40  /* Windows Bitmap */
#define QRCNV_BMP_OFFBITS 62 /* 14(bf) + 40(bi) + 4(rgbq) + 4(rgbq) */
#define QRCNV_BMP_PPM 3780   /* 96 dpi ~= 3780 ppm */
                             /* 72 dpi ~= 2835 ppm */

/* }}} */
/* {{{ utility macro */

#if defined(__BIG_ENDIAN__)
#define qrBmpWriteShort(ptr, n) { \
	uint16_t us = (uint16_t)((n) & 0xffffU); \
	qr_byte_t *tmp = (qr_byte_t *)&us; \
	*(ptr)++ = tmp[1]; \
	*(ptr)++ = tmp[0]; \
}
#elif defined(__LITTLE_ENDIAN__)
#define qrBmpWriteShort(ptr, n) { \
	uint16_t us = (uint16_t)((n) & 0xffffU); \
	qr_byte_t *tmp = (qr_byte_t *)&us; \
	*(ptr)++ = tmp[0]; \
	*(ptr)++ = tmp[1]; \
}
#else
#define qrBmpWriteShort(ptr, n) { \
	*(ptr)++ = (n) & 0xffU; \
	*(ptr)++ = ((n) >> 8) & 0xffU; \
}
#endif

#if defined(__BIG_ENDIAN__)
#define qrBmpWriteLong(ptr, n) { \
	uint32_t ul = (uint32_t)(n); \
	qr_byte_t *tmp = (qr_byte_t *)&ul; \
	*(ptr)++ = tmp[3]; \
	*(ptr)++ = tmp[2]; \
	*(ptr)++ = tmp[1]; \
	*(ptr)++ = tmp[0]; \
}
#elif defined(__LITTLE_ENDIAN__)
#define qrBmpWriteLong(ptr, n) { \
	uint32_t ul = (uint32_t)(n); \
	qr_byte_t *tmp = (qr_byte_t *)&ul; \
	*(ptr)++ = tmp[0]; \
	*(ptr)++ = tmp[1]; \
	*(ptr)++ = tmp[2]; \
	*(ptr)++ = tmp[3]; \
}
#else
#define qrBmpWriteLong(ptr, n) { \
	*(ptr)++ = (n) & 0xffU; \
	*(ptr)++ = ((n) >> 8) & 0xffU; \
	*(ptr)++ = ((n) >> 16) & 0xffU; \
	*(ptr)++ = ((n) >> 24) & 0xffU; \
}
#endif

#define qrBmpNextPixel() { \
	if (pxshift == 0) { \
		rptr++; \
		pxshift = 7; \
	} else { \
		pxshift--; \
	} \
}

/* }}} */
/* {{{ function prototypes */

static qr_byte_t *
qrBmpWriteHeader(qr_byte_t *bof, int size, int width, int height, int imagesize);

/* }}} */
/* {{{ qrSymbolToBMP() */

/*
 * 生成されたQRコードシンボルをモノクロ2値の
 * Windows Bitmap(BMP)に変換する
 */
QR_API qr_byte_t *
qrSymbolToBMP(QRCode *qr, int sep, int mag, int *size)
{
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, rmod, imgsize;
	int sepskips, pxshift;
	int i, j, ix, jx, dim, imgdim, sepdim;

	QRCNV_CHECK_STATE();
	QRCNV_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = (imgdim + 7) / 8;
	if ((rmod = (rsize % 4)) != 0) {
		rsize += 4 - rmod;
	}
	imgsize = rsize * imgdim;
	*size = QRCNV_BMP_OFFBITS + imgsize;
	QRCNV_MALLOC(rsize, *size);

	/*
	 * ヘッダを書き込む
	 */
	sptr = qrBmpWriteHeader(sbuf, *size, imgdim, imgdim, imgsize);

	/*
	 * シンボルを書き込む
	 */
	sepskips = rsize * sepdim;
	/* 分離パターン (下) */
	if (sepskips) {
		memset(sptr, 0, (size_t)sepskips);
		sptr += sepskips;
	}
	for (i = dim - 1; i >= 0; i--) {
		memset(rbuf, 0, (size_t)rsize);
		pxshift = 7;
		rptr = rbuf;
		/* 分離パターン (左) */
		for (j = 0; j < sepdim; j++) {
			qrBmpNextPixel();
		}
		/* シンボル本体 */
		for (j = 0; j < dim; j++) {
			if (qrIsBlack(qr, i, j)) {
				for (jx = 0; jx < mag; jx++) {
					*rptr |= 1 << pxshift;
					qrBmpNextPixel();
				}
			} else {
				for (jx = 0; jx < mag; jx++) {
					qrBmpNextPixel();
				}
			}
		}
		/* 行をmag回繰り返し書き込む */
		for (ix = 0; ix < mag; ix++) {
			memcpy(sptr, rbuf, (size_t)rsize);
			sptr += rsize;
		}
	}
	/* 分離パターン (上) */
	if (sepskips) {
		memset(sptr, 0, (size_t)sepskips);
		sptr += sepskips;
	}

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrsSymbolsToBMP() */

/*
 * 構造的連接用qrSymbolToBMP()
 */
QR_API qr_byte_t *
qrsSymbolsToBMP(QRStructured *st, int sep, int mag, int order, int *size)
{
	QRCode *qr = st->cur;
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, rmod, imgsize;
	int sepskips, pxshift;
	int i, j, k, ix, jx, kx;
	int cols, rows, pos, xdim, ydim, zdim;
	int dim, imgdim, sepdim;

	QRCNV_SA_CHECK_STATE();
	QRCNV_SA_IF_ONE(qrSymbolToBMP);
	QRCNV_SA_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = (xdim + 7) / 8;
	if ((rmod = (rsize % 4)) != 0) {
		rsize += 4 - rmod;
	}
	imgsize = rsize * ydim;
	*size = QRCNV_BMP_OFFBITS + imgsize;
	QRCNV_MALLOC(rsize, *size);

	/*
	 * ヘッダを書き込む
	 */
	sptr = qrBmpWriteHeader(sbuf, *size, xdim, ydim, imgsize);

	/*
	 * シンボルを書き込む
	 */
	sepskips = rsize * sepdim;
	for (k = rows - 1; k >= 0; k--) {
		/* 分離パターン (下) */
		if (sepskips) {
			memset(sptr, 0, (size_t)sepskips);
			sptr += sepskips;
		}
		for (i = dim - 1; i >= 0; i--) {
			memset(rbuf, 0, (size_t)rsize);
			pxshift = 7;
			rptr = rbuf;
			for (kx = 0; kx < cols; kx++) {
				/* 分離パターン (左) */
				for (j = 0; j < sepdim; j++) {
					qrBmpNextPixel();
				}
				/* シンボル本体 */
				if (order < 0) {
					pos = k + rows * kx;
				} else {
					pos = cols * k + kx;
				}
				if (pos >= st->num) {
					break;
				}
				for (j = 0; j < dim; j++) {
					if (qrIsBlack(st->qrs[pos], i, j)) {
						for (jx = 0; jx < mag; jx++) {
							*rptr |= 1 << pxshift;
							qrBmpNextPixel();
						}
					} else {
						for (jx = 0; jx < mag; jx++) {
							qrBmpNextPixel();
						}
					}
				}
			}
			/* 行をmag回繰り返し書き込む */
			for (ix = 0; ix < mag; ix++) {
				memcpy(sptr, rbuf, (size_t)rsize);
				sptr += rsize;
			}
		}
	}
	/* 分離パターン (上) */
	if (sepskips) {
		memset(sptr, 0, (size_t)sepskips);
		sptr += sepskips;
	}

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrBmpWriteHeader() */

static qr_byte_t *
qrBmpWriteHeader(qr_byte_t *bof, int size, int width, int height, int imagesize)
{
	qr_byte_t *ptr;

	ptr = bof;

	/*
	 * BITMAPFILEHEADER
	 */
	*ptr++ = 'B'; /* bfType */
	*ptr++ = 'M'; /* bfType */
	qrBmpWriteLong(ptr, size); /* bfSize */
	qrBmpWriteShort(ptr, 0); /* bfReserved1 */
	qrBmpWriteShort(ptr, 0); /* bfReserved2 */
	qrBmpWriteLong(ptr, QRCNV_BMP_OFFBITS); /* bfOffBits */

	/*
	 * BMPINFOHEADER
	 */
	qrBmpWriteLong(ptr, QRCNV_BMP_BISIZE); /* biSize */
	qrBmpWriteLong(ptr, width);  /* biWidth */
	qrBmpWriteLong(ptr, height); /* biHeight */
	qrBmpWriteShort(ptr, 1); /* biPlanes */
	qrBmpWriteShort(ptr, 1); /* biBitCount - 1 bit per pixel */
	qrBmpWriteLong(ptr, 0); /* biCopmression - BI_RGB */
	qrBmpWriteLong(ptr, imagesize);     /* biSizeImage */
	qrBmpWriteLong(ptr, QRCNV_BMP_PPM); /* biXPixPerMeter */
	qrBmpWriteLong(ptr, QRCNV_BMP_PPM); /* biYPixPerMeter */
	qrBmpWriteLong(ptr, 2); /* biClrUsed */
	qrBmpWriteLong(ptr, 2); /* biCirImportant */

	/*
	 * RGBQUAD - white
	 */
	*ptr++ = 255; /* rgbBlue */
	*ptr++ = 255; /* rgbGreen */
	*ptr++ = 255; /* rgbRed */
	*ptr++ = 0;   /* rgbReserved */

	/*
	 *RGBQUAD - black
	 */
	*ptr++ = 0; /* rgbBlue */
	*ptr++ = 0; /* rgbGreen */
	*ptr++ = 0; /* rgbRed */
	*ptr++ = 0; /* rgbReserved */

	return ptr;
}

/* }}} */
