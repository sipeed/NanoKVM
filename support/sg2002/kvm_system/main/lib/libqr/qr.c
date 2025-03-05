/*
 * QR Code Generator Library
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "qr.h"
#include "qr_util.h"
#include "qr_private.h"
#include "qr_dwtable.h"

#define qrIsData(qr, i, j)  (((qr)->symbol[i][j] & QR_MM_DATA) != 0)
#define qrIsFunc(qr, i, j)  (((qr)->symbol[i][j] & QR_MM_FUNC) != 0)

QR_API const char *(*qrGetCurrentFunctionName)(void) = NULL;

/*
 * ライブラリのバージョンを返す
 */
QR_API const char *
qrVersion(void)
{
	return LIBQR_VERSION;
}

/*
 * QRCodeオブジェクトを生成する
 */
QR_API QRCode *
qrInit(int version, int mode, int eclevel, int masktype, int *errcode)
{
	QRCode *qr = NULL;

	/*
	 * メモリを確保する
	 */
	qr = (QRCode *)calloc(1, sizeof(QRCode));
	if (qr == NULL) {
		*errcode = QR_ERR_MEMORY_EXHAUSTED;
		return NULL;
	}
	qr->dataword = (qr_byte_t *)calloc(1, QR_DWD_MAX);
	qr->ecword   = (qr_byte_t *)calloc(1, QR_ECW_MAX);
	qr->codeword = (qr_byte_t *)calloc(1, QR_CWD_MAX);
	if (qr->dataword == NULL || qr->ecword == NULL || qr->codeword == NULL) {
		*errcode = QR_ERR_MEMORY_EXHAUSTED;
		qrDestroy(qr);
		return NULL;
	}

	/*
	 * 内部状態を初期化する
	 */
	qr->_symbol = NULL;
	qr->symbol = NULL;
	qr->source = NULL;
	qr->srcmax = 0;
	qr->srclen = 0;
	qr->enclen = 0;
	qr->delta1 = 0;
	qr->delta2 = 0;
	qr->errcode = QR_ERR_NONE;
	qr->state = QR_STATE_BEGIN;

	/*
	 * 型番を設定する
	*/
	if (version == -1 || (version >= 1 && version <= QR_VER_MAX)) {
		qr->param.version = version;
	} else {
		*errcode = QR_ERR_INVALID_VERSION;
		qrDestroy(qr);
		return NULL;
	}

	/*
	 * 符号化モードを設定する
	*/
	if (mode == QR_EM_AUTO || (mode >= QR_EM_NUMERIC && mode < QR_EM_COUNT)) {
		qr->param.mode = mode;
	} else {
		*errcode = QR_ERR_INVALID_MODE;
		qrDestroy(qr);
		return NULL;
	}

	/*
	 * 誤り訂正レベルを設定する
	*/
	if (eclevel >= QR_ECL_L && eclevel < QR_EM_COUNT) {
		qr->param.eclevel = eclevel;
	} else {
		*errcode = QR_ERR_INVALID_ECL;
		qrDestroy(qr);
		return NULL;
	}

	/*
	 * マスクパターンを設定する
	*/
	if (masktype == -1 || (masktype >= 0 && masktype < QR_MPT_MAX)) {
		qr->param.masktype = masktype;
	} else {
		*errcode = QR_ERR_INVALID_MPT;
		qrDestroy(qr);
		return NULL;
	}

	return qr;
}

/*
 * QRStructuredオブジェクトを生成する
 */
QR_API QRStructured *
qrsInit(int version, int mode, int eclevel, int masktype, int maxnum, int *errcode)
{
	QRStructured *st = NULL;

	/*
	 * メモリを確保する
	 */
	st = (QRStructured *)calloc(1, sizeof(QRStructured));
	if (st == NULL) {
		*errcode = QR_ERR_MEMORY_EXHAUSTED;
		return NULL;
	}

	/*
	 * 内部状態を初期化する
	 */
	st->parity = 0;
	st->state = QR_STATE_BEGIN;

	/*
	 * 最大シンボル数を設定する
	*/
	if (maxnum >= 2 && masktype <= QR_STA_MAX) {
		st->max = maxnum;
	} else {
		*errcode = QR_ERR_INVALID_MAXNUM;
		qrsDestroy(st);
		return NULL;
	}

	/*
	 * 型番を設定する
	 */
	if (version >= 1 && version <= QR_VER_MAX) {
		st->param.version = version;
	} else {
		*errcode = QR_ERR_INVALID_VERSION;
		qrsDestroy(st);
		return NULL;
	}

	/*
	 * 符号化モードを設定する
	*/
	if (mode == QR_EM_AUTO || (mode >= QR_EM_NUMERIC && mode < QR_EM_COUNT)) {
		st->param.mode = mode;
	} else {
		*errcode = QR_ERR_INVALID_MODE;
		qrsDestroy(st);
		return NULL;
	}

	/*
	 * 誤り訂正レベルを設定する
	*/
	if (eclevel >= QR_ECL_L && eclevel < QR_EM_COUNT) {
		st->param.eclevel = eclevel;
	} else {
		*errcode = QR_ERR_INVALID_ECL;
		qrsDestroy(st);
		return NULL;
	}

	/*
	 * マスクパターンを設定する
	*/
	if (masktype == -1 || (masktype >= 0 && masktype < QR_MPT_MAX)) {
		st->param.masktype = masktype;
	} else {
		*errcode = QR_ERR_INVALID_MPT;
		qrsDestroy(st);
		return NULL;
	}

	/*
	 * 一つめのQRコードオブジェクトを初期化する
	*/
	st->qrs[0] = qrInit(st->param.version, st->param.mode,
			st->param.eclevel, st->param.masktype, errcode);
	if (st->qrs[0] == NULL) {
		qrsDestroy(st);
		return NULL;
	}
	st->cur = st->qrs[0];
	st->num = 1;

	return st;
}

/*
 * QRCodeオブジェクトを複製する
 */
QR_API QRCode *
qrClone(const QRCode *qr, int *errcode)
{
	QRCode *cp = NULL;

	/*
	 * QRCodeオブジェクト用のメモリを確保し、複製する
	 */
	cp = (QRCode *)malloc(sizeof(QRCode));
	if (cp == NULL) {
		*errcode = QR_ERR_MEMORY_EXHAUSTED;
		return NULL;
	}
	memcpy(cp, qr, sizeof(QRCode));

	/*
	 * 動的に確保されるメンバをいったんNULLにする
	 */
	cp->dataword = NULL;
	cp->ecword = NULL;
	cp->codeword = NULL;
	cp->_symbol = NULL;
	cp->symbol = NULL;
	cp->source = NULL;

	/*
	 * ファイナライズ後ならシンボル、ファイナライズ前なら計算用領域を複製
	 */
	if (cp->state == QR_STATE_FINAL) {
		int i, dim;

		dim = qr_vertable[cp->param.version].dimension;

		cp->_symbol = (qr_byte_t *)calloc((size_t)dim, (size_t)dim);
		if (cp->_symbol == NULL) {
			*errcode = QR_ERR_MEMORY_EXHAUSTED;
			qrDestroy(cp);
			return NULL;
		}
		memcpy(cp->_symbol, qr->_symbol, (size_t)(dim * dim));

		cp->symbol = (qr_byte_t **)malloc(sizeof(qr_byte_t *) * (size_t)dim);
		if (cp->symbol == NULL) {
			*errcode = QR_ERR_MEMORY_EXHAUSTED;
			qrDestroy(cp);
			return NULL;
		}
		for (i = 0; i < dim; i++) {
			cp->symbol[i] = cp->_symbol + dim * i;
		}
	} else {
		cp->dataword = (qr_byte_t *)malloc(QR_DWD_MAX);
		cp->ecword   = (qr_byte_t *)malloc(QR_ECW_MAX);
		cp->codeword = (qr_byte_t *)malloc(QR_CWD_MAX);
		if (cp->dataword == NULL || cp->ecword == NULL || cp->codeword == NULL) {
			*errcode = QR_ERR_MEMORY_EXHAUSTED;
			qrDestroy(cp);
			return NULL;
		}
		memcpy(cp->dataword, qr->dataword, QR_DWD_MAX);
		memcpy(cp->ecword  , qr->ecword  , QR_ECW_MAX);
		memcpy(cp->codeword, qr->codeword, QR_CWD_MAX);
	}

	/*
	 * 入力データを複製
	 */
	if (cp->srcmax > 0 && qr->source != NULL) {
		cp->source = (qr_byte_t *)malloc(cp->srcmax);
		if (cp->source == NULL) {
			*errcode = QR_ERR_MEMORY_EXHAUSTED;
			qrDestroy(cp);
			return NULL;
		}
		memcpy(cp->source, qr->source, cp->srclen);
	}

	return cp;
}

/*
 * QRStructuredオブジェクトを複製する
 */
QR_API QRStructured *
qrsClone(const QRStructured *st, int *errcode)
{
	QRStructured *cps = NULL;
	int i = 0;

	/*
	 * QRStructuredオブジェクト用のメモリを確保し、複製する
	 */
	cps = (QRStructured *)malloc(sizeof(QRStructured));
	if (cps == NULL) {
		*errcode = QR_ERR_MEMORY_EXHAUSTED;
		return NULL;
	}
	memcpy(cps, st, sizeof(QRStructured));

	/*
	 * 保持しているQRCodeオブジェクトを複製する
	 */
	while (i < cps->num) {
		QRCode *cp = qrClone(st->qrs[i], errcode);
		if (cp == NULL) {
			while (i > 0) {
				qrDestroy(cps->qrs[--i]);
				free(cps);
			}
			return NULL;
		}
		cps->qrs[i++] = cp;
	}
	while (i < QR_STA_MAX) {
		cps->qrs[i++] = NULL;
	}
	cps->cur = cps->qrs[0] + (st->cur - st->qrs[0]);

	return cps;
}

