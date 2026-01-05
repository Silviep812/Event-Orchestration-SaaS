import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function querySQL(query) {
  try {
    // Use -c with proper escaping - write query to temp file to avoid shell escaping issues
    const fs = await import('fs/promises');
    const tmpFile = `./.tmp_query_${Date.now()}.sql`;
    
    // Write query to temp file
    await fs.writeFile(tmpFile, query);
    
    // Use JSON output format for easier parsing
    const command = `psql "${DB_URL}" -t -A -f "${tmpFile}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Clean up temp file
    try {
      await fs.unlink(tmpFile);
    } catch {}
    
    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('psql:')) {
      // Don't log error, just return null
      return null;
    }
    
    // Parse tab-separated output (psql -t -A uses tabs)
    const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.startsWith('psql:'));
    if (lines.length === 0) return [];
    
    // For queries that return multiple columns, we need to know the column count
    // Try to detect by splitting first line
    const firstLine = lines[0];
    const parts = firstLine.split('\t');
    
    // If we have column names in query, try to extract them
    // For now, return raw data and let caller handle it
    return lines.map(line => {
      const values = line.split('\t');
      return { raw: line, values };
    });
  } catch (err) {
    // Silently fail - query might not be supported
    return null;
  }
}

async function checkFunctions() {
  console.log('\n📋 Checking Functions...\n');
  
  const queries = [
    {
      name: 'All Functions',
      query: `SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS return_type FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' ORDER BY p.proname;`
    },
    {
      name: 'Downstream/Timeline Functions',
      query: `SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS return_type FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND (p.proname LIKE '%recalculate%' OR p.proname LIKE '%downstream%' OR p.proname LIKE '%timeline%' OR p.proname LIKE '%resource%utilization%' OR p.proname LIKE '%update_resource%') ORDER BY p.proname;`
    },
    {
      name: 'Change Request Functions',
      query: `SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS return_type FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND (p.proname LIKE '%change_request%' OR p.proname LIKE '%notify%email%') ORDER BY p.proname;`
    }
  ];

  for (const { name, query } of queries) {
    console.log(`${name}:`);
    console.log('─'.repeat(60));
    
    const data = await querySQL(query);
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        const parts = row.values || row.raw?.split('\t') || [];
        const funcName = parts[0]?.trim();
        const args = parts[1]?.trim();
        const returnType = parts[2]?.trim();
        if (funcName && funcName !== 'undefined' && funcName) {
          console.log(`  ✓ ${funcName}`);
          if (args && args !== 'undefined') console.log(`    Args: ${args}`);
          if (returnType && returnType !== 'undefined') console.log(`    Returns: ${returnType}`);
        }
      });
    } else {
      console.log('  (no results)');
    }
    console.log('');
  }
}

async function checkViews() {
  console.log('\n📊 Checking Views...\n');
  
  const queries = [
    {
      name: 'All Views',
      query: `SELECT table_name AS view_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;`
    },
    {
      name: 'Timeline/Analytics Views',
      query: `SELECT table_name AS view_name, LEFT(view_definition, 100) AS view_definition_preview FROM information_schema.views WHERE table_schema = 'public' AND (table_name LIKE '%timeline%' OR table_name LIKE '%kpi%' OR table_name LIKE '%analytics%' OR table_name LIKE '%event_task%') ORDER BY table_name;`
    }
  ];

  for (const { name, query } of queries) {
    console.log(`${name}:`);
    console.log('─'.repeat(60));
    
    const data = await querySQL(query);
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        const parts = row.values || row.raw?.split('\t') || [];
        const viewName = parts[0]?.trim();
        const preview = parts[1]?.trim();
        if (viewName && viewName !== 'undefined') {
          console.log(`  ✓ ${viewName}`);
          if (preview && preview !== 'undefined') {
            console.log(`    Preview: ${preview.substring(0, 80)}...`);
          }
        }
      });
    } else {
      console.log('  (no results)');
    }
    console.log('');
  }
}

async function checkTables() {
  console.log('\n🗄️  Checking Tables...\n');
  
  const query = `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`;
  
  console.log('Key Tables:');
  console.log('─'.repeat(60));
  
  const data = await querySQL(query);
  if (data && Array.isArray(data) && data.length > 0) {
    const keyTables = ['change_requests', 'change_logs', 'tasks', 'resources', 'events'];
    data.forEach((row) => {
      const parts = row.values || row.raw?.split('|') || row.raw?.split('\t') || [];
      const tableName = parts[0]?.trim();
      if (tableName) {
        const isKey = keyTables.includes(tableName);
        console.log(`  ${isKey ? '✓' : ' '} ${tableName}`);
      }
    });
  } else {
    console.log('  (no results)');
  }
  console.log('');
}

async function checkRPCFunctions() {
  console.log('\n🔧 Checking RPC-Callable Functions...\n');
  
  const query = `SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS return_type FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND (pg_get_function_result(p.oid) ILIKE '%json%' OR pg_get_function_result(p.oid) ILIKE '%table%' OR pg_get_function_result(p.oid) ILIKE '%record%') ORDER BY p.proname;`;
  
    const data = await querySQL(query);
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        const parts = row.values || row.raw?.split('\t') || [];
        const funcName = parts[0]?.trim();
        const args = parts[1]?.trim();
        const returnType = parts[2]?.trim();
        if (funcName && funcName !== 'undefined') {
          console.log(`  ✓ ${funcName}(${args || ''})`);
          console.log(`    → ${returnType || 'unknown'}`);
        }
      });
    } else {
      console.log('  (no RPC functions found)');
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
      const query = `SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = '${req.name}';`;
      const data = await querySQL(query);
      if (data && Array.isArray(data) && data.length > 0) {
        const firstRow = data[0];
        const parts = firstRow.values || firstRow.raw?.split('\t') || [];
        const funcName = parts[0]?.trim();
        found = funcName === req.name;
      }
    } else if (req.type === 'view') {
      const query = `SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name = '${req.name}';`;
      const data = await querySQL(query);
      if (data && Array.isArray(data) && data.length > 0) {
        const firstRow = data[0];
        const parts = firstRow.values || firstRow.raw?.split('\t') || [];
        const viewName = parts[0]?.trim();
        found = viewName === req.name;
      }
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

