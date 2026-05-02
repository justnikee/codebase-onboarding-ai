package repositories

import (
	"context"
	"vyoma-api/internal/db"
	"vyoma-api/internal/models"
)

type ComplianceRuleRepository struct{}

func (r *ComplianceRuleRepository) GetApplicableRules(
	ctx context.Context,
	state string,
	industry string,
	turnover float64,
) ([]models.ComplianceRule, error) {
	query := `
		SELECT
			id,
			state,
			industry_type,
			turnover_min,
			turnover_max,
			rule_name,
			frequency,
			authority,
			penalty_amount,
			created_at
		FROM compliance_rules
		WHERE state = $1
		  AND industry_type = $2
		  AND $3 BETWEEN turnover_min AND turnover_max
	`

	rows, err := db.DB.Query(ctx, query, state, industry, turnover)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.ComplianceRule

	for rows.Next() {
		var rule models.ComplianceRule
		if err := rows.Scan(
			&rule.ID,
			&rule.State,
			&rule.IndustryType,
			&rule.TurnoverMin,
			&rule.TurnoverMax,
			&rule.RuleName,
			&rule.Frequency,
			&rule.Authority,
			&rule.PenaltyAmount,
			&rule.CreatedAt,
		); err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}

	return rules, nil
}
