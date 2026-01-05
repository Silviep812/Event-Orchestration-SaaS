-- Add price/cost and description fields to vendor rental and supplier tables
ALTER TABLE serv_vendor_rentals 
ADD COLUMN IF NOT EXISTS price DECIMAL,
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE serv_vendor_suppliers 
ADD COLUMN IF NOT EXISTS price DECIMAL,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update some sample data to include prices
UPDATE serv_vendor_rentals 
SET price = 500.00, 
    description = 'Full service rental company providing tables, chairs, tents, and entertainment equipment'
WHERE business_name = 'McManus Amusements';

UPDATE serv_vendor_rentals 
SET price = 450.00, 
    contact_name = 'John Smith',
    email = 'info@abcpartyrental.com',
    description = 'Professional party rental services with a wide selection of equipment and decor'
WHERE business_name = 'ABC Party & Tent Rental';