-- Update resort entries to use correct hospitality_type ID
UPDATE hospitality_profiles
SET hospitality_type = 4
WHERE hospitality_type = 2;