/*
 * QRCodeオブジェクトを開放する
 */
QR_API void
qrDestroy(QRCode *qr)
{
	if (qr == NULL) {
		return;
	}
	qrFree(qr->source);
	qrFree(qr->dataword);
	qrFree(qr->ecword);
	qrFree(qr->codeword);
	qrFree(qr->symbol);
	qrFree(qr->_symbol);
	free(qr);
}

/*
 * QRStructuredオブジェクトを開放する
 */
QR_API void
qrsDestroy(QRStructured *st)
{
	int i;
	if (st == NULL) {
		return;
	}
	for (i = 0; i < st->num; i++) {
		qrDestroy(st->qrs[i]);
	}
	free(st);
}

/*
 * 出力形式に対応するMIMEタイプを返す
 */
QR_API const char *
qrMimeType(int format)
{
	switch (format) {
		case QR_FMT_PNG:    return "image/png";
		case QR_FMT_BMP:    return "image/bmp";
		case QR_FMT_TIFF:   return "image/tiff";
		case QR_FMT_PBM:    return "image/x-portable-bitmap";
		case QR_FMT_SVG:    return "image/svg+xml";
		case QR_FMT_JSON:   return "application/json";
		case QR_FMT_DIGIT:  return "text/plain";
		case QR_FMT_ASCII:  return "text/plain";
		default: return NULL;
	}
}

/*
 * 出力形式に対応する拡張子 (ピリオドなし) を返す
 */
QR_API const char *
qrExtension(int format)
{
	switch (format) {
		case QR_FMT_PNG:    return "png";
		case QR_FMT_BMP:    return "bmp";
		case QR_FMT_TIFF:   return "tiff";
		case QR_FMT_PBM:    return "pbm";
		case QR_FMT_SVG:    return "svg";
		case QR_FMT_JSON:   return "json";
		case QR_FMT_DIGIT:  return "txt";
		case QR_FMT_ASCII:  return "txt";
		default: return NULL;
	}
}

/*
 * QRコードオブジェクトに登録されているエラー番号を返す
 */
QR_API int
qrGetErrorCode(QRCode *qr)
{
	return qr->errcode;
}

/*
 * QRコードオブジェクトに登録されているエラー情報を返す
 */
QR_API char *
qrGetErrorInfo(QRCode *qr)
{
	return &(qr->errinfo[0]);
}

/*
 * 構造的連接の最後のQRコードオブジェクトに登録されているエラー番号を返す
 */
QR_API int
qrsGetErrorCode(QRStructured *st)
{
	return st->cur->errcode;
}

/*
 * 構造的連接の最後のQRコードオブジェクトに登録されているエラー情報を返す
 */
QR_API char *
qrsGetErrorInfo(QRStructured *st)
{
	return &(st->cur->errinfo[0]);
}

/*
 * エラー番号に対応したエラー情報を返す
 */
QR_API const char *
qrStrError(int errcode)
{
	switch (errcode) {
	/* wide use errors */
	  case QR_ERR_NONE:
	  case QR_ERR_USAGE:
		return "";

	  case QR_ERR_SEE_ERRNO:
		return "For more information, check for errno";

	  case QR_ERR_NOT_IMPL:
		return "Not yet implemented";

	  case QR_ERR_STATE:
		return "Not allowed in the current state";

	  case QR_ERR_FOPEN:
		return "Failed to open file";

	  case QR_ERR_FREAD:
		return "Failed to read data";

	  case QR_ERR_FWRITE:
		return "Failed to write data";

	  case QR_ERR_MEMORY_EXHAUSTED:
		return "Memory exhausted";

	/* invalid parameter errors */
	  case QR_ERR_INVALID_ARG:
		return "Invalid argument";

	  case QR_ERR_INVALID_VERSION:
		return "Invalid version number";

	  case QR_ERR_INVALID_MODE:
		return "Invalid encoding mode";

	  case QR_ERR_INVALID_ECL:
		return "Invalid error correction level";

	  case QR_ERR_INVALID_MPT:
		return "Invalid mask pattern type";

	  case QR_ERR_INVALID_MAG:
		return "Invalid pixel magnifying ratio";

	  case QR_ERR_INVALID_SEP:
		return "Invalid separator width";

	  case QR_ERR_INVALID_SIZE:
		return "Invalid output size";

	  case QR_ERR_INVALID_FMT:
		return "Invalid output format";

	  case QR_ERR_INVALID_OUT:
		return "Invalid output pathname";

	  case QR_ERR_INVALID_MAXNUM:
		return "Invalid maximum symbol number";

	  case QR_ERR_UNSUPPORTED_FMT:
		return "Unsupported output format";

	  case QR_ERR_EMPTY_PARAM:
		return "Parameter required";

	/* input data size/type errors */
	  case QR_ERR_EMPTY_SRC:
		return "Input data is empty";

	  case QR_ERR_LARGE_SRC:
		return "Input data too large";

	  case QR_ERR_NOT_NUMERIC:
		return "Non decimal characters found";

	  case QR_ERR_NOT_ALNUM:
		return "Non alphanumeric characters found";

	  case QR_ERR_NOT_KANJI:
		return "Non JIS X 0208 kanji sequence found";

	/* imaging related errors */
	  case QR_ERR_IMAGE_TOO_LARGE:
		return "Output image size too large";

	  case QR_ERR_WIDTH_TOO_LARGE:
		return "Output image width too large";

	  case QR_ERR_HEIGHT_TOO_LARGE:
		return "Output image height too large";

	  case QR_ERR_IMAGECREATE:
		return "Failed to create image";

	  case QR_ERR_IMAGEFORMAT:
		return "Failed to convert image";

	  case QR_ERR_IMAGEFRAME:
		return "Failed to create frame";

	/* zlib related errors */
	  case QR_ERR_DEFLATE:
		return "Failed to deflate";

	/* unknown error(s) */
	  case QR_ERR_UNKNOWN:
	  default:
		return "Unknown error";
	}
}

/*
 * libqrのエラー番号からエラー情報を設定する
 */
QR_API void
qrSetErrorInfo(QRCode *qr, int errnum, const char *param)
{
	qr->errcode = errnum;
	if (param != NULL) {
		snprintf(&(qr->errinfo[0]), QR_ERR_MAX, "%s: %s", param, qrStrError(errnum));
	} else {
		snprintf(&(qr->errinfo[0]), QR_ERR_MAX, "%s", qrStrError(errnum));
	}
}

/*
 * システム標準のエラー番号からエラー情報を設定する
 */
QR_API void
qrSetErrorInfo2(QRCode *qr, int errnum, const char *param)
{
	char *info;
	int size = 0;
	info = &(qr->errinfo[0]);
	qr->errcode = QR_ERR_SEE_ERRNO;
	if (param != NULL) {
		size = snprintf(info, QR_ERR_MAX, "%s: ", param);
		if (size < 0 || size >= QR_ERR_MAX) {
			return;
		}
		info += size;
	}
#ifdef WIN32
	snprintf(info, (size_t)(QR_ERR_MAX - size), "%s", strerror(errnum));
#else
	strerror_r(errnum, info, (size_t)(QR_ERR_MAX - size));
#endif
}

/*
 * libqrのエラー番号と可変長パラメータからエラー情報を設定する
 */
QR_API void
qrSetErrorInfo3(QRCode *qr, int errnum, const char *fmt, ...)
{
	char info[QR_ERR_MAX];
	va_list ap;

	qr->errcode = errnum;
	va_start(ap, fmt);
	vsnprintf(&(info[0]), QR_ERR_MAX, fmt, ap);
	va_end(ap);
	snprintf(&(qr->errinfo[0]), QR_ERR_MAX, "%s%s", qrStrError(errnum), info);
}

/*
 * 最適な符号化方法を調べる
 */
QR_API int
qrDetectDataType(const qr_byte_t *source, int size)
{
	if (qrStrPosNotNumeric(source, size) == -1) {
		return QR_EM_NUMERIC;
	}
	if (qrStrPosNotAlnum(source, size) == -1) {
		return QR_EM_ALNUM;
	}
	if (qrStrPosNotKanji(source, size) == -1) {
		return QR_EM_KANJI;
	}
	return QR_EM_8BIT;
}

/*
 * 数字以外のデータが現れる位置を調べる
 */
QR_API int
qrStrPosNotNumeric(const qr_byte_t *source, int size)
{
	int p = 0;

	while (p < size) {
		if (source[p] < '0' || source[p] > '9') {
			return p;
		}
		p++;
	}
	return -1;
}

/*
 * 英数字以外のデータが現れる位置を調べる
 */
QR_API int
qrStrPosNotAlnum(const qr_byte_t *source, int size)
{
	int p = 0;

	while (p < size) {
		if (qr_alnumtable[source[p]] == -1) {
			return p;
		}
		p++;
	}
	return -1;
}

/*
 * JIS X 0208漢字以外のデータが現れる位置を調べる
 */
QR_API int
qrStrPosNotKanji(const qr_byte_t *source, int size)
{
	qr_byte_t x, y;
	int p = 0;

	while (p < size - 1) {
		x = source[p++];
		if (x >= 0x81 && x <= 0x9f) {
			x -= 0x81;
		} else if (x >= 0xe0 && x <= 0xea) {
			x -= 0xc1;
		} else {
			/* JIS X 0208漢字の1バイトめでない */
			return p - 1;
		}
		y = source[p++];
		if (y >= 0x40 && y <= 0xfc) {
			y -= 0x40;
		} else {
			/* JIS X 0208漢字の2バイトめでない */
			return p - 1;
		}
		if (qr_dwtable_kanji[x][y] == -1) {
			/* JIS X 0208漢字の未定義領域 */
			return p - 2;
		}
	}
	if (p < size) {
		return p;
	}
	return -1;
}

