package services

import (
	"context"
	"errors"

	"vyoma-api/internal/models"
	"vyoma-api/internal/repositories"

	"github.com/google/uuid"
)

type BusinessComplianceService struct {
	repo *repositories.BusinessComplianceRepository
}

func NewBusinessComplianceService(
	repo *repositories.BusinessComplianceRepository,
) *BusinessComplianceService {
	return &BusinessComplianceService{repo: repo}
}

func (s *BusinessComplianceService) ListByBusinessID(
	ctx context.Context,
	businessID uuid.UUID,
) ([]models.BusinessCompliance, error) {

	if businessID == uuid.Nil {
		return nil, errors.New("invalid business id")
	}

	return s.repo.ListByBusinessID(ctx, businessID)
}
