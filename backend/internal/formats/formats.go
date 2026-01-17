package formats

import (
	"path"
	"strings"
)

var supported = map[string]struct{}{
	"epub": {},
	"pdf":  {},
	"txt":  {},
	"mobi": {},
	"cbz":  {},
	"cbr":  {},
	"cb7":  {},
	"azw":  {},
	"azw3": {},
	"fb2":  {},
	"rtf":  {},
	"docx": {},
}

func Detect(pathname string) (string, bool) {
	ext := strings.ToLower(path.Ext(pathname))
	if ext == "" {
		return "unknown", false
	}
	format := strings.TrimPrefix(ext, ".")
	_, ok := supported[format]
	if !ok {
		return "unknown", false
	}
	return format, true
}

func SupportedFormats() []string {
	formats := make([]string, 0, len(supported))
	for key := range supported {
		formats = append(formats, key)
	}
	return formats
}