/*
 * 英数字もしくはJIS X 0208漢字のデータが現れる位置を調べる
 */
QR_API int
qrStrPosNot8bit(const qr_byte_t *source, int size)
{
	qr_byte_t x, y;
	int p = 0;

	while (p < size) {
		x = source[p++];
		if (qr_alnumtable[x] != -1) {
			return p - 1;
		}
		if (p < size && ((x >= 0x81 && x <= 0x9f) || (x >= 0xe0 && x <= 0xea))) {
			if (x < 0xa0) {
				x -= 0x81;
			} else {
				x -= 0xc1;
			}
			y = source[p];
			if (y >= 0x40 && y <= 0xfc && qr_dwtable_kanji[x][y - 0x40] != -1) {
				return p - 1;
			}
		}
	}
	return -1;
}

/*
 * デフォルトの符号化モードでsizeバイト符号化したときのビット長を返す
 */
QR_API int
qrGetEncodedLength(QRCode *qr, int size)
{
	return qrGetEncodedLength2(qr, size, qr->param.mode);
}

/*
 * 特定の符号化モードでsizeバイト符号化したときのビット長を返す
 */
QR_API int
qrGetEncodedLength2(QRCode *qr, int size, int mode)
{
	int n, v;

	/*
	 * モード指示子と文字数指示子のサイズ
	 */
	v = (qr->param.version == -1) ? QR_VER_MAX : qr->param.version;
	n = 4 + qr_vertable[v].nlen[mode];

	/*
	 * 符号化モードごとのデータサイズ
	 */
	switch (mode) {
	  case QR_EM_NUMERIC:
		/*
		 * 数字モード: 3桁ごとに10ビット
		 * (余りは1桁なら4ビット, 2桁なら7ビット)
		 */
		n += (size / 3) * 10;
		switch (size % 3) {
		  case 1:
			n += 4;
			break;
		  case 2:
			n += 7;
			break;
		}
		break;
	  case QR_EM_ALNUM:
		/*
		 * 英数字モード: 2桁ごとに11ビット
		 * (余りは1桁につき6ビット)
		 */
		n += (size / 2) * 11;
		if (size % 2 == 1) {
			n += 6;
		}
		break;
	  case QR_EM_8BIT:
		/*
		 * 8ビットバイトモード: 1桁ごとに8ビット
		 */
		n += size * 8;
		break;
	  case QR_EM_KANJI:
		/*
		 * 漢字モード: 1文字(2バイト)ごとに13ビット
		 */
		n += (size / 2) * 13;
		break;
	  default:
		qrSetErrorInfo(qr, QR_ERR_INVALID_MODE, NULL);
		return -1;
	}

	return n;
}

/*
 * デフォルトの符号化モードでsizeビットを上限として符号化可能な最大のバイト長を返す
 */
QR_API int
qrGetEncodableLength(QRCode *qr, int size)
{
	return qrGetEncodableLength2(qr, size, qr->param.mode);
}

/*
 * 特定の符号化モードでsizeビットを上限として符号化可能な最大のバイト長を返す
 */
QR_API int
qrGetEncodableLength2(QRCode *qr, int size, int mode)
{
	int l, m, n, v;

	/*
	 * モード指示子と文字数指示子のサイズ
	 */
	v = (qr->param.version == -1) ? QR_VER_MAX : qr->param.version;
	n = size - 4 - qr_vertable[v].nlen[mode];
	if (n <= 0) {
		return 0;
	}

	/*
	 * 符号化モードごとのデータサイズ
	 */
	switch (mode) {
	  case QR_EM_NUMERIC:
		/*
		 * 数字モード: 3桁ごとに10ビット
		 * (余りは1桁なら4ビット, 2桁なら7ビット)
		 */
		l = (n / 10) * 3;
		m = n % 10;
		if (m >= 7) {
			l += 2;
		} else if (m >= 4) {
			l += 1;
		}
		break;
	  case QR_EM_ALNUM:
		/*
		 * 英数字モード: 2桁ごとに11ビット
		 * (余りは1桁につき6ビット)
		 */
		l = (n / 11) * 2;
		m = n % 11;
		if (m >= 6) {
			l += 1;
		}
		break;
	  case QR_EM_8BIT:
		/*
		 * 8ビットバイトモード: 1桁ごとに8ビット
		 */
		l = n / 8;
		break;
	  case QR_EM_KANJI:
		/*
		 * 漢字モード: 1文字(2バイト)ごとに13ビット
		 */
		l = (n / 13) * 2;
		break;
	  default:
		qrSetErrorInfo(qr, QR_ERR_INVALID_MODE, NULL);
		return -1;
	}

	return l;
}

/*
 * データを追加する
 */
QR_API int
qrAddData(QRCode *qr, const qr_byte_t *source, int size)
{
	if (qr->state == QR_STATE_FINAL) {
		qrSetErrorInfo(qr, QR_ERR_STATE, _QR_FUNCTION);
		return FALSE;
	}
	return qrAddData2(qr, source, size, qr->param.mode);
}

/*
 * 符号化モードを指定してデータを追加する
 */
QR_API int
qrAddData2(QRCode *qr, const qr_byte_t *source, int size, int mode)
{
	int enclen, maxlen;
	int version;
	int pos, err;

	if (qr->state == QR_STATE_FINAL) {
		qrSetErrorInfo(qr, QR_ERR_STATE, _QR_FUNCTION);
		return FALSE;
	}

	if (size <= 0) {
		qrSetErrorInfo(qr, QR_ERR_EMPTY_SRC, NULL);
		return FALSE;
	}

	/*
	 * 入力データに最適な符号化モードを選ぶ
	 */
	if (mode == QR_EM_AUTO) {
		mode = qrDetectDataType(source, size);
	} else if (mode < QR_EM_NUMERIC || mode >= QR_EM_COUNT) {
		qrSetErrorInfo(qr, QR_ERR_INVALID_MODE, NULL);
		return FALSE;
	}


	/*
	 * 符号化後のデータ長を計算する
	 */
	enclen = qrGetEncodedLength2(qr, size, mode);
	if (enclen == -1) {
		return FALSE;
	}
	version = (qr->param.version == -1) ? QR_VER_MAX : qr->param.version;
	maxlen = 8 * qr_vertable[version].ecl[qr->param.eclevel].datawords;
	if (qr->enclen + enclen > maxlen) {
		qrSetErrorInfo3(qr, QR_ERR_LARGE_SRC, ", %d total encoded bits"
				" (max %d bits on version=%d, ecl=%s)",
				qr->enclen + enclen, maxlen, version, qr_eclname[qr->param.eclevel]);
		return FALSE;
	}
	if (qr->param.version == -1) {
		qr->delta1 += qr_vertable[QR_VER_MAX].nlen[mode] - qr_vertable[VERPOINT1].nlen[mode];
		qr->delta2 += qr_vertable[QR_VER_MAX].nlen[mode] - qr_vertable[VERPOINT2].nlen[mode];
	}

	/*
	 * 型番が指定されていれば、入力データをバッファリングせず直接エンコードする
	 */
	if (qr->param.version != -1) {
		qr->enclen += enclen;
		if (!qrHasData(qr)) {
			qrInitDataWord(qr);
		}
		if (qrEncodeDataWord(qr, source, size, mode) == TRUE) {
			qr->state = QR_STATE_SET;
			return TRUE;
		}
		return FALSE;
	}

	/*
	 * 入力データを検証する
	 */
	pos = -1;
	err = QR_ERR_NONE;
	switch (mode) {
	  case QR_EM_NUMERIC:
		pos = qrStrPosNotNumeric(source, size);
		err = QR_ERR_NOT_NUMERIC;
		break;
	  case QR_EM_ALNUM:
		pos = qrStrPosNotAlnum(source, size);
		err = QR_ERR_NOT_ALNUM;
		break;
	  case QR_EM_KANJI:
		pos = qrStrPosNotKanji(source, size);
		err = QR_ERR_NOT_KANJI;
		break;
	}
	if (pos != -1) {
		qrSetErrorInfo3(qr, err, " at offset %d", pos);
		return FALSE;
	}
	qr->enclen += enclen;

	/*
	 * バッファの容量が足りないときは追加で確保する
	 */
	while (qr->srcmax < qr->srclen + size + 6) {
		qr->srcmax += QR_SRC_MAX;
		qr->source = (qr_byte_t *)realloc(qr->source, qr->srcmax);
		if (qr->source == NULL) {
			qr->srcmax = 0;
			qrSetErrorInfo2(qr, QR_ERR_MEMORY_EXHAUSTED, _QR_FUNCTION);
			return FALSE;
		}
	}

	/*
	 * バッファにデータを保存する
	 */
	qr->source[qr->srclen++] = (qr_byte_t)(mode | 0x80);
	qr->source[qr->srclen++] = (qr_byte_t)((size >> 24) & 0x7F);
	qr->source[qr->srclen++] = (qr_byte_t)((size >> 16) & 0xFF);
	qr->source[qr->srclen++] = (qr_byte_t)((size >> 8) & 0xFF);
	qr->source[qr->srclen++] = (qr_byte_t)(size & 0xFF);
	memcpy(&(qr->source[qr->srclen]), source, (size_t)size);
	qr->srclen += size;
	qr->source[qr->srclen] = '\0';

	qr->state = QR_STATE_SET;
	return TRUE;
}

/*
 * 構造的連接の最後のQRコードオブジェクトにデータを追加する
 */
