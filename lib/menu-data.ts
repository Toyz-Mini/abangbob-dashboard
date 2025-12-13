import { MenuItem } from './types';

export const MOCK_MENU: MenuItem[] = [
  // Nasi Lemak Category
  {
    id: '1',
    name: 'Nasi Lemak Ayam',
    category: 'Nasi Lemak',
    price: 6.50,
    description: 'Nasi lemak dengan ayam goreng',
    ingredients: ['nasi', 'ayam', 'sambal', 'telur', 'kacang', 'timun'],
  },
  {
    id: '2',
    name: 'Nasi Lemak Rendang',
    category: 'Nasi Lemak',
    price: 7.00,
    description: 'Nasi lemak dengan rendang daging',
    ingredients: ['nasi', 'daging', 'sambal', 'telur', 'kacang', 'timun'],
  },
  {
    id: '3',
    name: 'Nasi Lemak Biasa',
    category: 'Nasi Lemak',
    price: 4.00,
    description: 'Nasi lemak biasa dengan telur',
    ingredients: ['nasi', 'sambal', 'telur', 'kacang', 'timun'],
  },
  
  // Burger Category
  {
    id: '4',
    name: 'Burger Ayam',
    category: 'Burger',
    price: 8.00,
    description: 'Burger ayam crispy',
    ingredients: ['bun', 'ayam', 'lettuce', 'tomato', 'mayo'],
  },
  {
    id: '5',
    name: 'Burger Daging',
    category: 'Burger',
    price: 9.00,
    description: 'Burger daging bakar',
    ingredients: ['bun', 'daging', 'cheese', 'lettuce', 'tomato', 'onion'],
  },
  {
    id: '6',
    name: 'Burger Special',
    category: 'Burger',
    price: 12.00,
    description: 'Burger double patty dengan extra cheese',
    ingredients: ['bun', 'daging', 'daging', 'cheese', 'cheese', 'lettuce', 'tomato'],
  },
  
  // Minuman Category
  {
    id: '7',
    name: 'Teh Ais',
    category: 'Minuman',
    price: 2.50,
    description: 'Teh tarik ais',
    ingredients: ['teh', 'susu', 'gula', 'ais'],
  },
  {
    id: '8',
    name: 'Kopi O',
    category: 'Minuman',
    price: 2.00,
    description: 'Kopi hitam',
    ingredients: ['kopi', 'gula'],
  },
  {
    id: '9',
    name: 'Lime Juice',
    category: 'Minuman',
    price: 3.00,
    description: 'Air limau nipis',
    ingredients: ['limau', 'gula', 'ais'],
  },
  {
    id: '10',
    name: 'Milo Ais',
    category: 'Minuman',
    price: 3.50,
    description: 'Milo sejuk',
    ingredients: ['milo', 'susu', 'ais'],
  },
];

export const MENU_CATEGORIES = ['All', ...Array.from(new Set(MOCK_MENU.map(item => item.category)))];

// ==================== UPSELL CONFIGURATION ====================

// Popular/best seller items (tunjuk kalau tiada rule specific)
export const POPULAR_UPSELL_IDS = ['7', '10', '8']; // Teh Ais, Milo Ais, Kopi O

// Custom rules: Jika cart ada item X, suggest item Y
export const UPSELL_RULES: Record<string, string[]> = {
  '1': ['7', '10'],     // Nasi Lemak Ayam → Teh Ais, Milo Ais
  '2': ['7', '8'],      // Nasi Lemak Rendang → Teh Ais, Kopi O
  '3': ['7', '10'],     // Nasi Lemak Biasa → Teh Ais, Milo Ais
  '4': ['10', '9'],     // Burger Ayam → Milo Ais, Lime Juice
  '5': ['10', '9'],     // Burger Daging → Milo Ais, Lime Juice
  '6': ['10', '9'],     // Burger Special → Milo Ais, Lime Juice
};

// Helper function to get upsell suggestions based on cart items
export const getUpsellSuggestions = (cartItemIds: string[], allMenuItems: MenuItem[]): MenuItem[] => {
  const suggestedIds = new Set<string>();
  
  // First, check custom rules
  cartItemIds.forEach(itemId => {
    const rules = UPSELL_RULES[itemId];
    if (rules) {
      rules.forEach(suggestId => suggestedIds.add(suggestId));
    }
  });
  
  // If no suggestions from rules, use popular items
  if (suggestedIds.size === 0) {
    POPULAR_UPSELL_IDS.forEach(id => suggestedIds.add(id));
  }
  
  // Filter out items already in cart
  const filteredIds = Array.from(suggestedIds).filter(id => !cartItemIds.includes(id));
  
  // Get menu items for suggestions (max 4)
  return filteredIds
    .slice(0, 4)
    .map(id => allMenuItems.find(item => item.id === id))
    .filter((item): item is MenuItem => item !== undefined && item.isAvailable !== false);
};

