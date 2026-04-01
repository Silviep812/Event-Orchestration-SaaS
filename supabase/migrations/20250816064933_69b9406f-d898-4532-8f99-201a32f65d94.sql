-- Populate Service Vendor Directory with available vendor types
INSERT INTO "Service Vendor Directory" (service_vendor_id, caterer, bakery, videographer, chef) 
VALUES 
('caterer_001', 'Catering Services', NULL, NULL, NULL),
('bakery_001', NULL, 'Bakery Services', NULL, NULL),
('videographer_001', NULL, NULL, 'Videography Services', NULL),
('chef_001', NULL, NULL, NULL, 'Chef Services')
ON CONFLICT (service_vendor_id) DO NOTHING;

-- Populate Venue Directory with available venue types
INSERT INTO "Venue Directory" (id, "Private_Resident", "Business_Location", "Restaurant_Location", "Resort_Location", "Recreation_Location", "Private_Club", "Market_Place", "Local_Govern_Location", "Hospitality_Location", "Agri-Farming", "Warehouse", "State_Govern_Location", "Sporting_Facility", "Other") 
VALUES 
(1, 'Private Residence', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, NULL, 'Business Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, NULL, NULL, 'Restaurant Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, NULL, NULL, NULL, 'Resort Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, NULL, NULL, NULL, NULL, 'Recreation Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, NULL, NULL, NULL, NULL, NULL, 'Private Club', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, NULL, NULL, NULL, NULL, NULL, NULL, 'Market Place', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Local Government Location', NULL, NULL, NULL, NULL, NULL, NULL),
(9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Hospitality Location', NULL, NULL, NULL, NULL, NULL),
(10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Agricultural/Farming', NULL, NULL, NULL, NULL),
(11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Warehouse', NULL, NULL, NULL),
(12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'State Government Location', NULL, NULL),
(13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Sporting Facility', NULL),
(14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Other')
ON CONFLICT (id) DO NOTHING;

-- Populate Hospitality Directory with available hospitality types
INSERT INTO "Hospitality Directory" (id, "Motel", "Hotel", "Airbnb", "Resort", "Other") 
VALUES 
(1, 'Motel', NULL, NULL, NULL, NULL),
(2, NULL, 'Hotel', NULL, NULL, NULL),
(3, NULL, NULL, 'Airbnb', NULL, NULL),
(4, NULL, NULL, NULL, 'Resort', NULL),
(5, NULL, NULL, NULL, NULL, 'Other')
ON CONFLICT (id) DO NOTHING;

-- Populate Transportation Directory with available transportation types
INSERT INTO "Transportation Directory" (transo_rental_id, bus, van, limo, car_suv, truck, other) 
VALUES 
(1, ARRAY['Bus Services'], NULL, NULL, NULL, NULL, NULL),
(2, NULL, 'Van Services', NULL, NULL, NULL, NULL),
(3, NULL, NULL, 'Limousine Services', NULL, NULL, NULL),
(4, NULL, NULL, NULL, 'Car/SUV Services', NULL, NULL),
(5, NULL, NULL, NULL, NULL, 'Truck Services', NULL),
(6, NULL, NULL, NULL, NULL, NULL, 'Other Transportation')
ON CONFLICT (transo_rental_id) DO NOTHING;

-- Populate Service Rental/Sale Directory with available rental types
INSERT INTO "Service Rental/Sale Directory" (rental_type_id, transport_options, photo_both, lighting, audio_visual_equip, game_tables, flowers_plants, tents, table_chairs, housewares, entertainment_options) 
VALUES 
('transport_001', 'Transportation Options', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('photo_001', NULL, 'Photo Booth', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('lighting_001', NULL, NULL, 'Lighting Equipment', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('av_001', NULL, NULL, NULL, 'Audio Visual Equipment', NULL, NULL, NULL, NULL, NULL, NULL),
('games_001', NULL, NULL, NULL, NULL, 'Game Tables', NULL, NULL, NULL, NULL, NULL),
('flowers_001', NULL, NULL, NULL, NULL, NULL, 'Flowers & Plants', NULL, NULL, NULL, NULL),
('tents_001', NULL, NULL, NULL, NULL, NULL, NULL, 'Tents', NULL, NULL, NULL),
('tables_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tables & Chairs', NULL, NULL),
('housewares_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Housewares', NULL),
('entertainment_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Entertainment Options')
ON CONFLICT (rental_type_id) DO NOTHING;

-- Populate Entertainment Directory with available entertainment types
INSERT INTO "Entertainment Directory" (id, "Musicians", "DJ Music", "Performer", "Standup Comic", "Speaker", "Stage_Production", "Other") 
VALUES 
(1, 'Musicians', NULL, NULL, NULL, NULL, NULL, NULL),
(2, NULL, 'DJ Music', NULL, NULL, NULL, NULL, NULL),
(3, NULL, NULL, 'Performer', NULL, NULL, NULL, NULL),
(4, NULL, NULL, NULL, 'Standup Comic', NULL, NULL, NULL),
(5, NULL, NULL, NULL, NULL, 'Speaker', NULL, NULL),
(6, NULL, NULL, NULL, NULL, NULL, 'Stage Production', NULL),
(7, NULL, NULL, NULL, NULL, NULL, NULL, 'Other')
ON CONFLICT (id) DO NOTHING;

-- Populate Bookings Directory with available booking types
INSERT INTO "Bookings Directory" (book_id, reservation, rsvp, confirmation, registry) 
VALUES 
('reservation_001', TRUE, NULL, NULL, NULL),
('rsvp_001', NULL, TRUE, NULL, NULL),
('confirmation_001', NULL, NULL, TRUE, NULL),
('registry_001', NULL, NULL, NULL, ARRAY['Registry Services'])
ON CONFLICT (book_id) DO NOTHING;