/**
 * Debug script to check leave_balances data in Supabase
 * Run: npx tsx scripts/debug-leave-balances.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLeaveBalances() {
    console.log('🔍 Checking leave_balances table in Supabase...\n');

    // 1. Get all leave balances
    const { data: balances, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .order('updated_at', { ascending: false });

    if (balanceError) {
        console.error('❌ Error fetching leave_balances:', balanceError);
        return;
    }

    console.log(`📊 Found ${balances?.length || 0} leave balance records:\n`);

    if (balances && balances.length > 0) {
        for (const balance of balances) {
            console.log('━'.repeat(60));
            console.log(`Staff ID: ${balance.staff_id}`);
            console.log(`Year: ${balance.year}`);
            console.log(`\n📅 Annual Leave:`);
            console.log(`   - Entitled: ${balance.annual_entitled}`);
            console.log(`   - Taken: ${balance.annual_taken}`);
            console.log(`   - Balance: ${balance.annual_balance}`);
            console.log(`\n🏥 Medical Leave:`);
            console.log(`   - Entitled: ${balance.medical_entitled}`);
            console.log(`   - Taken: ${balance.medical_taken}`);
            console.log(`   - Balance: ${balance.medical_balance}`);
            console.log(`\n🚨 Emergency Leave:`);
            console.log(`   - Entitled: ${balance.emergency_entitled}`);
            console.log(`   - Taken: ${balance.emergency_taken}`);
            console.log(`   - Balance: ${balance.emergency_balance}`);
            console.log(`\n💝 Compassionate Leave:`);
            console.log(`   - Entitled: ${balance.compassionate_entitled}`);
            console.log(`   - Taken: ${balance.compassionate_taken}`);
            console.log(`   - Balance: ${balance.compassionate_balance}`);
            console.log(`\n⏰ Updated: ${balance.updated_at}`);
        }
    } else {
        console.log('⚠️  No leave balance records found!');
    }

    // 2. Get staff list to compare
    console.log('\n\n📋 Checking staff table for comparison...\n');

    const { data: staffList, error: staffError } = await supabase
        .from('staff')
        .select('id, name, role, leave_entitlement')
        .eq('status', 'active')
        .limit(10);

    if (staffError) {
        console.error('❌ Error fetching staff:', staffError);
        return;
    }

    console.log(`Found ${staffList?.length || 0} active staff:\n`);

    if (staffList) {
        for (const staff of staffList) {
            console.log(`- ${staff.name} (${staff.role})`);
            console.log(`  ID: ${staff.id}`);
            if (staff.leave_entitlement) {
                console.log(`  Leave Entitlement (from staff table):`, staff.leave_entitlement);
            }
            console.log();
        }
    }

    // 3. Check if there's a mismatch
    console.log('\n━'.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('━'.repeat(60));

    if (balances && staffList) {
        const balanceStaffIds = new Set(balances.map(b => b.staff_id));
        const staffIds = new Set(staffList.map(s => s.id));

        const staffWithoutBalance = staffList.filter(s => !balanceStaffIds.has(s.id));

        if (staffWithoutBalance.length > 0) {
            console.log(`\n⚠️  ${staffWithoutBalance.length} staff WITHOUT leave balance records:`);
            staffWithoutBalance.forEach(s => console.log(`   - ${s.name} (${s.id})`));
        } else {
            console.log('\n✅ All active staff have leave balance records');
        }
    }
}

debugLeaveBalances().catch(console.error);
