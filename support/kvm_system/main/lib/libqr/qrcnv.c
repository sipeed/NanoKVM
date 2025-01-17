/*
 * QR Code Generator Library: Symbol Converters for Basic Output Formats
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

/* {{{ utility macro */

#define repeat(m, n) for ((m) = 0; (m) < (n); (m)++)

/* }}} */
/* {{{ symbol writing macro */

#define qrInitRow(filler) { \
	memset(rbuf, (filler), (size_t)rsize); \
	rptr = rbuf; \
}

#define qrWriteRow(m, n) { \
	wsize = (int)(rptr - rbuf); \
	for ((m) = 0; (m) < (n); (m)++) { \
		memcpy(sptr, rbuf, (size_t)wsize); \
		sptr += wsize; \
	} \
	if (wsize < rsize) { \
		*size -= (rsize - wsize) * (n); \
	} \
}

/*
 * シンボルを出力する際の定型作業をまとめたマクロ
 *
 * このマクロを呼び出す前に以下の4つのマクロをdefineし、
 * 呼び出した後はundefする
 *  qrWriteBOR()     行頭を書き込む
 *  qrWriteEOR()     行末を書き込む
 *  qrWriteBLM(m, n) 明モジュールを書き込む
 *  qrWriteDKM(m, n) 暗モジュールを書き込む
*/
#define qrWriteSymbol(qr, filler) { \
	/* 分離パターン (上) */ \
	if (sepdim > 0) { \
		qrInitRow(filler); \
		qrWriteBOR(); \
		qrWriteBLM(j, imgdim); \
		qrWriteEOR(); \
		qrWriteRow(i, sepdim); \
	} \
	for (i = 0; i < dim; i++) { \
		/* 行を初期化 */ \
		qrInitRow(filler); \
		/* 行頭 */ \
		qrWriteBOR(); \
		/* 分離パターン (左) */ \
		qrWriteBLM(j, sepdim); \
		/* シンボル本体 */ \
		for (j = 0; j < dim; j++) { \
			if (qrIsBlack((qr), i, j)) { \
				qrWriteDKM(jx, mag); \
			} else { \
				qrWriteBLM(jx, mag); \
			} \
		} \
		/* 分離パターン (右) */ \
		qrWriteBLM(j, sepdim); \
		/* 行末 */ \
		qrWriteEOR(); \
		/* 行をmag回繰り返し書き込む */ \
		qrWriteRow(ix, mag); \
	} \
	/* 分離パターン (下) */ \
	if (sepdim > 0) { \
		qrInitRow(filler); \
		qrWriteBOR(); \
		qrWriteBLM(j, imgdim); \
		qrWriteEOR(); \
		qrWriteRow(i, sepdim); \
	} \
}

/* }}} */
/* {{{ Structured append symbol writing macro */

#define qrsWriteSymbols(st, filler) { \
	for (k = 0; k < rows; k++) { \
		/* 分離パターン (上) */ \
		if (sepdim > 0) { \
			qrInitRow(filler); \
			qrWriteBOR(); \
			qrWriteBLM(j, xdim); \
			qrWriteEOR(); \
			qrWriteRow(i, sepdim); \
		} \
		for (i = 0; i < dim; i++) { \
			/* 行を初期化 */ \
			qrInitRow(filler); \
			/* 行頭 */ \
			qrWriteBOR(); \
			for (kx = 0; kx < cols; kx++) { \
				/* 分離パターン (左) */ \
				qrWriteBLM(j, sepdim); \
				/* シンボル本体 */ \
				if (order < 0) { \
					pos = k + rows * kx; \
				} else { \
					pos = cols * k + kx; \
				} \
				if (pos < (st)->num) { \
					for (j = 0; j < dim; j++) { \
						if (qrIsBlack((st)->qrs[pos], i, j)) { \
							qrWriteDKM(jx, mag); \
						} else { \
							qrWriteBLM(jx, mag); \
						} \
					} \
				} else { \
					qrWriteBLM(j, zdim); \
				} \
			} \
			/* 分離パターン (右) */ \
			qrWriteBLM(j, sepdim); \
			/* 行末 */ \
			qrWriteEOR(); \
			/* 行をmag回繰り返し書き込む */ \
			qrWriteRow(ix, mag); \
		} \
	} \
	/* 分離パターン (下) */ \
	if (sepdim > 0) { \
		qrInitRow(filler); \
		qrWriteBOR(); \
		qrWriteBLM(j, xdim); \
		qrWriteEOR(); \
		qrWriteRow(i, sepdim); \
	} \
}

