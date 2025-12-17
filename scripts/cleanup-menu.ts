
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

async function cleanupMenu() {
    const isDryRun = process.argv.includes('--dry-run');
    const isExecute = process.argv.includes('--execute');

    if (!isDryRun && !isExecute) {
        console.log('Please specify --dry-run or --execute');
        process.exit(1);
    }

    console.log('Fetching menu items...');
    const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, modifier_group_ids');

    if (menuError) {
        console.error('Error fetching menu items:', menuError);
        return;
    }

    console.log(`Found ${menuItems.length} menu items.`);

    console.log('Fetching modifier groups...');
    const { data: modifierGroups, error: groupsError } = await supabase
        .from('modifier_groups')
        .select('id, name');

    if (groupsError) {
        console.error('Error fetching modifier groups:', groupsError);
        return;
    }

    console.log(`Found ${modifierGroups.length} modifier groups.`);

    // Collect all used modifier group IDs
    const usedGroupIds = new Set<string>();
    menuItems.forEach(item => {
        if (item.modifier_group_ids && Array.isArray(item.modifier_group_ids)) {
            item.modifier_group_ids.forEach((id: string) => usedGroupIds.add(id));
        }
    });

    console.log(`Found ${usedGroupIds.size} unique used modifier groups.`);

    // Identify unused groups
    const unusedGroups = modifierGroups.filter(group => !usedGroupIds.has(group.id));

    console.log(`Found ${unusedGroups.length} UNUSED modifier groups.`);

    if (unusedGroups.length > 0) {
        console.log('\n--- Unused Modifier Groups ---');
        unusedGroups.forEach(group => {
            console.log(`ID: ${group.id}, Name: ${group.name}`);
        });
        console.log('------------------------------\n');
    }

    if (isDryRun) {
        console.log('DRY RUN COMPLETE. No changes made.');
    } else if (isExecute) {
        if (unusedGroups.length === 0) {
            console.log('No unused modifier groups to delete.');
            return;
        }

        console.log('Deleting unused modifier groups...');
        const idsToDelete = unusedGroups.map(g => g.id);

        // Delete in batches if needed, but for now simple delete
        const { error: deleteError } = await supabase
            .from('modifier_groups')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('Error deleting modifier groups:', deleteError);
        } else {
            console.log(`Successfully deleted ${idsToDelete.length} modifier groups.`);
        }

        // Check for orphaned modifier options (options pointing to non-existent groups)
        // Note: If foreign keys are set up correctly with CASCADE, this shouldn't be needed, 
        // but good to verify or clean if no cascade.
        // However, since we just deleted the groups, CASCADE should have handled their options.
        // Let's do a quick check for any options that reference groups that no longer exist (if we missed any).

        // Actually, let's fetch options and check validity generally before exiting
        console.log('Verifying orphaned options...');
        const { data: allOptions } = await supabase.from('modifier_options').select('id, group_id, name');
        const { data: currentGroups } = await supabase.from('modifier_groups').select('id');

        if (allOptions && currentGroups) {
            const currentGroupIds = new Set(currentGroups.map(g => g.id));
            const orphanedOptions = allOptions.filter(o => !currentGroupIds.has(o.group_id));

            if (orphanedOptions.length > 0) {
                console.log(`Found ${orphanedOptions.length} orphaned options (FK contraint missing?). Deleting...`);
                const orphanedIds = orphanedOptions.map(o => o.id);
                const { error: optDeleteError } = await supabase
                    .from('modifier_options')
                    .delete()
                    .in('id', orphanedIds);

                if (optDeleteError) console.error('Error deleting orphaned options:', optDeleteError);
                else console.log('Orphaned options deleted.');
            } else {
                console.log('No orphaned options found.');
            }
        }

    }
}

cleanupMenu();
