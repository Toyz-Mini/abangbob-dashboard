import { MenuItem, ModifierGroup, ModifierOption } from './types';

// ==================== MODIFIER GROUPS ====================

export const MOCK_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'modgroup_size_tenders',
    name: 'Pilih Saiz Tenders',
    isRequired: true,
    allowMultiple: false,
    minSelection: 1,
    maxSelection: 1,
  },
  {
    id: 'modgroup_flavour',
    name: 'Pilih Flavour',
    isRequired: true,
    allowMultiple: false,
    minSelection: 1,
    maxSelection: 1,
  },
  {
    id: 'modgroup_addon_sauce',
    name: 'Add On Sauce',
    isRequired: false,
    allowMultiple: false,
    minSelection: 0,
    maxSelection: 1,
  },
  {
    id: 'modgroup_size_nashville',
    name: 'Pilih Saiz',
    isRequired: true,
    allowMultiple: false,
    minSelection: 1,
    maxSelection: 1,
  },
];

// ==================== MODIFIER OPTIONS ====================

export const MOCK_MODIFIER_OPTIONS: ModifierOption[] = [
  // Size options for Chicken Tenders XL
  {
    id: 'modopt_tenders_3pcs',
    groupId: 'modgroup_size_tenders',
    name: '3 pieces',
    extraPrice: 0.00,
    isAvailable: true,
  },
  {
    id: 'modopt_tenders_6pcs',
    groupId: 'modgroup_size_tenders',
    name: '6 pieces',
    extraPrice: 4.00,
    isAvailable: true,
  },
  // Flavour options
  {
    id: 'modopt_flavour_original',
    groupId: 'modgroup_flavour',
    name: 'Original',
    extraPrice: 0.00,
    isAvailable: true,
  },
  {
    id: 'modopt_flavour_spicy',
    groupId: 'modgroup_flavour',
    name: 'Spicy',
    extraPrice: 0.00,
    isAvailable: true,
  },
  // Add-on sauce
  {
    id: 'modopt_extra_sauce',
    groupId: 'modgroup_addon_sauce',
    name: 'Extra Sauce',
    extraPrice: 1.00,
    isAvailable: true,
  },
  // Nashville size options
  {
    id: 'modopt_nashville_1pc',
    groupId: 'modgroup_size_nashville',
    name: '1 piece',
    extraPrice: 0.00,
    isAvailable: true,
  },
  {
    id: 'modopt_nashville_3pcs',
    groupId: 'modgroup_size_nashville',
    name: '3 pieces (FREE Dipping Sauce)',
    extraPrice: 7.00,
    isAvailable: true,
  },
];

// ==================== MENU ITEMS ====================

