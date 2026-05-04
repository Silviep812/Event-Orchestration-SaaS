-- Insert Maryland vendor rental businesses
INSERT INTO serv_vendor_rentals (business_name, contact_name, email, phone_number, city, state, zip, price, description) VALUES
('Baltimore Audio Solutions', 'Michael Chen', 'michael@baltimoreaudiosolutions.com', '4105551234', 'Baltimore', 'Maryland', '21201', 1500, 'Professional audio visual equipment for events of all sizes'),
('Charm City Photo Booth', 'Sarah Johnson', 'sarah@charmcityphoto.com', '4105552345', 'Baltimore', 'Maryland', '21202', 800, 'Fun and interactive photo booth experiences'),
('Maryland Event Lighting', 'James Wilson', 'james@mdeventlighting.com', '3015553456', 'Rockville', 'Maryland', '20850', 1200, 'Creative lighting solutions for memorable events'),
('Annapolis Game Rentals', 'Lisa Martinez', 'lisa@annapolisgames.com', '4105554567', 'Annapolis', 'Maryland', '21401', 600, 'Interactive game tables for all ages'),
('Garden State Florals MD', 'Emily Davis', 'emily@gardenstateflorals.com', '3015555678', 'Silver Spring', 'Maryland', '20901', 2000, 'Beautiful fresh flowers and plant arrangements'),
('Maryland Tent & Canopy', 'Robert Brown', 'robert@mdtentcanopy.com', '4105556789', 'Columbia', 'Maryland', '21044', 3000, 'Quality tents for outdoor events'),
('Premier Tables & Chairs MD', 'Jennifer Lee', 'jennifer@premiertablesmd.com', '3015557890', 'Bethesda', 'Maryland', '20814', 500, 'Complete table and seating solutions'),
('Chesapeake Party Supplies', 'David Taylor', 'david@chesapeakeparty.com', '4105558901', 'Towson', 'Maryland', '21204', 400, 'Party essentials and housewares'),
('Maryland Mobile Restrooms', 'Karen White', 'karen@mdmobilerestrooms.com', '3015559012', 'Gaithersburg', 'Maryland', '20877', 800, 'Clean and comfortable portable restroom solutions'),
('Capital Entertainment Props', 'Thomas Anderson', 'thomas@capitalprops.com', '4105550123', 'Frederick', 'Maryland', '21701', 1000, 'Unique props and stage production elements'),
('Maryland Kids Play Rentals', 'Amanda Garcia', 'amanda@mdkidsplay.com', '3015551234', 'Germantown', 'Maryland', '20874', 750, 'Safe and fun play equipment for children'),
('Baltimore Event Decor', 'Christopher Martin', 'chris@baltimoreeventdecor.com', '4105552345', 'Ellicott City', 'Maryland', '21042', 1800, 'Transform your venue with stunning decor'),
('Chesapeake Entertainment Co', 'Michelle Robinson', 'michelle@chesapeakeentertainment.com', '4105553456', 'Annapolis', 'Maryland', '21403', 2500, 'Professional entertainment services and equipment');

-- Link vendors to service types
INSERT INTO serv_vendor_rental_assignments (serv_vendor_rental_id, vendor_rental_type_id)
SELECT id, 4 FROM serv_vendor_rentals WHERE business_name = 'Baltimore Audio Solutions'
UNION ALL
SELECT id, 2 FROM serv_vendor_rentals WHERE business_name = 'Charm City Photo Booth'
UNION ALL
SELECT id, 3 FROM serv_vendor_rentals WHERE business_name = 'Maryland Event Lighting'
UNION ALL
SELECT id, 5 FROM serv_vendor_rentals WHERE business_name = 'Annapolis Game Rentals'
UNION ALL
SELECT id, 6 FROM serv_vendor_rentals WHERE business_name = 'Garden State Florals MD'
UNION ALL
SELECT id, 7 FROM serv_vendor_rentals WHERE business_name = 'Maryland Tent & Canopy'
UNION ALL
SELECT id, 8 FROM serv_vendor_rentals WHERE business_name = 'Premier Tables & Chairs MD'
UNION ALL
SELECT id, 9 FROM serv_vendor_rentals WHERE business_name = 'Chesapeake Party Supplies'
UNION ALL
SELECT id, 11 FROM serv_vendor_rentals WHERE business_name = 'Maryland Mobile Restrooms'
UNION ALL
SELECT id, 12 FROM serv_vendor_rentals WHERE business_name = 'Capital Entertainment Props'
UNION ALL
SELECT id, 14 FROM serv_vendor_rentals WHERE business_name = 'Maryland Kids Play Rentals'
UNION ALL
SELECT id, 13 FROM serv_vendor_rentals WHERE business_name = 'Baltimore Event Decor'
UNION ALL
SELECT id, 10 FROM serv_vendor_rentals WHERE business_name = 'Chesapeake Entertainment Co'
ON CONFLICT (serv_vendor_rental_id, vendor_rental_type_id) DO NOTHING;