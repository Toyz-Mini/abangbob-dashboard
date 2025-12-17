
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

async function checkOldModifiers() {
    const isDryRun = process.argv.includes('--dry-run');
    const isExecute = process.argv.includes('--execute');

    if (!isDryRun && !isExecute) {
        console.log('Please specify --dry-run or --execute');
        process.exit(1);
    }

    console.log('Scanning for "(OLD)" modifiers and options...');

    // 1. Check Modifier Groups
    const { data: oldGroups, error: groupError } = await supabase
        .from('modifier_groups')
        .select('id, name')
        .ilike('name', '%(OLD)%');

    if (groupError) {
        console.error('Error fetching modifier groups:', groupError);
        return;
    }

    // 2. Check Modifier Options
    const { data: oldOptions, error: optionError } = await supabase
        .from('modifier_options')
        .select('id, name, group_id')
        .ilike('name', '%(OLD)%');

    if (optionError) {
        console.error('Error fetching modifier options:', optionError);
        return;
    }

    const groupsCount = oldGroups?.length || 0;
    const optionsCount = oldOptions?.length || 0;

    console.log(`Found ${groupsCount} OLD modifier groups and ${optionsCount} OLD modifier options.`);

    if (groupsCount > 0) {
        console.log('\n--- OLD Modifier Groups ---');
        oldGroups?.forEach(g => console.log(`- ${g.name} (${g.id})`));
    }

    if (optionsCount > 0) {
        console.log('\n--- OLD Modifier Options ---');
        oldOptions?.forEach(o => console.log(`- ${o.name} (${o.id})`));
    }

    if (groupsCount === 0 && optionsCount === 0) {
        console.log('\n✓ No "(OLD)" items found in modifiers.');
        return;
    }

    if (isDryRun) {
        console.log('\nDRY RUN COMPLETE. No items deleted.');
    } else if (isExecute) {
        console.log('\nDeleting items...');

        // Delete groups
        if (groupsCount > 0) {
            const groupIds = oldGroups!.map(g => g.id);
            const { error } = await supabase.from('modifier_groups').delete().in('id', groupIds);
            if (error) console.error('Error deleting groups:', error);
            else console.log(`Deleted ${groupsCount} modifier groups.`);
        }

        // Delete options
        if (optionsCount > 0) {
            const optionIds = oldOptions!.map(o => o.id);
            const { error } = await supabase.from('modifier_options').delete().in('id', optionIds);
            if (error) console.error('Error deleting options:', error);
            else console.log(`Deleted ${optionsCount} modifier options.`);
        }
    }
}

checkOldModifiers();
