'use client';

import { useEffect, useState } from 'react';
import { useSetup, MenuCategory, SetupMenuItem } from '@/lib/contexts/SetupContext';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  UtensilsCrossed,
  Coffee,
  Cake,
  Wine,
  Pizza,
  Salad,
  X,
  Check,
  FolderPlus,
  Tag
} from 'lucide-react';

interface Props {
  onValidChange: (isValid: boolean) => void;
}

const CATEGORY_ICONS = [
  { id: 'utensils', icon: UtensilsCrossed, label: 'Makanan' },
  { id: 'coffee', icon: Coffee, label: 'Minuman' },
  { id: 'cake', icon: Cake, label: 'Pencuci Mulut' },
  { id: 'wine', icon: Wine, label: 'Alkohol' },
  { id: 'pizza', icon: Pizza, label: 'Pizza/Fast Food' },
  { id: 'salad', icon: Salad, label: 'Sihat' },
];

const SAMPLE_CATEGORIES: MenuCategory[] = [
  { id: 'main', name: 'Hidangan Utama', icon: 'utensils' },
  { id: 'drinks', name: 'Minuman', icon: 'coffee' },
  { id: 'desserts', name: 'Pencuci Mulut', icon: 'cake' },
];

export default function MenuSetupStep({ onValidChange }: Props) {
  const { setupData, updateMenuCategories, updateMenuItems } = useSetup();
  const { menuCategories, menuItems } = setupData;
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<SetupMenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('utensils');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  // Always valid - menu is optional
  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  // Load sample categories if empty
  useEffect(() => {
    if (menuCategories.length === 0) {
      updateMenuCategories(SAMPLE_CATEGORIES);
    }
  }, []);

  const handleAddCategory = () => {
    if (!categoryName.trim()) return;
    
    const newCategory: MenuCategory = {
      id: editingCategory?.id || `cat_${Date.now()}`,
      name: categoryName,
      icon: categoryIcon,
    };
    
    if (editingCategory) {
      updateMenuCategories(menuCategories.map(c => c.id === editingCategory.id ? newCategory : c));
    } else {
      updateMenuCategories([...menuCategories, newCategory]);
    }
    
    resetCategoryForm();
  };

  const handleDeleteCategory = (id: string) => {
    updateMenuCategories(menuCategories.filter(c => c.id !== id));
    // Also remove items in this category
    updateMenuItems(menuItems.filter(i => i.category !== id));
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIcon(category.icon || 'utensils');
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('utensils');
  };

  const handleAddItem = () => {
    if (!itemName.trim() || !itemPrice || !itemCategory) return;
    
    const newItem: SetupMenuItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      description: itemDescription,
    };
    
    if (editingItem) {
      updateMenuItems(menuItems.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      updateMenuItems([...menuItems, newItem]);
    }
    
    resetItemForm();
  };

  const handleDeleteItem = (id: string) => {
    updateMenuItems(menuItems.filter(i => i.id !== id));
  };

  const handleEditItem = (item: SetupMenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.category);
    setItemDescription(item.description || '');
    setShowItemForm(true);
  };

  const resetItemForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategory(menuCategories[0]?.id || '');
    setItemDescription('');
  };

  const getCategoryIcon = (iconId?: string) => {
    const found = CATEGORY_ICONS.find(i => i.id === iconId);
    return found?.icon || UtensilsCrossed;
  };

  const filteredItems = selectedCategory 
    ? menuItems.filter(i => i.category === selectedCategory)
    : menuItems;

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-teal-500" />
            Kategori Menu
          </h3>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-4">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nama Kategori</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="cth: Hidangan Utama"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Ikon</label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_ICONS.map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCategoryIcon(id)}
                        className={`p-3 rounded-xl transition-all ${
                          categoryIcon === id 
                            ? 'bg-teal-500 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                        title={label}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetCategoryForm}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={!categoryName.trim()}
                    className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingCategory ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="flex gap-2 flex-wrap">
          {menuCategories.map(category => {
            const Icon = getCategoryIcon(category.icon);
            const itemCount = menuItems.filter(i => i.category === category.id).length;
            return (
              <div
                key={category.id}
                className={`
                  group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer
                  ${selectedCategory === category.id 
                    ? 'bg-teal-500/20 border-teal-500 text-teal-400' 
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }
                `}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-slate-500">({itemCount})</span>
                <div className="hidden group-hover:flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                    className="p-1 hover:bg-slate-600 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-500" />
            Item Menu
            {selectedCategory && (
              <span className="text-sm font-normal text-slate-400">
                - {menuCategories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
          </h3>
          <button
            onClick={() => {
              setItemCategory(selectedCategory || menuCategories[0]?.id || '');
              setShowItemForm(true);
            }}
            disabled={menuCategories.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Tambah Item
          </button>
        </div>

        {/* Item Form Modal */}
        {showItemForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-4">
                {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nama Item *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="cth: Nasi Lemak Special"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Harga (RM) *</label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Kategori *</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {menuCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Penerangan (Pilihan)</label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Penerangan ringkas tentang item..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetItemForm}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!itemName.trim() || !itemPrice || !itemCategory}
                    className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingItem ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-700/30 rounded-xl">
            <UtensilsCrossed className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">
              {menuCategories.length === 0 
                ? 'Sila tambah kategori dahulu'
                : selectedCategory 
                  ? 'Tiada item dalam kategori ini'
                  : 'Belum ada item menu. Klik "Tambah Item" untuk mula.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const category = menuCategories.find(c => c.id === item.category);
              return (
                <div
                  key={item.id}
                  className="group bg-slate-700/30 border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">{item.name}</h4>
                      <span className="text-xs text-slate-500">{category?.name}</span>
                    </div>
                    <span className="text-lg font-bold text-teal-400">
                      RM {item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="flex-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-center justify-between">
        <span className="text-teal-400">Ringkasan Menu</span>
        <div className="flex gap-6 text-sm">
          <span className="text-slate-300">
            <span className="font-bold text-white">{menuCategories.length}</span> Kategori
          </span>
          <span className="text-slate-300">
            <span className="font-bold text-white">{menuItems.length}</span> Item
          </span>
        </div>
      </div>
    </div>
  );
}




