'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
// import { useInventory } from '@/lib/store';
import { MenuItem, ModifierGroup, ModifierOption, MenuCategory, StockItem } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  ToggleLeft,
  ToggleRight,
  Layers,
  Settings,
  FolderOpen,
  AlertCircle,
  X
} from 'lucide-react';
import {
  useMenuQuery,
  useMenuCategoriesQuery,
  useModifierGroupsQuery,
  useModifierOptionsQuery
} from '@/lib/hooks/queries/useMenuQueries';
import { useInventoryQuery } from '@/lib/hooks/queries/useInventoryQuery';
import {
  useAddMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useAddMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
  useAddModifierGroupMutation,
  useUpdateModifierGroupMutation,
  useDeleteModifierGroupMutation,
  useAddModifierOptionMutation,
  useUpdateModifierOptionMutation,
  useDeleteModifierOptionMutation
} from '@/lib/hooks/mutations/useMenuMutations';
import { useQueryClient } from '@tanstack/react-query';
import { menuKeys } from '@/lib/hooks/queries/useMenuQueries';
import { getSupabaseClient } from '@/lib/supabase/client';

type TabType = 'menu' | 'categories' | 'groups' | 'options';
type ModalType = 'add-menu' | 'edit-menu' | 'delete-menu' | 'add-group' | 'edit-group' | 'delete-group' | 'add-option' | 'edit-option' | 'delete-option' | 'add-category' | 'edit-category' | 'delete-category' | null;

