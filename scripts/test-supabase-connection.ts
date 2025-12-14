// Test Supabase Connection
// Run with: npx ts-node scripts/test-supabase-connection.ts

import { createClient } from '@supabase/supabase-js';

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
    console.log('📋 Test 2: Checking database tables...');
    const tables = ['staff', 'inventory', 'menu_items', 'orders', 'customers', 'expenses', 'attendance', 'outlets'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: MISSING (${error.message})`);
      } else {
        console.log(`   ✅ ${table}: EXISTS (${count || 0} records)`);
      }
    }
    
    console.log('\n✅ Connection test complete!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
