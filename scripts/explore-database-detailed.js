import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function querySQL(query) {
    try {
        const { data, error } = await supabase.rpc('execute_raw_sql', { query });
        if (error) {
            console.error(`Query error: ${error.message}`);
            return null;
        }
        return data;
    } catch (err) {
        console.error(`Execution error: ${err.message}`);
        return null;
    }
}

async function getTableStructure(tableName) {
    const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `;
    return await querySQL(query);
}

async function getTableForeignKeys(tableName) {
    const query = `
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = '${tableName}';
  `;
    return await querySQL(query);
}

async function getTableRowCount(tableName) {
    const query = `SELECT COUNT(*) as count FROM public."${tableName}";`;
    const result = await querySQL(query);
    if (result && result.length > 0) {
        return result[0].count || 0;
    }
    return 0;
}

async function getEnumTypes() {
    const query = `
    SELECT 
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `;
    return await querySQL(query);
}

async function getSampleData(tableName, limit = 5) {
    const query = `SELECT * FROM public."${tableName}" LIMIT ${limit};`;
    return await querySQL(query);
}

async function exploreTable(tableName) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Table: ${tableName}`);
    console.log('='.repeat(80));

    // Get structure
    const structure = await getTableStructure(tableName);
    if (structure && structure.length > 0) {
        console.log('\n📐 Structure:');
        structure.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`  • ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });
    }

    // Get foreign keys
    const fks = await getTableForeignKeys(tableName);
    if (fks && fks.length > 0) {
        console.log('\n🔗 Foreign Keys:');
        fks.forEach(fk => {
            console.log(`  • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
    }

    // Get row count
    const count = await getTableRowCount(tableName);
    console.log(`\n📊 Row Count: ${count}`);

    // Get sample data if exists
    if (count > 0) {
        const samples = await getSampleData(tableName, 2);
        if (samples && samples.length > 0) {
            console.log('\n📝 Sample Data (first 2 rows):');
            samples.forEach((row, idx) => {
                console.log(`  Row ${idx + 1}:`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
            });
        }
    }
}

async function main() {
    console.log('🔍 Detailed Database Exploration');
    console.log('='.repeat(80));

    // Key tables to explore
    const keyTables = [
        'events',
        'event_types',
        'event_themes',
        'tasks',
        'budget_items',
        'resources',
        'venues',
        'hospitality_profiles',
        'entertainments',
        'transportation_profiles',
        'suppliers',
        'teams',
        'user_roles',
        'notifications',
        'change_requests',
        'change_logs',
        'rsvp_submissions',
        'barcode_submissions',
        'registry_submissions',
        'reservation_submissions',
        'confirmation_submissions',
        'templates',
        'workflows',
        'resource_categories',
        'resource_status'
    ];

    // Explore each table
    for (const table of keyTables) {
        await exploreTable(table);
    }

    // Get enum types
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 Enum Types:');
    console.log('='.repeat(80));
    const enums = await getEnumTypes();
    if (enums && enums.length > 0) {
        const enumMap = {};
        enums.forEach(e => {
            if (!enumMap[e.enum_name]) enumMap[e.enum_name] = [];
            enumMap[e.enum_name].push(e.enum_value);
        });
        Object.keys(enumMap).forEach(enumName => {
            console.log(`\n  ${enumName}:`);
            enumMap[enumName].forEach(val => console.log(`    • ${val}`));
        });
    }

    // Check for existing user
    console.log(`\n${'='.repeat(80)}`);
    console.log('👤 Checking for User: af2766da-bc37-439c-a210-dd951e70f8b2');
    console.log('='.repeat(80));
    const userCheck = await querySQL(`
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE id = 'af2766da-bc37-439c-a210-dd951e70f8b2';
  `);
    if (userCheck && userCheck.length > 0) {
        console.log('✅ User found:', userCheck[0]);
    } else {
        console.log('❌ User not found in auth.users');
    }

    // Check existing events for this user
    const userEvents = await querySQL(`
    SELECT id, title, status, created_at 
    FROM public.events 
    WHERE user_id = 'af2766da-bc37-439c-a210-dd951e70f8b2'
    LIMIT 5;
  `);
    if (userEvents && userEvents.length > 0) {
        console.log(`\n📅 Existing Events (${userEvents.length}):`);
        userEvents.forEach(e => {
            console.log(`  • ${e.title} (${e.status}) - ${e.id}`);
        });
    } else {
        console.log('\n📅 No existing events for this user');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Detailed exploration complete!');
    console.log('='.repeat(80));
}

main().catch(console.error);

