
import { getSupabaseClient } from '../lib/supabase/client';

async function setDailyCountItems() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabase not connected');
        return;
    }

    // First, get some items
    const { data: items } = await supabase.from('inventory').select('id, name').limit(5);

    if (!items || items.length === 0) {
        console.log('No inventory items found');
        return;
    }

    console.log('Found items:', items.map(i => i.name));

    // Update them to be countDaily = true
    const ids = items.map(i => i.id);
    const { error } = await supabase
        .from('inventory')
        .update({ count_daily: true })
        .in('id', ids);

    if (error) {
        console.error('Error updating items:', error);
    } else {
        console.log(`Successfully marked ${ids.length} items for daily count.`);
    }
}

setDailyCountItems();
