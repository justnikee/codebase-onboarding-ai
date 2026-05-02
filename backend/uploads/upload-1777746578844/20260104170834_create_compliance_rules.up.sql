CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  industry_type TEXT NOT NULL,
  turnover_min NUMERIC NOT NULL,
  turnover_max NUMERIC NOT NULL,
  rule_name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  authority TEXT NOT NULL,
  penalty_amount NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);
