-- Add cost column to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS cost numeric;

-- Update costs for Private Residence venues (venue_type_id = 1)
UPDATE venues SET cost = 2500 WHERE business_name = 'Elegant Estate Manor';
UPDATE venues SET cost = 3000 WHERE business_name = 'Historic Waterfront Home';
UPDATE venues SET cost = 2000 WHERE business_name = 'Garden View Residence';
UPDATE venues SET cost = 2800 WHERE business_name = 'Lakeside Private Estate';
UPDATE venues SET cost = 2200 WHERE business_name = 'Countryside Manor House';

-- Update costs for Resort venues (venue_type_id = 4)
UPDATE venues SET cost = 8500 WHERE business_name = 'Gaylord National Resort';
UPDATE venues SET cost = 5500 WHERE business_name = 'Ashore Resort';
UPDATE venues SET cost = 6000 WHERE business_name = 'William F Bolger Center';

-- Update costs for Restaurant venues (venue_type_id = 3)
UPDATE venues SET cost = 2500 WHERE business_name = 'Bond 45';
UPDATE venues SET cost = 3500 WHERE business_name = 'Atlas Restaurant Group';
UPDATE venues SET cost = 1800 WHERE business_name = 'J Hollingers';
UPDATE venues SET cost = 2200 WHERE business_name = 'Glenwoods Dining';

-- Update costs for Private Club venues (venue_type_id = 6)
UPDATE venues SET cost = 5000 WHERE business_name = 'The Cannon Club';
UPDATE venues SET cost = 6000 WHERE business_name = 'Valley Country Club';
UPDATE venues SET cost = 7000 WHERE business_name = 'Montgomery Country Club';
UPDATE venues SET cost = 5800 WHERE business_name = 'Maryland Golf and Country Clubs';
UPDATE venues SET cost = 4800 WHERE business_name = 'Rolling Road Golf Club';

-- Update costs for Market venues (venue_type_id = 7)
UPDATE venues SET cost = 800 WHERE business_name = 'Baltimore Farmers Market';
UPDATE venues SET cost = 1000 WHERE business_name = 'Lexington Market';

-- Update costs for Local Parks (venue_type_id = 8)
UPDATE venues SET cost = 500 WHERE business_name = 'Brookside Gardens';
UPDATE venues SET cost = 450 WHERE business_name = 'Cylburn Arboretum';
UPDATE venues SET cost = 400 WHERE business_name = 'Centennial Park Pavilion';
UPDATE venues SET cost = 550 WHERE business_name = 'Black Hill Regional Park';
UPDATE venues SET cost = 600 WHERE business_name = 'Watkins Regional Park';
UPDATE venues SET cost = 500 WHERE business_name = 'Seneca Creek State Park Pavilion';
UPDATE venues SET cost = 450 WHERE business_name = 'Lake Needwood Regional Park';

-- Update costs for Hospitality venues (venue_type_id = 9)
UPDATE venues SET cost = 4500 WHERE business_name = 'Marriott Baltimore Waterfront';
UPDATE venues SET cost = 5000 WHERE business_name = 'Hyatt Regency Baltimore';

-- Update costs for Farm venues (venue_type_id = 10)
UPDATE venues SET cost = 3500 WHERE business_name = 'Green Meadows Farm';
UPDATE venues SET cost = 3800 WHERE business_name = 'Rosewood Farms';

-- Update costs for Warehouse venues (venue_type_id = 11)
UPDATE venues SET cost = 2800 WHERE business_name = 'SkyLofts Gallery Studios';
UPDATE venues SET cost = 3200 WHERE business_name = 'Baltimore Industrial Loft';

-- Update costs for State Parks (venue_type_id = 12)
UPDATE venues SET cost = 600 WHERE business_name = 'Sandy Point State Park';
UPDATE venues SET cost = 550 WHERE business_name = 'Patapsco Valley State Park';
UPDATE venues SET cost = 650 WHERE business_name = 'Gunpowder Falls State Park';
UPDATE venues SET cost = 500 WHERE business_name = 'Elk Neck State Park';
UPDATE venues SET cost = 550 WHERE business_name = 'Rocks State Park';

-- Update costs for Sporting venues (venue_type_id = 13)
UPDATE venues SET cost = 15000 WHERE business_name = 'MT Bank Stadium';

-- Update costs for Business Location venues (venue_type_id = 2)
UPDATE venues SET cost = 8000 WHERE business_name = 'Baltimore Convention Center';
UPDATE venues SET cost = 3500 WHERE business_name = 'BWI Business District Center';