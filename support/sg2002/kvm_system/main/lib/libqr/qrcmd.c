/*
 * QR Code Generator Library: Command Line Interface
 *
 * Core routines were originally written by Junn Ohta.
 * Based on qr.c Version 0.1: 2004/4/3 (Public Domain)
 *
 * @package     libqr
 * @author      Ryusuke SEKIYAMA <rsky0711@gmail.com>
 * @copyright   2006-2013 Ryusuke SEKIYAMA
 * @license     http://www.opensource.org/licenses/mit-license.php  MIT License
 */

#include "qrcmd.h"

#ifdef WIN32
#define err(code, ...) { \
	printf(__VA_ARGS__); \
	printf(": %s\r\n", strerror(errno)); \
	exit(code); \
}
#define errx(code, ...) { \
	printf(__VA_ARGS__); \
	printf("\r\n"); \
	exit(code); \
}
#else
#include <err.h>
#endif

#include <limits.h>
#include <stdlib.h>
#include <string.h>

#ifdef WIN32
#include <sys/fcntl.h>
#define writeln(msg) printf(msg "\r\n")
#define ewriteln(msg) printf(msg "\r\n")
#define writelnf(fmt, ...) printf(fmt "r\n", __VA_ARGS__)
#define ewritelnf(fmt, ...) printf(fmt "\r\n", __VA_ARGS__)
#else
#define writeln(msg) printf(msg "\n")
#define ewriteln(msg) fprintf(stderr, msg "\n")
#define writelnf(fmt, ...) printf(fmt "\n", __VA_ARGS__)
#define ewritelnf(fmt, ...) fprintf(stderr, fmt "\n", __VA_ARGS__)
#endif

/* {{{ main() */

int
main(int argc, char **argv)
{
	QRCMD_PTR_TYPE *qr;
	int mag = 1;
	int sep = QR_DIM_SEP;
	int fmt = QR_FMT_PBM;
	QRCMD_EXTRA_PARAM_A
	char output[PATH_MAX] = { '\0' };
	char *ptr = &(output[0]);
	int result = 0;

#ifdef WIN32
	setmode(fileno(stdin), O_BINARY);
	setmode(fileno(stdout), O_BINARY);
#endif

	if (argc <= 1) {
		writelnf("%s: QR Code Generator", argv[0]);
		writelnf("try '%s --help' for more information", argv[0]);
		return 1;
	}

	/*
	 * QRコードオブジェクトを生成し、コマンド行引数からパラメータと入力データを設定する
	 */
	qr = qrGetParameter(argc, argv, &fmt, &sep, &mag, QRCMD_EXTRA_PARAM_C &ptr);

	/*
	 * データコード語をエンコードし、シンボルを配置する
	 */
	if (!qrCmdFinalize(qr)) {
		ewritelnf("%s: %s", argv[0], qrCmdGetErrorInfo(qr));
		qrCmdDestroy(qr);
		return 1;
	}

	/*
	 * シンボルを出力する
	 */
#ifdef QRCMD_STRUCTURED_APPEND
	if (extra == -1) {
		/*
		 * 連番出力
		 */
		int i;
		for (i = 0; i < qr->num; i++) {
			if (output[0] == '\0') {
				result = qrOutputSymbol(qr->qrs[i], stdout, fmt, sep, mag);
			} else {
				char outputs[PATH_MAX] = { '\0' };
				int written = 0;
				written = snprintf(&(outputs[0]), PATH_MAX, "%s%02d.%s",
						&(output[0]), i + 1, qrExtension(fmt));
				if (written < 0 || written >= PATH_MAX) {
					ewritelnf("%s: output pathname is too long", argv[0]);
					qrCmdDestroy(qr);
					return 1;
				}
				result = qrOutputSymbol2(qr->qrs[i], &(outputs[0]), fmt, sep, mag);
			}
			if (result == -1) {
				ewritelnf("%s: QR Code #%d: %s", argv[0], i, qrCmdGetErrorInfo(qr));
				qrCmdDestroy(qr);
				return 1;
			}
		}
	} else
#endif
	if (output[0] == '\0') {
		result = qrCmdOutputSymbol(qr, stdout, fmt, sep, mag QRCMD_EXTRA_PARAM_B);
	} else {
		result = qrCmdOutputSymbol2(qr, &(output[0]), fmt, sep, mag QRCMD_EXTRA_PARAM_B);
	}
	if (result == -1) {
		ewritelnf("%s: %s", argv[0], qrCmdGetErrorInfo(qr));
		qrCmdDestroy(qr);
		return 1;
	}

	qrCmdDestroy(qr);
	return 0;
}

