/*
 * QR Code Generator Library: Header for Command Line Interface
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#ifndef _QRCMD_H_
#define _QRCMD_H_

/* {{{ include headers */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "qr.h"
#include "qr_util.h"

/* }}} */
/* {{{ version information */

#define QRCMD_PROG_VERSION "0.2.0"

/* }}} */
/* {{{ whether enable structured append or not */

#ifdef QRCMD_STRUCTURED_APPEND
/* {{{ enable structured append */

/* parameters */
#define QRCMD_PTR_TYPE QRStructured
#define QRCMD_EXTRA_PARAM_A int order = 0; int extra = 0;
#define QRCMD_EXTRA_PARAM_B , order
#define QRCMD_EXTRA_PARAM_C &order, &extra,
#define QRCMD_EXTRA_PARAM_D int *order, int *extra,
#define QRCMD_MAX_NUM_A int maxnum = QR_STA_MAX;
#define QRCMD_MAX_NUM_B maxnum,
#define QRCMD_DEFAULT_VERSION 1

/* functions */
#define qrCmdInit qrsInit
#define qrCmdDestroy qrsDestroy
#define qrCmdFinalize qrsFinalize
#define qrCmdGetErrorInfo qrsGetErrorInfo
#define qrCmdAddData qrsAddData
#define qrCmdAddData2 qrsAddData2
#define qrCmdOutputSymbol qrsOutputSymbols
#define qrCmdOutputSymbol2 qrsOutputSymbols2

/* others */
#ifndef QRCMD_PROG_NAME
#define QRCMD_PROG_NAME "qrs"
#endif
#ifndef QR_SA_SRC_MAX
#define QR_SA_SRC_MAX 112233
#endif
#define QRCMD_SRC_MAX QR_SA_SRC_MAX

/* }}} */
#else
/* {{{ disable structured append */

/* parameters */
#define QRCMD_PTR_TYPE QRCode
#define QRCMD_EXTRA_PARAM_A
#define QRCMD_EXTRA_PARAM_B
#define QRCMD_EXTRA_PARAM_C
#define QRCMD_EXTRA_PARAM_D
#define QRCMD_MAX_NUM_A
#define QRCMD_MAX_NUM_B
#define QRCMD_DEFAULT_VERSION -1

/* functions */
#define qrCmdInit qrInit
#define qrCmdDestroy qrDestroy
#define qrCmdFinalize qrFinalize
#define qrCmdGetErrorInfo qrGetErrorInfo
#define qrCmdAddData qrAddData
#define qrCmdAddData2 qrAddData2
#define qrCmdOutputSymbol qrOutputSymbol
#define qrCmdOutputSymbol2 qrOutputSymbol2

/* others */
#ifndef QRCMD_PROG_NAME
#define QRCMD_PROG_NAME "qr"
#endif
#define QRCMD_SRC_MAX QR_SRC_MAX

/* }}} */
#endif /* QRCMD_STRUCTURED_APPEND */

/* }}} */
/* {{{ function prototype declarations */

QRCMD_PTR_TYPE *
qrGetParameter(int argc, char **argv,
		int *fmt, int *sep, int *mag, QRCMD_EXTRA_PARAM_D char **output);

void
qrShowHelp(void);

/* }}} */

#endif /* _QRCMD_H_ */
