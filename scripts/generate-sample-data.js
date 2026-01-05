import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_ID = 'af2766da-bc37-439c-a210-dd951e70f8b2';

async function checkExistingData() {
  console.log('🔍 Checking existing data...\n');
  
  // Check user
  const { data: userData } = await supabase.auth.admin.getUserById(USER_ID);
  if (userData?.user) {
    console.log(`✅ User found: ${userData.user.email || USER_ID}\n`);
  } else {
    console.log(`⚠️  User ${USER_ID} not found in auth.users\n`);
  }
  
  // Check existing data counts
  const tables = [
    'event_types', 'event_themes', 'venue_types', 'hospitality_types',
    'entertainment_types', 'transportation_types', 'supplier_types',
    'venues', 'hospitality_profiles', 'entertainments', 
    'transportation_profiles', 'suppliers', 'events', 'tasks',
    'budget_items', 'resources', 'teams', 'notifications'
  ];
  
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${count || 0} rows`);
  }
  
  console.log('\n');
}

async function insertEventTypes() {
  console.log('📝 Inserting event types...');
  // Note: event_types table doesn't have description column based on schema
  // Check if types exist first, then insert only new ones
  const existingTypes = await supabase.from('event_types').select('name');
  const existingNames = (existingTypes.data || []).map(t => t.name);
  const newTypes = ['Wedding', 'Corporate Event', 'Birthday Party', 'Conference', 'Concert', 'Festival', 'Anniversary', 'Graduation']
    .filter(name => !existingNames.includes(name))
    .map(name => ({ name }));
  
  if (newTypes.length > 0) {
    const { error } = await supabase.from('event_types').insert(newTypes);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`✅ Inserted ${newTypes.length} new event types\n`);
    }
  } else {
    console.log('✅ Event types already exist\n');
  }
}

async function insertEventThemes() {
  console.log('📝 Inserting event themes...');
  const existingThemes = await supabase.from('event_themes').select('name');
  const existingNames = (existingThemes.data || []).map(t => t.name);
  const newThemes = [
    { name: 'Elegant Classic', description: 'Timeless elegance with traditional elements', premium: false, tags: ['elegant', 'classic', 'traditional'] },
    { name: 'Modern Minimalist', description: 'Clean lines and contemporary design', premium: false, tags: ['modern', 'minimalist', 'contemporary'] },
    { name: 'Rustic Charm', description: 'Countryside aesthetic with natural elements', premium: false, tags: ['rustic', 'countryside', 'natural'] },
    { name: 'Tropical Paradise', description: 'Beach and island-inspired themes', premium: true, tags: ['tropical', 'beach', 'island'] },
    { name: 'Vintage Glamour', description: 'Old Hollywood style with vintage touches', premium: true, tags: ['vintage', 'glamour', 'hollywood'] },
    { name: 'Garden Party', description: 'Outdoor garden celebration theme', premium: false, tags: ['garden', 'outdoor', 'celebration'] }
  ].filter(t => !existingNames.includes(t.name));
  
  if (newThemes.length > 0) {
    const { error } = await supabase.from('event_themes').insert(newThemes);
    if (error) console.error('Error:', error);
    else console.log(`✅ Inserted ${newThemes.length} new event themes\n`);
  } else {
    console.log('✅ Event themes already exist\n');
  }
}

async function insertLookupTypes() {
  console.log('📝 Inserting lookup types...');
  
  // Venue types
  const venueTypes = ['Ballroom', 'Outdoor Garden', 'Beachfront', 'Historic Mansion', 'Conference Center', 'Rooftop', 'Warehouse', 'Hotel'];
  for (const name of venueTypes) {
    await supabase.from('venue_types').upsert({ name, description: `${name} venue type` }, { onConflict: 'name' });
  }
  
  // Hospitality types
  const hospTypes = ['Full Service Catering', 'Buffet Service', 'Plated Service', 'Cocktail Reception', 'Bar Service', 'Coffee Service'];
  for (const name of hospTypes) {
    await supabase.from('hospitality_types').upsert({ name, description: `${name} service` }, { onConflict: 'name' });
  }
  
  // Entertainment types
  const entTypes = ['Live Band', 'DJ Services', 'Photographer', 'Videographer', 'Magician', 'Comedian', 'Dance Performance', 'Lighting & Sound'];
  for (const name of entTypes) {
    await supabase.from('entertainment_types').upsert({ name, description: `${name} entertainment` }, { onConflict: 'name' });
  }
  
  // Transportation types
  const transTypes = ['Luxury Sedan', 'Limousine', 'Party Bus', 'Shuttle Service', 'Vintage Car', 'Helicopter'];
  for (const name of transTypes) {
    await supabase.from('transportation_types').upsert({ name, description: `${name} transportation` }, { onConflict: 'name' });
  }
  
  // Supplier types
  const suppTypes = ['Floral Supplier', 'Tableware Rental', 'Furniture Rental', 'Linen Supplier', 'Lighting Supplier', 'Audio Equipment', 'Tent Rental', 'Stage Equipment'];
  for (const name of suppTypes) {
    await supabase.from('supplier_types').upsert({ name, description: `${name} supplier` }, { onConflict: 'name' });
  }
  
  console.log('✅ Lookup types inserted\n');
}

async function getTypeId(table, name) {
  const { data } = await supabase.from(table).select('id').eq('name', name).single();
  return data?.id;
}

async function insertSampleData() {
  console.log('📝 Inserting sample data...\n');
  
  // Get type IDs
  const weddingTypeId = await getTypeId('event_types', 'Wedding');
  const corporateTypeId = await getTypeId('event_types', 'Corporate Event');
  const birthdayTypeId = await getTypeId('event_types', 'Birthday Party');
  const conferenceTypeId = await getTypeId('event_types', 'Conference');
  
  const rusticThemeId = await getTypeId('event_themes', 'Rustic Charm');
  const elegantThemeId = await getTypeId('event_themes', 'Elegant Classic');
  const tropicalThemeId = await getTypeId('event_themes', 'Tropical Paradise');
  const modernThemeId = await getTypeId('event_themes', 'Modern Minimalist');
  
  // Insert events
  console.log('  Inserting events...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .insert([
      {
        user_id: USER_ID,
        title: 'Summer Wedding Celebration',
        description: 'Beautiful outdoor wedding with garden reception',
        venue: 'Sunset Garden Estate',
        start_date: '2025-07-15',
        end_date: '2025-07-15',
        start_time: '14:00:00',
        end_time: '22:00:00',
        budget: 50000.00,
        expected_attendees: 200,
        status: 'pending',
        type_id: weddingTypeId,
        theme_id: rusticThemeId
      },
      {
        user_id: USER_ID,
        title: 'Corporate Annual Gala',
        description: 'Annual company celebration and awards ceremony',
        venue: 'Grand Ballroom Downtown',
        start_date: '2025-08-20',
        end_date: '2025-08-20',
        start_time: '18:00:00',
        end_time: '23:00:00',
        budget: 75000.00,
        expected_attendees: 400,
        status: 'pending',
        type_id: corporateTypeId,
        theme_id: elegantThemeId
      },
      {
        user_id: USER_ID,
        title: '30th Birthday Bash',
        description: 'Milestone birthday celebration',
        venue: 'Oceanview Beach Club',
        start_date: '2025-06-10',
        end_date: '2025-06-10',
        start_time: '19:00:00',
        end_time: '01:00:00',
        budget: 15000.00,
        expected_attendees: 100,
        status: 'in_progress',
        type_id: birthdayTypeId,
        theme_id: tropicalThemeId
      },
      {
        user_id: USER_ID,
        title: 'Tech Conference 2025',
        description: 'Annual technology conference and networking event',
        venue: 'Metro Conference Center',
        start_date: '2025-09-05',
        end_date: '2025-09-07',
        start_time: '09:00:00',
        end_time: '17:00:00',
        budget: 100000.00,
        expected_attendees: 800,
        status: 'pending',
        type_id: conferenceTypeId,
        theme_id: modernThemeId
      }
    ])
    .select();
  
  if (eventsError) {
    console.error('  ❌ Error inserting events:', eventsError);
  } else {
    console.log(`  ✅ Inserted ${events?.length || 0} events`);
    
    // Insert tasks for first event
    if (events && events.length > 0) {
      const firstEvent = events[0];
      console.log('  Inserting tasks...');
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert([
          {
            event_id: firstEvent.id,
            title: 'Book Venue',
            description: 'Finalize venue contract and payment',
            status: 'in_progress',
            priority: 'high',
            due_date: '2025-05-01T12:00:00Z',
            created_by: USER_ID
          },
          {
            event_id: firstEvent.id,
            title: 'Hire Caterer',
            description: 'Select and book catering service',
            status: 'not_started',
            priority: 'high',
            due_date: '2025-05-15T12:00:00Z',
            created_by: USER_ID
          },
          {
            event_id: firstEvent.id,
            title: 'Send Invitations',
            description: 'Design and send wedding invitations',
            status: 'not_started',
            priority: 'medium',
            due_date: '2025-06-01T12:00:00Z',
            created_by: USER_ID
          }
        ]);
      
      if (tasksError) console.error('  ❌ Error inserting tasks:', tasksError);
      else console.log('  ✅ Tasks inserted');
      
      // Insert budget items
      console.log('  Inserting budget items...');
      const { error: budgetError } = await supabase
        .from('budget_items')
        .insert([
          {
            event_id: firstEvent.id,
            item_name: 'Venue Rental',
            category: 'venue',
            estimated_cost: 15000.00,
            vendor_name: 'Sunset Garden Estate',
            created_by: USER_ID
          },
          {
            event_id: firstEvent.id,
            item_name: 'Catering Service',
            category: 'catering',
            estimated_cost: 20000.00,
            vendor_name: 'Elite Catering Co.',
            created_by: USER_ID
          },
          {
            event_id: firstEvent.id,
            item_name: 'Floral Decorations',
            category: 'decorations',
            estimated_cost: 5000.00,
            vendor_name: 'Blooms & Bouquets',
            created_by: USER_ID
          }
        ]);
      
      if (budgetError) console.error('  ❌ Error inserting budget items:', budgetError);
      else console.log('  ✅ Budget items inserted');
    }
  }
  
  console.log('\n');
}

async function insertResourceData() {
  console.log('📝 Inserting resource categories and status...');
  
  const categories = ['Audio/Visual Equipment', 'Furniture', 'Decorations', 'Transportation', 'Staff', 'Food & Beverage', 'Security', 'Medical/First Aid'];
  for (const name of categories) {
    await supabase.from('resource_categories').upsert({ name }, { onConflict: 'name' });
  }
  
  const statuses = ['Available', 'Allocated', 'In Use', 'Maintenance', 'Reserved'];
  for (const name of statuses) {
    await supabase.from('resource_status').upsert({ name }, { onConflict: 'name' });
  }
  
  console.log('✅ Resource data inserted\n');
}

async function insertNotifications() {
  console.log('📝 Inserting notifications...');
  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        recipient_id: USER_ID,
        title: 'Task Assigned',
        message: 'You have been assigned to "Book Venue" task',
        type: 'task_update',
        is_read: false,
        entity_type: 'task'
      },
      {
        recipient_id: USER_ID,
        title: 'Event Updated',
        message: 'Summer Wedding Celebration has been updated',
        type: 'event_update',
        is_read: false,
        entity_type: 'event'
      },
      {
        recipient_id: USER_ID,
        title: 'Budget Alert',
        message: 'Budget item "Catering Service" exceeds estimated cost',
        type: 'budget_update',
        is_read: false,
        entity_type: 'budget_item'
      }
    ]);
  
  if (error) console.error('Error:', error);
  else console.log('✅ Notifications inserted\n');
}

async function main() {
  console.log('🚀 Generating Sample Data for Event Orchestration SaaS');
  console.log('='.repeat(80));
  console.log(`User ID: ${USER_ID}\n`);
  
  try {
    await checkExistingData();
    await insertEventTypes();
    await insertEventThemes();
    await insertLookupTypes();
    await insertResourceData();
    await insertSampleData();
    await insertNotifications();
    
    console.log('='.repeat(80));
    console.log('✅ Sample data generation complete!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

