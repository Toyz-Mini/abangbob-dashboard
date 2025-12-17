
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

async function auditMenu() {
    console.log('Starting Menu Quality Audit...');

    // 1. Fetch all groups and options
    const { data: groups } = await supabase.from('modifier_groups').select('id, name');
    const { data: options } = await supabase.from('modifier_options').select('id, group_id, name');

    if (!groups || !options) {
        console.error('Error fetching data');
        return;
    }

    // Check 1: Empty Modifier Groups
    const groupIdsWithOptions = new Set(options.map(o => o.group_id));
    const emptyGroups = groups.filter(g => !groupIdsWithOptions.has(g.id));

    console.log('\n--- Check 1: Empty Modifier Groups (No Options) ---');
    if (emptyGroups.length > 0) {
        console.log(`Found ${emptyGroups.length} empty groups:`);
        emptyGroups.forEach(g => console.log(`- [${g.name}] (ID: ${g.id})`));
    } else {
        console.log('✓ No empty groups found.');
    }

    // Check 2: Duplicate Modifier Group Names
    const nameCounts: Record<string, number> = {};
    groups.forEach(g => {
        nameCounts[g.name] = (nameCounts[g.name] || 0) + 1;
    });
    const duplicateNames = Object.entries(nameCounts).filter(([_, count]) => count > 1);

    console.log('\n--- Check 2: Duplicate Modifier Group Names ---');
    if (duplicateNames.length > 0) {
        console.log(`Found ${duplicateNames.length} names appearing multiple times:`);
        duplicateNames.forEach(([name, count]) => console.log(`- "${name}": ${count} times`));
    } else {
        console.log('✓ No duplicate group names found.');
    }

    // Check 3: Duplicate Options within Groups
    console.log('\n--- Check 3: Duplicate Options within Groups ---');
    const issuesFound = [];
    for (const group of groups) {
        const groupOptions = options.filter(o => o.group_id === group.id);
        const optNameCounts: Record<string, number> = {};
        groupOptions.forEach(o => {
            optNameCounts[o.name] = (optNameCounts[o.name] || 0) + 1;
        });
        const dupOpts = Object.entries(optNameCounts).filter(([_, count]) => count > 1);
        if (dupOpts.length > 0) {
            issuesFound.push({ groupName: group.name, duplicates: dupOpts });
        }
    }

    if (issuesFound.length > 0) {
        issuesFound.forEach(issue => {
            console.log(`Group: "${issue.groupName}"`);
            issue.duplicates.forEach(([name, count]) => console.log(`  - Option "${name}" appears ${count} times`));
        });
    } else {
        console.log('✓ No duplicate options within groups found.');
    }
}

auditMenu();
