import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function exploreTaskTable() {
    console.log('🔍 Exploring Task Table Structure');
    console.log('='.repeat(80));

    // Get table structure
    console.log('\n📐 Task Table Structure:');
    console.log('-'.repeat(80));

    const { data: columns, error: colsError } = await supabase.rpc('execute_raw_sql', {
        query: `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      ORDER BY ordinal_position;
    `
    });

    if (colsError) {
        console.error('Error fetching columns:', colsError);
    } else if (columns) {
        console.table(columns);
    }

    // Get sample tasks
    console.log('\n📝 Sample Tasks (first 5):');
    console.log('-'.repeat(80));

    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(5);

    if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
    } else if (tasks && tasks.length > 0) {
        tasks.forEach((task, idx) => {
            console.log(`\nTask ${idx + 1}:`);
            console.log('  ID:', task.id);
            console.log('  Title:', task.title);
            console.log('  Event ID:', task.event_id);
            console.log('  Status:', task.status);
            console.log('  Priority:', task.priority);
            console.log('  Due Date:', task.due_date);
            console.log('  Start Date:', task.start_date);
            console.log('  End Date:', task.end_date);
            console.log('  Start Time:', task.start_time);
            console.log('  End Time:', task.end_time);
            console.log('  Assigned To:', task.assigned_to);
            console.log('  Created By:', task.created_by);
            console.log('  Created At:', task.created_at);
        });
    } else {
        console.log('No tasks found in database');
    }

    // Check for date inconsistencies
    console.log('\n🔍 Date Field Analysis:');
    console.log('-'.repeat(80));

    const { data: dateAnalysis, error: dateError } = await supabase.rpc('execute_raw_sql', {
        query: `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(due_date) as has_due_date,
        COUNT(start_date) as has_start_date,
        COUNT(end_date) as has_end_date,
        COUNT(CASE WHEN due_date IS NOT NULL AND start_date IS NOT NULL THEN 1 END) as has_both_due_and_start,
        COUNT(CASE WHEN start_date IS NOT NULL AND end_date IS NOT NULL THEN 1 END) as has_start_and_end
      FROM tasks;
    `
    });

    if (dateError) {
        console.error('Error analyzing dates:', dateError);
    } else if (dateAnalysis) {
        console.table(dateAnalysis);
    }

    // Check task_assignments table
    console.log('\n👥 Task Assignments:');
    console.log('-'.repeat(80));

    const { data: assignments, error: assignError } = await supabase
        .from('task_assignments')
        .select('*')
        .limit(5);

    if (assignError) {
        console.error('Error fetching assignments:', assignError);
    } else if (assignments && assignments.length > 0) {
        console.table(assignments);
    } else {
        console.log('No task assignments found');
    }

    // Check task dependencies
    console.log('\n🔗 Task Dependencies:');
    console.log('-'.repeat(80));

    const { data: dependencies, error: depsError } = await supabase
        .from('tasks_dependencies')
        .select('*')
        .limit(5);

    if (depsError) {
        console.error('Error fetching dependencies:', depsError);
    } else if (dependencies && dependencies.length > 0) {
        console.table(dependencies);
    } else {
        console.log('No task dependencies found');
    }

    // Check foreign key relationships
    console.log('\n🔗 Foreign Key Relationships:');
    console.log('-'.repeat(80));

    const { data: fks, error: fkError } = await supabase.rpc('execute_raw_sql', {
        query: `
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
        AND tc.table_name = 'tasks';
    `
    });

    if (fkError) {
        console.error('Error fetching foreign keys:', fkError);
    } else if (fks) {
        console.table(fks);
    }

    console.log('\n✅ Task table exploration complete!');
    console.log('='.repeat(80));
}

exploreTaskTable().catch(console.error);

