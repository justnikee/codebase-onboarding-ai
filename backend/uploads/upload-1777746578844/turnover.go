package services

import (
	"strconv"
	"strings"
)

func parseTurnover(turnoverRange string) float64 {
	// Examples:
	// "0-5 Cr"
	// "10-50 Cr"
	// "50+ Cr"

	turnoverRange = strings.ToLower(turnoverRange)
	turnoverRange = strings.ReplaceAll(turnoverRange, "cr", "")
	turnoverRange = strings.TrimSpace(turnoverRange)

	// handle "50+"
	if strings.Contains(turnoverRange, "+") {
		value := strings.ReplaceAll(turnoverRange, "+", "")
		num, _ := strconv.ParseFloat(strings.TrimSpace(value), 64)
		return num
	}

	// handle "10-50"
	parts := strings.Split(turnoverRange, "-")
	if len(parts) == 2 {
		num, _ := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
		return num
	}

	// fallback
	return 0
}
