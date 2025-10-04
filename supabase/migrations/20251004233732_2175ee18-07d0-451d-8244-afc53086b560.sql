-- Delete any motel profiles first
DELETE FROM hospitality_profiles
WHERE hospitality_type = 2;

-- Delete the motel hospitality type
DELETE FROM hospitality_types
WHERE id = 2;