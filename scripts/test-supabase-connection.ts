// Test Supabase Connection
// Run with: npx tsx scripts/test-supabase-connection.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Credentials found:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test 1: Check connection with a simple query
    console.log('📡 Test 1: Testing basic connection...');
    const { data, error } = await supabase.from('staff').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!\n');
    
    // Test 2: Check if tables exist
    console.log('📋 Test 2: Checking database tables...\n');
    
    // Core tables from schema.sql
    const coreTables = ['staff', 'inventory', 'menu_items', 'modifier_groups', 'modifier_options', 'orders', 'customers', 'expenses', 'attendance', 'outlets', 'audit_logs', 'suppliers', 'purchase_orders'];
    
    // Extended tables from migrations
    const extendedTables = ['inventory_logs', 'production_logs', 'delivery_orders', 'daily_cash_flows', 'recipes', 'shifts', 'schedule_entries', 'promotions', 'notifications'];
    
    // Staff portal tables
    const portalTables = ['checklist_templates', 'checklist_completions', 'leave_balances', 'leave_requests', 'leave_records', 'claim_requests', 'staff_requests', 'announcements'];
    
    // Equipment tables
    const equipmentTables = ['oil_trackers', 'oil_change_requests', 'oil_action_history'];
    
    // KPI tables
    const kpiTables = ['staff_kpi', 'training_records', 'ot_records', 'customer_reviews'];
    
    let missingTables: string[] = [];
    let existingTables: string[] = [];
    
    console.log('   🗄️  Core Tables:');
    for (const table of coreTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`      ❌ ${table}: MISSING`);
        missingTables.push(table);
      } else {
        console.log(`      ✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
      }
    }
    
    console.log('\n   📦 Extended Tables:');
    for (const table of extendedTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`      ❌ ${table}: MISSING`);
        missingTables.push(table);
      } else {
        console.log(`      ✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
      }
    }
    
    console.log('\n   👤 Staff Portal Tables:');
    for (const table of portalTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`      ❌ ${table}: MISSING`);
        missingTables.push(table);
      } else {
        console.log(`      ✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
      }
    }
    
    console.log('\n   🔧 Equipment Tables:');
    for (const table of equipmentTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`      ❌ ${table}: MISSING`);
        missingTables.push(table);
      } else {
        console.log(`      ✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
      }
    }
    
    console.log('\n   📊 KPI Tables:');
    for (const table of kpiTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`      ❌ ${table}: MISSING`);
        missingTables.push(table);
      } else {
        console.log(`      ✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
      }
    }
    
    // Summary
    console.log('\n================================================');
    console.log('📊 SUMMARY');
    console.log('================================================');
    console.log(`   ✅ Existing tables: ${existingTables.length}`);
    console.log(`   ❌ Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n   ⚠️  Missing tables need migration:');
      console.log(`      ${missingTables.join(', ')}`);
      console.log('\n   📝 To fix, run migrations in Supabase SQL Editor:');
      console.log('      1. Open Supabase Dashboard > SQL Editor');
      console.log('      2. Run lib/supabase/schema.sql first');
      console.log('      3. Then run individual migration files as needed');
    }
    
    console.log('\n✅ Connection test complete!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();


