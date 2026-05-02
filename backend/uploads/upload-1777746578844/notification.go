package models

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID         uuid.UUID `json:"id"`
	BusinessID uuid.UUID `json:"business_id"`
	RuleID     uuid.UUID `json:"rule_id"`
	NotifyAt   time.Time `json:"notify_at"`
	Sent       bool      `json:"sent"`
}
