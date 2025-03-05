/*
 * This code is taken from:
 * PNG (Portable Network Graphics) Specification, Version 1.1
 * 15. Appendix: Sample CRC Code
 * http://www.libpng.org/pub/png/spec/1.1/PNG-CRCAppendix.html
 */

#ifdef uint32_t
typedef uint32_t crc_t;
#else
typedef unsigned long crc_t;
#endif

/* Table of CRCs of all 8-bit messages. */
static crc_t crc_table[256];

/* Flag: has the table been computed? Initially false. */
static int crc_table_computed = 0;

/* Make the table for a fast CRC. */
static void make_crc_table(void)
{
	crc_t c;
	int n, k;

	for (n = 0; n < 256; n++) {
		c = (crc_t) n;
		for (k = 0; k < 8; k++) {
			if (c & 1) {
				c = 0xedb88320L ^ (c >> 1);
			} else {
				c = c >> 1;
			}
		}
		crc_table[n] = c;
	}
	crc_table_computed = 1;
}

/* Update a running CRC with the bytes buf[0..len-1]--the CRC
   should be initialized to all 1's, and the transmitted value
   is the 1's complement of the final running CRC (see the
   crc() routine below)). */

static crc_t update_crc(crc_t crc, const unsigned char *buf, int len)
{
	crc_t c = crc;
	int n;

	if (!crc_table_computed) {
		make_crc_table();
	}
	for (n = 0; n < len; n++) {
		c = crc_table[(c ^ buf[n]) & 0xff] ^ (c >> 8);
	}
	return c;
}

/* Return the CRC of the bytes buf[0..len-1]. */
static crc_t crc(const unsigned char *buf, int len)
{
	return update_crc(0xffffffffL, buf, len) ^ 0xffffffffL;
}
