package models

import (
	"time"

	"github.com/google/uuid"
)

type Business struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	State         string    `json:"state"`
	IndustryType  string    `json:"industry_type"`
	TurnoverRange string    `json:"turnover_range"`
	CreatedAt     time.Time `json:"created_at"`
}