QR_API int
qrsAddData(QRStructured *st, const qr_byte_t *source, int size)
{
	if (st->state == QR_STATE_FINAL) {
		qrSetErrorInfo(st->cur, QR_ERR_STATE, _QR_FUNCTION);
		return FALSE;
	}
	return qrsAddData2(st, source, size, st->param.mode);
}

/*
 * 構造的連接の最後のQRコードオブジェクトに符号化モードを指定してデータを追加する
 */
QR_API int
qrsAddData2(QRStructured *st, const qr_byte_t *source, int size, int mode)
{
	int enclen, maxlen, limit, remain;
	int sizes[QR_STA_MAX] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
	int i, j;
	int p;

	if (st->state == QR_STATE_FINAL) {
		qrSetErrorInfo(st->cur, QR_ERR_STATE, _QR_FUNCTION);
		return FALSE;
	}

	if (size <= 0) {
		qrSetErrorInfo(st->cur, QR_ERR_EMPTY_SRC, NULL);
		return FALSE;
	}

	/*
	 * 入力データに最適な符号化モードを選ぶ
	 */
	if (mode == QR_EM_AUTO) {
		mode = qrDetectDataType(source, size);
	}

	/*
	 * 残りデータ容量を計算する
	 */
	maxlen = 8 * qr_vertable[st->param.version].ecl[st->param.eclevel].datawords;
	limit = maxlen - QR_STA_LEN;
	if (!qrHasData(st->cur)) {
		remain = limit;
	} else {
		remain = qrRemainedDataBits(st->cur);
	}

	/*
	 * 符号化後のデータ長を計算する
	 */
	enclen = qrGetEncodedLength2(st->cur, size, mode);
	if (enclen == -1) {
		return FALSE;
	}
	j = 0;
	if (enclen > remain) {
		int l, r, s;
		r = remain;
		s = size;
		for (i = 0; i <= st->max - st->num; i++) {
			j++;
			l = qrGetEncodableLength2(st->cur, r, mode);
			if (s <= l) {
				sizes[i] = s;
				s = 0;
				break;
			} else {
				sizes[i] = l;
				s -= l;
				r = limit;
			}
		}
		if (s > 0) {
			int snum, reqlen;
			snum = (enclen + maxlen - 1) / maxlen - (st->num - 1);
			reqlen = maxlen * (st->num - 1);
			reqlen += maxlen - remain;
			reqlen += enclen;
			reqlen += qr_vertable[st->param.version].nlen[mode] * (snum - 1) + QR_STA_LEN * snum;
			qrSetErrorInfo3(st->cur, QR_ERR_LARGE_SRC, ", %d total encoded bits"
					" (max %d bits on version=%d, ecl=%s, num=%d)",
					reqlen, maxlen * st->max,
					st->param.version, qr_eclname[st->param.eclevel], st->max);
			return FALSE;
		}
	} else {
		j = 1;
		sizes[0] = size;
	}

	/*
	 * 入力データをエンコードする
	 */
	p = 0;
	i = 0;
	while (i < j) {
		if (sizes[i] == 0 && i != 0) {
			break;
		}
		if (!qrHasData(st->cur)) {
			/*
			 * データコード語を初期化し、仮の構造的連接ヘッダを追加する
			 */
			qrInitDataWord(st->cur);
			qrAddDataBits(st->cur, 4, 0);
			qrAddDataBits(st->cur, 4, 0);
			qrAddDataBits(st->cur, 4, 0);
			qrAddDataBits(st->cur, 8, 0);
		}
		if (sizes[i] != 0) {
			st->cur->enclen += qrGetEncodedLength2(st->cur, sizes[i], mode);
			if (qrEncodeDataWord(st->cur, source + p, sizes[i], mode) == TRUE) {
				st->cur->state = QR_STATE_SET;
				st->state = QR_STATE_SET;
			} else {
				return FALSE;
			}
			p += sizes[i];
		}
		i++;
		if (i < j && sizes[i] > 0) {
			/*
			 * 次のQRコードオブジェクトを初期化する
			 */
			int errcode;
			st->qrs[st->num] = qrInit(st->param.version, st->param.mode,
					st->param.eclevel, st->param.masktype, &errcode);
			if (st->qrs[st->num] == NULL) {
				qrSetErrorInfo(st->cur, errcode, NULL);
				return FALSE;
			}
			st->cur = st->qrs[st->num];
			st->num++;
		}
	}

	/*
	 * パリティを計算する
	 */
	p = 0;
	while (p < size) {
		st->parity ^= source[p++];
	}

	return TRUE;
}

/*
 * データコード語を初期化する
 */
static int
qrInitDataWord(QRCode *qr)
{
	/*
	 * データコード語領域をゼロクリアする
	 */
	memset(qr->dataword, '\0', QR_DWD_MAX);

	/*
	 * 追加位置をバイト0の最上位ビットにする
	 */
	qr->dwpos = 0;
	qr->dwbit = 7;

	return TRUE;
}

/*
 * データコード語をエンコードする
 */
static int
qrEncodeDataWord(QRCode *qr, const qr_byte_t *source, int size, int mode)
{
	int p = 0;
	int e = QR_ERR_NONE;
	int n = 0;
	int word = 0;
	int dwpos = qr->dwbit;
	int dwbit = qr->dwpos;

	if (mode < QR_EM_NUMERIC || mode >= QR_EM_COUNT) {
		e = QR_ERR_INVALID_MODE;
		goto err;
	}

	/*
	 * モード指示子(4ビット)を追加する
	 */
	qrAddDataBits(qr, 4, qr_modeid[mode]);

	/*
	 * 文字数指示子(8〜16ビット)を追加する
	 * ビット数は型番とモードによって異なる
	 */
	if (mode == QR_EM_KANJI) {
		qrAddDataBits(qr, qr_vertable[qr->param.version].nlen[mode], size / 2);
	} else {
		qrAddDataBits(qr, qr_vertable[qr->param.version].nlen[mode], size);
	}

	/*
	 * 入力データを符号化する
	 */
	switch (mode) {
	  case QR_EM_NUMERIC:
		/*
		 * 数字モード
		 * 3桁ずつ10ビットの2進数に変換する
		 * 余りは1桁なら4ビット、2桁なら7ビットにする
		 */
		while (p < size) {
			qr_byte_t q = source[p];
			if (q < '0' || q > '9') {
				/* 数字でない */
				e = QR_ERR_NOT_NUMERIC;
				goto err;
			}
			word = word * 10 + (q - '0');
			/*
			 * 3桁たまったら10ビットで追加する
			 */
			if (++n >= 3) {
				qrAddDataBits(qr, 10, word);
				n = 0;
				word = 0;
			}
			p++;
		}
		/*
		 * 余りの桁を追加する
		 */
		if (n == 1) {
			qrAddDataBits(qr, 4, word);
		} else if (n == 2) {
			qrAddDataBits(qr, 7, word);
		}
		break;

	  case QR_EM_ALNUM:
		/*
		 * 英数字モード
		 * 2桁ずつ11ビットの2進数に変換する
		 * 余りは6ビットとして変換する
		 */
		while (p < size) {
			signed char q = qr_alnumtable[source[p]];
			if (q == -1) {
				/* 符号化可能な英数字でない */
				e = QR_ERR_NOT_ALNUM;
				goto err;
			}
			word = word * 45 + (int)q;
			/*
			 * 2桁たまったら11ビットで追加する
			 */
			if (++n >= 2) {
				qrAddDataBits(qr, 11, word);
				n = 0;
				word = 0;
			}
			p++;
		}
		/*
		 * 余りの桁を追加する
		 */
		if (n == 1) {
			qrAddDataBits(qr, 6, word);
		}
		break;

	  case QR_EM_8BIT:
		/*
		 * 8ビットバイトモード
		 * 各バイトを直接8ビット値として追加する
		 */
		while (p < size) {
			qrAddDataBits(qr, 8, (int)source[p++]);
		}
		break;

	  case QR_EM_KANJI:
		/*
		 * 漢字モード
		 * 2バイトを13ビットに変換して追加する
		 */
		while (p < size - 1) {
			qr_byte_t x, y;
			/*
			 * 第1バイトの処理
			 * 0x81-0x9fなら0x81を引く
			 * 0xe0,0xeaなら0xc1を引く
			 */
			x = source[p++];
			if (x >= 0x81 && x <= 0x9f) {
				x -= 0x81;
			} else if (x >= 0xe0 && x <= 0xea) {
				x -= 0xc1;
			} else {
				/* JIS X 0208漢字の1バイトめでない */
				p -= 1;
				e = QR_ERR_NOT_KANJI;
				goto err;
			}
			/*
			 * 第2バイトの処理
			 * 0x40を引く
			 */
			y = source[p++];
			if (y >= 0x40 && y <= 0xfc) {
				y -= 0x40;
			} else {
				/* JIS X 0208漢字の2バイトめでない */
				p -= 1;
				e = QR_ERR_NOT_KANJI;
				goto err;
			}
			/*
			 * 結果を13ビットの値として追加する
			 */
			word = (int)qr_dwtable_kanji[x][y];
			if (word == -1) {
				/* JIS X 0208漢字の未定義領域 */
				p -= 2;
				e = QR_ERR_NOT_KANJI;
				goto err;
			}
			qrAddDataBits(qr, 13, word);
		}
		if (p < size) {
			/*
			 * 末尾に余分なバイトがある
			 */
			e = QR_ERR_NOT_KANJI;
			goto err;
		}
		break;

	  default:
		e = QR_ERR_INVALID_MODE;
		goto err;
	}

	return TRUE;

  err:
	qr->dwpos = dwpos;
	qr->dwbit = dwbit;
	if (e == QR_ERR_INVALID_MODE) {
		qrSetErrorInfo(qr, e, NULL);
	} else {
		qrSetErrorInfo3(qr, e, " at offset %d", p);
	}
	return FALSE;
}

