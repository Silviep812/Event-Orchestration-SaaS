-- Update the themes directory to include Parties and Market Place entries
UPDATE "Themes Directory" 
SET 
  parties = ARRAY['Birthday Party', 'Anniversary Party', 'Graduation Party', 'Holiday Party', 'House Party', 'Garden Party'],
  market_place = ARRAY['Farmers Market', 'Craft Market', 'Food Market', 'Vintage Market', 'Holiday Market', 'Pop-up Market']
WHERE baby_shower = 'Baby Shower Theme';

-- Also add other missing array entries for completeness
UPDATE "Themes Directory"
SET 
  sporting = ARRAY['Golf Tournament', 'Tennis Event', 'Basketball Game', 'Football Event', 'Marathon', 'Cycling Event'],
  special_event = ARRAY['Awards Ceremony', 'Product Launch', 'Charity Gala', 'Fundraiser', 'Conference', 'Seminar'],
  meet_up = ARRAY['Business Networking', 'Social Meetup', 'Professional Groups', 'Hobby Groups', 'Community Groups', 'Support Groups']
WHERE baby_shower = 'Baby Shower Theme';