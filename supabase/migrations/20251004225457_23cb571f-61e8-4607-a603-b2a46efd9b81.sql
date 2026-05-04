-- Populate Maryland hotels with event spaces and costs
-- Prefer legacy "Hospitality Location"; if removed (e.g. after venue_types cleanup), use "Other".

WITH vt AS (
  SELECT COALESCE(
    (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
  ) AS hospitality_type
)
INSERT INTO public.venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, cost, user_id)
SELECT
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  vt.hospitality_type,
  v.city,
  v.state,
  v.zip,
  v.capacity,
  v.cost,
  NULL::uuid
FROM vt
CROSS JOIN (
  VALUES
    ('Four Seasons Hotel Baltimore', 'Events Coordinator', 'events.baltimore@fourseasons.com', '4105768800', 'Baltimore', 'MD', '21202', 400, 15000),
    ('Sagamore Pendry Baltimore', 'Catering Sales', 'events@pendry.com', '4109990000', 'Baltimore', 'MD', '21231', 350, 12000),
    ('Baltimore Marriott Waterfront', 'Event Planning', 'baltimorewaterfront.events@marriott.com', '4107859400', 'Baltimore', 'MD', '21202', 500, 10000),
    ('Hotel Monaco Baltimore', 'Special Events', 'monaco.events@monaco-baltimore.com', '4109622000', 'Baltimore', 'MD', '21202', 250, 8500),
    ('Lord Baltimore Hotel', 'Sales Manager', 'events@lordbaltimorehotel.com', '4105394000', 'Baltimore', 'MD', '21201', 300, 7500),
    ('Royal Sonesta Harbor Court Baltimore', 'Banquet Sales', 'harborcourt.events@sonesta.com', '4102346000', 'Baltimore', 'MD', '21202', 450, 11000),
    ('The Westin Annapolis', 'Event Services', 'events.annapolis@westin.com', '4109722300', 'Annapolis', 'MD', '21401', 350, 9500),
    ('Graduate Annapolis', 'Events Team', 'events@graduatehotels.com', '4102634700', 'Annapolis', 'MD', '21401', 200, 7000),
    ('Historic Inns of Annapolis', 'Group Sales', 'events@historicinnsofannapolis.com', '4102631014', 'Annapolis', 'MD', '21401', 180, 6500),
    ('Princess Royale Hotel & Conference Center', 'Conference Services', 'events@princessroyale.com', '4105207070', 'Ocean City', 'MD', '21842', 600, 12000),
    ('Hilton Ocean City Oceanfront Suites', 'Event Planning', 'oceancity.events@hilton.com', '4102894600', 'Ocean City', 'MD', '21842', 400, 9000),
    ('Clarion Resort Fontainebleau Hotel', 'Catering Manager', 'events@fontainebleauoc.com', '4105242300', 'Ocean City', 'MD', '21842', 500, 8000),
    ('The Bethesdan Hotel', 'Events Coordinator', 'events@thebethesdan.com', '2406509700', 'Bethesda', 'MD', '20814', 280, 10500),
    ('Hyatt Regency Bethesda', 'Sales Office', 'bethesda.events@hyatt.com', '3016574500', 'Bethesda', 'MD', '20814', 450, 11500),
    ('Gaithersburg Marriott Washingtonian Center', 'Event Sales', 'washingtonian.events@marriott.com', '3019860800', 'Gaithersburg', 'MD', '20878', 550, 9500),
    ('Turf Valley Resort', 'Conference Services', 'events@turfvalley.com', '4104659000', 'Ellicott City', 'MD', '21042', 500, 13000),
    ('The Hotel at the University of Maryland', 'Event Planning', 'events@thehotelumd.com', '3018643636', 'College Park', 'MD', '20740', 350, 8500),
    ('Homewood Suites by Hilton Frederick', 'Group Sales', 'frederick.events@hilton.com', '3016318800', 'Frederick', 'MD', '21704', 200, 6000),
    ('Hampton Inn & Suites Frederick-Fort Detrick', 'Event Coordinator', 'frederick.catering@hilton.com', '3016989500', 'Frederick', 'MD', '21702', 180, 5500),
    ('Hyatt Regency Chesapeake Bay Golf Resort', 'Resort Events', 'chesapeakebay.events@hyatt.com', '4102211234', 'Cambridge', 'MD', '21613', 600, 14000)
) AS v(business_name, contact_name, email, phone_number, city, state, zip, capacity, cost)
WHERE vt.hospitality_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.venues x
    WHERE x.business_name = v.business_name AND x.city = v.city AND x.state = v.state
  );
