-- Add Mixologist to vendor_supplier_types table
INSERT INTO vendor_supplier_types (name)
VALUES ('Mixologist')
ON CONFLICT DO NOTHING;