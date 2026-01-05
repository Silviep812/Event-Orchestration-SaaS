-- Add new values to budget_category enum
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'misc';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'vendors';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'services';