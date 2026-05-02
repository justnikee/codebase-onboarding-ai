package models

import (
	"time"

	"github.com/google/uuid"
)

type ComplianceRule struct {
	ID            uuid.UUID `json:"id"`
	State         string    `json:"state"`
	IndustryType  string    `json:"industry_type"`
	TurnoverMin   float64   `json:"turnover_min"`
	TurnoverMax   float64   `json:"turnover_max"`
	RuleName      string    `json:"rule_name"`
	Frequency     string    `json:"frequency"`
	Authority     string    `json:"authority"`
	PenaltyAmount float64   `json:"penalty_amount"`
	CreatedAt     time.Time `json:"created_at"`
}
