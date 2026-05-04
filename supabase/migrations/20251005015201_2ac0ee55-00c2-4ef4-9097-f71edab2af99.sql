-- Add Food Wholesaler category to Supplier Directory
ALTER TABLE "Supplier Directory"
ADD COLUMN IF NOT EXISTS "Food_Wholesaler" text;