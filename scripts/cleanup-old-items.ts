
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOldMenuItems() {
    const isDryRun = process.argv.includes('--dry-run');
    const isExecute = process.argv.includes('--execute');

    if (!isDryRun && !isExecute) {
        console.log('Please specify --dry-run or --execute');
        process.exit(1);
    }

    console.log('Fetching menu items marked as (OLD)...');
    const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name')
        .ilike('name', '%(OLD)%'); // Case insensitive search for (OLD)

    if (menuError) {
        console.error('Error fetching menu items:', menuError);
        return;
    }

    if (!menuItems || menuItems.length === 0) {
        console.log('No items found with "(OLD)" in the name.');
        return;
    }

    console.log(`Found ${menuItems.length} items to remove:`);
    menuItems.forEach(item => console.log(`- ${item.name} (${item.id})`));

    if (isDryRun) {
        console.log('\nDRY RUN COMPLETE. No items deleted.');
    } else if (isExecute) {
        console.log('\nDeleting items...');
        const idsToDelete = menuItems.map(item => item.id);

        const { error: deleteError } = await supabase
            .from('menu_items')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('Error deleting items:', deleteError);
        } else {
            console.log(`Successfully deleted ${idsToDelete.length} items.`);
        }
    }
}

cleanupOldMenuItems();