/*
 * データコード語の余りを埋める
 */
static int
qrFinalizeDataWord(QRCode *qr)
{
	int n, m;
	int word;

	/*
	 * 終端パターンを追加する(最大4ビットの0)
	 */
	n = qrRemainedDataBits(qr);
	if (n < 4) {
		qrAddDataBits(qr, n, 0);
		n = 0;
	} else {
		qrAddDataBits(qr, 4, 0);
		n -= 4;
	}
	/*
	 * 末尾のデータコード語の全ビットが埋まっていなければ
	 * 余りを埋め草ビット(0)で埋める
	 */
	m = n % 8;
	if (m > 0) {
		qrAddDataBits(qr, m, 0);
		n -= m;
	}

	/*
	 * 残りのデータコード語に埋め草コード語1,2を交互に埋める
	 */
	word = PADWORD1;
	while (n >= 8) {
		qrAddDataBits(qr, 8, word);
		if (word == PADWORD1) {
			word = PADWORD2;
		} else {
			word = PADWORD1;
		}
		n -= 8;
	}

	return TRUE;
}

/*
 * データコード語にビット列を追加する
 */
static void
qrAddDataBits(QRCode *qr, int n, int word)
{
	/*
	 * 上位ビットから順に処理(ビット単位で処理するので遅い)
	 */
	while (n-- > 0) {
		/*
		 * ビット追加位置にデータの下位からnビットめをORする
		 */
		qr->dataword[qr->dwpos] |= ((word >> n) & 1) << qr->dwbit;
		/*
		 * 次のビット追加位置に進む
		 */
		if (--qr->dwbit < 0) {
			qr->dwpos++;
			qr->dwbit = 7;
		}
	}
}

/*
 * データコード語の残りビット数を返す
 */
QR_API int
qrRemainedDataBits(QRCode *qr)
{
	int version;
	version = (qr->param.version == -1) ? QR_VER_MAX : qr->param.version;
	return (qr_vertable[version].ecl[qr->param.eclevel].datawords - qr->dwpos) * 8 - (7 - qr->dwbit);
}

/*
 * RSブロックごとに誤り訂正コード語を計算する
 */
static int
qrComputeECWord(QRCode *qr)
{
	int i, j, k, m;
	int ecwtop, dwtop, nrsb, rsbnum;
	qr_byte_t rswork[QR_RSD_MAX];

	/*
	 * データコード語をRSブロックごとに読み出し、
	 * それぞれについて誤り訂正コード語を計算する
	 * RSブロックは長さによってnrsb種類に分かれ、
	 * それぞれの長さについてrsbnum個のブロックがある
	 */
	dwtop = 0;
	ecwtop = 0;
	nrsb = qr_vertable[qr->param.version].ecl[qr->param.eclevel].nrsb;
#define rsb qr_vertable[qr->param.version].ecl[qr->param.eclevel].rsb
#define gfvector qr_gftable[ecwlen]
	for (i = 0; i < nrsb; i++) {
		int dwlen, ecwlen;
		/*unsigned char *gfvector;*/
		/*qr_rsblock_t *rsbp;*/
		/*
		 * この長さのRSブロックの個数(rsbnum)と
		 * RSブロック内のデータコード語の長さ(dwlen)、
		 * 誤り訂正コード語の長さ(ecwlen)を求める
		 * また誤り訂正コード語の長さから、使われる
		 * 誤り訂正生成多項式(gfvector)を選ぶ
		 */
		/*rsbp = &(qr_vertable[qr->param.version].ecl[qr->param.eclevel].rsb[i]);
		rsbnum = rsbp->rsbnum;
		dwlen = rsbp->datawords;
		ecwlen = rsbp->totalwords - rsbp->datawords;*/
		rsbnum = rsb[i].rsbnum;
		dwlen = rsb[i].datawords;
		ecwlen = rsb[i].totalwords - rsb[i].datawords;
		/*gfvector = qr_gftable[ecwlen];*/
		/*
		 * それぞれのRSブロックについてデータコード語を
		 * 誤り訂正生成多項式で除算し、結果を誤り訂正
		 * コード語とする
		 */
		for (j = 0; j < rsbnum; j++) {
			/*
			 * RS符号計算用作業領域をクリアし、
			 * 当該RSブロックのデータコード語を
			 * 多項式係数とみなして作業領域に入れる
			 * (作業領域の大きさはRSブロックの
			 * データコード語と誤り訂正コード語の
			 * いずれか長いほうと同じだけ必要)
			 */
			memset(&(rswork[0]), '\0', QR_RSD_MAX);
			memcpy(&(rswork[0]), &(qr->dataword[dwtop]), (size_t)dwlen);
			/*
			 * 多項式の除算を行う
			 * (各次数についてデータコード語の初項係数から
			 * 誤り訂正生成多項式への乗数を求め、多項式
			 * どうしの減算により剰余を求めることをくり返す)
			 */
			for (k = 0; k < dwlen; k++) {
				int e;
				if (rswork[0] == 0) {
					/*
					 * 初項係数がゼロなので、各項係数を
					 * 左にシフトして次の次数に進む
					 */
					for (m = 0; m < QR_RSD_MAX-1; m++) {
						rswork[m] = rswork[m+1];
					}
					rswork[QR_RSD_MAX-1] = 0;
					continue;
				}
				/*
				 * データコード語の初項係数(整数表現)から
				 * 誤り訂正生成多項式への乗数(べき表現)を求め、
				 * 残りの各項について剰余を求めるために
				 * データコード語の各項係数を左にシフトする
				 */
				e = qr_fac2exp[rswork[0]];
				for (m = 0; m < QR_RSD_MAX-1; m++) {
					rswork[m] = rswork[m+1];
				}
				rswork[QR_RSD_MAX-1] = 0;
				/*
				 * 誤り訂正生成多項式の各項係数に上で求めた
				 * 乗数を掛け(べき表現の加算により求める)、
				 * データコード語の各項から引いて(整数表現の
				 * 排他的論理和により求める)、剰余を求める
				 */
				for (m = 0; m < ecwlen; m++) {
					rswork[m] ^= qr_exp2fac[(gfvector[m] + e) % 255];
				}
			}
			/*
			 * 多項式除算の剰余を当該RSブロックの
			 * 誤り訂正コードとする
			 */
			memcpy(&(qr->ecword[ecwtop]), &(rswork[0]), (size_t)ecwlen);
			/*
			 * データコード語の読み出し位置と
			 * 誤り訂正コード語の書き込み位置を
			 * 次のRSブロック開始位置に移動する
			 */
			dwtop += dwlen;
			ecwtop += ecwlen;
		}
	}
#undef rsb
#undef gfvector
	return TRUE;
}

/*
 * データコード語と誤り訂正コード語から最終的なコード語を作る
 */
static int
qrMakeCodeWord(QRCode *qr)
{
	int i, j, k, cwtop, pos;
	int dwlenmax, ecwlenmax;
	int dwlen, ecwlen, nrsb;
	/*qr_rsblock_t *rsb;*/

	/*
	 * RSブロックのサイズ種類数(nrsb)および
	 * 最大RSブロックのデータコード語数(dwlenmax)、
	 * 誤り訂正コード語数(ecwlenmax)を得る
	 */
	nrsb = qr_vertable[qr->param.version].ecl[qr->param.eclevel].nrsb;
	/*rsb = qr_vertable[qr->param.version].ecl[qr->param.eclevel].rsb;*/
#define rsb qr_vertable[qr->param.version].ecl[qr->param.eclevel].rsb
	dwlenmax = rsb[nrsb-1].datawords;
	ecwlenmax = rsb[nrsb-1].totalwords - rsb[nrsb-1].datawords;
	/*
	 * 各RSブロックから順にデータコード語を取り出し
	 * コード語領域(qr->codeword)に追加する
	 */
	cwtop = 0;
	for (i = 0; i < dwlenmax; i++) {
		pos = i;
		/*
		 * RSブロックのサイズごとに処理を行う
		 */
		for (j = 0; j < nrsb; j++) {
			dwlen = rsb[j].datawords;
			/*
			 * 同じサイズのRSブロックは順に処理する
			 */
			for (k = 0; k < rsb[j].rsbnum; k++) {
				/*
				 * 各RSブロックのiバイトめのデータ
				 * コード語をコード語領域に追加する
				 * (すでにすべてのデータコード語を
				 * 取り出したRSブロックは飛ばす)
				 */
				if (i < dwlen) {
					qr->codeword[cwtop++] = qr->dataword[pos];
				}
				/*
				 * 次のRSブロックのiバイトめに進む
				 */
				pos += dwlen;
			}
		}
	}
	/*
	 * 各RSブロックから順に誤り訂正コード語を取り出し
	 * コード語領域(qr->codeword)に追加する
	 */
	for (i = 0; i < ecwlenmax; i++) {
		pos = i;
		/*
		 * RSブロックのサイズごとに処理を行う
		 */
		for (j = 0; j < nrsb; j++) {
			ecwlen = rsb[j].totalwords - rsb[j].datawords;
			/*
			 * 同じサイズのRSブロックは順に処理する
			 */
			for (k = 0; k < rsb[j].rsbnum; k++) {
				/*
				 * 各RSブロックのiバイトめの誤り訂正
				 * コード語をコード語領域に追加する
				 * (すでにすべての誤り訂正コード語を
				 * 取り出したRSブロックは飛ばす)
				 */
				if (i < ecwlen) {
					qr->codeword[cwtop++] = qr->ecword[pos];
				}
				/*
				 * 次のRSブロックのiバイトめに進む
				 */
				pos += ecwlen;
			}
		}
	}
#undef rsb
#undef nrsb
	return TRUE;
}

