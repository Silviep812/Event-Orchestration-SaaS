#!/usr/bin/env python3
r"""
Script to convert COPY statements from pg_dump to INSERT statements
for use in Supabase migrations.
"""

import os
import re

backup_file = os.path.join('supabase', 'migrations', 'full_main_branch_2025_12_22.sql.backup')
output_file = os.path.join('supabase', 'migrations', 'seed_data.sql')

print(f"Reading {backup_file}...")
with open(backup_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

output_lines = []
in_copy_section = False
current_copy_statement = None
table_name = None
columns = []
data_lines = []

def escape_sql_string(value):
    """Escape single quotes and backslashes for SQL"""
    if value is None or value == '\\N':
        return 'NULL'
    # Replace single quotes with two single quotes
    value = str(value).replace("'", "''")
    # Escape backslashes
    value = value.replace('\\', '\\\\')
    return f"'{value}'"

def convert_copy_to_inserts():
    """Convert accumulated COPY data to INSERT statements"""
    if not table_name or not columns or not data_lines:
        return
    
    # Start building INSERT statements
    # Group inserts in batches of 100 for better performance
    batch_size = 100
    for batch_start in range(0, len(data_lines), batch_size):
        batch = data_lines[batch_start:batch_start + batch_size]
        
        # Parse each data line (tab-separated values)
        insert_values = []
        for line in batch:
            if not line.strip() or line.strip() == '\\.':
                continue
            
            # Split by tab
            values = line.rstrip('\n').split('\t')
            
            # Convert values to SQL format
            sql_values = []
            for i, val in enumerate(values):
                if i < len(columns):
                    sql_values.append(escape_sql_string(val))
                else:
                    # Extra columns, skip
                    break
            
            # Pad with NULL if needed
            while len(sql_values) < len(columns):
                sql_values.append('NULL')
            
            insert_values.append(f"({', '.join(sql_values)})")
        
        if insert_values:
            columns_str = ', '.join([f'"{col}"' if ' ' in col or col[0].isupper() else col for col in columns])
            schema_table = table_name.split('.')
            if len(schema_table) == 2:
                schema, table = schema_table
                table_str = f'"{schema}".{table}' if ' ' in table or table[0].isupper() else f'"{schema}".{table}'
            else:
                table_str = f'"{table_name}"' if ' ' in table_name or table_name[0].isupper() else table_name
            
            output_lines.append(f"INSERT INTO {table_str} ({columns_str}) VALUES\n")
            output_lines.append(',\n'.join(insert_values))
            output_lines.append(';\n\n')

# Process the file
for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Detect COPY statement
    if stripped.startswith('COPY ') and 'FROM stdin;' in stripped:
        # Convert previous COPY section if any
        if in_copy_section and data_lines:
            convert_copy_to_inserts()
        
        # Parse COPY statement: COPY schema.table (col1, col2, ...) FROM stdin;
        match = re.match(r'COPY\s+([^\s]+)\s*\(([^)]+)\)\s+FROM\s+stdin;', stripped)
        if match:
            table_name = match.group(1)
            columns_str = match.group(2)
            columns = [col.strip().strip('"') for col in columns_str.split(',')]
            data_lines = []
            in_copy_section = True
            print(f"Found COPY for {table_name} with {len(columns)} columns at line {i+1}")
        continue
    
    # Collect data lines
    if in_copy_section:
        if stripped == '\\.':
            # End of COPY section
            if data_lines:
                convert_copy_to_inserts()
            in_copy_section = False
            table_name = None
            columns = []
            data_lines = []
        else:
            # Data line
            data_lines.append(line)

# Handle last COPY section if file ends without \.
if in_copy_section and data_lines:
    convert_copy_to_inserts()

# Write output
print(f"Writing converted INSERT statements to {output_file}...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("-- Seed data converted from pg_dump COPY statements\n")
    f.write("-- This file contains INSERT statements for all data from the database dump\n\n")
    f.writelines(output_lines)

print(f"Conversion complete! Created {output_file} with {len(output_lines)} lines")

