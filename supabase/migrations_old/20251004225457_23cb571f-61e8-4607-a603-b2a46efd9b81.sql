-- Populate Maryland hotels with event spaces and costs
-- venue_type_id = '9' is Hospitality Location

INSERT INTO venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, cost, user_id) VALUES
-- Baltimore Hotels
('Four Seasons Hotel Baltimore', 'Events Coordinator', 'events.baltimore@fourseasons.com', '4105768800', '9', 'Baltimore', 'MD', '21202', 400, 15000, NULL),
('Sagamore Pendry Baltimore', 'Catering Sales', 'events@pendry.com', '4109990000', '9', 'Baltimore', 'MD', '21231', 350, 12000, NULL),
('Baltimore Marriott Waterfront', 'Event Planning', 'baltimorewaterfront.events@marriott.com', '4107859400', '9', 'Baltimore', 'MD', '21202', 500, 10000, NULL),
('Hotel Monaco Baltimore', 'Special Events', 'monaco.events@monaco-baltimore.com', '4109622000', '9', 'Baltimore', 'MD', '21202', 250, 8500, NULL),
('Lord Baltimore Hotel', 'Sales Manager', 'events@lordbaltimorehotel.com', '4105394000', '9', 'Baltimore', 'MD', '21201', 300, 7500, NULL),
('Royal Sonesta Harbor Court Baltimore', 'Banquet Sales', 'harborcourt.events@sonesta.com', '4102346000', '9', 'Baltimore', 'MD', '21202', 450, 11000, NULL),

-- Annapolis Hotels
('The Westin Annapolis', 'Event Services', 'events.annapolis@westin.com', '4109722300', '9', 'Annapolis', 'MD', '21401', 350, 9500, NULL),
('Graduate Annapolis', 'Events Team', 'events@graduatehotels.com', '4102634700', '9', 'Annapolis', 'MD', '21401', 200, 7000, NULL),
('Historic Inns of Annapolis', 'Group Sales', 'events@historicinnsofannapolis.com', '4102631014', '9', 'Annapolis', 'MD', '21401', 180, 6500, NULL),

-- Ocean City Hotels
('Princess Royale Hotel & Conference Center', 'Conference Services', 'events@princessroyale.com', '4105207070', '9', 'Ocean City', 'MD', '21842', 600, 12000, NULL),
('Hilton Ocean City Oceanfront Suites', 'Event Planning', 'oceancity.events@hilton.com', '4102894600', '9', 'Ocean City', 'MD', '21842', 400, 9000, NULL),
('Clarion Resort Fontainebleau Hotel', 'Catering Manager', 'events@fontainebleauoc.com', '4105242300', '9', 'Ocean City', 'MD', '21842', 500, 8000, NULL),

-- Bethesda/Rockville Area
('The Bethesdan Hotel', 'Events Coordinator', 'events@thebethesdan.com', '2406509700', '9', 'Bethesda', 'MD', '20814', 280, 10500, NULL),
('Hyatt Regency Bethesda', 'Sales Office', 'bethesda.events@hyatt.com', '3016574500', '9', 'Bethesda', 'MD', '20814', 450, 11500, NULL),
('Gaithersburg Marriott Washingtonian Center', 'Event Sales', 'washingtonian.events@marriott.com', '3019860800', '9', 'Gaithersburg', 'MD', '20878', 550, 9500, NULL),

-- Columbia/Laurel Area
('Turf Valley Resort', 'Conference Services', 'events@turfvalley.com', '4104659000', '9', 'Ellicott City', 'MD', '21042', 500, 13000, NULL),
('The Hotel at the University of Maryland', 'Event Planning', 'events@thehotelumd.com', '3018643636', '9', 'College Park', 'MD', '20740', 350, 8500, NULL),

-- Frederick Area
('Homewood Suites by Hilton Frederick', 'Group Sales', 'frederick.events@hilton.com', '3016318800', '9', 'Frederick', 'MD', '21704', 200, 6000, NULL),
('Hampton Inn & Suites Frederick-Fort Detrick', 'Event Coordinator', 'frederick.catering@hilton.com', '3016989500', '9', 'Frederick', 'MD', '21702', 180, 5500, NULL),

-- Cambridge/Eastern Shore
('Hyatt Regency Chesapeake Bay Golf Resort', 'Resort Events', 'chesapeakebay.events@hyatt.com', '4102211234', '9', 'Cambridge', 'MD', '21613', 600, 14000, NULL)