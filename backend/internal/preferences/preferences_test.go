package preferences

import "testing"

func TestNormalizeUserPreferencesLocale(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		expect string
	}{
		{"default", "", "en"},
		{"english", "en", "en"},
		{"chinese", "zh-CN", "zh-CN"},
		{"chinese-short", "zh", "zh-CN"},
		{"invalid", "fr", "en"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := NormalizeUserPreferences(UserPreferences{Locale: tc.input})
			if got.Locale != tc.expect {
				t.Fatalf("expected %q, got %q", tc.expect, got.Locale)
			}
		})
	}
}
