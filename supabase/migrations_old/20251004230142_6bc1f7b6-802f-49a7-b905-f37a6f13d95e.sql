-- Populate Maryland Airbnb properties with event spaces and costs
-- venue_type_id = '9' is Hospitality Location (can accommodate both hotels and Airbnbs)

INSERT INTO venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, cost, user_id) VALUES
-- Baltimore Area Airbnbs
('Fells Point Historic Townhouse', 'Property Manager', 'events.fellspoint@airbnb.com', '4105551234', '9', 'Baltimore', 'MD', '21231', 50, 2500, NULL),
('Canton Waterfront Loft', 'Host Services', 'canton.events@airbnb.com', '4105551235', '9', 'Baltimore', 'MD', '21224', 40, 2000, NULL),
('Federal Hill Rooftop Venue', 'Event Coordinator', 'federalhill.events@airbnb.com', '4105551236', '9', 'Baltimore', 'MD', '21230', 60, 3000, NULL),
('Mt. Vernon Mansion Event Space', 'Property Host', 'mtvernon.events@airbnb.com', '4105551237', '9', 'Baltimore', 'MD', '21201', 80, 3500, NULL),

-- Annapolis Area Airbnbs
('Historic District Waterfront Home', 'Annapolis Host', 'historic.annapolis@airbnb.com', '4105551238', '9', 'Annapolis', 'MD', '21401', 45, 2800, NULL),
('Eastport Harbor View Estate', 'Event Services', 'eastport.events@airbnb.com', '4105551239', '9', 'Annapolis', 'MD', '21403', 70, 3200, NULL),
('West Annapolis Garden Estate', 'Host Manager', 'westannapolis.events@airbnb.com', '4105551240', '9', 'Annapolis', 'MD', '21401', 55, 2600, NULL),

-- Ocean City Area Airbnbs
('Oceanfront Beach House', 'Property Manager', 'oceanfront.oc@airbnb.com', '4105551241', '9', 'Ocean City', 'MD', '21842', 100, 4500, NULL),
('Bayside Event Villa', 'Events Coordinator', 'bayside.oc@airbnb.com', '4105551242', '9', 'Ocean City', 'MD', '21842', 80, 3800, NULL),
('North OC Beachfront Estate', 'Host Services', 'northoc.events@airbnb.com', '4105551243', '9', 'Ocean City', 'MD', '21842', 90, 4200, NULL),

-- Montgomery County Airbnbs
('Bethesda Modern Event Space', 'Property Host', 'bethesda.modern@airbnb.com', '3015551244', '9', 'Bethesda', 'MD', '20814', 50, 2700, NULL),
('Chevy Chase Elegant Manor', 'Event Manager', 'chevychase.events@airbnb.com', '3015551245', '9', 'Chevy Chase', 'MD', '20815', 65, 3100, NULL),
('Rockville Historic Estate', 'Host Coordinator', 'rockville.estate@airbnb.com', '3015551246', '9', 'Rockville', 'MD', '20850', 75, 3300, NULL),

-- Howard County Airbnbs
('Columbia Lakefront House', 'Property Services', 'columbia.lakefront@airbnb.com', '4105551247', '9', 'Columbia', 'MD', '21044', 55, 2400, NULL),
('Ellicott City Mill House', 'Event Host', 'ellicottcity.mill@airbnb.com', '4105551248', '9', 'Ellicott City', 'MD', '21043', 60, 2900, NULL),

-- Frederick Area Airbnbs
('Historic Frederick Mansion', 'Property Manager', 'frederick.mansion@airbnb.com', '3015551249', '9', 'Frederick', 'MD', '21701', 70, 3000, NULL),
('Catoctin Mountain Retreat', 'Event Coordinator', 'catoctin.retreat@airbnb.com', '3015551250', '9', 'Frederick', 'MD', '21702', 85, 3400, NULL),

-- Eastern Shore Airbnbs
('St. Michaels Waterfront Estate', 'Host Services', 'stmichaels.events@airbnb.com', '4105551251', '9', 'St. Michaels', 'MD', '21663', 60, 3500, NULL),
('Easton Historic Inn', 'Property Host', 'easton.historic@airbnb.com', '4105551252', '9', 'Easton', 'MD', '21601', 50, 2800, NULL),
('Chesapeake Bay Beach House', 'Event Manager', 'chesapeake.beach@airbnb.com', '4105551253', '9', 'Cambridge', 'MD', '21613', 75, 3600, NULL),

-- Western Maryland Airbnbs
('Deep Creek Lake Estate', 'Property Services', 'deepcreek.events@airbnb.com', '3015551254', '9', 'McHenry', 'MD', '21541', 100, 4000, NULL),
('Cumberland Victorian Mansion', 'Host Coordinator', 'cumberland.victorian@airbnb.com', '3015551255', '9', 'Cumberland', 'MD', '21502', 65, 2700, NULL);