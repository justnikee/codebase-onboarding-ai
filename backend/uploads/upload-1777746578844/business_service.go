package services

import (
	"context"
	"errors"
	"time"

	"vyoma-api/internal/db"
	"vyoma-api/internal/models"
	"vyoma-api/internal/repositories"

	"github.com/google/uuid"
)

type BusinessService struct {
	businessRepo   *repositories.BusinessRepository
	ruleRepo       *repositories.ComplianceRuleRepository
	complianceRepo *repositories.BusinessComplianceRepository
}

func NewBusinessService(
	businessRepo *repositories.BusinessRepository,
	ruleRepo *repositories.ComplianceRuleRepository,
	complianceRepo *repositories.BusinessComplianceRepository,
) *BusinessService {
	return &BusinessService{
		businessRepo:   businessRepo,
		ruleRepo:       ruleRepo,
		complianceRepo: complianceRepo,
	}
}

func (s *BusinessService) CreateBusiness(
	ctx context.Context,
	business *models.Business,
) (*models.Business, error) {

	// 1️⃣ begin transaction
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 2️⃣ create business
	created, err := s.businessRepo.CreateBusiness(ctx, business)
	if err != nil {
		return nil, err
	}

	// 3️⃣ find applicable rules
	turnover := parseTurnover(business.TurnoverRange)

	rules, err := s.ruleRepo.GetApplicableRules(
		ctx,
		business.State,
		business.IndustryType,
		turnover,
	)
	if err != nil {
		return nil, err
	}

	// 4️⃣ assign rules
	for _, rule := range rules {
		dueDate := calculateDueDate(rule.Frequency)

		err := s.complianceRepo.AssignRule(
			ctx,
			tx,
			created.ID,
			rule.ID,
			dueDate,
		)
		if err != nil {
			return nil, err
		}
	}

	// 5️⃣ commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return created, nil
}

func calculateDueDate(freq string) time.Time {
	switch freq {
	case "monthly":
		return time.Now().AddDate(0, 1, 0)
	case "yearly":
		return time.Now().AddDate(1, 0, 0)
	default:
		return time.Now().AddDate(0, 1, 0)
	}
}

func (s *BusinessService) GetBusinessByID(
	ctx context.Context,
	id uuid.UUID,
) (*models.Business, error) {

	if id == uuid.Nil {
		return nil, errors.New("invalid business id")
	}

	return s.businessRepo.GetBusinessByID(ctx, id)
}
