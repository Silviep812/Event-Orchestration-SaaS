-- Add missing columns to transportations table
ALTER TABLE transportations 
ADD COLUMN IF NOT EXISTS seating_capacity integer,
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS special_accommodations text[];

-- Now insert Maryland-based transportation businesses for all transportation types

-- Bus transportation (type_id: 1)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Premier Charter Bus Maryland', 'Michael Johnson', 'info@premierchartermd.com', '4105551001', 'Baltimore', 'Maryland', '21202', 1, 1500, 56, 'Luxury charter bus service for groups and events', ARRAY['WiFi', 'Restroom', 'Air Conditioning', 'Reclining Seats']),
('Maryland Express Bus Lines', 'Sarah Williams', 'bookings@mdexpressbus.com', '4105551002', 'Rockville', 'Maryland', '20850', 1, 1200, 45, 'Reliable bus transportation for corporate and private events', ARRAY['WiFi', 'Audio System', 'Air Conditioning']);

-- Van transportation (type_id: 2)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Annapolis Van Service', 'David Martinez', 'contact@annapolisvan.com', '4105552001', 'Annapolis', 'Maryland', '21401', 2, 350, 15, 'Comfortable van transportation for medium-sized groups', ARRAY['WiFi', 'Luggage Space', 'Climate Control']),
('Silver Spring Shuttles', 'Jennifer Lee', 'info@silverspringshuttles.com', '3015552002', 'Silver Spring', 'Maryland', '20901', 2, 300, 12, 'Professional shuttle and van services for all occasions', ARRAY['Wheelchair Accessible', 'WiFi', 'Air Conditioning']);

-- Car/SUV transportation (type_id: 3)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Bethesda Executive Cars', 'Robert Taylor', 'reservations@bethesdaexec.com', '3015553001', 'Bethesda', 'Maryland', '20814', 3, 150, 6, 'Premium SUV service for executive transportation', ARRAY['WiFi', 'Leather Seats', 'Bottled Water']),
('Towson Luxury Rides', 'Emily Brown', 'bookings@towsonluxury.com', '4105553002', 'Towson', 'Maryland', '21204', 3, 175, 7, 'High-end car and SUV service for special occasions', ARRAY['Climate Control', 'Premium Sound', 'Phone Chargers']);

-- Limousine transportation (type_id: 4)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Maryland Royal Limousines', 'Christopher Wilson', 'info@mdroyallimo.com', '4105554001', 'Columbia', 'Maryland', '21044', 4, 500, 10, 'Elegant limousine service for weddings and special events', ARRAY['Bar Service', 'Premium Sound', 'Mood Lighting', 'Privacy Partition']),
('Frederick Premium Limo', 'Amanda Garcia', 'bookings@frederickpremium.com', '3015554002', 'Frederick', 'Maryland', '21701', 4, 450, 8, 'Luxury limousine service with professional chauffeurs', ARRAY['Champagne Service', 'Entertainment System', 'Leather Interior']);

-- Truck transportation (type_id: 5)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Baltimore Moving & Transport', 'James Anderson', 'dispatch@baltimoremove.com', '4105555001', 'Baltimore', 'Maryland', '21224', 5, 200, 3, 'Professional truck services for equipment and supplies transport', ARRAY['Lift Gate', 'Tie-Down Straps', 'Climate Control']),
('Gaithersburg Freight Services', 'Maria Rodriguez', 'info@gaithersburgfreight.com', '3015555002', 'Gaithersburg', 'Maryland', '20877', 5, 250, 3, 'Reliable truck transportation for event logistics and deliveries', ARRAY['Loading Assistance', 'GPS Tracking', 'Insurance Coverage']);

-- Other transportation (type_id: 6)
INSERT INTO transportations (business_name, contact_name, email, phone_number, city, state, zip, transp_type_id, price, seating_capacity, description, special_accommodations) VALUES
('Chesapeake Specialty Transport', 'Thomas Clark', 'contact@chesapeakespecial.com', '4105556001', 'Easton', 'Maryland', '21601', 6, 400, 20, 'Unique transportation options including trolleys and vintage vehicles', ARRAY['Open Air Option', 'Tour Guide', 'Custom Routes']),
('Hagerstown Party Bus', 'Lisa Martinez', 'bookings@hagerstownparty.com', '3015556002', 'Hagerstown', 'Maryland', '21740', 6, 600, 25, 'Party bus rentals for celebrations and special occasions', ARRAY['Dance Floor', 'Bar', 'Sound System', 'LED Lighting']);