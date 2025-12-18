
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
    'checklist_templates',
    'checklist_completions',
    'leave_requests',
    'claim_requests',
    'staff_requests',
    'staff_kpi',
    'announcements'
];

async function checkTables() {
    console.log('Checking for Staff Portal tables...');

    for (const table of tablesToCheck) {
        const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

        if (error) {
            console.error(`❌ Missing table: ${table} (${error.message})`);
        } else {
            console.log(`✅ Table exists: ${table}`);
        }
    }
}

checkTables();