/* }}} */
/* {{{ Digit formatted symbol writing macro */

#define qrWriteBOR_Digit()
#define qrWriteEOR_Digit() { *rptr++ = ' '; }
#define qrWriteBLM_Digit(m, n) { rptr += (n); }
#define qrWriteDKM_Digit(m, n) { repeat(m, n) { *rptr++ = '1'; } }

/* }}} */
/* {{{ Ascii art formatted symbol writing macro */

#define qrWriteBOR_ASCII()
#ifdef WIN32
#define qrWriteEOR_ASCII() { *rptr++ = '\r'; *rptr++ = '\n'; }
#else
#define qrWriteEOR_ASCII() { *rptr++ = '\n'; }
#endif
#ifdef _QRCNV_AA_STYLE_U2588
#define QRCNV_AA_UNIT 3
#define qrWriteBLM_ASCII(m, n) { rptr += (n) * 2; }
#define qrWriteDKM_ASCII(m, n) { repeat(m, n) { *rptr++ = 0xe2; *rptr++ = 0x96; *rptr++ = 0x88; } }
#else
#define QRCNV_AA_UNIT 2
#define qrWriteBLM_ASCII(m, n) { rptr += (n) * 2; }
#define qrWriteDKM_ASCII(m, n) { repeat(m, n) { *rptr++ = 'X'; *rptr++ = 'X'; } }
#endif

/* }}} */
/* {{{ JSON formatted symbol writing macro */

#define qrWriteBOR_JSON() { *rptr++ = '['; }
#define qrWriteEOR_JSON() { rptr--; *rptr++ = ']'; rptr++; }
#ifdef _QR_JSON_STYLE_BOOLELAN
#define QRCNV_JSON_UNIT 6
#define qrWriteBLM_JSON(m, n) { repeat(m, n) { memcpy(rptr, "false", 5); rptr += 6; } }
#define qrWriteDKM_JSON(m, n) { repeat(m, n) { memcpy(rptr, "true", 4); rptr += 5; } }
#else
#define QRCNV_JSON_UNIT 2
#define qrWriteBLM_JSON(m, n) { repeat(m, n) { *rptr++ = '0'; rptr++; } }
#define qrWriteDKM_JSON(m, n) { repeat(m, n) { *rptr++ = '1'; rptr++; } }
#endif

/* }}} */
/* {{{ PBM formatted symbol writing macro */

#define qrWriteBOR_PBM()
#define qrWriteEOR_PBM() { *rptr++ = '\n'; }
#define qrWriteBLM_PBM(m, n) { repeat(m, n) { rptr++; *rptr++ = '0'; } }
#define qrWriteDKM_PBM(m, n) { repeat(m, n) { rptr++; *rptr++ = '1'; } }

/* }}} */
/* {{{ qrSymbolToDigit() */

/*
 * 生成されたQRコードシンボルを0,1と空白で構成される文字列に変換する
 */
