package repositories

import (
	"context"

	"vyoma-api/internal/db"
	"vyoma-api/internal/models"

	uuid "github.com/google/uuid"
)

type BusinessRepository struct{}

func (r *BusinessRepository) CreateBusiness(
	ctx context.Context,
	business *models.Business,
) (*models.Business, error) {

	query := `
		INSERT INTO businesses (
			name,
			state,
			industry_type,
			turnover_range
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	err := db.DB.QueryRow(
		ctx,
		query,
		business.Name,
		business.State,
		business.IndustryType,
		business.TurnoverRange,
	).Scan(&business.ID, &business.CreatedAt)

	if err != nil {
		return nil, err
	}

	return business, nil
}

func (r *BusinessRepository) GetBusinessByID(
	ctx context.Context,
	id uuid.UUID,
) (*models.Business, error) {

	query := `
		SELECT
			id,
			name,
			state,
			industry_type,
			turnover_range,
			created_at
		FROM businesses
		WHERE id = $1
	`

	var business models.Business

	err := db.DB.QueryRow(ctx, query, id).Scan(
		&business.ID,
		&business.Name,
		&business.State,
		&business.IndustryType,
		&business.TurnoverRange,
		&business.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &business, nil
}
