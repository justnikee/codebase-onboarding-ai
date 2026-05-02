CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  uploaded_at TIMESTAMP DEFAULT now()
);
