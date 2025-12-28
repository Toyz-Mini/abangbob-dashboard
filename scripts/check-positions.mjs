#!/usr/bin/env node
/**
 * Quick diagnostic script to check staff_positions table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

console.log('🔍 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPositions() {
    try {
        // Check if table exists and get data
        console.log('\n📋 Checking staff_positions table...\n');

        const { data, error } = await supabase
            .from('staff_positions')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('❌ Error:', error.message);
            if (error.code === '42P01') {
                console.log('\n⚠️  Table "staff_positions" does not exist!');
                console.log('   Please run the migration: lib/supabase/migrations/add-staff-positions-table.sql');
            }
            return;
        }

        if (data && data.length > 0) {
            console.log(`✅ Found ${data.length} positions in database:\n`);
            data.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.name} (${p.role}) - Active: ${p.is_active}`);
            });
        } else {
            console.log('⚠️  Table exists but is EMPTY!');
            console.log('   The seed data from migration may not have been inserted.');
            console.log('   Try running the INSERT statements from the migration file.');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

checkPositions();
