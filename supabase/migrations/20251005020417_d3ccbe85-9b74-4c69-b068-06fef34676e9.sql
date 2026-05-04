-- Add price column to suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS price numeric;

-- Add food_wholesaler category
INSERT INTO supplier_categories (id, name) 
VALUES (6, 'food_wholesaler')
ON CONFLICT (id) DO NOTHING;

-- Insert Maryland-based suppliers for all categories
INSERT INTO suppliers (business_name, contact_name, email, phone_number, city, state, zip, category_id, type_id, price) VALUES
-- Distributors
('Maryland Food Distributors', 'John Smith', 'contact@mdfooddist.com', '410-555-0101', 'Baltimore', 'MD', '21201', 3, 5, 2500.00),
('Capital Event Supplies', 'Sarah Johnson', 'info@capitalevent.com', '301-555-0102', 'Rockville', 'MD', '20850', 3, 1, 1800.00),

-- Wholesalers
('Chesapeake Party Wholesale', 'Mike Davis', 'sales@chesapeakewholesale.com', '410-555-0103', 'Annapolis', 'MD', '21401', 2, 1, 1500.00),
('Maryland Decor Wholesale', 'Lisa Brown', 'orders@mddecor.com', '240-555-0104', 'Frederick', 'MD', '21701', 2, 2, 1200.00),

-- Food Wholesalers
('Bay State Food Wholesalers', 'Robert Wilson', 'contact@baystatefood.com', '443-555-0105', 'Columbia', 'MD', '21044', 6, 5, 3000.00),
('Eastern Shore Food Supply', 'Jennifer Lee', 'info@eshorefood.com', '410-555-0106', 'Easton', 'MD', '21601', 6, 5, 2800.00),

-- Online Markets
('MD Event Market Online', 'David Martinez', 'support@mdeventmarket.com', '301-555-0107', 'Bethesda', 'MD', '20814', 1, 1, 800.00),
('Digital Party Supplies MD', 'Amanda White', 'hello@digitalpartymd.com', '443-555-0108', 'Silver Spring', 'MD', '20901', 1, 2, 600.00),

-- Merchandizers
('Maryland Event Merchandising', 'Chris Taylor', 'sales@mdeventmerch.com', '410-555-0109', 'Towson', 'MD', '21204', 4, 6, 2200.00),
('Charm City Merchandisers', 'Patricia Anderson', 'info@charmcitymerch.com', '443-555-0110', 'Baltimore', 'MD', '21224', 4, 4, 1900.00),

-- Other
('Maryland Event Specialists', 'Kevin Thomas', 'contact@mdeventspec.com', '301-555-0111', 'Gaithersburg', 'MD', '20877', 5, 1, 1600.00),
('Potomac Party Solutions', 'Maria Garcia', 'info@potomacparty.com', '240-555-0112', 'Potomac', 'MD', '20854', 5, 3, 1400.00)
ON CONFLICT (business_name, email) DO NOTHING;