/*
 * シンボルを初期化し、機能パターンを配置する
 */
static int
qrFillFunctionPattern(QRCode *qr)
{
	int i, j, n, dim, xpos, ypos;

	/*
	 * シンボルの1辺の長さを求める
	 */
	dim = qr_vertable[qr->param.version].dimension;
	/*
	 * シンボル全体をクリアする
	 */
	qrFree(qr->symbol);
	qrFree(qr->_symbol);
	qr->_symbol = (qr_byte_t *)calloc((size_t)dim, (size_t)dim);
	if (qr->_symbol == NULL) {
		return FALSE;
	}
	qr->symbol = (qr_byte_t **)malloc(sizeof(qr_byte_t *) * (size_t)dim);
	if (qr->symbol == NULL) {
		free(qr->_symbol);
		return FALSE;
	}
	for (i = 0; i < dim; i++) {
		qr->symbol[i] = qr->_symbol + dim * i;
	}
	/*
	 * 左上、右上、左下の隅に位置検出パターンを配置する
	 */
	for (i = 0; i < QR_DIM_FINDER; i++) {
		for (j = 0; j < QR_DIM_FINDER; j++) {
			qr->symbol[i][j] = qr_finderpattern[i][j];
			qr->symbol[i][dim-1-j] = qr_finderpattern[i][j];
			qr->symbol[dim-1-i][j] = qr_finderpattern[i][j];
		}
	}
	/*
	 * 位置検出パターンの分離パターンを配置する
	 */
	for (i = 0; i < QR_DIM_FINDER+1; i++) {
		qr->symbol[i][QR_DIM_FINDER] = QR_MM_FUNC;
		qr->symbol[QR_DIM_FINDER][i] = QR_MM_FUNC;
		qr->symbol[i][dim-1-QR_DIM_FINDER] = QR_MM_FUNC;
		qr->symbol[dim-1-QR_DIM_FINDER][i] = QR_MM_FUNC;
		qr->symbol[dim-1-i][QR_DIM_FINDER] = QR_MM_FUNC;
		qr->symbol[QR_DIM_FINDER][dim-1-i] = QR_MM_FUNC;
	}
	/*
	 * 位置合わせパターンを配置する
	 */
	n = qr_vertable[qr->param.version].aplnum;
	for (i = 0; i < n; i++) {
		for (j = 0; j < n; j++) {
			int x, y, x0, y0, xcenter, ycenter;
			/*
			 * 位置合わせパターンの中心と左上の座標を求める
			 */
			ycenter = qr_vertable[qr->param.version].aploc[i];
			xcenter = qr_vertable[qr->param.version].aploc[j];
			y0 = ycenter - QR_DIM_ALIGN / 2;
			x0 = xcenter - QR_DIM_ALIGN / 2;
			if (qrIsFunc(qr, ycenter, xcenter)) {
				/*
				 * 位置検出パターンと重なるときは配置しない
				 */
				continue;
			}
			for (y = 0; y < QR_DIM_ALIGN; y++) {
				for (x = 0; x < QR_DIM_ALIGN; x++) {
					qr->symbol[y0+y][x0+x] = qr_alignpattern[y][x];
				}
			}
		}
	}
	/*
	 * タイミングパターンを配置する
	 */
	for (i = QR_DIM_FINDER; i < dim-1-QR_DIM_FINDER; i++) {
		qr->symbol[i][QR_DIM_TIMING] = QR_MM_FUNC;
		qr->symbol[QR_DIM_TIMING][i] = QR_MM_FUNC;
		if ((i & 1) == 0) {
			qr->symbol[i][QR_DIM_TIMING] |= QR_MM_BLACK;
			qr->symbol[QR_DIM_TIMING][i] |= QR_MM_BLACK;
		}
	}
	/*
	 * 形式情報の領域を予約する
	 */
	for (i = 0; i < 2; i++) {
		for (j = 0; j < QR_FIN_MAX; j++) {
			xpos = (qr_fmtinfopos[i][j].xpos + dim) % dim;
			ypos = (qr_fmtinfopos[i][j].ypos + dim) % dim;
			qr->symbol[ypos][xpos] |= QR_MM_FUNC;
		}
	}
	xpos = (qr_fmtblackpos.xpos + dim) % dim;
	ypos = (qr_fmtblackpos.ypos + dim) % dim;
	qr->symbol[ypos][xpos] |= QR_MM_FUNC;
	/*
	 * 型番情報が有効(型番7以上)なら
	 * 型番情報の領域を予約する
	 */
	if (qr_verinfo[qr->param.version] != -1L) {
		for (i = 0; i < 2; i++) {
			for (j = 0; j < QR_VIN_MAX; j++) {
				xpos = (qr_verinfopos[i][j].xpos + dim) % dim;
				ypos = (qr_verinfopos[i][j].ypos + dim) % dim;
				qr->symbol[ypos][xpos] |= QR_MM_FUNC;
			}
		}
	}

	return TRUE;
}

/*
 * シンボルに符号化されたコード語を配置する
 */
static int
qrFillCodeWord(QRCode *qr)
{
	int i, j;

	/*
	 * シンボル右下隅から開始する
	 */
	qrInitPosition(qr);
	/*
	 * コード語領域のすべてのバイトについて...
	 */
	for (i = 0; i < qr_vertable[qr->param.version].totalwords; i++) {
		/*
		 * 最上位ビットから順に各ビットを調べ...
		 */
		for (j = 7; j >= 0; j--) {
			/*
			 * そのビットが1なら黒モジュールを置く
			 */
			if ((qr->codeword[i] & (1 << j)) != 0) {
				qr->symbol[qr->ypos][qr->xpos] |= QR_MM_DATA;
			}
			/*
			 * 次のモジュール配置位置に移動する
			 */
			qrNextPosition(qr);
		}
	}

	return TRUE;
}

/*
 * モジュール配置の初期位置と配置方向を決める
 */
static void
qrInitPosition(QRCode *qr)
{
	/*
	 * シンボルの右下隅から配置を始める
	 */
	qr->xpos = qr->ypos = qr_vertable[qr->param.version].dimension - 1;
	/*
	 * 最初の移動方向は左向き、次に上向き
	 */
	qr->xdir = -1;
	qr->ydir = -1;
}

/*
 * 次のモジュール配置位置を決める
 */
static void
qrNextPosition(QRCode *qr)
{
	do {
		/*
		 * qr->xdir方向に1モジュール移動して
		 * qr->xdirの向きを逆にする
		 * 右に移動したときはqr->ydir方向にも
		 * 1モジュール移動する
		 */
		qr->xpos += qr->xdir;
		if (qr->xdir > 0) {
			qr->ypos += qr->ydir;
		}
		qr->xdir = -qr->xdir;
		/*
		 * y方向にシンボルをはみ出すようなら
		 * y方向ではなくx方向に2モジュール左に移動し、
		 * かつqr->ydirの向きを逆にする
		 * qr->xposが縦のタイミングパターン上なら
		 * さらに1モジュール左に移動する
		 */
		if (qr->ypos < 0 || qr->ypos >= qr_vertable[qr->param.version].dimension) {
			qr->ypos -= qr->ydir;
			qr->ydir = -qr->ydir;
			qr->xpos -= 2;
			if (qr->xpos == QR_DIM_TIMING) {
				qr->xpos--;
			}
		}
		/*
		 * 新しい位置が機能パターン上なら
		 * それをよけて次の候補位置を探す
		 */
	} while (qrIsFunc(qr, qr->ypos, qr->xpos));
}

/*
 * シンボルを最適なマスクパターンでマスクする
 */
static int
qrSelectMaskPattern(QRCode *qr)
{
	int type;
	long penalty, xpenalty;

	if (qr->param.masktype >= 0) {
		/*
		 * マスクパターンが引数で指定されていたので
		 * そのパターンでマスクして終了
		 */
		return qrApplyMaskPattern(qr);
	}
	/*
	 * すべてのマスクパターンを評価する
	 */
	xpenalty = -1L;
	for (type = 0; type < QR_MPT_MAX; type++) {
		/*
		 * 当該マスクパターンでマスクして評価する
		 */
		qrApplyMaskPattern2(qr, type);
		penalty = qrEvaluateMaskPattern(qr);
		/*
		 * 失点がこれまでより低かったら記録する
		 */
		if (xpenalty == -1L || penalty < xpenalty) {
			qr->param.masktype = type;
			xpenalty = penalty;
		}
	}
	/*
	 * 失点が最低のパターンでマスクする
	 */
	return qrApplyMaskPattern(qr);
}

/*
 * 設定済みの参照子のマスクパターンでシンボルをマスクする
 */
static int
qrApplyMaskPattern(QRCode *qr)
{
	return qrApplyMaskPattern2(qr, qr->param.masktype);
}

/*
 * 指定した参照子のマスクパターンでシンボルをマスクする
 */
