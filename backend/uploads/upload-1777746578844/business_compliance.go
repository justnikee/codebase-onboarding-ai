package models

import (
	"time"

	"github.com/google/uuid"
)

type BusinessCompliance struct {
	ID         uuid.UUID `json:"id"`
	BusinessID uuid.UUID `json:"business_id"`
	RuleID     uuid.UUID `json:"rule_id"`
	Status     string    `json:"status"`
	DueDate    time.Time `json:"due_date"`

	// joined fields
	RuleName  string `json:"rule_name"`
	Frequency string `json:"frequency"`
	Authority string `json:"authority"`
}
