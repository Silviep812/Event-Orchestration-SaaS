-- Add missing columns to entertainments table
ALTER TABLE entertainments 
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS description text;

-- Now populate with Maryland entertainment businesses (2 per type)

-- Musician (type_id: 1)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Maryland Music Studios', 'Michael Henderson', 'michael@marylandmusic.com', '410-555-0101', 'Baltimore', 'MD', '21201', 1, 850, 'Professional musicians for weddings, corporate events, and private parties'),
('Capital City Musicians', 'Sarah Martinez', 'sarah@capitalcitymusic.com', '301-555-0102', 'Rockville', 'MD', '20850', 1, 950, 'Versatile musicians specializing in classical, jazz, and contemporary music');

-- DJ Music (type_id: 2)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Premier DJ Services', 'Jason Thompson', 'jason@premierdjmd.com', '443-555-0201', 'Columbia', 'MD', '21044', 2, 675, 'Professional DJ services for all occasions with state-of-the-art equipment'),
('Elite Entertainment DJs', 'Marcus Johnson', 'marcus@elitedjmd.com', '240-555-0202', 'Gaithersburg', 'MD', '20877', 2, 725, 'Top-rated DJ entertainment with extensive music library and lighting');

-- Performer (type_id: 3)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Maryland Performance Arts', 'Emily Chen', 'emily@mdperformance.com', '410-555-0301', 'Annapolis', 'MD', '21401', 3, 1200, 'Professional performers including dancers, acrobats, and specialty acts'),
('Stage Stars Entertainment', 'David Wilson', 'david@stagestarsmd.com', '301-555-0302', 'Silver Spring', 'MD', '20901', 3, 1350, 'Award-winning performers for corporate and private events');

-- Standup Comic (type_id: 4)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Chesapeake Comedy', 'Robert Garcia', 'robert@chesapeakecomedy.com', '443-555-0401', 'Baltimore', 'MD', '21202', 4, 800, 'Professional standup comedians for corporate events and private parties'),
('Laugh Factory Maryland', 'Jennifer Davis', 'jennifer@laughfactorymd.com', '240-555-0402', 'Bethesda', 'MD', '20814', 4, 900, 'Clean comedy entertainment for all audiences and events');

-- Singer (type_id: 5)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Charm City Vocals', 'Amanda Rodriguez', 'amanda@charmcityvocals.com', '410-555-0501', 'Baltimore', 'MD', '21224', 5, 750, 'Professional vocalists specializing in jazz, pop, and R&B'),
('Maryland Solo Artists', 'Christopher Lee', 'chris@mdsoloartists.com', '301-555-0502', 'Frederick', 'MD', '21701', 5, 825, 'Talented solo singers for weddings, galas, and special events');

-- Stage Production (type_id: 6) - Already has "All Stage Sound", add one more
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Premier Stage Productions', 'Victoria Brown', 'victoria@premierstagemd.com', '443-555-0601', 'Columbia', 'MD', '21045', 6, 2500, 'Full-service stage production including sound, lighting, and technical support');

-- Update existing All Stage Sound with missing fields
UPDATE entertainments 
SET contact_name = 'Thomas Reynolds', 
    price = 2800, 
    description = 'Professional stage sound and production equipment for events of all sizes'
WHERE business_name = 'All Stage Sound';

-- Other (type_id: 7)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Unique Entertainment MD', 'Kevin Anderson', 'kevin@uniqueentmd.com', '410-555-0701', 'Towson', 'MD', '21204', 7, 1100, 'Specialty entertainment including magicians, mentalists, and unique acts'),
('Creative Events Entertainment', 'Lisa White', 'lisa@creativeeventsmd.com', '240-555-0702', 'Germantown', 'MD', '20874', 7, 1250, 'Innovative entertainment options for memorable events');

-- Musical Group (type_id: 8)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Maryland Ensembles', 'Thomas Miller', 'thomas@mdensembles.com', '301-555-0801', 'Rockville', 'MD', '20852', 8, 1400, 'Professional musical ensembles from duos to quartets'),
('Bay Area Musicians', 'Patricia Taylor', 'patricia@bayareamusicians.com', '410-555-0802', 'Annapolis', 'MD', '21403', 8, 1550, 'Versatile musical groups for all types of events');

-- Choir (type_id: 9)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Chesapeake Choral Society', 'Margaret Wilson', 'margaret@chesapeakechoral.com', '443-555-0901', 'Baltimore', 'MD', '21218', 9, 1800, 'Professional choir for weddings, ceremonies, and special events'),
('Maryland Vocal Ensemble', 'Richard Moore', 'richard@mdvocalensemble.com', '301-555-0902', 'College Park', 'MD', '20740', 9, 1900, 'Award-winning choir specializing in classical and contemporary music');

-- Band (type_id: 10)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Capital City Band', 'Daniel Jackson', 'daniel@capitalcityband.com', '240-555-1001', 'Gaithersburg', 'MD', '20878', 10, 2200, 'Full band entertainment for weddings, corporate events, and festivals'),
('Maryland Live Music', 'Susan Martinez', 'susan@mdlivemusic.com', '410-555-1002', 'Baltimore', 'MD', '21231', 10, 2400, 'Professional bands covering all genres and decades');

-- Concert (type_id: 11)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Concert Productions MD', 'James Thompson', 'james@concertpromd.com', '301-555-1101', 'Silver Spring', 'MD', '20902', 11, 3500, 'Full concert production services for large-scale events'),
('Premier Concert Services', 'Michelle Garcia', 'michelle@premierconcertmd.com', '443-555-1102', 'Columbia', 'MD', '21046', 11, 3800, 'Professional concert coordination and entertainment booking');

-- Production (type_id: 12)
INSERT INTO entertainments (business_name, contact_name, email, phone_number, city, state, zip, ent_type_id, price, description) VALUES
('Complete Productions MD', 'Andrew Davis', 'andrew@completepromd.com', '410-555-1201', 'Annapolis', 'MD', '21404', 12, 3200, 'Full-service event production including entertainment coordination'),
('Elite Production Services', 'Katherine Brown', 'katherine@eliteproductionmd.com', '240-555-1202', 'Bethesda', 'MD', '20815', 12, 3400, 'Comprehensive production services for corporate and private events');