CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  notify_at TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT false
);
