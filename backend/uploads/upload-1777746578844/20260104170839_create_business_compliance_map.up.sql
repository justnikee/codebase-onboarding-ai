CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE business_compliance_map (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'overdue')),
  due_date DATE NOT NULL,
  PRIMARY KEY (business_id, rule_id)
);
