
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log('Checking for count_daily column...');

    // Try to select the column
    const { data, error } = await supabase
        .from('inventory')
        .select('id, count_daily')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting count_daily:', error.message);
        console.log('Diagnosis: The column likely does not exist.');
    } else {
        console.log('✅ Success! count_daily column exists.');
        console.log('Sample data:', data);
    }
}

checkColumn();
