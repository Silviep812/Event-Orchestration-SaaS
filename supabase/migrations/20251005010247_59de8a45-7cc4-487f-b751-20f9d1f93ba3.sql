-- Insert Maryland-based vendors for Service Vendor Directory (serv_vendor_suppliers table)

-- Caterer (type_id: 1)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Baltimore Catering Co', 'Rachel Green', 'rachel@baltimorecatering.com', '4105553001', 'Baltimore', 'Maryland', '21201', 1, 2500, 'Full-service catering for corporate and private events'),
('Chesapeake Bay Catering', 'David Wilson', 'david@chesapeakecatering.com', '4105553002', 'Annapolis', 'Maryland', '21401', 1, 2200, 'Specializing in seafood and regional cuisine');

-- Chef (type_id: 2)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Private Chef MD', 'Michael Johnson', 'michael@privatechefmd.com', '4105553003', 'Rockville', 'Maryland', '20850', 2, 1500, 'Personal chef services for intimate events'),
('Executive Chef Services', 'Lisa Chen', 'lisa@executivechef.com', '3015553004', 'Silver Spring', 'Maryland', '20901', 2, 1800, 'Professional chef services with custom menus');

-- Bakery (type_id: 3)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Sweet Delights Bakery', 'Sarah Martinez', 'sarah@sweetdelights.com', '4105553005', 'Frederick', 'Maryland', '21701', 3, 800, 'Custom cakes, pastries, and dessert tables'),
('Maryland Artisan Bakery', 'Thomas Anderson', 'thomas@mdartisan.com', '4105553006', 'Towson', 'Maryland', '21204', 3, 900, 'Artisan breads and custom baked goods');

-- Videographer (type_id: 4)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Charm City Video Productions', 'Jennifer Lee', 'jennifer@charmcityvideo.com', '4105553007', 'Baltimore', 'Maryland', '21218', 4, 2000, 'Professional event videography and editing'),
('Capital Video Services', 'Robert Brown', 'robert@capitalvideo.com', '3015553008', 'Bethesda', 'Maryland', '20814', 4, 2200, 'Cinematic event coverage and live streaming');

-- Food Truck (type_id: 5)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Rolling Gourmet MD', 'Amanda Garcia', 'amanda@rollinggourmet.com', '4105553009', 'Columbia', 'Maryland', '21044', 5, 1200, 'Gourmet food truck catering for events'),
('Street Eats Baltimore', 'Christopher White', 'chris@streeteats.com', '4105553010', 'Baltimore', 'Maryland', '21202', 5, 1000, 'Diverse street food options on wheels');

-- Mobile Pop-Up (type_id: 6)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Pop-Up Events MD', 'Michelle Taylor', 'michelle@popupevents.com', '4105553011', 'Gaithersburg', 'Maryland', '20877', 6, 1500, 'Mobile bars and pop-up dining experiences'),
('Mobile Market Maryland', 'Kevin Davis', 'kevin@mobilemarket.com', '3015553012', 'Germantown', 'Maryland', '20874', 6, 1300, 'Pop-up retail and vendor services');

-- Ice Sculpture (type_id: 7) - Already has Ice Lab, adding one more
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Frozen Art Sculptures', 'Daniel Kim', 'daniel@frozenart.com', '4105553013', 'Annapolis', 'Maryland', '21403', 7, 1800, 'Custom ice sculptures and ice bars for events');

-- Florist (type_id: 8) - Already has The Modest Florist, adding one more
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Garden State Florals', 'Emily Green', 'emily@gardenstate.com', '4105553014', 'Ellicott City', 'Maryland', '21042', 8, 1200, 'Fresh floral arrangements and event decor');

-- Foodies (type_id: 9)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Maryland Foodies Collective', 'Patricia Moore', 'patricia@mdfoodies.com', '4105553015', 'College Park', 'Maryland', '20740', 9, 1000, 'Artisan food vendors and tastings'),
('Gourmet Bites MD', 'Steven Jackson', 'steven@gourmetbites.com', '4105553016', 'Bowie', 'Maryland', '20715', 9, 950, 'Specialty food sampling and demonstrations');

