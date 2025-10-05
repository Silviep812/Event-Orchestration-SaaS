-- Update incomplete transportation entries to be fully populated Maryland businesses

-- Update Affordable Luxury Limousine with complete information
UPDATE transportations 
SET 
  contact_name = 'Patricia Williams',
  email = 'info@affordableluxurylimo.com',
  state = 'Maryland',
  price = 475,
  seating_capacity = 9,
  description = 'Affordable luxury limousine service for all special occasions',
  special_accommodations = ARRAY['Premium Interior', 'Sound System', 'Complimentary Beverages', 'Professional Chauffeur']
WHERE business_name = 'Affordable Luxury Limousine';

-- Update Gogo Charters to be a Maryland business with complete information
UPDATE transportations 
SET 
  contact_name = 'Steven Thompson',
  city = 'College Park',
  state = 'Maryland',
  zip = '20740',
  price = 1350,
  seating_capacity = 50,
  description = 'Professional charter bus service for group transportation and events',
  special_accommodations = ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Comfortable Seating']
WHERE business_name = 'Gogo Charters';