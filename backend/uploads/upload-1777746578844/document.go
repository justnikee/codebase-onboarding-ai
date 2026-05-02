package models

import (
	"time"

	"github.com/google/uuid"
)

type Document struct {
	ID         uuid.UUID  `json:"id"`
	BusinessID uuid.UUID  `json:"business_id"`
	RuleID     uuid.UUID  `json:"rule_id"`
	FileURL    string     `json:"file_url"`
	ExpiryDate *time.Time `json:"expiry_date,omitempty"`
	UploadedAt time.Time  `json:"uploaded_at"`
}
