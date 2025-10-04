-- Update the INSERT policy to allow venues without user_id
DROP POLICY IF EXISTS "Users can create their own venues" ON venues;

CREATE POLICY "Users can create venues"
ON venues
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Insert Maryland venues (without price column)
INSERT INTO venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, user_id) VALUES
-- Private Clubs
('The Cannon Club', 'Events Manager', 'events@thecannongolfclub.com', '4108887700', 6, 'Davidsonville', 'MD', '21035', 180, NULL),
('Valley Country Club', 'Wedding Coordinator', 'weddings@valleycountryclub.com', '4104554500', 6, 'Towson', 'MD', '21204', 200, NULL),
('Montgomery Country Club', 'Event Director', 'events@montgomerycc.com', '3019268300', 6, 'Laytonsville', 'MD', '20882', 250, NULL),
('Maryland Golf and Country Clubs', 'Special Events', 'events@marylandgcc.org', '4108791000', 6, 'Bel Air', 'MD', '21014', 220, NULL),
('Rolling Road Golf Club', 'Catering Manager', 'catering@rollingroad.com', '4107470900', 6, 'Catonsville', 'MD', '21228', 175, NULL),
-- Resorts  
('Gaylord National Resort', 'Convention Sales', 'meetings@gaylordnational.com', '3019654000', 4, 'National Harbor', 'MD', '20745', 2500, NULL),
('Ashore Resort', 'Conference Center', 'conferences@ashoreoceancity.com', '4105244900', 4, 'Ocean City', 'MD', '21842', 1000, NULL),
('William F Bolger Center', 'Event Services', 'events@bolgercenter.com', '3019839400', 4, 'Potomac', 'MD', '20854', 600, NULL),
-- Restaurants
('Bond 45', 'Private Events', 'groups@bond45.com', '3017498445', 3, 'National Harbor', 'MD', '20745', 120, NULL),
('Atlas Restaurant Group', 'Private Dining', 'events@atlasrestaurantgroup.com', '4104321515', 3, 'Baltimore', 'MD', '21202', 150, NULL),
('J Hollingers', 'Events Team', 'events@jhollingers.com', '2406505400', 3, 'Silver Spring', 'MD', '20910', 80, NULL),
('Glenwoods Dining', 'Group Events', 'events@glenwoodsdining.com', '4107272722', 3, 'Baltimore', 'MD', '21212', 100, NULL),
-- Farms
('Green Meadows Farm', 'Wedding Coordinator', 'gmfstables@gmail.com', '3016315900', 10, 'Ijamsville', 'MD', '21754', 250, NULL),
('Rosewood Farms', 'Event Manager', 'info@rosewoodfarmsmd.com', '4435352700', 10, 'Hampstead', 'MD', '21074', 200, NULL),
-- Warehouses
('SkyLofts Gallery Studios', 'Venue Manager', 'info@skylofts.net', '4105391929', 11, 'Baltimore', 'MD', '21224', 150, NULL),
('Baltimore Industrial Loft', 'Event Director', 'events@baltloft.com', '4103968800', 11, 'Baltimore', 'MD', '21231', 180, NULL),
-- Sporting
('MT Bank Stadium', 'Special Events', 'events@baltimoreravens.com', '4102615000', 13, 'Baltimore', 'MD', '21230', 71000, NULL),
-- Markets
('Baltimore Farmers Market', 'Market Manager', 'info@farmersmarketbaltimore.org', '4103960146', 7, 'Baltimore', 'MD', '21201', 500, NULL),
('Lexington Market', 'Events', 'events@lexingtonmarket.com', '4106856169', 7, 'Baltimore', 'MD', '21201', 300, NULL),
-- Hospitality
('Marriott Baltimore Waterfront', 'Catering Sales', 'events@marriottbaltimore.com', '4107371234', 9, 'Baltimore', 'MD', '21230', 600, NULL),
('Hyatt Regency Baltimore', 'Events Team', 'baltimore.regency@hyatt.com', '4105289000', 9, 'Baltimore', 'MD', '21202', 800, NULL),
-- Business
('Baltimore Convention Center', 'Event Services', 'sales@bccenter.org', '4106496000', 2, 'Baltimore', 'MD', '21201', 5000, NULL),
('BWI Business District Center', 'Conference Manager', 'events@bwicenter.com', '4107998800', 2, 'Linthicum Heights', 'MD', '21090', 400, NULL),
-- Recreation
('Sandy Point State Park Pavilion', 'Park Events', 'events@sandypoint.org', '4109747000', 5, 'Annapolis', 'MD', '21403', 200, NULL),
('Patapsco Valley State Park', 'Recreation Coordinator', 'events@patapscopark.org', '4104614559', 5, 'Ellicott City', 'MD', '21043', 150, NULL);