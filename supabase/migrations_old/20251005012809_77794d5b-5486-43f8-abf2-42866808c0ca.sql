-- Update incomplete vendor rental entry to be fully populated

-- Update McManus Amusements with complete information
UPDATE serv_vendor_rentals 
SET 
  contact_name = 'Daniel McManus',
  state = 'Maryland',
  description = 'Professional amusement and entertainment equipment rentals for all events'
WHERE business_name = 'McManus Amusements';