static int
qrApplyMaskPattern2(QRCode *qr, int type)
{

	int i, j, dim;

	if (type < 0 || type >= QR_MPT_MAX) {
		qrSetErrorInfo3(qr, QR_ERR_INVALID_MPT, "%d", type);
		return FALSE;
	}

	dim = qr_vertable[qr->param.version].dimension;
	/*
	 * 以前のマスクパターンをクリアし、
	 * 符号化済みデータを初期パターンとする
	 */
	for (i = 0; i < dim; i++) {
		for (j = 0; j < dim; j++) {
			/*
			 * 機能パターン領域の印字黒モジュールは残す
			 */
			if (qrIsFunc(qr, i, j)) {
				continue;
			}
			/*
			 * 符号化データ領域は符号化データの
			 * 黒モジュールを印字黒モジュールにする
			 */
			if (qrIsData(qr, i, j)) {
				qr->symbol[i][j] |= QR_MM_BLACK;
			} else {
				qr->symbol[i][j] &= ~QR_MM_BLACK;
			}
		}
	}
	/*
	 * i行j列のモジュールについて...
	 */
	for (i = 0; i < dim; i++) {
		for (j = 0; j < dim; j++) {
			if (qrIsFunc(qr, i, j)) {
				/*
				 * 機能パターン領域(および形式情報、
				 * 型番情報)はマスク対象から除外する
				 */
				continue;
			}
			/*
			 * 指定された条件を満たすモジュールを反転する
			 */
			if ((type == 0 && (i + j) % 2 == 0) ||
				(type == 1 && i % 2 == 0) ||
				(type == 2 && j % 3 == 0) ||
				(type == 3 && (i + j) % 3 == 0) ||
				(type == 4 && ((i / 2) + (j / 3)) % 2 == 0) ||
				(type == 5 && (i * j) % 2 + (i * j) % 3 == 0) ||
				(type == 6 && ((i * j) % 2 + (i * j) % 3) % 2 == 0) ||
				(type == 7 && ((i * j) % 3 + (i + j) % 2) % 2 == 0))
			{
				qr->symbol[i][j] ^= QR_MM_BLACK;
			}
		}
	}

	return TRUE;
}

/*
 * マスクパターンを評価し評価値を返す
 */
static long
qrEvaluateMaskPattern(QRCode *qr)
{
	int i, j, m, n, dim;
	long penalty;

	/*
	 * 評価値をpenaltyに積算する
	 * マスクは符号化領域に対してのみ行うが
	 * 評価はシンボル全体について行われる
	 */
	penalty = 0L;
	dim = qr_vertable[qr->param.version].dimension;
	/*
	 * 特徴: 同色の行/列の隣接モジュール
	 * 評価条件: モジュール数 = (5＋i)
	 * 失点: 3＋i
	 */
	for (i = 0; i < dim; i++) {
		n = 0;
		for (j = 0; j < dim; j++) {
			if (j > 0 && qrIsBlack(qr, i, j) == qrIsBlack(qr, i, j-1)) {
				/*
				 * すぐ左と同色のモジュール
				 * 同色列の長さを1増やす
				 */
				n++;
			} else {
				/*
				 * 色が変わった
				 * 直前で終わった同色列の長さを評価する
				 */
				if (n >= 5) {
					penalty += (long)(3 + (n - 5));
				}
				n = 1;
			}
		}
		/*
		 * 列が尽きた
		 * 直前で終わった同色列の長さを評価する
		 */
		if (n >= 5) {
			penalty += (long)(3 + (n - 5));
		}
	}
	for (i = 0; i < dim; i++) {
		n = 0;
		for (j = 0; j < dim; j++) {
			if (j > 0 && qrIsBlack(qr, j, i) == qrIsBlack(qr, j-1, i)) {
				/*
				 * すぐ上と同色のモジュール
				 * 同色列の長さを1増やす
				 */
				n++;
			} else {
				/*
				 * 色が変わった
				 * 直前で終わった同色列の長さを評価する
				 */
				if (n >= 5) {
					penalty += (long)(3 + (n - 5));
				}
				n = 1;
			}
		}
		/*
		 * 列が尽きた
		 * 直前で終わった同色列の長さを評価する
		 */
		if (n >= 5) {
			penalty += (long)(3 + (n - 5));
		}
	}
	/*
	 * 特徴: 同色のモジュールブロック
	 * 評価条件: ブロックサイズ = 2×2
	 * 失点: 3
	 */
	for (i = 0; i < dim - 1; i++) {
		for (j = 0; j < dim - 1; j++) {
			if (qrIsBlack(qr, i, j) == qrIsBlack(qr, i, j+1) &&
				qrIsBlack(qr, i, j) == qrIsBlack(qr, i+1, j) &&
				qrIsBlack(qr, i, j) == qrIsBlack(qr, i+1, j+1))
			{
				/*
				 * 2×2の同色のブロックがあった
				 */
				penalty += 3L;
			}
		}
	}
	/*
	 * 特徴: 行/列における1:1:3:1:1比率(暗:明:暗:明:暗)のパターン
	 * に続いて比率4の幅以上の明パターン
	 * 失点: 40
	 * 前後はシンボル境界外か明モジュールである必要がある
	 * 2:2:6:2:2のようなパターンにも失点を与えるべきかは
	 * JIS規格からは読み取れない。ここでは与えていない
	 */
	for (i = 0; i < dim; i++) {
		for (j = 0; j < dim - 6; j++) {
			if ((j == 0 || !qrIsBlack(qr, i, j-1)) &&
				qrIsBlack(qr, i, j+0) &&
				!qrIsBlack(qr, i, j+1) &&
				qrIsBlack(qr, i, j+2) &&
				qrIsBlack(qr, i, j+3) &&
				qrIsBlack(qr, i, j+4) &&
				!qrIsBlack(qr, i, j+5) &&
				qrIsBlack(qr, i, j+6))
			{
				int k, l;
				l = 1;
				for (k = 0; k < dim - j - 7 && k < 4; k++) {
					if (qrIsBlack(qr, i, j + k + 7)) {
						l = 0;
						break;
					}
				}
				/*
				 * パターンがあった
				 */
				if (l) {
					penalty += 40L;
				}
			}
		}
	}
	for (i = 0; i < dim; i++) {
		for (j = 0; j < dim - 6; j++) {
			if ((j == 0 || !qrIsBlack(qr, j-1, i)) &&
				qrIsBlack(qr, j+0, i) &&
				!qrIsBlack(qr, j+1, i) &&
				qrIsBlack(qr, j+2, i) &&
				qrIsBlack(qr, j+3, i) &&
				qrIsBlack(qr, j+4, i) &&
				!qrIsBlack(qr, j+5, i) &&
				qrIsBlack(qr, j+6, i) &&
				(j == dim-7 || !qrIsBlack(qr, j+7, i)))
			{
				int k, l;
				l = 1;
				for (k = 0; k < dim - j - 7 && k < 4; k++) {
					if (qrIsBlack(qr, j + k + 7, i)) {
						l = 0;
						break;
					}
				}
				/*
				 * パターンがあった
				 */
				if (l) {
					penalty += 40L;
				}
			}
		}
	}
	/*
	 * 特徴: 全体に対する暗モジュールの占める割合
	 * 評価条件: 50±(5×k)%〜50±(5×(k＋1))%
	 * 失点: 10×k
	 */
	m = 0;
	n = 0;
	for (i = 0; i < dim; i++) {
		for (j = 0; j < dim; j++) {
			m++;
			if (qrIsBlack(qr, i, j)) {
				n++;
			}
		}
	}
	penalty += (long)(abs((n * 100 / m) - 50) / 5 * 10);
	return penalty;
}

/*
 * シンボルに形式情報と型番情報を配置する
 */
static int
qrFillFormatInfo(QRCode *qr)
{
	int i, j, dim, fmt, modulo, xpos, ypos;
	long v;

	dim = qr_vertable[qr->param.version].dimension;
	/*
	 * 形式情報を計算する
	 * 誤り訂正レベル2ビット(L:01, M:00, Q:11, H:10)と
	 * マスクパターン参照子3ビットからなる計5ビットに
	 * Bose-Chaudhuri-Hocquenghem(15,5)符号による
	 * 誤り訂正ビット10ビットを付加して15ビットとする
	 * (5ビットをxの次数14〜10の多項式係数とみなして
	 * 多項式x^10+x^8+x^5+x^4+x^2+x+1(係数10100110111)
	 * で除算した剰余10ビットを誤り訂正ビットとする)
	 * さらにすべてのビットがゼロにならないように
	 * 101010000010010(0x5412)とXORをとる
	 */
	fmt = ((qr->param.eclevel ^ 1) << 3) | qr->param.masktype;
	modulo = fmt << 10;
	for (i = 14; i >= 10; i--) {
		if ((modulo & (1 << i)) == 0) {
			continue;
		}
		modulo ^= 0x537 << (i - 10);
	}
	fmt = ((fmt << 10) + modulo) ^ 0x5412;
	/*
	 * 形式情報をシンボルに配置する
	 */
	for (i = 0; i < 2; i++) {
		for (j = 0; j < QR_FIN_MAX; j++) {
			if ((fmt & (1 << j)) == 0) {
				continue;
			}
			xpos = (qr_fmtinfopos[i][j].xpos + dim) % dim;
			ypos = (qr_fmtinfopos[i][j].ypos + dim) % dim;
			qr->symbol[ypos][xpos] |= QR_MM_BLACK;
		}
	}
	xpos = (qr_fmtblackpos.xpos + dim) % dim;
	ypos = (qr_fmtblackpos.ypos + dim) % dim;
	qr->symbol[ypos][xpos] |= QR_MM_BLACK;
	/*
	 * 型番情報が有効(型番7以上)なら
	 * 型番情報をシンボルに配置する
	 */
	v = qr_verinfo[qr->param.version];
	if (v != -1L) {
		for (i = 0; i < 2; i++) {
			for (j = 0; j < QR_VIN_MAX; j++) {
				if ((v & (1L << j)) == 0L) {
					continue;
				}
				xpos = (qr_verinfopos[i][j].xpos + dim) % dim;
				ypos = (qr_verinfopos[i][j].ypos + dim) % dim;
				qr->symbol[ypos][xpos] |= QR_MM_BLACK;
			}
		}
	}

	return TRUE;
}

/*
 * データコード語の余剰ビットを埋める処理から
 * シンボルに形式情報と型番情報を配置する処理までを
 * 一括で実行する
 */
