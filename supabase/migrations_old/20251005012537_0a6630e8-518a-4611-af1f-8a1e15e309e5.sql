-- Update incomplete service vendor entries to be fully populated Maryland businesses

-- Update Ice Lab with complete information
UPDATE serv_vendor_suppliers 
SET 
  contact_name = 'Jason Mitchell',
  state = 'Maryland',
  price = 1900,
  description = 'Professional ice sculpture artistry for elegant events and celebrations'
WHERE business_name = 'Ice Lab';

-- Update The Modest Florist with complete information
UPDATE serv_vendor_suppliers 
SET 
  contact_name = 'Rebecca Thompson',
  email = 'rebecca@modestflorist.com',
  state = 'Maryland',
  price = 1100,
  description = 'Beautiful floral arrangements and designs for all occasions'
WHERE business_name = 'The Modest Florist';