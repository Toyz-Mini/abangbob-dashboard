/**
 * Seed script to populate suppliers and inventory items from provided data
 * Run with: npx tsx scripts/seed-suppliers-inventory.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// SUPPLIER DATA
// ========================================
const suppliersData = [
  {
    name: 'Zuis Enterprise / MZ',
    contact_person: 'Mee Mee',
    phone: '6737319867',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'cod',
    lead_time_days: 3,
    rating: 4.0,
    status: 'active',
    notes: ''
  },
  {
    name: 'Fayze Department Salambigar',
    contact_person: '',
    phone: '6737377216',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'net7',
    lead_time_days: 2,
    rating: 4.5,
    status: 'active',
    notes: 'Main supplier for dry goods and condiments'
  },
  {
    name: 'Bake Culture',
    contact_person: '',
    phone: '6737112046',
    email: '',
    address: '',
    account_numbers: [
      { bankName: 'BIBD', accountNumber: '00-001-01-004673-3', accountName: 'Bake Culture' },
      { bankName: 'Baiduri', accountNumber: '02-00-110-429087', accountName: 'Bake Culture' }
    ],
    payment_terms: 'net14',
    lead_time_days: 3,
    rating: 4.5,
    status: 'active',
    notes: 'Baking supplies and ingredients'
  },
  {
    name: 'Wan Sing',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'cod',
    lead_time_days: 3,
    rating: 3.5,
    status: 'active',
    notes: ''
  },
  {
    name: 'Ecopack',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'net7',
    lead_time_days: 5,
    rating: 4.0,
    status: 'active',
    notes: 'Packaging materials supplier'
  },
  {
    name: 'SKP',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'cod',
    lead_time_days: 3,
    rating: 3.5,
    status: 'active',
    notes: ''
  },
  {
    name: 'Yin Bee',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'net7',
    lead_time_days: 3,
    rating: 4.0,
    status: 'active',
    notes: ''
  },
  {
    name: 'Ji-Mart',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'cod',
    lead_time_days: 1,
    rating: 4.0,
    status: 'active',
    notes: 'Quick local supplies'
  },
  {
    name: 'Food Stuff',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'net14',
    lead_time_days: 7,
    rating: 4.5,
    status: 'active',
    notes: 'Bulk spices and specialty ingredients'
  },
  {
    name: 'Guan Hock Lee',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'net7',
    lead_time_days: 3,
    rating: 4.0,
    status: 'active',
    notes: 'Spices and seasonings'
  },
  {
    name: 'Tayeem Majid',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_numbers: [],
    payment_terms: 'cod',
    lead_time_days: 2,
    rating: 3.5,
    status: 'active',
    notes: ''
  }
];

// ========================================
// INVENTORY DATA
// ========================================
// Will be populated after suppliers are inserted to get supplier IDs
const inventoryData = [
  // Fayze Department Salambigar items
  { name: 'BAKERS Baking Powder Double Effect (100g)', category: 'Baking Supplies', unit: 'pcs', price: 1.20, supplier: 'Fayze', min_quantity: 10, current_quantity: 15 },
  { name: 'TUMIX Chicken Stock (1kg)', category: 'Seasoning', unit: 'kg', price: 5.95, supplier: 'Fayze', min_quantity: 5, current_quantity: 8 },
  { name: 'MAYOMI Mayonnaise (3 liter)', category: 'Condiment', unit: 'liter', price: 7.95, supplier: 'Fayze', min_quantity: 3, current_quantity: 5 },
  { name: 'BON CHEF Mayonnaise (3 liter)', category: 'Condiment', unit: 'liter', price: 6.99, supplier: 'Fayze', min_quantity: 3, current_quantity: 4 },
  { name: 'NONA Tepung Custard (300g)', category: 'Baking Supplies', unit: 'pcs', price: 1.30, supplier: 'Fayze', min_quantity: 10, current_quantity: 12 },
  { name: 'NAZRI Sodium Bicarbonate (200g)', category: 'Baking Supplies', unit: 'pcs', price: 1.90, supplier: 'Fayze', min_quantity: 10, current_quantity: 15 },
  { name: 'MAGGI Sos Cili (1.5kg)', category: 'Sauce', unit: 'kg', price: 3.30, supplier: 'Fayze', min_quantity: 5, current_quantity: 8 },
  { name: 'MAGGI Sos tomato', category: 'Sauce', unit: 'kg', price: 3.10, supplier: 'Fayze', min_quantity: 5, current_quantity: 7 },
  { name: 'AMERICAN GARDEN Yellow Mustard', category: 'Condiment', unit: 'pcs', price: 2.10, supplier: 'Fayze', min_quantity: 5, current_quantity: 6 },
  { name: 'LAZAT MSG', category: 'Seasoning', unit: 'kg', price: 4.25, supplier: 'Fayze', min_quantity: 5, current_quantity: 8 },
  { name: 'BABAS Meat Curry Powder (1kg)', category: 'Spices', unit: 'kg', price: 9.80, supplier: 'Fayze', min_quantity: 3, current_quantity: 5 },
  { name: 'Chilli Powder (1kg)', category: 'Spices', unit: 'kg', price: 7.90, supplier: 'Fayze', min_quantity: 3, current_quantity: 4 },
  { name: 'BAKERS Oregano Flakes (20g)', category: 'Herbs', unit: 'pcs', price: 2.30, supplier: 'Fayze', min_quantity: 10, current_quantity: 12 },
  { name: 'BAKERS Parsley Leaves (10g)', category: 'Herbs', unit: 'pcs', price: 2.30, supplier: 'Fayze', min_quantity: 10, current_quantity: 12 },
  { name: 'Ginger Powder (500g)', category: 'Spices', unit: 'pcs', price: 9.90, supplier: 'Fayze', min_quantity: 5, current_quantity: 6 },
  { name: 'AK Fine Salt (250g)', category: 'Seasoning', unit: 'pcs', price: 1.50, supplier: 'Fayze', min_quantity: 10, current_quantity: 15 },
  { name: 'Black Pepper Powder (1 kg)', category: 'Spices', unit: 'kg', price: 12.90, supplier: 'Fayze', min_quantity: 3, current_quantity: 4 },
  { name: 'White Pepper Powder (1 kg)', category: 'Spices', unit: 'kg', price: 13.90, supplier: 'Fayze', min_quantity: 3, current_quantity: 4 },
  { name: 'Sugar (10kg)', category: 'Baking Supplies', unit: 'kg', price: 11.90, supplier: 'Fayze', min_quantity: 20, current_quantity: 30 },
  { name: 'SABLIS Vinegar (600ml)', category: 'Condiment', unit: 'ml', price: 1.30, supplier: 'Fayze', min_quantity: 10, current_quantity: 12 },
  { name: 'IDEAL Telur Greg (30pcs)', category: 'Baking Supplies', unit: 'pcs', price: 5.10, supplier: 'Fayze', min_quantity: 5, current_quantity: 8 },
  { name: 'SP Breadcrumbs (1kg)', category: 'Breading', unit: 'kg', price: 3.70, supplier: 'Fayze', min_quantity: 5, current_quantity: 7 },
  { name: 'Disposable Glove Plastik (100pcs)', category: 'Packaging', unit: 'pcs', price: 1.60, supplier: 'Fayze', min_quantity: 20, current_quantity: 30 },
  { name: 'Enoki', category: 'Vegetable', unit: 'pcs', price: 21.00, supplier: 'Fayze', min_quantity: 5, current_quantity: 0 },
  { name: 'Mumi Cooking Oil (17 liter)', category: 'Oil', unit: 'liter', price: 31.50, supplier: 'Fayze', min_quantity: 2, current_quantity: 3 },
  
  // Food Stuff items
  { name: 'Hexa Paprika powder 30gm x 12pkt', category: 'Spices', unit: 'box', price: 24.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Hexa Garlic powder blend 40gm x 12pkt', category: 'Spices', unit: 'box', price: 26.10, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Hexa Garlic powder blend 1kg x 10pkt', category: 'Spices', unit: 'box', price: 118.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Hexa Garlic powder 40gm x 12pkt', category: 'Spices', unit: 'box', price: 12.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Taste Thai Sriracha chili sauce 510gm x 12btl', category: 'Sauce', unit: 'box', price: 30.60, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Knorr chicken stock 8x1kg', category: 'Seasoning', unit: 'box', price: 57.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Oki chicken stock 12x1kg', category: 'Seasoning', unit: 'box', price: 62.40, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Mayonnaise 4tong x 3L', category: 'Condiment', unit: 'box', price: 75.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Bunga raya custard powder 300gm x 12pkt', category: 'Baking Supplies', unit: 'box', price: 14.40, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Mr ten sodium bicarbonate 1kg', category: 'Baking Supplies', unit: 'kg', price: 8.00, supplier: 'Food Stuff', min_quantity: 5, current_quantity: 7 },
  { name: 'Twinie chili sauce 4tong x 4.5kg', category: 'Sauce', unit: 'box', price: 28.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Twinie tomato sauce 4tong x 4.5kg', category: 'Sauce', unit: 'box', price: 28.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Hexa Mustard powder 40gm x 12pkt', category: 'Spices', unit: 'box', price: 18.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Mr ten Monosodium 20x1kg(offer 5½ctn free ½', category: 'Seasoning', unit: 'box', price: 80.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 1 },
  { name: 'Babas curry meat 1kg x 20pkt', category: 'Spices', unit: 'box', price: 196.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 1 },
  { name: 'Babas curry meat 250gm x 40pkt', category: 'Spices', unit: 'box', price: 100.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Chili powder 1kg', category: 'Spices', unit: 'kg', price: 6.50, supplier: 'Food Stuff', min_quantity: 5, current_quantity: 7 },
  { name: 'Hexa oregano Leaves 20gm x 12pkt', category: 'Herbs', unit: 'box', price: 24.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Hexa oregano Leaves 150gm x 13pkt', category: 'Herbs', unit: 'box', price: 64.40, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Hexa Parsley Leaves 15gm x 12pkt', category: 'Herbs', unit: 'box', price: 24.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Hexa Parsley Leaves 150gm x 13pkt', category: 'Herbs', unit: 'box', price: 72.80, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Hexa Ginger powder 40gm x 12pkt', category: 'Spices', unit: 'box', price: 24.00, supplier: 'Food Stuff', min_quantity: 2, current_quantity: 3 },
  { name: 'Mr ten pdv fine salt 250gm x 48pkt', category: 'Seasoning', unit: 'box', price: 13.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Mr ten white pepper 350gm x 60pkt', category: 'Spices', unit: 'box', price: 13.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 1 },
  { name: 'Mr ten pepper powder 500gm x 10pkt', category: 'Spices', unit: 'box', price: 60.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Mr ten vinegar 4tong x 4.5kg', category: 'Condiment', unit: 'box', price: 20.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Twinie vinegar 4tong x 4.5kg', category: 'Condiment', unit: 'box', price: 22.00, supplier: 'Food Stuff', min_quantity: 1, current_quantity: 2 },
  { name: 'Bunga raya Breadcrumbs 500gm', category: 'Breading', unit: 'pcs', price: 1.80, supplier: 'Food Stuff', min_quantity: 10, current_quantity: 15 },
  { name: 'Bunga raya Breadcrumbs orange 1kg', category: 'Breading', unit: 'kg', price: 4.00, supplier: 'Food Stuff', min_quantity: 5, current_quantity: 7 },
  
  // Guan Hock Lee items
  { name: 'Paprika Powder (1kg)', category: 'Spices', unit: 'kg', price: 37.20, supplier: 'Guan Hock Lee', min_quantity: 3, current_quantity: 4 },
  { name: 'HELA Garlic Powder (1kg)', category: 'Spices', unit: 'kg', price: 30.00, supplier: 'Guan Hock Lee', min_quantity: 3, current_quantity: 4 },
  { name: 'HELA Onion Powder (1kg)', category: 'Spices', unit: 'kg', price: 37.20, supplier: 'Guan Hock Lee', min_quantity: 3, current_quantity: 4 },
  
  // Ji-Mart items
  { name: 'BAKER\'S CHOICE Tepung Roti (1 ctn)', category: 'Breading', unit: 'ctn', price: 19.50, supplier: 'Ji-Mart', min_quantity: 2, current_quantity: 3 },
  { name: 'BROOKE Frymaster Elite (15kg)', category: 'Oil', unit: 'kg', price: 40.00, supplier: 'Ji-Mart', min_quantity: 2, current_quantity: 3 },
  { name: 'MICHELIN Creamy Frying Oil (18kg)', category: 'Oil', unit: 'kg', price: 65.00, supplier: 'Ji-Mart', min_quantity: 2, current_quantity: 3 },
  { name: 'SKI Sriracha Hot Chili Sos (8tkml)', category: 'Sauce', unit: 'btl', price: 3.00, supplier: 'Ji-Mart', min_quantity: 10, current_quantity: 15 },
  
  // Tayeem Majid items
  { name: 'QUIX Wraps (8 pcs)', category: 'Bread', unit: 'pcs', price: 2.60, supplier: 'Tayeem Majid', min_quantity: 10, current_quantity: 12 },
  
  // Yin Bee items
  { name: 'EMBORG Iain Yogurt (12 pkts)', category: 'Dairy', unit: 'box', price: 52.20, supplier: 'Yin Bee', min_quantity: 2, current_quantity: 3 },
];

// ========================================
// MAIN FUNCTION
// ========================================
async function seedData() {
  console.log('🌱 Starting seed process...\n');

  try {
    // Step 1: Insert suppliers
    console.log('📦 Inserting suppliers...');
    const { data: insertedSuppliers, error: supplierError } = await supabase
      .from('suppliers')
      .insert(suppliersData)
      .select();

    if (supplierError) {
      console.error('❌ Error inserting suppliers:', supplierError);
      throw supplierError;
    }

    console.log(`✅ Inserted ${insertedSuppliers?.length || 0} suppliers\n`);

    // Create supplier name to ID mapping
    const supplierMap = new Map();
    insertedSuppliers?.forEach((supplier: any) => {
      supplierMap.set(supplier.name, supplier.id);
      
      // Also map the short names used in inventory data
      if (supplier.name.includes('Fayze')) {
        supplierMap.set('Fayze', supplier.id);
      } else if (supplier.name.includes('Food Stuff')) {
        supplierMap.set('Food Stuff', supplier.id);
      } else if (supplier.name.includes('Guan Hock Lee')) {
        supplierMap.set('Guan Hock Lee', supplier.id);
      } else if (supplier.name.includes('Ji-Mart')) {
        supplierMap.set('Ji-Mart', supplier.id);
      } else if (supplier.name.includes('Tayeem Majid')) {
        supplierMap.set('Tayeem Majid', supplier.id);
      } else if (supplier.name.includes('Yin Bee')) {
        supplierMap.set('Yin Bee', supplier.id);
      }
    });

    // Step 2: Prepare and insert inventory items
    console.log('📦 Inserting inventory items...');
    
    const inventoryInsertData = inventoryData.map(item => {
      const supplierId = supplierMap.get(item.supplier);
      return {
        name: item.name,
        category: item.category,
        unit: item.unit,
        current_quantity: item.current_quantity,
        min_quantity: item.min_quantity,
        cost: item.price,
        supplier_id: supplierId || null
      };
    });

    const { data: insertedInventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryInsertData)
      .select();

    if (inventoryError) {
      console.error('❌ Error inserting inventory:', inventoryError);
      throw inventoryError;
    }

    console.log(`✅ Inserted ${insertedInventory?.length || 0} inventory items\n`);

    // Step 3: Display summary
    console.log('📊 SEED SUMMARY');
    console.log('================');
    console.log(`Suppliers: ${insertedSuppliers?.length || 0}`);
    console.log(`Inventory Items: ${insertedInventory?.length || 0}`);
    console.log('\n✨ Seed completed successfully!');
    
    // Display suppliers with item counts
    console.log('\n📋 Suppliers with item counts:');
    for (const [supplierName, supplierId] of supplierMap.entries()) {
      if (!supplierName.includes('/') && supplierName !== 'Fayze' && supplierName !== 'Food Stuff' && supplierName !== 'Guan Hock Lee' && supplierName !== 'Ji-Mart' && supplierName !== 'Tayeem Majid' && supplierName !== 'Yin Bee') {
        const itemCount = inventoryInsertData.filter(i => i.supplier_id === supplierId).length;
        if (itemCount > 0) {
          console.log(`  - ${supplierName}: ${itemCount} items`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedData();


