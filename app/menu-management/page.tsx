'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useMenu } from '@/lib/store';
import { MenuItem, ModifierGroup, ModifierOption } from '@/lib/types';
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
  DollarSign,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

type TabType = 'menu' | 'groups' | 'options';
type ModalType = 'add-menu' | 'edit-menu' | 'delete-menu' | 'add-group' | 'edit-group' | 'delete-group' | 'add-option' | 'edit-option' | 'delete-option' | null;

const MENU_CATEGORIES = ['Nasi Lemak', 'Burger', 'Minuman', 'Sides', 'Dessert', 'Alacart'];

export default function MenuManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { 
    menuItems, 
    modifierGroups, 
    modifierOptions,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    addModifierOption,
    updateModifierOption,
    deleteModifierOption,
    getOptionsForGroup,
    isInitialized 
  } = useMenu();

  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);
  const [selectedOption, setSelectedOption] = useState<ModifierOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Initialize from URL params on mount
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const tab = searchParams.get('tab') as TabType || 'menu';
    
    setSearchTerm(search);
    setFilterCategory(category);
    if (['menu', 'groups', 'options'].includes(tab)) {
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
  });

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
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  // Modal handlers
  const openAddMenuModal = () => {
    setMenuForm({
      name: '',
      category: 'Nasi Lemak',
      price: 0,
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
    });
    setModalType('add-option');
  };

  const openEditOptionModal = (option: ModifierOption) => {
    setSelectedOption(option);
    setOptionForm({
      groupId: option.groupId,
      name: option.name,
      extraPrice: option.extraPrice,
      isAvailable: option.isAvailable,
    });
    setModalType('edit-option');
  };

  const openDeleteOptionModal = (option: ModifierOption) => {
    setSelectedOption(option);
    setModalType('delete-option');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedMenuItem(null);
    setSelectedGroup(null);
    setSelectedOption(null);
    setIsProcessing(false);
  };

  // Menu Item Handlers
  const handleAddMenuItem = async () => {
    if (!menuForm.name.trim()) {
      alert('Sila masukkan nama menu');
      return;
    }
    if (menuForm.price <= 0) {
      alert('Sila masukkan harga yang sah');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addMenuItem({
      name: menuForm.name.trim(),
      category: menuForm.category,
      price: menuForm.price,
      description: menuForm.description.trim() || undefined,
      isAvailable: menuForm.isAvailable,
      modifierGroupIds: menuForm.modifierGroupIds,
    });

    closeModal();
  };

  const handleEditMenuItem = async () => {
    if (!selectedMenuItem || !menuForm.name.trim()) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateMenuItem(selectedMenuItem.id, {
      name: menuForm.name.trim(),
      category: menuForm.category,
      price: menuForm.price,
      description: menuForm.description.trim() || undefined,
      isAvailable: menuForm.isAvailable,
      modifierGroupIds: menuForm.modifierGroupIds,
    });

    closeModal();
  };

  const handleDeleteMenuItem = async () => {
    if (!selectedMenuItem) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteMenuItem(selectedMenuItem.id);
    closeModal();
  };

  // Modifier Group Handlers
  const handleAddGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Sila masukkan nama group');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addModifierGroup({
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

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateModifierGroup(selectedGroup.id, {
      name: groupForm.name.trim(),
      isRequired: groupForm.isRequired,
      allowMultiple: groupForm.allowMultiple,
      minSelection: groupForm.minSelection,
      maxSelection: groupForm.maxSelection,
    });

    closeModal();
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteModifierGroup(selectedGroup.id);
    closeModal();
  };

  // Modifier Option Handlers
  const handleAddOption = async () => {
    if (!optionForm.name.trim() || !optionForm.groupId) {
      alert('Sila masukkan nama option dan pilih group');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addModifierOption({
      groupId: optionForm.groupId,
      name: optionForm.name.trim(),
      extraPrice: optionForm.extraPrice,
      isAvailable: optionForm.isAvailable,
    });

    closeModal();
  };

  const handleEditOption = async () => {
    if (!selectedOption || !optionForm.name.trim()) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateModifierOption(selectedOption.id, {
      groupId: optionForm.groupId,
      name: optionForm.name.trim(),
      extraPrice: optionForm.extraPrice,
      isAvailable: optionForm.isAvailable,
    });

    closeModal();
  };

  const handleDeleteOption = async () => {
    if (!selectedOption) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteModifierOption(selectedOption.id);
    closeModal();
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

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Pengurusan Menu
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Urus menu items, modifier groups dan options
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => handleTabChange('menu')}
            className={`btn btn-sm ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline'}`}
          >
            <UtensilsCrossed size={16} />
            Menu Items ({menuItems.length})
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
              <div className="card">
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
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <UtensilsCrossed size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {searchTerm ? 'Tiada menu dijumpai' : 'Belum ada menu items'}
                </p>
                <button className="btn btn-primary" onClick={openAddMenuModal}>
                  <Plus size={18} />
                  Tambah Menu Pertama
                </button>
              </div>
            )}
          </>
        )}

        {/* Modifier Groups Tab */}
        {activeTab === 'groups' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={openAddGroupModal}>
                <Plus size={18} />
                Tambah Group
              </button>
            </div>

            {modifierGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
                {modifierGroups.map(group => {
                  const options = getOptionsForGroup(group.id);
                  return (
                    <div key={group.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                            {group.name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {group.isRequired && (
                              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Wajib</span>
                            )}
                            {group.allowMultiple && (
                              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Multiple</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openEditGroupModal(group)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openDeleteGroupModal(group)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Min: {group.minSelection} | Max: {group.maxSelection}
                        </div>
                      </div>

                      <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        Options ({options.length})
                      </div>
                      {options.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {options.map(opt => (
                            <div 
                              key={opt.id}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                background: opt.isAvailable ? 'var(--gray-50)' : '#fee2e2',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem'
                              }}
                            >
                              <span style={{ opacity: opt.isAvailable ? 1 : 0.6 }}>{opt.name}</span>
                              <span style={{ fontWeight: 600, color: opt.extraPrice > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                                {opt.extraPrice > 0 ? `+BND ${opt.extraPrice.toFixed(2)}` : 'Free'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem' }}>
                          Tiada options
                        </p>
                      )}

                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openAddOptionModal(group.id)}
                        style={{ width: '100%', marginTop: '1rem' }}
                      >
                        <Plus size={14} />
                        Tambah Option
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Layers size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Belum ada modifier groups
                </p>
                <button className="btn btn-primary" onClick={openAddGroupModal}>
                  <Plus size={18} />
                  Tambah Group Pertama
                </button>
              </div>
            )}
          </>
        )}

        {/* Modifier Options Tab */}
        {activeTab === 'options' && (
          <>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => openAddOptionModal()}>
                <Plus size={18} />
                Tambah Option
              </button>
            </div>

            {modifierOptions.length > 0 ? (
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Group</th>
                      <th>Harga Tambahan</th>
                      <th>Status</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modifierOptions.map(option => {
                      const group = modifierGroups.find(g => g.id === option.groupId);
                      return (
                        <tr key={option.id}>
                          <td style={{ fontWeight: 600 }}>{option.name}</td>
                          <td>
                            <span className="badge badge-info">{group?.name || 'Unknown'}</span>
                          </td>
                          <td>
                            {option.extraPrice > 0 ? (
                              <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                +BND {option.extraPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>Percuma</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${option.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                              {option.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openEditOptionModal(option)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openDeleteOptionModal(option)}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Settings size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Belum ada modifier options
                </p>
                <button className="btn btn-primary" onClick={() => openAddOptionModal()}>
                  <Plus size={18} />
                  Tambah Option Pertama
                </button>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Menu Modal */}
        <Modal
          isOpen={modalType === 'add-menu' || modalType === 'edit-menu'}
          onClose={closeModal}
          title={modalType === 'add-menu' ? 'Tambah Menu Baru' : 'Edit Menu'}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Nama Menu *</label>
            <input
              type="text"
              className="form-input"
              value={menuForm.name}
              onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Nasi Lemak Special"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={menuForm.category}
                onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {MENU_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Harga (BND) *</label>
              <input
                type="number"
                className="form-input"
                value={menuForm.price}
                onChange={(e) => setMenuForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <textarea
              className="form-input"
              value={menuForm.description}
              onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Penerangan menu..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setMenuForm(prev => ({ ...prev, isAvailable: true }))}
                className={`btn ${menuForm.isAvailable ? 'btn-success' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <Check size={16} />
                Available
              </button>
              <button
                type="button"
                onClick={() => setMenuForm(prev => ({ ...prev, isAvailable: false }))}
                className={`btn ${!menuForm.isAvailable ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <X size={16} />
                Sold Out
              </button>
            </div>
          </div>

          {modifierGroups.length > 0 && (
            <div className="form-group">
              <label className="form-label">Modifier Groups</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {modifierGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleModifierGroup(group.id)}
                    className={`btn btn-sm ${menuForm.modifierGroupIds.includes(group.id) ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {menuForm.modifierGroupIds.includes(group.id) ? <Check size={14} /> : <Plus size={14} />}
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-menu' ? handleAddMenuItem : handleEditMenuItem}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : modalType === 'add-menu' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Menu Modal */}
        <Modal
          isOpen={modalType === 'delete-menu'}
          onClose={closeModal}
          title="Padam Menu"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: '#fee2e2', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam <strong>{selectedMenuItem?.name}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteMenuItem} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>

        {/* Add/Edit Group Modal */}
        <Modal
          isOpen={modalType === 'add-group' || modalType === 'edit-group'}
          onClose={closeModal}
          title={modalType === 'add-group' ? 'Tambah Modifier Group' : 'Edit Modifier Group'}
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Nama Group *</label>
            <input
              type="text"
              className="form-input"
              value={groupForm.name}
              onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Pilih Sos, Pilih Flavour"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Wajib Pilih?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setGroupForm(prev => ({ ...prev, isRequired: false }))}
                className={`btn ${!groupForm.isRequired ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Optional
              </button>
              <button
                type="button"
                onClick={() => setGroupForm(prev => ({ ...prev, isRequired: true, minSelection: Math.max(1, prev.minSelection) }))}
                className={`btn ${groupForm.isRequired ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <AlertCircle size={16} />
                Wajib
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Boleh Pilih Lebih Dari Satu?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setGroupForm(prev => ({ ...prev, allowMultiple: false, maxSelection: 1 }))}
                className={`btn ${!groupForm.allowMultiple ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Single Select
              </button>
              <button
                type="button"
                onClick={() => setGroupForm(prev => ({ ...prev, allowMultiple: true, maxSelection: 5 }))}
                className={`btn ${groupForm.allowMultiple ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Multiple Select
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Min Selection</label>
              <input
                type="number"
                className="form-input"
                value={groupForm.minSelection}
                onChange={(e) => setGroupForm(prev => ({ ...prev, minSelection: Number(e.target.value) }))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Selection</label>
              <input
                type="number"
                className="form-input"
                value={groupForm.maxSelection}
                onChange={(e) => setGroupForm(prev => ({ ...prev, maxSelection: Number(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-group' ? handleAddGroup : handleEditGroup}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : modalType === 'add-group' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Group Modal */}
        <Modal
          isOpen={modalType === 'delete-group'}
          onClose={closeModal}
          title="Padam Modifier Group"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: '#fee2e2', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam group <strong>{selectedGroup?.name}</strong>?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--warning)', marginTop: '0.5rem' }}>
              Semua options dalam group ini juga akan dipadam.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteGroup} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>

        {/* Add/Edit Option Modal */}
        <Modal
          isOpen={modalType === 'add-option' || modalType === 'edit-option'}
          onClose={closeModal}
          title={modalType === 'add-option' ? 'Tambah Option' : 'Edit Option'}
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Group *</label>
            <select
              className="form-select"
              value={optionForm.groupId}
              onChange={(e) => setOptionForm(prev => ({ ...prev, groupId: e.target.value }))}
            >
              <option value="">Pilih Group</option>
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
              onChange={(e) => setOptionForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: BBQ Sauce, Extra Cheese"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Harga Tambahan (BND)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="var(--text-secondary)" />
              <input
                type="number"
                className="form-input"
                value={optionForm.extraPrice}
                onChange={(e) => setOptionForm(prev => ({ ...prev, extraPrice: Number(e.target.value) }))}
                min="0"
                step="0.5"
                style={{ flex: 1 }}
              />
            </div>
            <small style={{ color: 'var(--text-secondary)' }}>0 = Percuma</small>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setOptionForm(prev => ({ ...prev, isAvailable: true }))}
                className={`btn ${optionForm.isAvailable ? 'btn-success' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setOptionForm(prev => ({ ...prev, isAvailable: false }))}
                className={`btn ${!optionForm.isAvailable ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Unavailable
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-option' ? handleAddOption : handleEditOption}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : modalType === 'add-option' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Option Modal */}
        <Modal
          isOpen={modalType === 'delete-option'}
          onClose={closeModal}
          title="Padam Option"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: '#fee2e2', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam option <strong>{selectedOption?.name}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteOption} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