export default function MenuManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Queries
  const { data: menuItems = [], isLoading: isMenuLoading } = useMenuQuery();
  const { data: menuCategories = [], isLoading: isCategoriesLoading } = useMenuCategoriesQuery();
  const { data: modifierGroups = [], isLoading: isGroupsLoading } = useModifierGroupsQuery();
  const { data: modifierOptions = [], isLoading: isOptionsLoading } = useModifierOptionsQuery();
  const { data: inventory = [] } = useInventoryQuery();

  // Mutations
  const addMenuItemMutation = useAddMenuItemMutation();
  const updateMenuItemMutation = useUpdateMenuItemMutation();
  const deleteMenuItemMutation = useDeleteMenuItemMutation();

  const addCategoryMutation = useAddMenuCategoryMutation();
  const updateCategoryMutation = useUpdateMenuCategoryMutation();
  const deleteCategoryMutation = useDeleteMenuCategoryMutation();

  const addGroupMutation = useAddModifierGroupMutation();
  const updateGroupMutation = useUpdateModifierGroupMutation();
  const deleteGroupMutation = useDeleteModifierGroupMutation();

  const addOptionMutation = useAddModifierOptionMutation();
  const updateOptionMutation = useUpdateModifierOptionMutation();
  const deleteOptionMutation = useDeleteModifierOptionMutation();

  // Inventory for linking ingredients
  // Use inventory from query

  // Realtime Subscriptions (Lightweight version)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase.channel('menu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        queryClient.invalidateQueries({ queryKey: menuKeys.items() });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modifier_groups' }, () => {
        queryClient.invalidateQueries({ queryKey: menuKeys.modifierGroups() });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modifier_options' }, () => {
        queryClient.invalidateQueries({ queryKey: menuKeys.modifierOptions() });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);
  const [selectedOption, setSelectedOption] = useState<ModifierOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Initialize from URL params on mount
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const tab = searchParams.get('tab') as TabType || 'menu';

    setSearchTerm(search);
    setFilterCategory(category);
    if (['menu', 'categories', 'groups', 'options'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = (params: { search?: string; category?: string; tab?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== '' && value !== 'menu') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Wrapped setters that also update URL
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateUrlParams({ search: value, category: filterCategory, tab: activeTab });
  };

  const handleCategoryChange = (value: string) => {
    setFilterCategory(value);
    updateUrlParams({ search: searchTerm, category: value, tab: activeTab });
  };

  const handleTabChange = (value: TabType) => {
    setActiveTab(value);
    updateUrlParams({ search: searchTerm, category: filterCategory, tab: value });
  };

  // Menu Item Form
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Nasi Lemak',
    price: 0,
    cost: 0,
    description: '',
    isAvailable: true,
    modifierGroupIds: [] as string[],
  });

  // Modifier Group Form
  const [groupForm, setGroupForm] = useState({
    name: '',
    isRequired: false,
    allowMultiple: false,
    minSelection: 0,
    maxSelection: 1,
  });

  // Modifier Option Form
  const [optionForm, setOptionForm] = useState({
    groupId: '',
    name: '',
    extraPrice: 0,
    isAvailable: true,
    ingredients: [] as { stockItemId: string; quantity: number }[],
  });

  // Ingredient Selection State (for Option Modal)
  const [selectedStockId, setSelectedStockId] = useState('');
  const [selectedStockQty, setSelectedStockQty] = useState(1);

  // Category Form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    sortOrder: 1,
    isActive: true,
  });

  // Get active categories for dropdowns
  const activeCategories = useMemo(() => {
    return menuCategories.filter((c: MenuCategory) => c.isActive);
  }, [menuCategories]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, filterCategory]);

  // Get unique categories from menu items
  const categories = useMemo(() => {
    // Combine active categories with any categories from existing menu items
    const activeCatNames = activeCategories.map((c: MenuCategory) => c.name);
    const menuCats = new Set(menuItems.map(item => item.category));
    const allCats = new Set([...activeCatNames, ...menuCats]);
    return ['All', ...Array.from(allCats)];
  }, [menuItems, activeCategories]);

  // Modal handlers
  const openAddMenuModal = () => {
    setMenuForm({
      name: '',
      category: activeCategories[0]?.name || 'Uncategorized',
      price: 0,
      cost: 0,
      description: '',
      isAvailable: true,
      modifierGroupIds: [],
    });
    setModalType('add-menu');
  };

  const openEditMenuModal = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      cost: (item as any).cost || 0,
      description: item.description || '',
      isAvailable: item.isAvailable,
      modifierGroupIds: item.modifierGroupIds,
    });
    setModalType('edit-menu');
  };

  const openDeleteMenuModal = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setModalType('delete-menu');
  };

  const openAddGroupModal = () => {
    setGroupForm({
      name: '',
      isRequired: false,
      allowMultiple: false,
      minSelection: 0,
      maxSelection: 1,
    });
    setModalType('add-group');
  };

  const openEditGroupModal = (group: ModifierGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      isRequired: group.isRequired,
      allowMultiple: group.allowMultiple,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
    });
    setModalType('edit-group');
  };

  const openDeleteGroupModal = (group: ModifierGroup) => {
    setSelectedGroup(group);
    setModalType('delete-group');
  };

  const openAddOptionModal = (groupId?: string) => {
    setOptionForm({
      groupId: groupId || (modifierGroups[0]?.id || ''),
      name: '',
      extraPrice: 0,
      isAvailable: true,
      ingredients: [],
    });
    setSelectedStockId('');
    setSelectedStockQty(1);
    setModalType('add-option');
  };

  const openEditOptionModal = (option: ModifierOption) => {
    setSelectedOption(option);
    setOptionForm({
      groupId: option.groupId,
      name: option.name,
      extraPrice: option.extraPrice,
      isAvailable: option.isAvailable,
      ingredients: option.ingredients || [],
    });
    setSelectedStockId('');
    setSelectedStockQty(1);
    setModalType('edit-option');
  };

  const openDeleteOptionModal = (option: ModifierOption) => {
    setSelectedOption(option);
    setModalType('delete-option');
  };

  // Category Modal Openers
  const openAddCategoryModal = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3b82f6',
      sortOrder: menuCategories.length + 1,
      isActive: true,
    });
    setModalType('add-category');
  };

  const openEditCategoryModal = (category: MenuCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setModalType('edit-category');
  };

  const openDeleteCategoryModal = (category: MenuCategory) => {
    setSelectedCategory(category);
    setModalType('delete-category');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedMenuItem(null);
    setSelectedGroup(null);
    setSelectedOption(null);
    setSelectedCategory(null);
  };

  // Menu Item Handlers
  const handleAddMenuItem = async () => {
    if (!menuForm.name.trim()) return alert('Sila masukkan nama menu');
    if (menuForm.price < 0) return alert('Sila masukkan harga yang sah');

    await addMenuItemMutation.mutateAsync({
      name: menuForm.name.trim(),
      category: menuForm.category,
      price: menuForm.price,
      cost: menuForm.cost,
      description: menuForm.description.trim() || undefined,
      isAvailable: menuForm.isAvailable,
      modifierGroupIds: menuForm.modifierGroupIds,
    });

    closeModal();
  };

  const handleEditMenuItem = async () => {
    if (!selectedMenuItem || !menuForm.name.trim()) return;

    await updateMenuItemMutation.mutateAsync({
      id: selectedMenuItem.id,
      updates: {
        name: menuForm.name.trim(),
        category: menuForm.category,
        price: menuForm.price,
        cost: menuForm.cost,
        description: menuForm.description.trim() || undefined,
        isAvailable: menuForm.isAvailable,
        modifierGroupIds: menuForm.modifierGroupIds,
      }
    });

    closeModal();
  };

  const handleDeleteMenuItem = async () => {
    if (!selectedMenuItem) return;
    await deleteMenuItemMutation.mutateAsync(selectedMenuItem.id);
    closeModal();
  };

  const toggleMenuItemAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (item) {
      await updateMenuItemMutation.mutateAsync({
        id,
        updates: { isAvailable: !item.isAvailable }
      });
    }
  };

  // Modifier Group Handlers
  const handleAddGroup = async () => {
    if (!groupForm.name.trim()) return alert('Sila masukkan nama group');

    await addGroupMutation.mutateAsync({
      name: groupForm.name.trim(),
      isRequired: groupForm.isRequired,
      allowMultiple: groupForm.allowMultiple,
      minSelection: groupForm.minSelection,
      maxSelection: groupForm.maxSelection,
    });

    closeModal();
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !groupForm.name.trim()) return;

    await updateGroupMutation.mutateAsync({
      id: selectedGroup.id,
      updates: {
        name: groupForm.name.trim(),
        isRequired: groupForm.isRequired,
        allowMultiple: groupForm.allowMultiple,
        minSelection: groupForm.minSelection,
        maxSelection: groupForm.maxSelection,
      }
    });

    closeModal();
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    await deleteGroupMutation.mutateAsync(selectedGroup.id);
    closeModal();
  };

  // Modifier Option Handlers
  const handleAddOption = async () => {
    if (!optionForm.name.trim() || !optionForm.groupId) {
      return alert('Sila masukkan nama option dan pilih group');
    }

    await addOptionMutation.mutateAsync({
      groupId: optionForm.groupId,
      name: optionForm.name.trim(),
      extraPrice: optionForm.extraPrice,
      isAvailable: optionForm.isAvailable,
      ingredients: optionForm.ingredients,
    });

    closeModal();
  };

  const handleEditOption = async () => {
    if (!selectedOption || !optionForm.name.trim()) return;

    await updateOptionMutation.mutateAsync({
      id: selectedOption.id,
      updates: {
        groupId: optionForm.groupId,
        name: optionForm.name.trim(),
        extraPrice: optionForm.extraPrice,
        isAvailable: optionForm.isAvailable,
        ingredients: optionForm.ingredients,
      }
    });

    closeModal();
  };

  const handleAddIngredient = () => {
    if (!selectedStockId || selectedStockQty <= 0) return;
    if (optionForm.ingredients.some(i => i.stockItemId === selectedStockId)) {
      alert('Ingredient already added');
      return;
    }
    setOptionForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { stockItemId: selectedStockId, quantity: selectedStockQty }]
    }));
    setSelectedStockId('');
    setSelectedStockQty(1);
  };

  const handleRemoveIngredient = (index: number) => {
    setOptionForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteOption = async () => {
    if (!selectedOption) return;
    await deleteOptionMutation.mutateAsync(selectedOption.id);
    closeModal();
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return alert('Sila masukkan nama kategori');

    await addCategoryMutation.mutateAsync({
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
      color: categoryForm.color,
      sortOrder: categoryForm.sortOrder,
      isActive: categoryForm.isActive,
    });

    closeModal();
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryForm.name.trim()) return;

    await updateCategoryMutation.mutateAsync({
      id: selectedCategory.id,
      updates: {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        color: categoryForm.color,
        sortOrder: categoryForm.sortOrder,
        isActive: categoryForm.isActive,
      }
    });

    closeModal();
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    const itemsUsingCategory = menuItems.filter(item => item.category === selectedCategory.name);
    if (itemsUsingCategory.length > 0) {
      alert(`Tidak boleh padam kategori ini. ${itemsUsingCategory.length} menu item masih menggunakan kategori ini.`);
      return;
    }

    await deleteCategoryMutation.mutateAsync(selectedCategory.id);
    closeModal();
  };

  // Helper to get options for a group
  const getOptionsForGroup = (groupId: string) => {
    return modifierOptions.filter(o => o.groupId === groupId);
  };

  // Toggle modifier group in menu item form
  const toggleModifierGroup = (groupId: string) => {
    setMenuForm(prev => ({
      ...prev,
      modifierGroupIds: prev.modifierGroupIds.includes(groupId)
        ? prev.modifierGroupIds.filter(id => id !== groupId)
        : [...prev.modifierGroupIds, groupId]
    }));
  };

  const isAnyLoading = isMenuLoading || isCategoriesLoading || isGroupsLoading || isOptionsLoading;

  if (isAnyLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Common Modal Props
  const modalProps = {
    isOpen: !!modalType,
    onClose: closeModal,
    title: ''
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'add-menu':
      case 'edit-menu':
        modalProps.title = modalType === 'add-menu' ? 'Tambah Menu' : 'Edit Menu';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              {/* Form Fields - Reused from previous implementation */}
              <div className="form-group">
                <label className="form-label">Nama Menu *</label>
                <input
                  type="text"
                  className="form-input"
                  value={menuForm.name}
                  onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="Contoh: Nasi Lemak Ayam"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-select"
                    value={menuForm.category}
                    onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                  >
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Harga (BND) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cost (BND)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={menuForm.cost}
                  onChange={e => setMenuForm({ ...menuForm, cost: parseFloat(e.target.value) })}
                  placeholder="Optional cost price"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="form-textarea"
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modifier Groups</label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {modifierGroups.map(group => (
                    <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={menuForm.modifierGroupIds.includes(group.id)}
                        onChange={() => toggleModifierGroup(group.id)}
                      />
                      <span>{group.name}</span>
                    </label>
                  ))}
                  {modifierGroups.length === 0 && (
                    <div className="text-sm text-gray-500 italic">Tiada modifier groups</div>
                  )}
                </div>
              </div>

              <div className="form-checkbox">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isAvailable}
                    onChange={e => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  />
                  <span>Available untuk dipesan</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-primary"
                  onClick={modalType === 'add-menu' ? handleAddMenuItem : handleEditMenuItem}
                  disabled={addMenuItemMutation.isPending || updateMenuItemMutation.isPending}
                >
                  {addMenuItemMutation.isPending || updateMenuItemMutation.isPending ? 'Processing...' : 'Simpan'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'delete-menu':
        modalProps.title = 'Padam Menu';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <p>Adakah anda pasti ingin memadam menu <b>{selectedMenuItem?.name}</b>?</p>
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span>Tindakan ini tidak boleh dikembalikan.</span>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteMenuItem}
                  disabled={deleteMenuItemMutation.isPending}
                >
                  {deleteMenuItemMutation.isPending ? 'Deleting...' : 'Padam'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'add-group':
      case 'edit-group':
        modalProps.title = modalType === 'add-group' ? 'Tambah Modifier Group' : 'Edit Modifier Group';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Group *</label>
                <input
                  type="text"
                  className="form-input"
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Contoh: Pilih Sos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Minimum Selection</label>
                  <input
                    type="number"
                    className="form-input"
                    value={groupForm.minSelection}
                    onChange={e => setGroupForm({ ...groupForm, minSelection: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Selection</label>
                  <input
                    type="number"
                    className="form-input"
                    value={groupForm.maxSelection}
                    onChange={e => setGroupForm({ ...groupForm, maxSelection: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupForm.isRequired}
                    onChange={e => setGroupForm({ ...groupForm, isRequired: e.target.checked })}
                  />
                  <span>Wajib pilih (Required)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupForm.allowMultiple}
                    onChange={e => setGroupForm({ ...groupForm, allowMultiple: e.target.checked })}
                  />
                  <span>Boleh pilih lebih dari satu (Multiple)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-primary"
                  onClick={modalType === 'add-group' ? handleAddGroup : handleEditGroup}
                  disabled={addGroupMutation.isPending || updateGroupMutation.isPending}
                >
                  {addGroupMutation.isPending || updateGroupMutation.isPending ? 'Processing...' : 'Simpan'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'delete-group':
        modalProps.title = 'Padam Modifier Group';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <p>Adakah anda pasti ingin memadam group <b>{selectedGroup?.name}</b>?</p>
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span>Semua options dalam group ini juga akan dipadam.</span>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteGroup}
                  disabled={deleteGroupMutation.isPending}
                >
                  {deleteGroupMutation.isPending ? 'Deleting...' : 'Padam'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'add-option':
      case 'edit-option':
        modalProps.title = modalType === 'add-option' ? 'Tambah Option' : 'Edit Option';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div className="form-group">
                <label className="form-label">Modifier Group</label>
                <select
                  className="form-select"
                  value={optionForm.groupId}
                  onChange={e => setOptionForm({ ...optionForm, groupId: e.target.value })}
                  disabled={modalType === 'edit-option'}
                >
                  {modifierGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Option *</label>
                <input
                  type="text"
                  className="form-input"
                  value={optionForm.name}
                  onChange={e => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="Contoh: Sos Cili"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Harga Tambahan (BND)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={optionForm.extraPrice}
                  onChange={e => setOptionForm({ ...optionForm, extraPrice: parseFloat(e.target.value) })}
                />
              </div>

              <div className="form-checkbox">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optionForm.isAvailable}
                    onChange={e => setOptionForm({ ...optionForm, isAvailable: e.target.checked })}
                  />
                  <span>Available</span>
                </label>
              </div>

              {/* Ingredient Linking */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2 text-sm">Link Ingredients (Optional)</h4>
                <div className="flex gap-2 mb-2">
                  <select
                    className="form-select text-sm"
                    value={selectedStockId}
                    onChange={e => setSelectedStockId(e.target.value)}
                  >
                    <option value="">Pilih Stock Effect</option>
                    {inventory.map((item: StockItem) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-input w-20 text-sm"
                    value={selectedStockQty}
                    onChange={e => setSelectedStockQty(parseFloat(e.target.value))}
                    min="0.1"
                    step="0.1"
                  />
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddIngredient}>
                    <Plus size={14} />
                  </button>
                </div>

                {optionForm.ingredients.length > 0 && (
                  <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                    {optionForm.ingredients.map((ing, idx) => {
                      const stockItem = inventory.find((i: StockItem) => i.id === ing.stockItemId);
                      return (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{stockItem?.name || 'Unknown'} × {ing.quantity} {stockItem?.unit}</span>
                          <button type="button" onClick={() => handleRemoveIngredient(idx)} className="text-red-500 hover:text-red-700">
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-primary"
                  onClick={modalType === 'add-option' ? handleAddOption : handleEditOption}
                  disabled={addOptionMutation.isPending || updateOptionMutation.isPending}
                >
                  {addOptionMutation.isPending || updateOptionMutation.isPending ? 'Processing...' : 'Simpan'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'delete-option':
        modalProps.title = 'Padam Option';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <p>Adakah anda pasti ingin memadam option <b>{selectedOption?.name}</b>?</p>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteOption}
                  disabled={deleteOptionMutation.isPending}
                >
                  {deleteOptionMutation.isPending ? 'Deleting...' : 'Padam'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'add-category':
      case 'edit-category':
        modalProps.title = modalType === 'add-category' ? 'Tambah Kategori' : 'Edit Kategori';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Kategori *</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Urutan (Sort Order)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={categoryForm.sortOrder}
                    onChange={e => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warna Label</label>
                  <input
                    type="color"
                    className="form-input h-10 w-full p-1"
                    value={categoryForm.color}
                    onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-checkbox">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={e => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  />
                  <span>Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-primary"
                  onClick={modalType === 'add-category' ? handleAddCategory : handleEditCategory}
                  disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {addCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Processing...' : 'Simpan'}
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'delete-category':
        modalProps.title = 'Padam Kategori';
        return (
          <Modal {...modalProps}>
            <div className="space-y-4">
              <p>Adakah anda pasti ingin memadam kategori <b>{selectedCategory?.name}</b>?</p>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteCategory}
                  disabled={deleteCategoryMutation.isPending}
                >
                  {deleteCategoryMutation.isPending ? 'Deleting...' : 'Padam'}
                </button>
              </div>
            </div>
          </Modal>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                Pengurusan Menu
              </h1>
              <p className="page-subtitle">
                Urus menu items, modifier groups dan options
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-200)', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '1rem' }}>
          <button
            onClick={() => handleTabChange('menu')}
            className={`btn btn-sm ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline'}`}
          >
            <UtensilsCrossed size={16} />
            Menu Items ({menuItems.length})
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`btn btn-sm ${activeTab === 'categories' ? 'btn-primary' : 'btn-outline'}`}
          >
            <FolderOpen size={16} />
            Kategori ({menuCategories.length})
          </button>
          <button
            onClick={() => handleTabChange('groups')}
            className={`btn btn-sm ${activeTab === 'groups' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Layers size={16} />
            Modifier Groups ({modifierGroups.length})
          </button>
          <button
            onClick={() => handleTabChange('options')}
            className={`btn btn-sm ${activeTab === 'options' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Settings size={16} />
            Options ({modifierOptions.length})
          </button>
        </div>

        {/* Menu Items Tab */}
        {activeTab === 'menu' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari menu..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ paddingLeft: '2rem', width: '200px' }}
                  />
                </div>
                <select
                  className="form-select"
                  value={filterCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={openAddMenuModal}>
                <Plus size={18} />
                Tambah Menu
              </button>
            </div>

            {filteredMenuItems.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="card hidden md:block">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Menu</th>
                          <th>Kategori</th>
                          <th>Harga</th>
                          <th>Modifiers</th>
                          <th>Status</th>
                          <th>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMenuItems.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                              {item.description && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-info">{item.category}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>BND {item.price.toFixed(2)}</td>
                            <td>
                              {item.modifierGroupIds.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                  {item.modifierGroupIds.map(gid => {
                                    const group = modifierGroups.find(g => g.id === gid);
                                    return group ? (
                                      <span key={gid} className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                        {group.name}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => toggleMenuItemAvailability(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: item.isAvailable ? 'var(--success)' : 'var(--danger)'
                                }}
                              >
                                {item.isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                <span style={{ fontSize: '0.75rem' }}>
                                  {item.isAvailable ? 'Available' : 'Sold Out'}
                                </span>
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openEditMenuModal(item)}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openDeleteMenuModal(item)}
                                  style={{ color: 'var(--danger)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredMenuItems.map(item => (
                    <div key={item.id} className="card p-4">
                      {/* Header: Name & Price */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{item.name}</h3>
                          <span className="badge badge-info mt-1">{item.category}</span>
                        </div>
                        <div className="text-xl font-bold text-primary">
                          BND {item.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="border-t border-gray-100 dark:border-gray-800 my-3"></div>

                      {/* Modifiers Section */}
                      {item.modifierGroupIds.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Modifiers</p>
                          <div className="flex flex-wrap gap-2">
                            {item.modifierGroupIds.map(gid => {
                              const group = modifierGroups.find(g => g.id === gid);
                              return group ? (
                                <span key={gid} className="badge badge-warning text-xs">
                                  {group.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between mt-4 gap-3">
                        {/* Status Toggle */}
                        <button
                          onClick={() => toggleMenuItemAvailability(item.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${item.isAvailable
                            ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                            : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                            }`}
                        >
                          {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          <span className="text-sm font-medium">
                            {item.isAvailable ? 'Available' : 'Sold Out'}
                          </span>
                        </button>

                        <div className="flex gap-2">
                          <button
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => openEditMenuModal(item)}
                          >
                            <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            className="p-2 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                            onClick={() => openDeleteMenuModal(item)}
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card text-center p-8">
                <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-4" />
                <h3>Tiada menu dijumpai</h3>
                <p className="text-gray-500">Cuba ubah filter atau tambah menu baru.</p>
              </div>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={openAddCategoryModal}>
                <Plus size={18} />
                Tambah Kategori
              </button>
            </div>

            <div className="card">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Urutan</th>
                      <th>Nama Kategori</th>
                      <th>Deskripsi</th>
                      <th>Status</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuCategories.map(cat => (
                      <tr key={cat.id}>
                        <td>{cat.sortOrder}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              style={{ width: 12, height: 12, borderRadius: 2, background: cat.color }}
                            />
                            <span className="font-semibold">{cat.name}</span>
                          </div>
                        </td>
                        <td>{cat.description || '-'}</td>
                        <td>
                          {cat.isActive ? (
                            <span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded">Aktif</span>
                          ) : (
                            <span className="text-gray-500 text-xs font-bold border border-gray-200 bg-gray-50 px-2 py-1 rounded">Tidak Aktif</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => openEditCategoryModal(cat)} className="btn btn-sm btn-outline"><Edit2 size={14} /></button>
                            <button onClick={() => openDeleteCategoryModal(cat)} className="btn btn-sm btn-outline text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={openAddGroupModal}>
                <Plus size={18} />
                Tambah Group
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modifierGroups.map(group => (
                <div key={group.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{group.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => openEditGroupModal(group)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => openDeleteGroupModal(group)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Selection:</span>
                      <span className="font-mono">{group.minSelection} - {group.maxSelection}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {group.isRequired && <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded border border-red-100">Required</span>}
                      {group.allowMultiple && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded border border-blue-100">Multi-select</span>}
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-gray-400 mb-1">Options:</div>
                    <div className="flex flex-wrap gap-1">
                      {getOptionsForGroup(group.id).map(opt => (
                        <span key={opt.id} className="text-xs bg-gray-100 px-2 py-1 rounded">{opt.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => openAddOptionModal()}>
                <Plus size={18} />
                Tambah Option
              </button>
            </div>

            <div className="card">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Option</th>
                      <th>Group</th>
                      <th>Extra Price</th>
                      <th>Ingredients</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modifierOptions.map(opt => {
                      const group = modifierGroups.find(g => g.id === opt.groupId);
                      return (
                        <tr key={opt.id}>
                          <td className="font-medium">{opt.name}</td>
                          <td><span className="badge badge-info">{group?.name || 'Unknown Group'}</span></td>
                          <td>{opt.extraPrice > 0 ? `+ BND ${opt.extraPrice.toFixed(2)}` : 'Free'}</td>
                          <td>
                            {opt.ingredients && opt.ingredients.length > 0 ? (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                {opt.ingredients.length} items linked
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button onClick={() => openEditOptionModal(opt)} className="btn btn-sm btn-outline"><Edit2 size={14} /></button>
                              <button onClick={() => openDeleteOptionModal(opt)} className="btn btn-sm btn-outline text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Modal Renderer */}
      {renderModalContent()}
    </MainLayout>
  );
}
