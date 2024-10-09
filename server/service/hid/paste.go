package hid

import (
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

type Char struct {
	Modifiers int
	Code      int
}

type PasteReq struct {
	Content string `form:"content" validate:"required"`
}

func (s *Service) Paste(c *gin.Context) {
	var req PasteReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if len(req.Content) > 1024 {
		rsp.ErrRsp(c, -2, "")
		return
	}

	s.hid.kbMutex.Lock()
	for _, char := range req.Content {
		key, ok := charMap[char]
		if !ok {
			log.Debugf("unknown key %c", char)
			continue
		}

		keyDown := []byte{byte(key.Modifiers), 0x00, byte(key.Code), 0x00, 0x00, 0x00, 0x00, 0x00}
		keyUp := []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}

		// only handle shift. Need to handle all modifiers?
		if key.Modifiers > 0 {
			keyShift := []byte{0x00, 0x00, byte(225), 0x00, 0x00, 0x00, 0x00, 0x00}
			s.hid.Write(s.hid.g0, keyShift)
		}

		s.hid.Write(s.hid.g0, keyDown)
		s.hid.Write(s.hid.g0, keyUp)

		if key.Modifiers > 0 {
			s.hid.Write(s.hid.g0, keyUp)
		}

		time.Sleep(50 * time.Millisecond)
	}
	s.hid.kbMutex.Unlock()

	rsp.OkRsp(c)
	log.Debugf("hid paste success, total %d", len(req.Content))
}

var charMap = map[rune]Char{
	97:  {0, 4},  // a
	98:  {0, 5},  // b
	99:  {0, 6},  // c
	100: {0, 7},  // d
	101: {0, 8},  // e
	102: {0, 9},  // f
	103: {0, 10}, // g
	104: {0, 11}, // h
	105: {0, 12}, // i
	106: {0, 13}, // j
	107: {0, 14}, // k
	108: {0, 15}, // l
	109: {0, 16}, // m
	110: {0, 17}, // n
	111: {0, 18}, // o
	112: {0, 19}, // p
	113: {0, 20}, // q
	114: {0, 21}, // r
	115: {0, 22}, // s
	116: {0, 23}, // t
	117: {0, 24}, // u
	118: {0, 25}, // v
	119: {0, 26}, // w
	120: {0, 27}, // x
	121: {0, 28}, // y
	122: {0, 29}, // z

	49: {0, 30}, // 1
	50: {0, 31}, // 2
	51: {0, 32}, // 3
	52: {0, 33}, // 4
	53: {0, 34}, // 5
	54: {0, 35}, // 6
	55: {0, 36}, // 7
	56: {0, 37}, // 8
	57: {0, 38}, // 9
	48: {0, 39}, // 0

	10: {0, 40}, // Enter
	9:  {0, 43}, // Tab
	32: {0, 44}, // Space
	45: {0, 45}, // -
	61: {0, 46}, // =
	91: {0, 47}, // [
	93: {0, 48}, // ]
	92: {0, 49}, // \

	59: {0, 51}, // ;
	39: {0, 52}, // '
	96: {0, 53}, // `
	44: {0, 54}, // ,
	46: {0, 55}, // .
	47: {0, 56}, // /

	65: {2, 4},  // A
	66: {2, 5},  // B
	67: {2, 6},  // C
	68: {2, 7},  // D
	69: {2, 8},  // E
	70: {2, 9},  // F
	71: {2, 10}, // G
	72: {2, 11}, // H
	73: {2, 12}, // I
	74: {2, 13}, // J
	75: {2, 14}, // K
	76: {2, 15}, // L
	77: {2, 16}, // M
	78: {2, 17}, // N
	79: {2, 18}, // O
	80: {2, 19}, // P
	81: {2, 20}, // Q
	82: {2, 21}, // R
	83: {2, 22}, // S
	84: {2, 23}, // T
	85: {2, 24}, // U
	86: {2, 25}, // V
	87: {2, 26}, // W
	88: {2, 27}, // X
	89: {2, 28}, // Y
	90: {2, 29}, // Z

	33: {2, 30}, // !
	64: {2, 31}, // @
	35: {2, 32}, // #
	36: {2, 33}, // $
	37: {2, 34}, // %
	94: {2, 35}, // ^
	38: {2, 36}, // &
	42: {2, 37}, // *
	40: {2, 38}, // (
	41: {2, 39}, // )

	95:  {2, 45}, // _
	43:  {2, 46}, // +
	123: {2, 47}, // {
	125: {2, 48}, // }
	124: {2, 49}, // |

	58:  {2, 51}, // :
	34:  {2, 52}, // "
	126: {2, 53}, // ~
	60:  {2, 54}, // <
	62:  {2, 55}, // >
	63:  {2, 56}, // ?
}