QR_API int
qrFinalize(QRCode *qr)
{
	static qr_funcs funcs[] = {
		qrFinalizeDataWord,
		qrComputeECWord,
		qrMakeCodeWord,
		qrFillFunctionPattern,
		qrFillCodeWord,
		qrSelectMaskPattern,
		qrFillFormatInfo,
		NULL
	};
	int i = 0;
	int ret = TRUE;

	if (qrIsFinalized(qr)) {
		return TRUE;
	}

	/*
	 * 型番自動選択
	 */
	if (qr->param.version == -1) {
		int maxlen, delta;
		int version = 0;
		while (++version <= QR_VER_MAX) {
			if (version <= VERPOINT1) {
				delta = qr->delta1;
			} else if (version <= VERPOINT2) {
				delta = qr->delta2;
			} else {
				delta = 0;
			}
			maxlen = 8 * qr_vertable[version].ecl[qr->param.eclevel].datawords;
			if (maxlen >= qr->enclen - delta) {
				break;
			}
		}
		if (version > QR_VER_MAX) {
			maxlen = 8 * qr_vertable[QR_VER_MAX].ecl[qr->param.eclevel].datawords;
			qrSetErrorInfo3(qr, QR_ERR_LARGE_SRC, ", %d total encoded bits"
					" (max %d bits on version=%d, ecl=%s)",
					qr->enclen, maxlen, QR_VER_MAX, qr_eclname[qr->param.eclevel]);
			return FALSE;
		}
		qr->param.version = version;
	}

	/*
	 * データコード語に入力データを登録する
	 */
	if (qr->source != NULL) {
		qr_byte_t *source;
		int mode, size;

		qrInitDataWord(qr);
		source = qr->source;
		while ((mode = (int)(*source++)) != '\0') {
			mode ^= 0x80;
			size = ((int)*source++) << 24;
			size |= ((int)*source++) << 16;
			size |= ((int)*source++) << 8;
			size |= (int)*source++;
			if (qrEncodeDataWord(qr, source, size, mode) == FALSE) {
				return FALSE;
			}
			source += size;
		}

		qrFree(qr->source);
	}

	/*
	 * シンボルを生成する
	 */
	while (funcs[i] && ret == TRUE) {
		ret = funcs[i++](qr);
	}

	if (ret == TRUE) {
		qrFree(qr->dataword);
		qrFree(qr->ecword);
		qrFree(qr->codeword);
		qr->state = QR_STATE_FINAL;
	}
	return ret;
}

/*
 * Finalze済か判定する
 */
QR_API int
qrIsFinalized(const QRCode *qr)
{
	if (qr->state == QR_STATE_FINAL) {
		return TRUE;
	}
	return FALSE;
}

/*
 * データをセット済か判定する
 */
QR_API int qrHasData(const QRCode *qr)
{
	if (qr->state == QR_STATE_BEGIN) {
		return FALSE;
	}
	return TRUE;
}

/*
 * 構造的連接の最後のQRコードオブジェクトの
 * 仮構造的連接ヘッダを正しい情報で上書きし、Finalizeする
 */
QR_API int
qrsFinalize(QRStructured *st)
{
	int m, n, r;

	if (!qrsHasData(st)) {
		qrSetErrorInfo(st->cur, QR_ERR_STATE, _QR_FUNCTION);
		return FALSE;
	} else if (qrsIsFinalized(st)) {
		return TRUE;
	}

	m = 0;
	n = st->num - 1;
	r = TRUE;
	while (m <= n && r == TRUE) {
		int dwpos, dwbit;
		dwpos = st->qrs[m]->dwpos;
		dwbit = st->qrs[m]->dwbit;
		st->qrs[m]->dwpos = 0;
		st->qrs[m]->dwbit = 7;
		qrAddDataBits(st->qrs[m], 4, 3);
		qrAddDataBits(st->qrs[m], 4, m);
		qrAddDataBits(st->qrs[m], 4, n);
		qrAddDataBits(st->qrs[m], 8, st->parity);
		st->qrs[m]->dwpos = dwpos;
		st->qrs[m]->dwbit = dwbit;
		r = qrFinalize(st->qrs[m]);
		m++;
	}

	if (r == TRUE) {
		st->state = QR_STATE_FINAL;
	}
	return r;
}

/*
 * Finalze済か判定する
 */
QR_API int
qrsIsFinalized(const QRStructured *st)
{
	if (st->state == QR_STATE_FINAL) {
		return TRUE;
	}
	return FALSE;
}

/*
 * データをセット済か判定する
 */
QR_API int qrsHasData(const QRStructured *st)
{
	if (st->state == QR_STATE_BEGIN) {
		return FALSE;
	}
	return TRUE;
}

/*
 * 生成されたQRコードシンボルを fmt で指定した形式に変換する
 */
QR_API qr_byte_t *
qrGetSymbol(QRCode *qr, int fmt, int sep, int mag, int *size)
{
	qr_byte_t *buf;
	int _size;

	static const QRConverter cnv[QR_FMT_COUNT] = {
		qrSymbolToBMP,
		qrSymbolToPBM,
		qrSymbolToJSON,
		qrSymbolToDigit,
		qrSymbolToASCII
	};

	if (fmt < 0 || fmt >= QR_FMT_COUNT) {
		qrSetErrorInfo(qr, QR_ERR_INVALID_FMT, NULL);
		return NULL;
	}

	if (cnv[fmt] == NULL) {
		qrSetErrorInfo(qr, QR_ERR_UNSUPPORTED_FMT, NULL);
		return NULL;
	}

	buf = cnv[fmt](qr, sep, mag, &_size);
	if (buf == NULL) {
		return NULL;
	}

	if (size) {
		*size = _size;
	}
	return buf;
}

/*
 * 生成されたQRコードシンボルをストリーム fp に書き込む
 */
QR_API int
qrOutputSymbol(QRCode *qr, FILE *fp, int fmt, int sep, int mag)
{
	qr_byte_t *buf;
	int size;

	buf = qrGetSymbol(qr, fmt, sep, mag, &size);
	if (buf == NULL) {
		return -1;
	}

	if (fp == NULL) {
		fp = stdout;
	}

	if (!fwrite(buf, (size_t)size, 1, fp)) {
		qrSetErrorInfo2(qr, QR_ERR_FWRITE, NULL);
		free(buf);
		return -1;
	}
	if (ferror(fp)) {
		qrSetErrorInfo(qr, QR_ERR_FWRITE, NULL);
		free(buf);
		return -1;
	}

	free(buf);

	return size;
}

/*
 * 生成されたQRコードシンボルをファイル pathname に書き込む
 */
QR_API int
qrOutputSymbol2(QRCode *qr, const char *pathname, int fmt, int sep, int mag)
{
	FILE *fp;
	int size;

	if (pathname == NULL || pathname[0] == '\0') {
		qrSetErrorInfo(qr, QR_ERR_EMPTY_PARAM, "(empty pathname)");
		return -1;
	}

	fp = fopen(pathname, "wb");
	if (fp == NULL) {
		qrSetErrorInfo2(qr, QR_ERR_FOPEN, pathname);
		return -1;
	}

	size = qrOutputSymbol(qr, fp, fmt, sep, mag);
	fclose(fp);

	return size;
}

/*
 * 生成されたQRコードシンボルすべてを fmt で指定した形式に変換する
 */
QR_API qr_byte_t *
qrsGetSymbols(QRStructured *st, int fmt, int sep, int mag, int order, int *size)
{
	qr_byte_t *buf;
	int _size;

	static QRsConverter cnv[QR_FMT_COUNT] = {
		qrsSymbolsToPBM,
		qrsSymbolsToJSON,
		qrsSymbolsToDigit,
		qrsSymbolsToASCII
	};

	if (fmt < 0 || fmt >= QR_FMT_COUNT) {
		qrSetErrorInfo(st->cur, QR_ERR_INVALID_FMT, NULL);
		return NULL;
	}

	buf = cnv[fmt](st, sep, mag, order, &_size);
	if (buf == NULL) {
		return NULL;
	}

	if (size) {
		*size = _size;
	}

	return buf;
}

/*
 * 生成されたQRコードシンボルすべてをストリーム fp に書き込む
 */
QR_API int
qrsOutputSymbols(QRStructured *st, FILE *fp, int fmt, int sep, int mag, int order)
{
	qr_byte_t *buf;
	int size;


	buf = qrsGetSymbols(st, fmt, sep, mag, order, &size);
	if (buf == NULL) {
		return -1;
	}

	if (fp == NULL) {
		fp = stdout;
	}

	if (!fwrite(buf, (size_t)size, 1, fp)) {
		qrSetErrorInfo2(st->cur, QR_ERR_FWRITE, NULL);
		free(buf);
		return -1;
	}
	if (ferror(fp)) {
		qrSetErrorInfo(st->cur, QR_ERR_FWRITE, NULL);
		free(buf);
		return -1;
	}

	free(buf);

	return size;
}

/*
 * 生成されたQRコードシンボルすべてをファイル pathname に書き込む
 */
QR_API int
qrsOutputSymbols2(QRStructured *st, const char *pathname, int fmt, int sep, int mag, int order)
{
	FILE *fp;
	int size;

	if (pathname == NULL || pathname[0] == '\0') {
		qrSetErrorInfo(st->cur, QR_ERR_EMPTY_PARAM, "(empty pathname)");
		return -1;
	}

	fp = fopen(pathname, "wb");
	if (fp == NULL) {
		qrSetErrorInfo2(st->cur, QR_ERR_FOPEN, pathname);
		return -1;
	}

	size = qrsOutputSymbols(st, fp, fmt, sep, mag, order);
	fclose(fp);

	return size;
}
