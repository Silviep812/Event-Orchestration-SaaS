
-- Update category names to match RESOURCE_CATEGORIES exactly
UPDATE checklist_templates SET category_name = 'Bookings' WHERE category_name = 'Booking';
UPDATE checklist_templates SET category_name = 'Venues' WHERE category_name = 'Venue';
UPDATE checklist_templates SET category_name = 'Suppliers' WHERE category_name = 'Supplier';
UPDATE checklist_templates SET category_name = 'Service Vendor' WHERE category_name = 'Service';
UPDATE checklist_templates SET category_name = 'Vendor Service Rental/Buy' WHERE category_name = 'Rentals';

-- Add Marketing category templates
INSERT INTO checklist_templates (category_name, sort_order, label) VALUES
('Marketing', 1, 'Define target audience and messaging'),
('Marketing', 2, 'Create promotional materials (flyers, banners, etc.)'),
('Marketing', 3, 'Set up social media campaign'),
('Marketing', 4, 'Send email invitations/newsletters'),
('Marketing', 5, 'Coordinate with media/press contacts'),
('Marketing', 6, 'Track RSVPs and engagement metrics'),
('Marketing', 7, 'Prepare day-of signage and branding'),
('Marketing', 8, 'Post-event follow-up communications');

-- Rename Staff to match if there's a Staff category (keep as-is since it's not in RESOURCE_CATEGORIES)
-- Staff doesn't have a matching resource category, so we'll leave it for now
