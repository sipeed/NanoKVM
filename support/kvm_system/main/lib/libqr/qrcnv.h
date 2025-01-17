/*
 * QR Code Generator Library: Private Definitions for Symbol Converters
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#ifndef _QRCNV_H_
#define _QRCNV_H_

/* {{{ include headers */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "qr.h"
#include "qr_util.h"
#include <math.h>
#include <stdlib.h>
#include <string.h>

/* }}} */
/* {{{ determine EOL size (CR+LF or LF) */

#ifdef WIN32
#define QRCNV_EOL_SIZE 2
#else
#define QRCNV_EOL_SIZE 1
#endif

/* }}} */
/* {{{ error handlers */

#define QRCNV_RETURN_FAILURE(e, p) { \
	qrSetErrorInfo(qr, (e), (p)); \
	if (size) { \
		*size = -1; \
	} \
	return NULL; \
}

#define QRCNV_RETURN_FAILURE2(e, p) { \
	qrSetErrorInfo2(qr, (e), (p)); \
	if (size) { \
		*size = -1; \
	} \
	return NULL; \
}

#define QRCNV_RETURN_FAILURE3(e, p, ...) { \
	qrSetErrorInfo3(qr, (e), (p), __VA_ARGS__); \
	if (size) { \
		*size = -1; \
	} \
	return NULL; \
}

/* }}} */
/* {{{ allocate memory for the working rowl and the symbo */

#define QRCNV_MALLOC(rsize, ssize) { \
	rbuf = (qr_byte_t *)malloc((size_t)(rsize)); \
	if (rbuf == NULL) { \
		QRCNV_RETURN_FAILURE2(QR_ERR_MEMORY_EXHAUSTED, _QR_FUNCTION); \
	} \
	sbuf = (qr_byte_t *)malloc((size_t)(ssize)); \
	if (sbuf == NULL) { \
		free(rbuf); \
		QRCNV_RETURN_FAILURE2(QR_ERR_MEMORY_EXHAUSTED, _QR_FUNCTION); \
	} \
}

/* }}} */
/* {{{ check the state and the parameters */

#define QRCNV_CHECK_STATE() { \
	if (qr->state < QR_STATE_FINAL) { \
		QRCNV_RETURN_FAILURE(QR_ERR_STATE, _QR_FUNCTION); \
	} \
}

#define QRCNV_GET_SIZE() { \
	if (sep != -1 && (sep < 0 || mag > QR_SEP_MAX)) { \
		QRCNV_RETURN_FAILURE3(QR_ERR_INVALID_SEP, ": %d", sep); \
	} \
	if (mag <= 0 || mag > QR_MAG_MAX) { \
		QRCNV_RETURN_FAILURE3(QR_ERR_INVALID_MAG, ": %d", mag); \
	} \
	dim = qr_vertable[qr->param.version].dimension; \
	if (sep == -1) { \
		sepdim = QR_DIM_SEP * mag; \
	} else { \
		sepdim = sep * mag; \
	} \
	imgdim = dim * mag + sepdim * 2; \
}

/* }}} */
/* {{{ check the state and the parameters (structured append) */

#define QRCNV_SA_CHECK_STATE() { \
	if (st->state < QR_STATE_FINAL) { \
		QRCNV_RETURN_FAILURE(QR_ERR_STATE, _QR_FUNCTION); \
	} \
}

#define QRCNV_SA_GET_SIZE() { \
	if (sep != -1 && (sep < 0 || mag > QR_SEP_MAX)) { \
		QRCNV_RETURN_FAILURE3(QR_ERR_INVALID_SEP, ": %d", sep); \
	} \
	if (mag <= 0 || mag > QR_MAG_MAX) { \
		QRCNV_RETURN_FAILURE3(QR_ERR_INVALID_MAG, ": %d", mag); \
	} \
	dim = qr_vertable[st->param.version].dimension; \
	if (sep == -1) { \
		sepdim = QR_DIM_SEP * mag; \
	} else { \
		sepdim = sep * mag; \
	} \
	zdim = dim * mag; \
	imgdim = zdim + sepdim * 2; \
	if (order > 0) { \
		if (st->num > order) { \
			cols = order; \
			rows = (st->num + order - 1) / cols; \
		} else { \
			cols = st->num; \
			rows = 1; \
		} \
	} else if (order < 0) { \
		int _a; \
		_a = abs(order); \
		if (st->num > _a) { \
			rows = _a; \
			cols = (st->num + _a - 1) / rows; \
		} else { \
			cols = 1; \
			rows = st->num; \
		} \
	} else { \
		double _r; \
		_r = sqrt((double)st->num); \
		cols = (int)ceil(_r); \
		rows = (int)floor(_r); \
		if (cols * rows < st->num) { \
			rows = (int)ceil(_r); \
		} \
	} \
	xdim = (zdim + sepdim) * cols + sepdim; \
	ydim = (zdim + sepdim) * rows + sepdim; \
}

#define QRCNV_SA_IF_ONE(func) { \
	if (st->num == 1) { \
		return (func)(st->qrs[0], sep, mag, size); \
	} \
}

#endif /* _QRCNV_H_ */
