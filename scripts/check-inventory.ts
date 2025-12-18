
import { getSupabaseClient } from '../lib/supabase/client';

async function checkInventory() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.log('No supabase');
        return;
    }

    const { data, error } = await supabase.from('inventory').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log('Raw Inventory Item:', data[0]);
    }
}

checkInventory();
