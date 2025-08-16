-- Populate the Supplier Directory with comprehensive supplier types
INSERT INTO "Supplier Directory" (
  "Distributor", 
  "Wholesaler", 
  "Online_Market", 
  "Merchandizer", 
  "Other"
) VALUES (
  'Food & Beverage Distributor',
  'Event Supply Wholesaler', 
  'Amazon Business',
  'Event Merchandiser',
  'Local Specialty Supplier'
)
ON CONFLICT DO NOTHING;

-- Add more comprehensive entries
INSERT INTO "Supplier Directory" (
  "Distributor", 
  "Wholesaler", 
  "Online_Market", 
  "Merchandizer", 
  "Other"
) VALUES 
(
  'Party Supply Distributor',
  'Bulk Equipment Wholesaler',
  'Alibaba',
  'Promotional Merchandiser', 
  'Custom Print Shop'
),
(
  'Catering Supply Distributor',
  'Restaurant Supply Wholesaler',
  'eBay Business',
  'Gift Merchandiser',
  'Artisan Craft Supplier'
),
(
  'Floral Distributor',
  'Decoration Wholesaler', 
  'Etsy Business',
  'Corporate Merchandiser',
  'Specialty Import Supplier'
)
ON CONFLICT DO NOTHING;