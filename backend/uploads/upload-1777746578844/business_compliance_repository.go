package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"

	"vyoma-api/internal/db"
	"vyoma-api/internal/models"
)

type BusinessComplianceRepository struct{}

func (r *BusinessComplianceRepository) AssignRule(
	ctx context.Context,
	tx db.Tx,
	businessID uuid.UUID,
	complianceRuleID uuid.UUID,
	dueDate time.Time,
) error {

	query := `
		INSERT INTO business_compliance_map (
			business_id,
			rule_id,
			status,
			due_date
		)
		VALUES ($1, $2, 'pending', $3)
	`

	_, err := tx.Exec(ctx, query, businessID, complianceRuleID, dueDate)
	return err

}

func (r *BusinessComplianceRepository) ListByBusinessID(
	ctx context.Context,
	businessID uuid.UUID,
) ([]models.BusinessCompliance, error) {

	query := `
		SELECT
			bcm.id,
			bcm.business_id,
			bcm.rule_id,
			bcm.status,
			bcm.due_date,
			cr.rule_name,
			cr.frequency,
			cr.authority
		FROM business_compliance_map bcm
		JOIN compliance_rules cr ON cr.id = bcm.rule_id
		WHERE bcm.business_id = $1
		ORDER BY bcm.due_date ASC
	`

	rows, err := db.DB.Query(ctx, query, businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var compliances []models.BusinessCompliance

	for rows.Next() {
		var c models.BusinessCompliance

		err := rows.Scan(
			&c.ID,
			&c.BusinessID,
			&c.RuleID,
			&c.Status,
			&c.DueDate,
			&c.RuleName,
			&c.Frequency,
			&c.Authority,
		)
		if err != nil {
			return nil, err
		}

		compliances = append(compliances, c)
	}

	return compliances, nil
}
