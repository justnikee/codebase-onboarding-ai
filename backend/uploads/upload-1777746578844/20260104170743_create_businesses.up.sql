CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  industry_type TEXT NOT NULL,
  turnover_range TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);