QR_API qr_byte_t *
qrSymbolToDigit(QRCode *qr, int sep, int mag, int *size)
{
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, ix, jx, dim, imgdim, sepdim;

	QRCNV_CHECK_STATE();
	QRCNV_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = imgdim + 1;
	*size = rsize * imgdim - 1;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_Digit
#define qrWriteEOR qrWriteEOR_Digit
#define qrWriteBLM qrWriteBLM_Digit
#define qrWriteDKM qrWriteDKM_Digit

	/*
	 * シンボルを書き込む
	 */
	qrWriteSymbol(qr, '0');

	/*
	 * 最後の文字(スペース)を終端文字に置換する
	 */
	*(--sptr) = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrSymbolToASCII() */

/*
 * 生成されたQRコードシンボルを0,1と空白で構成される文字列に変換する
 */
QR_API qr_byte_t *
qrSymbolToASCII(QRCode *qr, int sep, int mag, int *size)
{
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, ix, jx, dim, imgdim, sepdim;

	QRCNV_CHECK_STATE();
	QRCNV_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = imgdim * QRCNV_AA_UNIT + QRCNV_EOL_SIZE;
	*size = rsize * imgdim;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_ASCII
#define qrWriteEOR qrWriteEOR_ASCII
#define qrWriteBLM qrWriteBLM_ASCII
#define qrWriteDKM qrWriteDKM_ASCII

	/*
	 * シンボルを書き込む
	 */
	qrWriteSymbol(qr, ' ');

	/*
	 * 終端文字を書き込む
	 */
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrSymbolToJSON() */

/*
 * 生成されたQRコードシンボルをJSON形式の文字列に変換する
 * JSONをデコードすると二次元配列が得られる
 */
QR_API qr_byte_t *
qrSymbolToJSON(QRCode *qr, int sep, int mag, int *size)
{
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, ix, jx, dim, imgdim, sepdim;

	QRCNV_CHECK_STATE();
	QRCNV_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = 1 + imgdim * QRCNV_JSON_UNIT + 1;
	*size = 1 + rsize * imgdim - 1 + 1;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_JSON
#define qrWriteEOR qrWriteEOR_JSON
#define qrWriteBLM qrWriteBLM_JSON
#define qrWriteDKM qrWriteDKM_JSON

	/*
	 * ヘッダを書き込む
	 */
	*sptr++ = '[';

	/*
	 * シンボルを書き込む
	 */
	qrWriteSymbol(qr, ',');

	/*
	 * フッタと終端文字を書き込む
	 */
	sptr--;
	*sptr++ = ']';
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrSymbolToPBM() */

/*
 * 生成されたQRコードシンボルをモノクロ2値の
 * アスキー形式Portable Bitmap(PBM)に変換する
 */
QR_API qr_byte_t *
qrSymbolToPBM(QRCode *qr, int sep, int mag, int *size)
{
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, ix, jx, dim, imgdim, sepdim;
	char header[64];
	int hsize;

	QRCNV_CHECK_STATE();
	QRCNV_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	hsize = snprintf(&(header[0]), sizeof(header), "P1\n%d %d\n", imgdim, imgdim);
	if (hsize == -1 || header[hsize - 1] != '\n') {
		QRCNV_RETURN_FAILURE(QR_ERR_UNKNOWN, _QR_FUNCTION);
	}
	rsize = imgdim * 2 + 1;
	*size = hsize + rsize * imgdim;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_PBM
#define qrWriteEOR qrWriteEOR_PBM
#define qrWriteBLM qrWriteBLM_PBM
#define qrWriteDKM qrWriteDKM_PBM

	/*
	 * ヘッダを書き込む
	 */
	memcpy(sptr, header, (size_t)hsize);
	sptr += hsize;

	/*
	 * シンボルを書き込む
	 */
	qrWriteSymbol(qr, ' ');

	/*
	 * 終端文字を書き込む
	 */
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrsSymbolsToDigit() */

/*
 * 構造的連接用qrSymbolToDigit()
 * order は無視される
 */
QR_API qr_byte_t *
qrsSymbolsToDigit(QRStructured *st, int sep, int mag, int order, int *size)
{
	QRCode *qr = st->cur;
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, k, ix, jx;
	int cols, rows, xdim, ydim, zdim;
	int dim, imgdim, sepdim;

	QRCNV_SA_CHECK_STATE();
	QRCNV_SA_IF_ONE(qrSymbolToDigit);
	QRCNV_SA_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = imgdim + 1;
	*size = rsize * imgdim * st->num - 1;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_Digit
#define qrWriteEOR qrWriteEOR_Digit
#define qrWriteBLM qrWriteBLM_Digit
#define qrWriteDKM qrWriteDKM_Digit

	/*
	 * シンボルを書き込む
	 */
	for (k = 0; k < st->num; k++) {
		qrWriteSymbol(st->qrs[k], '0');
		*(--sptr) = '\n';
		sptr++;
	}

	/*
	 * 最後の文字(LF)を終端文字に置換する
	 */
	*(--sptr) = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrsSymbolsToASCII() */

/*
 * 構造的連接用qrSymbolToASCII()
 */
QR_API qr_byte_t *
qrsSymbolsToASCII(QRStructured *st, int sep, int mag, int order, int *size)
{
	QRCode *qr = st->cur;
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, k, ix, jx, kx;
	int cols, rows, pos, xdim, ydim, zdim;
	int dim, imgdim, sepdim;

	QRCNV_SA_CHECK_STATE();
	QRCNV_SA_IF_ONE(qrSymbolToASCII);
	QRCNV_SA_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = xdim * QRCNV_AA_UNIT + QRCNV_EOL_SIZE;
	*size = rsize * ydim;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_ASCII
#define qrWriteEOR qrWriteEOR_ASCII
#define qrWriteBLM qrWriteBLM_ASCII
#define qrWriteDKM qrWriteDKM_ASCII

	/*
	 * シンボルを書き込む
	 */
	qrsWriteSymbols(st, ' ');

	/*
	 * 終端文字を書き込む
	 */
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrsSymbolsToJSON() */

/*
 * 構造的連接用qrSymbolToJSON()
 * order は無視される
 */
QR_API qr_byte_t *
qrsSymbolsToJSON(QRStructured *st, int sep, int mag, int order, int *size)
{
	QRCode *qr = st->cur;
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, k, ix, jx;
	int cols, rows, xdim, ydim, zdim;
	int dim, imgdim, sepdim;

	QRCNV_SA_CHECK_STATE();
	/*QRCNV_SA_IF_ONE(qrSymbolToJSON);*/
	QRCNV_SA_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	rsize = 1 + imgdim * QRCNV_JSON_UNIT + 1;
	*size = 1 + (1 + rsize * imgdim + 1) * st->num - 1 + 1;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_JSON
#define qrWriteEOR qrWriteEOR_JSON
#define qrWriteBLM qrWriteBLM_JSON
#define qrWriteDKM qrWriteDKM_JSON

	/*
	 * ヘッダを書き込む
	 */
	*sptr++ = '[';

	/*
	 * シンボルを書き込む
	 */
	for (k = 0; k < st->num; k++) {
		*sptr++ = '[';
		qrWriteSymbol(st->qrs[k], ',');
		sptr--;
		*sptr++ = ']';
		*sptr++ = ',';
	}

	/*
	 * フッタと終端文字を書き込む
	 */
	sptr--;
	*sptr++ = ']';
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
/* {{{ qrsSymbolsToPBM() */

/*
 * 構造的連接用qrSymbolToPBM()
 */
QR_API qr_byte_t *
qrsSymbolsToPBM(QRStructured *st, int sep, int mag, int order, int *size)
{
	QRCode *qr = st->cur;
	qr_byte_t *rbuf, *rptr;
	qr_byte_t *sbuf, *sptr;
	int rsize, wsize;
	int i, j, k, ix, jx, kx;
	int cols, rows, pos, xdim, ydim, zdim;
	int dim, imgdim, sepdim;
	char header[64];
	int hsize;

	QRCNV_SA_CHECK_STATE();
	QRCNV_SA_IF_ONE(qrSymbolToPBM);
	QRCNV_SA_GET_SIZE();

	/*
	 * 変換後のサイズを計算し、メモリを確保する
	 */
	hsize = snprintf(&(header[0]), 64, "P1\n%d %d\n", xdim, ydim);
	if (hsize >= 64) {
		QRCNV_RETURN_FAILURE(QR_ERR_UNKNOWN, _QR_FUNCTION);
	}
	rsize = xdim * 2 + 1;
	*size = hsize + rsize * ydim;
	QRCNV_MALLOC(rsize, *size + 1);

	sptr = sbuf;

#define qrWriteBOR qrWriteBOR_PBM
#define qrWriteEOR qrWriteEOR_PBM
#define qrWriteBLM qrWriteBLM_PBM
#define qrWriteDKM qrWriteDKM_PBM

	/*
	 * ヘッダを書き込む
	 */
	memcpy(sptr, header, (size_t)hsize);
	sptr += hsize;

	/*
	 * シンボルを書き込む
	 */
	qrsWriteSymbols(st, ' ');

	/*
	 * 終端文字を付加する
	 */
	*sptr = '\0';

#undef qrWriteBOR
#undef qrWriteEOR
#undef qrWriteBLM
#undef qrWriteDKM

	free(rbuf);

	return sbuf;
}

/* }}} */
