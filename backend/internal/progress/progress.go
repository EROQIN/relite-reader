package progress

import (
	"math"
	"time"
)

type Progress struct {
	BookID    string    `json:"book_id"`
	Location  float64   `json:"location"`
	UpdatedAt time.Time `json:"updated_at"`
}

func normalizeLocation(value float64) float64 {
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return 0
	}
	if value < 0 {
		return 0
	}
	if value > 1 {
		return 1
	}
	return value
}
