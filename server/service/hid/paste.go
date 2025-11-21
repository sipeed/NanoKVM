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
	Langue string `form:"langue"`
}

func LangueSwitch(base map[rune]Char, lang string) map[rune]Char {
	// wenn kein lang angegeben → Standardmap zurück
	if lang == "" {
		return base
	}

	// immer Kopie erstellen
	m := copyMap(base)

	switch lang {
	case "de":
		// Y tauschen
		m['y'] = Char{0, 29}
		m['Y'] = Char{2, 29}

		// Z tauschen
		m['z'] = Char{0, 28}
		m['Z'] = Char{2, 28}

		// deutsche Sonderzeichen hinzufügen oder remappen
		m['\u00E4'] = Char{0, 52} // ä
		m['\u00C4'] = Char{2, 52} // Ä
		m['\u00F6'] = Char{0, 51} // ö
		m['\u00D6'] = Char{2, 51} // Ö
		m['\u00FC'] = Char{0, 47} // ü
		m['\u00DC'] = Char{2, 47} // Ü
		m['\u00DF'] = Char{0, 45} // ß

		//Tauschen
		m['^'] = Char{0, 53} // muss doppelt sein
		m['/'] = Char{2, 36} // Shift + 7
		m['('] = Char{2, 37} // Shift + 8
		m['&'] = Char{2, 35} // Shift + 6
		m[')'] = Char{2, 38} // Shift + 9
		m['`'] = Char{2, 46} // Grave Accent / Backtick
		m['"'] = Char{2, 31} // Shift + 2
		m['?'] = Char{2, 45} // Shift + ß
		m['{'] = Char{0x40, 36} // ALt Gr + 7
		m['['] = Char{0x40, 37} // ALt Gr + 8
		m[']'] = Char{0x40, 38} // ALt Gr + 6
		m['}'] = Char{0x40, 39} // ALt Gr + 0
		m['\\'] = Char{0x40, 45} // ALt Gr + ß
		m['@'] = Char{0x40, 20} // ALt Gr + q
		m['+'] = Char{0, 48} // Shift + +
		m['*'] = Char{2, 48} // Shift + +
		m['~'] = Char{0x40, 48} // Shift + +
		m['#'] = Char{0, 49} // Shift + #
		m['\''] = Char{2, 49} // Shift + #
		m['<'] = Char{0, 100} // Shift + <
		m['>'] = Char{2, 100} // Shift + <
		m['|'] = Char{0x40, 100} // ALt Gr + <
		m[';'] = Char{2, 54} // Shift + ,
		m[':'] = Char{2, 55} // Shift + .
		m['-'] = Char{0, 56} // Shift + -
		m['_'] = Char{2, 56} // Shift + -

		//neu
		m['\u00B4'] = Char{0, 46} // ´
		m['\u00B0'] = Char{2, 53} // °
		m['\u00A7'] = Char{2, 32} // §
		m['\u20AC'] = Char{0x40, 8} // €
		m['\u00B2'] = Char{0x40, 31} // ²
		m['\u00B3'] = Char{0x40, 32} // ³
		
	}
	return m
}

func (s *Service) Paste(c *gin.Context) {
	var req PasteReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	charMapLocal := LangueSwitch(charMap, req.Langue)
	if len(req.Content) > 1024 {
		rsp.ErrRsp(c, -2, "content too long")
		return
	}
	s.hid.kbMutex.Lock()
	defer s.hid.kbMutex.Unlock()
	keyUp := []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}

	for _, char := range req.Content {
		key, ok := charMapLocal[char]
		if !ok {
			log.Debugf("unknown key '%c' (rune: %d)", char, char)
			continue
		}
		keyDown := []byte{byte(key.Modifiers), 0x00, byte(key.Code), 0x00, 0x00, 0x00, 0x00, 0x00}
		s.hid.Write(s.hid.g0, keyDown)
		s.hid.Write(s.hid.g0, keyUp)
		time.Sleep(50 * time.Millisecond)
	}

	rsp.OkRsp(c)
	log.Debugf("hid paste success, total %d characters processed", len(req.Content))
}

