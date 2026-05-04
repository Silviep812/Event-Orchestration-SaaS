-- Update the INSERT policy to allow venues without user_id
DROP POLICY IF EXISTS "Users can create their own venues" ON public.venues;
DROP POLICY IF EXISTS "Users can create venues" ON public.venues;

CREATE POLICY "Users can create venues"
ON public.venues
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Resolve venue_type_id by name so pushes work when legacy serial ids differ or
-- rows like "Resort Location" / "Hospitality Location" were already removed.
WITH vt AS (
  SELECT
    (SELECT id FROM public.venue_types WHERE name = 'Private Club' ORDER BY id LIMIT 1) AS private_club,
    (SELECT id FROM public.venue_types WHERE name = 'Restaurant Location' ORDER BY id LIMIT 1) AS restaurant,
    (SELECT COALESCE(
      (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1),
      (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
    )) AS resort,
    (SELECT id FROM public.venue_types WHERE name = 'Recreation Location' ORDER BY id LIMIT 1) AS recreation,
    (SELECT id FROM public.venue_types WHERE name = 'Market Place' ORDER BY id LIMIT 1) AS market,
    (SELECT COALESCE(
      (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
      (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
    )) AS hospitality,
    (SELECT id FROM public.venue_types WHERE name = 'Business Location' ORDER BY id LIMIT 1) AS business,
    (SELECT id FROM public.venue_types WHERE name = 'Agricultural/Farming' ORDER BY id LIMIT 1) AS farm,
    (SELECT id FROM public.venue_types WHERE name = 'Warehouse' ORDER BY id LIMIT 1) AS warehouse,
    (SELECT id FROM public.venue_types WHERE name = 'Sporting Facility' ORDER BY id LIMIT 1) AS sporting,
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1) AS other_fallback
)
INSERT INTO public.venues (business_name, contact_name, email, phone_number, venue_type_id, city, state, zip, capacity, user_id)
SELECT
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  COALESCE(
    CASE v.kind
      WHEN 'private_club' THEN vt.private_club
      WHEN 'restaurant' THEN vt.restaurant
      WHEN 'resort' THEN vt.resort
      WHEN 'farm' THEN vt.farm
      WHEN 'warehouse' THEN vt.warehouse
      WHEN 'sporting' THEN vt.sporting
      WHEN 'market' THEN vt.market
      WHEN 'hospitality' THEN vt.hospitality
      WHEN 'business' THEN vt.business
      WHEN 'recreation' THEN vt.recreation
    END,
    vt.other_fallback
  ),
  v.city,
  v.state,
  v.zip,
  v.capacity,
  NULL::uuid
FROM vt
CROSS JOIN (
  VALUES
    ('The Cannon Club', 'Events Manager', 'events@thecannongolfclub.com', '4108887700', 'private_club', 'Davidsonville', 'MD', '21035', 180),
    ('Valley Country Club', 'Wedding Coordinator', 'weddings@valleycountryclub.com', '4104554500', 'private_club', 'Towson', 'MD', '21204', 200),
    ('Montgomery Country Club', 'Event Director', 'events@montgomerycc.com', '3019268300', 'private_club', 'Laytonsville', 'MD', '20882', 250),
    ('Maryland Golf and Country Clubs', 'Special Events', 'events@marylandgcc.org', '4108791000', 'private_club', 'Bel Air', 'MD', '21014', 220),
    ('Rolling Road Golf Club', 'Catering Manager', 'catering@rollingroad.com', '4107470900', 'private_club', 'Catonsville', 'MD', '21228', 175),
    ('Gaylord National Resort', 'Convention Sales', 'meetings@gaylordnational.com', '3019654000', 'resort', 'National Harbor', 'MD', '20745', 2500),
    ('Ashore Resort', 'Conference Center', 'conferences@ashoreoceancity.com', '4105244900', 'resort', 'Ocean City', 'MD', '21842', 1000),
    ('William F Bolger Center', 'Event Services', 'events@bolgercenter.com', '3019839400', 'resort', 'Potomac', 'MD', '20854', 600),
    ('Bond 45', 'Private Events', 'groups@bond45.com', '3017498445', 'restaurant', 'National Harbor', 'MD', '20745', 120),
    ('Atlas Restaurant Group', 'Private Dining', 'events@atlasrestaurantgroup.com', '4104321515', 'restaurant', 'Baltimore', 'MD', '21202', 150),
    ('J Hollingers', 'Events Team', 'events@jhollingers.com', '2406505400', 'restaurant', 'Silver Spring', 'MD', '20910', 80),
    ('Glenwoods Dining', 'Group Events', 'events@glenwoodsdining.com', '4107272722', 'restaurant', 'Baltimore', 'MD', '21212', 100),
    ('Green Meadows Farm', 'Wedding Coordinator', 'gmfstables@gmail.com', '3016315900', 'farm', 'Ijamsville', 'MD', '21754', 250),
    ('Rosewood Farms', 'Event Manager', 'info@rosewoodfarmsmd.com', '4435352700', 'farm', 'Hampstead', 'MD', '21074', 200),
    ('SkyLofts Gallery Studios', 'Venue Manager', 'info@skylofts.net', '4105391929', 'warehouse', 'Baltimore', 'MD', '21224', 150),
    ('Baltimore Industrial Loft', 'Event Director', 'events@baltloft.com', '4103968800', 'warehouse', 'Baltimore', 'MD', '21231', 180),
    ('MT Bank Stadium', 'Special Events', 'events@baltimoreravens.com', '4102615000', 'sporting', 'Baltimore', 'MD', '21230', 71000),
    ('Baltimore Farmers Market', 'Market Manager', 'info@farmersmarketbaltimore.org', '4103960146', 'market', 'Baltimore', 'MD', '21201', 500),
    ('Lexington Market', 'Events', 'events@lexingtonmarket.com', '4106856169', 'market', 'Baltimore', 'MD', '21201', 300),
    ('Marriott Baltimore Waterfront', 'Catering Sales', 'events@marriottbaltimore.com', '4107371234', 'hospitality', 'Baltimore', 'MD', '21230', 600),
    ('Hyatt Regency Baltimore', 'Events Team', 'baltimore.regency@hyatt.com', '4105289000', 'hospitality', 'Baltimore', 'MD', '21202', 800),
    ('Baltimore Convention Center', 'Event Services', 'sales@bccenter.org', '4106496000', 'business', 'Baltimore', 'MD', '21201', 5000),
    ('BWI Business District Center', 'Conference Manager', 'events@bwicenter.com', '4107998800', 'business', 'Linthicum Heights', 'MD', '21090', 400),
    ('Sandy Point State Park Pavilion', 'Park Events', 'events@sandypoint.org', '4109747000', 'recreation', 'Annapolis', 'MD', '21403', 200),
    ('Patapsco Valley State Park', 'Recreation Coordinator', 'events@patapscopark.org', '4104614559', 'recreation', 'Ellicott City', 'MD', '21043', 150)
) AS v(business_name, contact_name, email, phone_number, kind, city, state, zip, capacity)
WHERE COALESCE(
  CASE v.kind
    WHEN 'private_club' THEN vt.private_club
    WHEN 'restaurant' THEN vt.restaurant
    WHEN 'resort' THEN vt.resort
    WHEN 'farm' THEN vt.farm
    WHEN 'warehouse' THEN vt.warehouse
    WHEN 'sporting' THEN vt.sporting
    WHEN 'market' THEN vt.market
    WHEN 'hospitality' THEN vt.hospitality
    WHEN 'business' THEN vt.business
    WHEN 'recreation' THEN vt.recreation
  END,
  vt.other_fallback
) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.venues x
    WHERE x.business_name = v.business_name AND x.city = v.city AND x.state = v.state
  );
