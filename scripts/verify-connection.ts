
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('------------------------------------------------');
console.log('🔍 Testing Supabase Connection');
console.log('------------------------------------------------');
console.log('URL:', url);
console.log('Key:', serviceKey ? '(Set)' : '(Missing)');

if (!url.includes('gmkeiqficpsfiwhqchup')) {
    console.error('❌ ERROR: URL does not match gmke... project!');
    process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function test() {
    try {
        console.log('Connecting...');
        const { data, error } = await supabase.from('staff_positions').select('*').limit(3);

        if (error) {
            console.error('❌ Connection Failed:', error.message);
        } else {
            console.log('✅ Connection Successful!');
            console.log(`✅ Retrieved ${data.length} positions.`);
            if (data.length > 0) {
                console.log('Sample:', data[0].name);
            }
        }
    } catch (e) {
        console.error('❌ Unexpected Error:', e);
    }
}

test();
