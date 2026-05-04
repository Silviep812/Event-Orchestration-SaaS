-- Populate Maryland Airbnb properties with event spaces and costs
-- Prefer "Hospitality Location"; if removed (e.g. after venue_types cleanup), use "Other".

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
    ('Fells Point Historic Townhouse', 'Property Manager', 'events.fellspoint@airbnb.com', '4105551234', 'Baltimore', 'MD', '21231', 50, 2500),
    ('Canton Waterfront Loft', 'Host Services', 'canton.events@airbnb.com', '4105551235', 'Baltimore', 'MD', '21224', 40, 2000),
    ('Federal Hill Rooftop Venue', 'Event Coordinator', 'federalhill.events@airbnb.com', '4105551236', 'Baltimore', 'MD', '21230', 60, 3000),
    ('Mt. Vernon Mansion Event Space', 'Property Host', 'mtvernon.events@airbnb.com', '4105551237', 'Baltimore', 'MD', '21201', 80, 3500),
    ('Historic District Waterfront Home', 'Annapolis Host', 'historic.annapolis@airbnb.com', '4105551238', 'Annapolis', 'MD', '21401', 45, 2800),
    ('Eastport Harbor View Estate', 'Event Services', 'eastport.events@airbnb.com', '4105551239', 'Annapolis', 'MD', '21403', 70, 3200),
    ('West Annapolis Garden Estate', 'Host Manager', 'westannapolis.events@airbnb.com', '4105551240', 'Annapolis', 'MD', '21401', 55, 2600),
    ('Oceanfront Beach House', 'Property Manager', 'oceanfront.oc@airbnb.com', '4105551241', 'Ocean City', 'MD', '21842', 100, 4500),
    ('Bayside Event Villa', 'Events Coordinator', 'bayside.oc@airbnb.com', '4105551242', 'Ocean City', 'MD', '21842', 80, 3800),
    ('North OC Beachfront Estate', 'Host Services', 'northoc.events@airbnb.com', '4105551243', 'Ocean City', 'MD', '21842', 90, 4200),
    ('Bethesda Modern Event Space', 'Property Host', 'bethesda.modern@airbnb.com', '3015551244', 'Bethesda', 'MD', '20814', 50, 2700),
    ('Chevy Chase Elegant Manor', 'Event Manager', 'chevychase.events@airbnb.com', '3015551245', 'Chevy Chase', 'MD', '20815', 65, 3100),
    ('Rockville Historic Estate', 'Host Coordinator', 'rockville.estate@airbnb.com', '3015551246', 'Rockville', 'MD', '20850', 75, 3300),
    ('Columbia Lakefront House', 'Property Services', 'columbia.lakefront@airbnb.com', '4105551247', 'Columbia', 'MD', '21044', 55, 2400),
    ('Ellicott City Mill House', 'Event Host', 'ellicottcity.mill@airbnb.com', '4105551248', 'Ellicott City', 'MD', '21043', 60, 2900),
    ('Historic Frederick Mansion', 'Property Manager', 'frederick.mansion@airbnb.com', '3015551249', 'Frederick', 'MD', '21701', 70, 3000),
    ('Catoctin Mountain Retreat', 'Event Coordinator', 'catoctin.retreat@airbnb.com', '3015551250', 'Frederick', 'MD', '21702', 85, 3400),
    ('St. Michaels Waterfront Estate', 'Host Services', 'stmichaels.events@airbnb.com', '4105551251', 'St. Michaels', 'MD', '21663', 60, 3500),
    ('Easton Historic Inn', 'Property Host', 'easton.historic@airbnb.com', '4105551252', 'Easton', 'MD', '21601', 50, 2800),
    ('Chesapeake Bay Beach House', 'Event Manager', 'chesapeake.beach@airbnb.com', '4105551253', 'Cambridge', 'MD', '21613', 75, 3600),
    ('Deep Creek Lake Estate', 'Property Services', 'deepcreek.events@airbnb.com', '3015551254', 'McHenry', 'MD', '21541', 100, 4000),
    ('Cumberland Victorian Mansion', 'Host Coordinator', 'cumberland.victorian@airbnb.com', '3015551255', 'Cumberland', 'MD', '21502', 65, 2700)
) AS v(business_name, contact_name, email, phone_number, city, state, zip, capacity, cost)
WHERE vt.hospitality_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.venues x
    WHERE x.business_name = v.business_name AND x.city = v.city AND x.state = v.state
  );