func copyMap(src map[rune]Char) map[rune]Char {
	dst := make(map[rune]Char, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

var charMap = map[rune]Char{
	// Lowercase letters
	'a': {0, 4}, 'b': {0, 5}, 'c': {0, 6}, 'd': {0, 7}, 'e': {0, 8},
	'f': {0, 9}, 'g': {0, 10}, 'h': {0, 11}, 'i': {0, 12}, 'j': {0, 13},
	'k': {0, 14}, 'l': {0, 15}, 'm': {0, 16}, 'n': {0, 17}, 'o': {0, 18},
	'p': {0, 19}, 'q': {0, 20}, 'r': {0, 21}, 's': {0, 22}, 't': {0, 23},
	'u': {0, 24}, 'v': {0, 25}, 'w': {0, 26}, 'x': {0, 27}, 'y': {0, 28},
	'z': {0, 29},

	// Uppercase letters (Modifier 2 typically means Left Shift)
	'A': {2, 4}, 'B': {2, 5}, 'C': {2, 6}, 'D': {2, 7}, 'E': {2, 8},
	'F': {2, 9}, 'G': {2, 10}, 'H': {2, 11}, 'I': {2, 12}, 'J': {2, 13},
	'K': {2, 14}, 'L': {2, 15}, 'M': {2, 16}, 'N': {2, 17}, 'O': {2, 18},
	'P': {2, 19}, 'Q': {2, 20}, 'R': {2, 21}, 'S': {2, 22}, 'T': {2, 23},
	'U': {2, 24}, 'V': {2, 25}, 'W': {2, 26}, 'X': {2, 27}, 'Y': {2, 28},
	'Z': {2, 29},

	// Numbers
	'1': {0, 30}, '2': {0, 31}, '3': {0, 32}, '4': {0, 33}, '5': {0, 34},
	'6': {0, 35}, '7': {0, 36}, '8': {0, 37}, '9': {0, 38}, '0': {0, 39},

	// Shifted numbers / Symbols
	'!': {2, 30}, // Shift + 1
	'@': {2, 31}, // Shift + 2
	'#': {2, 32}, // Shift + 3
	'$': {2, 33}, // Shift + 4
	'%': {2, 34}, // Shift + 5
	'^': {2, 35}, // Shift + 6
	'&': {2, 36}, // Shift + 7
	'*': {2, 37}, // Shift + 8
	'(': {2, 38}, // Shift + 9
	')': {2, 39}, // Shift + 0

	// Other common characters
	'\n': {0, 40}, // Enter (Return)
	'\t': {0, 43}, // Tab
	' ':  {0, 44}, // Space
	'-':  {0, 45}, // Hyphen / Minus
	'=':  {0, 46}, // Equals
	'[':  {0, 47}, // Left Square Bracket
	']':  {0, 48}, // Right Square Bracket
	'\\': {0, 49}, // Backslash

	';':  {0, 51}, // Semicolon
	'\'': {0, 52}, // Apostrophe / Single Quote
	'`':  {0, 53}, // Grave Accent / Backtick
	',':  {0, 54}, // Comma
	'.':  {0, 55}, // Period / Dot
	'/':  {0, 56}, // Slash

	// Shifted symbols
	'_':  {2, 45}, // Underscore (Shift + Hyphen)
	'+':  {2, 46}, // Plus (Shift + Equals)
	'{':  {2, 47}, // Left Curly Brace (Shift + Left Square Bracket)
	'}':  {2, 48}, // Right Curly Brace (Shift + Right Square Bracket)
	'|':  {2, 49}, // Pipe (Shift + Backslash)

	':':  {2, 51}, // Colon (Shift + Semicolon)
	'"':  {2, 52}, // Double Quote (Shift + Apostrophe)
	'~':  {2, 53}, // Tilde (Shift + Grave Accent)
	'<':  {2, 54}, // Less Than (Shift + Comma)
	'>':  {2, 55}, // Greater Than (Shift + Period)
	'?':  {2, 56}, // Question Mark (Shift + Slash)
}
