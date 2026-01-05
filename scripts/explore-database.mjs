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
    // Try using execute_raw_sql RPC function if it exists
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

async function checkFunctions() {
  console.log('\n📋 Checking Functions...\n');
  
  const queries = [
    {
      name: 'All Functions',
      query: `
        SELECT 
          p.proname AS function_name,
          pg_get_function_arguments(p.oid) AS arguments,
          pg_get_function_result(p.oid) AS return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY p.proname;
      `
    },
    {
      name: 'Downstream/Timeline Functions',
      query: `
        SELECT 
          p.proname AS function_name,
          pg_get_function_arguments(p.oid) AS arguments,
          pg_get_function_result(p.oid) AS return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (
            p.proname LIKE '%recalculate%' OR
            p.proname LIKE '%downstream%' OR
            p.proname LIKE '%timeline%' OR
            p.proname LIKE '%resource%utilization%' OR
            p.proname LIKE '%update_resource%'
          )
        ORDER BY p.proname;
      `
    },
    {
      name: 'Change Request Functions',
      query: `
        SELECT 
          p.proname AS function_name,
          pg_get_function_arguments(p.oid) AS arguments,
          pg_get_function_result(p.oid) AS return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (
            p.proname LIKE '%change_request%' OR
            p.proname LIKE '%notify%email%'
          )
        ORDER BY p.proname;
      `
    }
  ];

  for (const { name, query } of queries) {
    console.log(`${name}:`);
    console.log('─'.repeat(60));
    
    const data = await querySQL(query);
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        console.log(`  ✓ ${row.function_name}`);
        console.log(`    Args: ${row.arguments || 'none'}`);
        console.log(`    Returns: ${row.return_type || 'void'}`);
      });
    } else {
      console.log('  (no results or query failed)');
    }
    console.log('');
  }
}

async function checkViews() {
  console.log('\n📊 Checking Views...\n');
  
  const queries = [
    {
      name: 'All Views',
      query: `
        SELECT 
          table_name AS view_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    },
    {
      name: 'Timeline/Analytics Views',
      query: `
        SELECT 
          table_name AS view_name,
          LEFT(view_definition, 100) AS view_definition_preview
        FROM information_schema.views
        WHERE table_schema = 'public'
          AND (
            table_name LIKE '%timeline%' OR
            table_name LIKE '%kpi%' OR
            table_name LIKE '%analytics%' OR
            table_name LIKE '%event_task%'
          )
        ORDER BY table_name;
      `
    }
  ];

  for (const { name, query } of queries) {
    console.log(`${name}:`);
    console.log('─'.repeat(60));
    
    const data = await querySQL(query);
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        console.log(`  ✓ ${row.view_name}`);
        if (row.view_definition_preview) {
          console.log(`    Preview: ${row.view_definition_preview}...`);
        }
      });
    } else {
      console.log('  (no results or query failed)');
    }
    console.log('');
  }
}

async function checkTables() {
  console.log('\n🗄️  Checking Tables...\n');
  
  const query = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  console.log('Key Tables:');
  console.log('─'.repeat(60));
  
  const data = await querySQL(query);
  if (data && Array.isArray(data) && data.length > 0) {
    const keyTables = ['change_requests', 'change_logs', 'tasks', 'resources', 'events'];
    data.forEach((row) => {
      const isKey = keyTables.includes(row.table_name);
      console.log(`  ${isKey ? '✓' : ' '} ${row.table_name}`);
    });
  } else {
    console.log('  (no results or query failed)');
  }
  console.log('');
}

async function checkRPCFunctions() {
  console.log('\n🔧 Checking RPC-Callable Functions...\n');
  
  const query = `
    SELECT 
      p.proname AS function_name,
      pg_get_function_arguments(p.oid) AS arguments,
      pg_get_function_result(p.oid) AS return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        pg_get_function_result(p.oid) ILIKE '%json%' OR
        pg_get_function_result(p.oid) ILIKE '%table%' OR
        pg_get_function_result(p.oid) ILIKE '%record%'
      )
    ORDER BY p.proname;
  `;
  
  const data = await querySQL(query);
  if (data && Array.isArray(data) && data.length > 0) {
    data.forEach((row) => {
      console.log(`  ✓ ${row.function_name}(${row.arguments || ''})`);
      console.log(`    → ${row.return_type}`);
    });
  } else {
    console.log('  (no RPC functions found or query failed)');
  }
  console.log('');
}

async function checkPDFRequirements() {
  console.log('\n📄 PDF Requirements Check...\n');
  console.log('─'.repeat(60));
  
  const requirements = [
    { name: 'recalculate_downstream_tasks', type: 'function' },
    { name: 'event_task_timeline_view', type: 'view' },
    { name: 'update_resource_utilization', type: 'function' },
    { name: 'event_kpi_view', type: 'view' },
    { name: 'notify_change_request_email', type: 'function' },
    { name: 'apply_change_request', type: 'function' },
    { name: 'approve_change_request', type: 'function' },
  ];
  
  for (const req of requirements) {
    let found = false;
    
    if (req.type === 'function') {
      const query = `
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = '${req.name}';
      `;
      const data = await querySQL(query);
      found = data && Array.isArray(data) && data.length > 0;
    } else if (req.type === 'view') {
      const query = `
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
          AND table_name = '${req.name}';
      `;
      const data = await querySQL(query);
      found = data && Array.isArray(data) && data.length > 0;
    }
    
    console.log(`  ${found ? '✅' : '❌'} ${req.name} (${req.type})`);
  }
  console.log('');
}

async function main() {
  console.log('🔍 Exploring Supabase Database...');
  console.log('='.repeat(60));
  
  try {
    await checkTables();
    await checkFunctions();
    await checkViews();
    await checkRPCFunctions();
    await checkPDFRequirements();
    
    console.log('\n✅ Database exploration complete!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error exploring database:', error.message);
    process.exit(1);
  }
}

main();