/* }}} main() */
/* {{{ qrShowHelp() */

/*
 * 使用方法を表示する
 */
void
qrShowHelp(void)
{
	writeln("QR Code Generator");
	writeln();
	writeln("QR Code (R) is registered trademarks of DENSO WAVE INCORPORATED");
	writeln("in JAPAN and other countries.");
	writeln();
	writelnf("usage: %s [options ...] [ [ [mode] [text | -i file] ] ...] ", QRCMD_PROG_NAME);
	writeln();
	writeln("input:");
	writeln("  The data which is stored in QR Code Symbol (at least 1 character).");
	writeln("  If it is not specified, read from stdin.");
	writeln();
	writeln("examples:");
	writelnf("  %s -eM -x6 < input.txt > output.pbm", QRCMD_PROG_NAME);
	writelnf("  %s -eM -x6 -o output.pbm -i input.txt", QRCMD_PROG_NAME);
	writelnf("  %s -v2 -fBMP -o foobar.bmp -mA 'FOOBAR'", QRCMD_PROG_NAME);
	writelnf("  %s -x3 -fSVG -o mixed.svg -mA 'ALNUM' -m8 ' ' -mN '001'", QRCMD_PROG_NAME);
	writelnf("  %s -fAA 'Ascii Art'", QRCMD_PROG_NAME);
	writeln();
	writeln("options:");
	writeln("  -V                    show program's version number and exit");
	writeln("  -?, -h, --help        show this help message and exit");
#ifdef QRCMD_STRUCTURED_APPEND
	writeln("  -v, --version=NUM     symbol version (1-40, default: 1)");
#else
	writeln("  -v, --version=NUM     symbol version (1-40, default: auto)");
#endif
	writeln("  -m, --mode=MODE       encoding mode (N,A,8,K,S, default: S)");
	writeln("                        N: numeric, A: uppercase alphabet and numeric,");
	writeln("                        8: 8-bit byte, K: JIS X 0208 Kanji, S: auto");
	writeln("  -e, --eclevel=LEVEL   error correction level (L,M,Q,H, default: M)");
	writeln("                        L: 7%%, M: 15%%, Q: 25%%, H: 30%%");
	writeln("  -p, --pattern=NUM     mask pattern (0-7, default: auto)");
	writeln("  -x, --magnify=NUM     magnifying ratio (1-16, default: 1)");
	writeln("  -s, --separator=NUM   separator pattan width (0-16, default: 4)");
	writeln("                        '4' is the lower limit of the QR Code specification.");
	writeln("  -f, --format=FORMAT   output format (default: PBM)");
	writeln("                        Available formats are followings.");
	writeln("                          PNG, BMP, TIFF, PBM, SVG, JSON, DIGIT, ASCII");
	writeln("                        These are case-insensitive and some have aliases.");
	writeln("                          DIGIT -> 01");
	writeln("                          ASCII -> asciiart, aa");
	writeln("                          JSON  -> javascript, js");
	writeln("                          TIFF  -> tif");
#ifdef QRCMD_STRUCTURED_APPEND
	writelnf("  -a, --maxnum=NUM      maximum number of symbols (1-%d, default: %d)", QR_STA_MAX, QR_STA_MAX);
	writeln("  -z, --order=NUM       ordering method of symbols, in case NUM is ...");
	writeln("                        = 0 (default): order to square as possible");
	writeln("                        >= 1: order each NUM symbols to horizontal");
	writeln("                        <= -1: order each NUM symbols to vertical");
	writeln("  --serial              output as serial numbered images");
	writeln("                        Number and extension will be added to output pathname.");
	writeln("                        (default: output as a combined image)");
#endif
	writeln("  -o, --output=PATH     output pathname (default: write to stdout)");
	writeln("  -i, --input=PATH      input pathname (default: read from stdin)");
	writeln("                        To specify multiple files, set this option");
	writeln("                        before every filename. And the encoding mode");
	writeln("                        can be specified to each files.");
	writeln("                        (e.g. -mA -i file1 -mK -i file2 ...)");
}

/* }}} qrShowHelp() */
/* {{{ utilities for qrGetParameter() */

#define QR_SHORT_OPT(name) (d = 2, !strncmp(ptr, name, d))
#define QR_LONG_OPT(name) (d = sizeof(name), !strncmp(ptr, name "=", d))

