-- Add Mixologist column to Service Vendor Directory table
ALTER TABLE "Service Vendor Directory"
ADD COLUMN IF NOT EXISTS mixologist text;