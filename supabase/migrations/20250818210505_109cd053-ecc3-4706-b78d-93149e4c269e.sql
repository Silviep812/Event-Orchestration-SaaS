-- Insert profile for existing user with correct username
INSERT INTO public.profiles (user_id, username, display_name, bio) 
VALUES ('8ca9f4e0-8dc0-42b3-85ba-ee879ad1ed4f', 'idaeventpartners.com', 'IDA Event Partners', 'Professional event planning services')
ON CONFLICT (user_id) DO UPDATE SET 
  username = 'idaeventpartners.com',
  display_name = 'IDA Event Partners',
  bio = 'Professional event planning services';