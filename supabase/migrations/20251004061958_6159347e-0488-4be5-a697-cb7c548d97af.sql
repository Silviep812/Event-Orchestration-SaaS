-- Update Portable Toilets to Portable Johns in vendor_rental_types
UPDATE vendor_rental_types 
SET name = 'Portable Johns'
WHERE name = 'Portable Toilets' OR name = 'Portable Toialets';