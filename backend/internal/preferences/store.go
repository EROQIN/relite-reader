package preferences

// Store persists per-user preferences.
type Store interface {
	Get(userID string) (UserPreferences, error)
	Save(userID string, prefs UserPreferences) (UserPreferences, error)
}