#define QR_GETOPT_NEXT() { \
	opt = ptr; \
	ptr += d; \
	if (d == 2 && *ptr == '\0') { \
		i++; \
		if (i == argc) { \
			errx(1, "%s: %s", opt, qrStrError(QR_ERR_EMPTY_PARAM)); \
		} \
		ptr = argv[i]; \
	} \
	if (ptr == NULL || *ptr == '\0') { \
		errx(1, "%s: %s", opt, qrStrError(QR_ERR_EMPTY_PARAM)); \
	} \
}

/* }}} utilities for qrGetParameter() */
/* {{{ qrGetParameter() */

/*
 * コマンド行引数からパラメータと入力データを設定し、出力ファイル名を取得する
 */
QRCMD_PTR_TYPE *
qrGetParameter(int argc, char **argv,
		int *fmt, int *sep, int *mag, QRCMD_EXTRA_PARAM_D char **output)
{
	QRCMD_PTR_TYPE *qr;
	char *opt, *ptr;
	int i;
	size_t d;
	int version = QRCMD_DEFAULT_VERSION;
	int mode = QR_EM_AUTO;
	int eclevel = QR_ECL_M;
	int masktype = -1;
	QRCMD_MAX_NUM_A
	int errcode = QR_ERR_NONE;
	int has_data = 0;

	/*
	 * 引数のパラメータを取得する
	 */
	for (i = 1; i < argc; i++) {
		ptr = argv[i];
		if (!strcmp(ptr, "-?") || !strcasecmp(ptr, "-h") || !strcmp(ptr, "--help")) {
			/*
			 * 使用方法
			 */
			qrShowHelp();
			exit(1);

		} else if (!strcmp(ptr, "-V")) {
			/*
			 * バージョン
			 */
			writelnf("%s: QR Code Generator", QRCMD_PROG_NAME);
			writelnf("qrcmd version: %s", QRCMD_PROG_VERSION);
			writelnf("libqr version: %s", qrVersion());
			exit(1);

		} else if (QR_SHORT_OPT("-v") || QR_LONG_OPT("--version")) {
			/*
			 * 型番
			 */
			QR_GETOPT_NEXT();
			if (*ptr < '0' || *ptr > '9') {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_VERSION));
			}
			version = atoi(ptr);
			if (version <= 0 || version > QR_VER_MAX) {
				errx(1, "%d: %s", version, qrStrError(QR_ERR_INVALID_VERSION));
			}

		} else if (QR_SHORT_OPT("-m") || QR_LONG_OPT("--mode")) {
			/*
			 * 符号化モード
			 */
			QR_GETOPT_NEXT();
			switch (*ptr) {
			  case 's':
			  case 'S':
				mode = QR_EM_AUTO;
				break;
			  case 'n':
			  case 'N':
				mode = QR_EM_NUMERIC;
				break;
			  case 'a':
			  case 'A':
				mode = QR_EM_ALNUM;
				break;
			  case '8':
			  case 'B':
				mode = QR_EM_8BIT;
				break;
			  case 'k':
			  case 'K':
				mode = QR_EM_KANJI;
				break;
			  default:
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_MODE));
			}

		} else if (QR_SHORT_OPT("-e") || QR_LONG_OPT("--eclevel")) {
			/*
			 * 誤り訂正レベル
			 */
			QR_GETOPT_NEXT();
			switch (*ptr) {
			  case 'l':
			  case 'L':
				eclevel = QR_ECL_L;
				break;
			  case 'm':
			  case 'M':
				eclevel = QR_ECL_M;
				break;
			  case 'q':
			  case 'Q':
				eclevel = QR_ECL_Q;
				break;
			  case 'h':
			  case 'H':
				eclevel = QR_ECL_H;
				break;
			  default:
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_ECL));
			}

		} else if (QR_SHORT_OPT("-p") || QR_LONG_OPT("--pattern")) {
			/*
			 * マスクパターン種別
			 */
			QR_GETOPT_NEXT();
			if (*ptr < '0' || *ptr > '9') {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_MPT));
			}
			masktype = atoi(ptr);
			if (masktype < 0 || masktype >= QR_MPT_MAX) {
				errx(1, "%d: %s", masktype, qrStrError(QR_ERR_INVALID_MPT));
			}

		} else if (QR_SHORT_OPT("-x") || QR_LONG_OPT("--magnify")) {
			/*
			 * ピクセル表示倍率
			 */
			QR_GETOPT_NEXT();
			if (*ptr < '0' || *ptr > '9') {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_MAG));
			}
			*mag = atoi(ptr);
			if (*mag < 0 || *mag > QR_MAG_MAX) {
				errx(1, "%d: %s", *mag, qrStrError(QR_ERR_INVALID_MAG));
			}

		} else if (QR_SHORT_OPT("-s") || QR_LONG_OPT("--separator")) {
			/*
			 * 分離パターン幅
			 */
			QR_GETOPT_NEXT();
			if (*ptr < '0' || *ptr > '9') {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_SEP));
			}
			*sep = atoi(ptr);
			if (*sep < 0 || *sep > QR_SEP_MAX) {
				errx(1, "%d: %s", *sep, qrStrError(QR_ERR_INVALID_SEP));
			}

		} else if (QR_SHORT_OPT("-f") || QR_LONG_OPT("--format")) {
			/*
			 * 出力形式
			 */
			QR_GETOPT_NEXT();
			if (!strcasecmp(ptr, "digit") || !strcasecmp(ptr, "01")) {
				*fmt = QR_FMT_DIGIT;
			} else if (!strcasecmp(ptr, "asciiart") ||
					!strcasecmp(ptr, "ascii") ||
					!strcasecmp(ptr, "aa"))
			{
				*fmt = QR_FMT_ASCII;
			} else if (!strcasecmp(ptr, "javascript") ||
					!strcasecmp(ptr, "json") ||
					!strcasecmp(ptr, "js"))
			{
				*fmt = QR_FMT_JSON;
			} else if (!strcasecmp(ptr, "pbm")) {
				*fmt = QR_FMT_PBM;
			} else if (!strcasecmp(ptr, "bmp")) {
				*fmt = QR_FMT_BMP;
			} else if (!strcasecmp(ptr, "svg")) {
				*fmt = QR_FMT_SVG;
			} else if (!strcasecmp(ptr, "tiff") | !strcasecmp(ptr, "tif")) {
#ifdef QR_ENABLE_TIFF
				*fmt = QR_FMT_TIFF;
#else

#endif /* QR_ENABLE_TIFF */
#ifdef QR_ENABLE_PNG
			} else if (!strcasecmp(ptr, "png")) {
				*fmt = QR_FMT_PNG;
#endif /* QR_ENABLE_PNG */
			} else {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_FMT));
			}

		} else if (QR_SHORT_OPT("-o") || QR_LONG_OPT("--output")) {
			/*
			 * 出力ファイル名
			 */
			QR_GETOPT_NEXT();
			size_t pathlen;
			pathlen = strlen(ptr);
			if (pathlen >= PATH_MAX) {
				errx(1, "argv[%d]: %s", i, strerror(ENAMETOOLONG));
			}
			if (*output[0] != '\0') {
				errx(1, "%s: %s: Duplicated declaration of output pathname",
						*output, ptr);
			}
			strncpy(*output, ptr, pathlen);

#ifdef QRCMD_STRUCTURED_APPEND

		} else if (QR_SHORT_OPT("-a") || QR_LONG_OPT("--maxnum")) {
			/*
			 * 最大シンボル数
			 */
			QR_GETOPT_NEXT();
			if (*ptr < '0' || *ptr > '9') {
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_MAXNUM));
			}
			maxnum = atoi(ptr);
			if (maxnum < 2 || maxnum > QR_STA_MAX) {
				errx(1, "%d: %s", maxnum, qrStrError(QR_ERR_INVALID_MAXNUM));
			}

		} else if (QR_SHORT_OPT("-z") || QR_LONG_OPT("--order")) {
			/*
			 * 並べ方
			 */
			QR_GETOPT_NEXT();
			if (*ptr != '-' && (*ptr < '0' || *ptr > '9')) {
				/*errx(1, "%s: %s", ptr, qrStrError(QR_ERR_UNKNOWN));*/
				continue;
			}
			*order = atoi(ptr);

		} else if (!strcmp(ptr, "--serial")) {
			/*
			 * 連番
			*/
			if (*extra != 0) {
				errx(1, "Serial image output and GIF animation output are exclusive.");
			}
			*extra = -1;

		} else if (!strcmp(ptr, "--animation") || !strncmp(ptr, "--animation=", 12)) {
			/*
			 * GIFアニメ
			*/
			if (*extra != 0) {
				errx(1, "Serial image output and GIF animation output are exclusive.");
			}
			if (strlen(ptr) == 11) {
				*extra = 100;
			} else {
				double _f;
				ptr += 12;
				if (*ptr < '0' || *ptr > '9') {
					errx(1, "%s: Invalid animation delay.", ptr);
				}
				_f = atof(ptr);
				*extra = (int)(_f * 100);
				if (*extra == 0) {
					errx(1, "Zero animation delay.");
				}
			}

#endif /* QRCMD_STRUCTURED_APPEND */

		} else {
			break;
		}
	}

	/*
	 * QRコードオブジェクトを初期化する
	 */
	qr = qrCmdInit(version, mode, eclevel, masktype, QRCMD_MAX_NUM_B &errcode);
	if (qr == NULL) {
		errx(1, "%s", qrStrError(errcode));
	}

	/*
	 * 入力データを取得する
	 */
	for (; i < argc; i++) {
		ptr = argv[i];
		if (QR_SHORT_OPT("-m") || QR_LONG_OPT("--mode")) {
			/*
			 * 符号化モードを上書き
			 */
			QR_GETOPT_NEXT();
			switch (*ptr) {
			  case 'n':
			  case 'N':
				mode = QR_EM_NUMERIC;
				break;
			  case 'a':
			  case 'A':
				mode = QR_EM_ALNUM;
				break;
			  case '8':
			  case 'B':
				mode = QR_EM_8BIT;
				break;
			  case 'k':
			  case 'K':
				mode = QR_EM_KANJI;
				break;
			  default:
				qrCmdDestroy(qr);
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_MODE));
			}

		} else if (QR_SHORT_OPT("-i") || QR_LONG_OPT("--input")) {
			qr_byte_t source[QRCMD_SRC_MAX];
			int srclen = 0;
			FILE *fp;
			int c;
			/*
			 * 入力データをファイルから読む
			 */
			QR_GETOPT_NEXT();
			fp = fopen(ptr, "rb");
			if (fp == NULL) {
				qrCmdDestroy(qr);
				err(1, "%s", ptr);
			}
			while ((c = fgetc(fp)) != EOF && srclen < QRCMD_SRC_MAX){
				source[srclen++] = (qr_byte_t)c;
			}
			fclose(fp);
			if (srclen == 0) {
				qrCmdDestroy(qr);
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_EMPTY_SRC));
			} else if (c != EOF) {
				qrCmdDestroy(qr);
				errx(1, "%s: %s", ptr, qrStrError(QR_ERR_LARGE_SRC));
			}
			if (!qrCmdAddData2(qr, source, srclen, mode)) {
				char errinfo[QR_ERR_MAX];
				snprintf(&(errinfo[0]), QR_ERR_MAX, "%s: %s", ptr, qrCmdGetErrorInfo(qr));
				qrCmdDestroy(qr);
				errx(1, "%s", errinfo);
			}
			has_data++;

		} else if (*ptr != '-') {
			qr_byte_t source[QRCMD_SRC_MAX];
			int srclen = 0;
			/*
			 * 入力データを引数から得る
			 */
			srclen = strlen(ptr);
			if (srclen == 0) {
				qrCmdDestroy(qr);
				errx(1, "argv[%d]: %s", i, qrStrError(QR_ERR_EMPTY_SRC));
			} else if (srclen > QRCMD_SRC_MAX) {
				qrCmdDestroy(qr);
				errx(1, "argv[%d]: %s", i, qrStrError(QR_ERR_LARGE_SRC));
			}
			memcpy(&(source[0]), ptr, (size_t)srclen);
			if (!qrCmdAddData2(qr, source, srclen, mode)) {
				char errinfo[QR_ERR_MAX];
				snprintf(&(errinfo[0]), QR_ERR_MAX, "argv[%d]: %s", i, qrCmdGetErrorInfo(qr));
				qrCmdDestroy(qr);
				errx(1, "%s", errinfo);
			}
			has_data++;

		} else {
			/*
			 * 未定義オプション
			 */
			qrCmdDestroy(qr);
			errx(1, "%s: %s", ptr, qrStrError(QR_ERR_INVALID_ARG));
		}
	}

	/*
	 * 入力データが空なら、標準入力から読む
	 */
	if (!has_data) {
		qr_byte_t source[QRCMD_SRC_MAX];
		int srclen = 0;
		int c;
		while ((c = getchar()) != EOF && srclen < QRCMD_SRC_MAX){
			source[srclen++] = (qr_byte_t)c;
		}
		if (srclen == 0) {
			qrCmdDestroy(qr);
			errx(1, "-stdin: %s", qrStrError(QR_ERR_EMPTY_SRC));
		}
		if (c != EOF) {
			qrCmdDestroy(qr);
			errx(1, "-stdin: %s", qrStrError(QR_ERR_LARGE_SRC));
		}
		if (!qrCmdAddData2(qr, source, srclen, mode)) {
			char errinfo[QR_ERR_MAX];
			snprintf(&(errinfo[0]), QR_ERR_MAX, "%s", qrCmdGetErrorInfo(qr));
			qrCmdDestroy(qr);
			errx(1, "%s", errinfo);
		}
	}

	return qr;
}

/* }}} qrGetParameter() */
