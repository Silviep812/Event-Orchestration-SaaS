-- Insert Maryland State Parks that permit events
INSERT INTO venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, user_id) VALUES
-- State Parks (venue_type_id = 12)
('Sandy Point State Park', 'Park Events Coordinator', 'sandypoint.events@maryland.gov', '4109747000', '12', 'Annapolis', 'MD', '21403', 300, NULL),
('Patapsco Valley State Park', 'Special Events', 'patapsco.reservations@maryland.gov', '4104614559', '12', 'Ellicott City', 'MD', '21043', 200, NULL),
('Gunpowder Falls State Park', 'Event Services', 'gunpowder.events@maryland.gov', '4105925897', '12', 'Kingsville', 'MD', '21087', 250, NULL),
('Elk Neck State Park', 'Park Manager', 'elkneck.permits@maryland.gov', '4102872333', '12', 'North East', 'MD', '21901', 150, NULL),
('Rocks State Park', 'Recreation Coordinator', 'rocks.events@maryland.gov', '4105575974', '12', 'Jarrettsville', 'MD', '21084', 175, NULL),
-- Local Parks (venue_type_id = 8)
('Brookside Gardens', 'Events Manager', 'events@brooksidegardens.org', '3019622004', '8', 'Wheaton', 'MD', '20902', 200, NULL),
('Cylburn Arboretum', 'Event Rental Office', 'cylburn.events@baltimorecity.gov', '4103964880', '8', 'Baltimore', 'MD', '21209', 150, NULL),
('Centennial Park Pavilion', 'Recreation Events', 'pavilions@howardcountymd.gov', '4103137256', '8', 'Columbia', 'MD', '21044', 180, NULL),
('Black Hill Regional Park', 'Park Permits', 'blackhill.events@montgomeryparks.org', '3019407099', '8', 'Boyds', 'MD', '20841', 250, NULL),
('Watkins Regional Park', 'Special Events Office', 'watkins.events@pgparks.com', '3019742313', '8', 'Upper Marlboro', 'MD', '20774', 300, NULL),
('Seneca Creek State Park Pavilion', 'Event Permits', 'senecacreek.events@maryland.gov', '3019249388', '8', 'Gaithersburg', 'MD', '20878', 200, NULL),
('Lake Needwood Regional Park', 'Group Reservations', 'needwood.events@montgomeryparks.org', '3019487077', '8', 'Rockville', 'MD', '20850', 175, NULL);