export const MOCK_MENU: MenuItem[] = [
  // Nasi Lemak Category
  {
    id: '1',
    name: 'Nasi Lemak Ayam',
    category: 'Nasi Lemak',
    price: 6.50,
    description: 'Nasi lemak dengan ayam goreng',
    ingredients: ['nasi', 'ayam', 'sambal', 'telur', 'kacang', 'timun'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '2',
    name: 'Nasi Lemak Rendang',
    category: 'Nasi Lemak',
    price: 7.00,
    description: 'Nasi lemak dengan rendang daging',
    ingredients: ['nasi', 'daging', 'sambal', 'telur', 'kacang', 'timun'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '3',
    name: 'Nasi Lemak Biasa',
    category: 'Nasi Lemak',
    price: 4.00,
    description: 'Nasi lemak biasa dengan telur',
    ingredients: ['nasi', 'sambal', 'telur', 'kacang', 'timun'],
    isAvailable: true,
    modifierGroupIds: [],
  },

  // Burger Category
  {
    id: '4',
    name: 'Burger Ayam',
    category: 'Burger',
    price: 8.00,
    description: 'Burger ayam crispy',
    ingredients: ['bun', 'ayam', 'lettuce', 'tomato', 'mayo'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '5',
    name: 'Burger Daging',
    category: 'Burger',
    price: 9.00,
    description: 'Burger daging bakar',
    ingredients: ['bun', 'daging', 'cheese', 'lettuce', 'tomato', 'onion'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '6',
    name: 'Burger Special',
    category: 'Burger',
    price: 12.00,
    description: 'Burger double patty dengan extra cheese',
    ingredients: ['bun', 'daging', 'daging', 'cheese', 'cheese', 'lettuce', 'tomato'],
    isAvailable: true,
    modifierGroupIds: [],
  },

  // Minuman Category
  {
    id: '7',
    name: 'Teh Ais',
    category: 'Minuman',
    price: 2.50,
    description: 'Teh tarik ais',
    ingredients: ['teh', 'susu', 'gula', 'ais'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '8',
    name: 'Kopi O',
    category: 'Minuman',
    price: 2.00,
    description: 'Kopi hitam',
    ingredients: ['kopi', 'gula'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '9',
    name: 'Lime Juice',
    category: 'Minuman',
    price: 3.00,
    description: 'Air limau nipis',
    ingredients: ['limau', 'gula', 'ais'],
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '10',
    name: 'Milo Ais',
    category: 'Minuman',
    price: 3.50,
    description: 'Milo sejuk',
    ingredients: ['milo', 'susu', 'ais'],
    isAvailable: true,
    modifierGroupIds: [],
  },

  // Alacart Category
  {
    id: '11',
    name: 'Chicken Tenders XL',
    category: 'Alacart',
    price: 5.90,
    description: 'Crispy chicken tenders with free garlic mayo sauce',
    isAvailable: true,
    modifierGroupIds: ['modgroup_size_tenders'],
  },
  {
    id: '12',
    name: 'Chicken Crispy Wrap',
    category: 'Alacart',
    price: 2.90,
    description: 'Crispy chicken wrap with fresh vegetables',
    isAvailable: true,
    modifierGroupIds: ['modgroup_addon_sauce'],
  },
  {
    id: '13',
    name: 'Crispy Chicken Skin',
    category: 'Alacart',
    price: 2.00,
    description: 'Crispy fried chicken skin',
    isAvailable: true,
    modifierGroupIds: ['modgroup_flavour', 'modgroup_addon_sauce'],
  },
  {
    id: '14',
    name: 'Ayam Gunting XXXL',
    category: 'Alacart',
    price: 5.90,
    description: 'Extra large crispy fried chicken',
    isAvailable: true,
    modifierGroupIds: ['modgroup_flavour', 'modgroup_addon_sauce'],
  },
  {
    id: '15',
    name: 'Burger Crispy XXL',
    category: 'Alacart',
    price: 7.90,
    description: 'Extra large crispy chicken burger with cheese',
    isAvailable: true,
    modifierGroupIds: ['modgroup_addon_sauce'],
  },
  {
    id: '16',
    name: 'Chicken Popcorn',
    category: 'Alacart',
    price: 3.50,
    description: 'Bite-sized crispy chicken popcorn',
    isAvailable: true,
    modifierGroupIds: ['modgroup_flavour', 'modgroup_addon_sauce'],
  },
  {
    id: '17',
    name: 'Crispy Enoki',
    category: 'Alacart',
    price: 2.00,
    description: 'Crispy fried enoki mushrooms',
    isAvailable: true,
    modifierGroupIds: ['modgroup_flavour', 'modgroup_addon_sauce'],
  },
  {
    id: '18',
    name: 'Potato Bowl',
    category: 'Alacart',
    price: 3.50,
    description: 'NEW! Creamy potato bowl with special mayo topping',
    isAvailable: true,
    modifierGroupIds: [],
  },
  {
    id: '19',
    name: 'Nashville Mozzarella Cheese',
    category: 'Alacart',
    price: 3.90,
    description: 'Crispy Nashville-style mozzarella cheese sticks',
    isAvailable: true,
    modifierGroupIds: ['modgroup_size_nashville'],
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

