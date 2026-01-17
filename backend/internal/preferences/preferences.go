package preferences

import "math"

type ReaderPreferences struct {
	Theme        string  `json:"theme"`
	Font         string  `json:"font"`
	FontSize     int     `json:"fontSize"`
	LineHeight   float64 `json:"lineHeight"`
	PageWidth    int     `json:"pageWidth"`
	TextAlign    string  `json:"textAlign"`
	LayoutMode   string  `json:"layoutMode"`
	FocusMode    bool    `json:"focusMode"`
	ReadingSpeed int     `json:"readingSpeed"`
	Background   string  `json:"background"`
	Brightness   float64 `json:"brightness"`
}

type UserPreferences struct {
	Reader ReaderPreferences `json:"reader"`
}

var allowedThemes = map[string]struct{}{
	"paper": {},
	"sepia": {},
	"night": {},
	"slate": {},
	"mist": {},
}

var allowedFonts = map[string]struct{}{
	"sans": {},
	"serif": {},
	"mono": {},
}

var allowedAlignments = map[string]struct{}{
	"left": {},
	"justify": {},
}

var allowedLayouts = map[string]struct{}{
	"single":  {},
	"columns": {},
}

func DefaultReaderPreferences() ReaderPreferences {
	return ReaderPreferences{
		Theme:        "paper",
		Font:         "serif",
		FontSize:     18,
		LineHeight:   1.7,
		PageWidth:    720,
		TextAlign:    "left",
		LayoutMode:   "single",
		FocusMode:    false,
		ReadingSpeed: 240,
		Background:   "",
		Brightness:   1.0,
	}
}

func DefaultUserPreferences() UserPreferences {
	return UserPreferences{Reader: DefaultReaderPreferences()}
}

func NormalizeReaderPreferences(input ReaderPreferences) ReaderPreferences {
	defaults := DefaultReaderPreferences()
	prefs := defaults
	if _, ok := allowedThemes[input.Theme]; ok {
		prefs.Theme = input.Theme
	}
	if _, ok := allowedFonts[input.Font]; ok {
		prefs.Font = input.Font
	}
	if _, ok := allowedAlignments[input.TextAlign]; ok {
		prefs.TextAlign = input.TextAlign
	}
	if _, ok := allowedLayouts[input.LayoutMode]; ok {
		prefs.LayoutMode = input.LayoutMode
	}
	if input.FontSize != 0 {
		prefs.FontSize = clampInt(input.FontSize, 14, 24)
	}
	if input.LineHeight != 0 {
		prefs.LineHeight = clampFloat(input.LineHeight, 1.4, 2.2)
	}
	if input.PageWidth != 0 {
		prefs.PageWidth = clampInt(input.PageWidth, 520, 980)
	}
	if input.ReadingSpeed != 0 {
		prefs.ReadingSpeed = clampInt(input.ReadingSpeed, 160, 360)
	}
	if input.Background != "" {
		prefs.Background = input.Background
	}
	if input.Brightness != 0 {
		prefs.Brightness = clampFloat(input.Brightness, 0.8, 1.2)
	}
	prefs.FocusMode = input.FocusMode
	return prefs
}

func NormalizeUserPreferences(input UserPreferences) UserPreferences {
	return UserPreferences{Reader: NormalizeReaderPreferences(input.Reader)}
}

func clampInt(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func clampFloat(value, min, max float64) float64 {
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return min
	}
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