-- Beverage (type_id: 10)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Thirsty Events MD', 'Karen White', 'karen@thirstyevents.com', '4105553017', 'Westminster', 'Maryland', '21157', 10, 1100, 'Full bar service and specialty beverages'),
('Pour Perfection', 'Mark Thompson', 'mark@pourperfection.com', '4105553018', 'Easton', 'Maryland', '21601', 10, 1200, 'Premium beverage catering and bartenders');

-- Brewery (type_id: 11)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Charm City Brewing Events', 'Brian Harris', 'brian@charmcitybrew.com', '4105553019', 'Baltimore', 'Maryland', '21230', 11, 1500, 'Craft beer service and brewery experiences'),
('Maryland Craft Brewers', 'Nancy Lewis', 'nancy@mdcraftbrew.com', '4105553020', 'Laurel', 'Maryland', '20707', 11, 1400, 'Local craft beer catering and education');

-- Winery (type_id: 12)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Chesapeake Vineyards Events', 'Victoria Hall', 'victoria@chesapeakewine.com', '4105553021', 'Cambridge', 'Maryland', '21613', 12, 1600, 'Wine tastings and vineyard experiences'),
('Maryland Wine Co', 'Andrew Clark', 'andrew@mdwineco.com', '4105553022', 'Hagerstown', 'Maryland', '21740', 12, 1500, 'Premium wine service and sommelier consultation');

-- Other (type_id: 13)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Event Services Plus', 'Rachel Walker', 'rachel@eventservices.com', '4105553023', 'Chevy Chase', 'Maryland', '20815', 13, 800, 'Miscellaneous event support services'),
('All-Purpose Event Support', 'David Young', 'david@allevent.com', '4105553024', 'Ocean City', 'Maryland', '21842', 13, 750, 'Flexible event service solutions');

-- Delivery (type_id: 14)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Fast Track Delivery MD', 'Karen Allen', 'karen@fasttrack.com', '4105553025', 'Waldorf', 'Maryland', '20602', 14, 500, 'Reliable event delivery and logistics'),
('Express Event Delivery', 'Steven King', 'steven@expressdelivery.com', '4105553026', 'Glen Burnie', 'Maryland', '21061', 14, 450, 'Same-day delivery for event supplies');

-- Volunteers (type_id: 15)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Maryland Volunteer Network', 'Michelle Robinson', 'michelle@mdvolunteer.com', '4105553027', 'Salisbury', 'Maryland', '21801', 15, 0, 'Coordinated volunteer services for events'),
('Community Event Volunteers', 'Christopher Martin', 'chris@communityvolunteer.com', '4105553028', 'Frederick', 'Maryland', '21702', 15, 0, 'Volunteer coordination and management');

-- Security (type_id: 16)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Elite Event Security', 'James Wilson', 'james@elitesecurity.com', '4105553029', 'Baltimore', 'Maryland', '21201', 16, 2000, 'Professional security services for events'),
('Maryland Security Solutions', 'Lisa Martinez', 'lisa@mdsecurity.com', '3015553030', 'Rockville', 'Maryland', '20850', 16, 1800, 'Comprehensive event security and crowd control');

-- Transportation (type_id: 17)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('Premier Transportation MD', 'Robert Miller', 'robert@premiertrans.com', '4105553031', 'Annapolis', 'Maryland', '21401', 17, 1500, 'Luxury transportation for events and guests'),
('Bay Area Event Transit', 'Amanda Davis', 'amanda@bayareatransit.com', '4105553032', 'Towson', 'Maryland', '21204', 17, 1400, 'Group transportation and shuttle services');

-- Rentals (type_id: 18)
INSERT INTO serv_vendor_suppliers (business_name, contact_name, email, phone_number, city, state, zip, vendor_sup_type_id, price, description) VALUES
('All Event Rentals MD', 'Thomas Anderson', 'thomas@alleventrentals.com', '4105553033', 'Silver Spring', 'Maryland', '20910', 18, 1000, 'Complete event rental equipment and supplies'),
('Maryland Party Rentals', 'Jennifer White', 'jennifer@mdpartyrentals.com', '4105553034', 'Columbia', 'Maryland', '21044', 18, 950, 'Tables, chairs, linens, and party essentials');