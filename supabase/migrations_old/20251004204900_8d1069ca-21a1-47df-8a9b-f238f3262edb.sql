-- Add barcode column to Bookings Directory table
ALTER TABLE "Bookings Directory" 
ADD COLUMN barcode boolean DEFAULT NULL;