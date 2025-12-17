'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useRecipes, useMenu } from '@/lib/store';
import { useRecipesRealtime } from '@/lib/supabase/realtime-hooks';
import { useCallback } from 'react';
import { Recipe, RecipeIngredient } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ChefHat,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Star,
  PieChart,
  Clock,
  Search
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';

type ModalType = 'add' | 'edit' | 'delete' | null;

export default function RecipesPage() {
  const { recipes, inventory, addRecipe, updateRecipe, deleteRecipe, refreshRecipes, isInitialized } = useRecipes();
  const { menuItems } = useMenu();

  const handleRecipesChange = useCallback(() => {
    refreshRecipes();
  }, [refreshRecipes]);

  // useRecipesRealtime(handleRecipesChange);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    menuItemId: '',
    menuItemName: '',
    sellingPrice: 0,
    ingredients: [] as { stockItemId: string; stockItemName: string; quantity: number; unit: string; costPerUnit: number }[],
    instructions: '',
    prepTime: 10,
    yieldQuantity: 1,
    yieldUnit: 'pcs',
  });

  // Calculate recipe metrics
  const recipeMetrics = useMemo(() => {
    const totalRecipes = recipes.length;
    const avgMargin = recipes.length > 0
      ? recipes.reduce((sum, r) => sum + r.profitMargin, 0) / recipes.length
      : 0;
    const lowMarginCount = recipes.filter(r => r.profitMargin < 30).length;
    const highMarginCount = recipes.filter(r => r.profitMargin >= 50).length;

    return { totalRecipes, avgMargin, lowMarginCount, highMarginCount };
  }, [recipes]);

  // Menu Engineering Matrix
  const menuMatrix = useMemo(() => {
    if (recipes.length === 0) return { stars: [], puzzles: [], plowhorses: [], dogs: [] };

    const avgMargin = recipeMetrics.avgMargin;
    const avgPopularity = 50; // Placeholder - would need sales data

    return {
      stars: recipes.filter(r => r.profitMargin >= avgMargin), // High margin
      puzzles: recipes.filter(r => r.profitMargin >= avgMargin).slice(0, 2), // High margin, low popularity
      plowhorses: recipes.filter(r => r.profitMargin < avgMargin).slice(0, 2), // Low margin, high popularity
      dogs: recipes.filter(r => r.profitMargin < 20), // Low margin, low popularity
    };
  }, [recipes, recipeMetrics.avgMargin]);

  // Filter recipes
  const filteredRecipes = recipes.filter(r =>
    r.menuItemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get menu items without recipes
  const menuItemsWithoutRecipes = menuItems.filter(
    item => !recipes.some(r => r.menuItemId === item.id)
  );

  const openAddModal = () => {
    const firstItem = menuItemsWithoutRecipes[0] || menuItems[0];
    setFormData({
      menuItemId: firstItem?.id || '',
      menuItemName: firstItem?.name || '',
      sellingPrice: firstItem?.price || 0,
      ingredients: [],
      instructions: '',
      prepTime: 10,
      yieldQuantity: 1,
      yieldUnit: 'pcs',
    });
    setModalType('add');
  };

  const openEditModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      menuItemId: recipe.menuItemId,
      menuItemName: recipe.menuItemName,
      sellingPrice: recipe.sellingPrice,
      ingredients: recipe.ingredients.map(i => ({
        stockItemId: i.stockItemId,
        stockItemName: i.stockItemName,
        quantity: i.quantity,
        unit: i.unit,
        costPerUnit: i.costPerUnit,
      })),
      instructions: recipe.instructions || '',
      prepTime: recipe.prepTime,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
    });
    setModalType('edit');
  };

  const openDeleteModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRecipe(null);
    setIsProcessing(false);
  };

  const addIngredient = (stockItem: { id: string; name: string; unit: string; cost: number }) => {
    const existing = formData.ingredients.find(i => i.stockItemId === stockItem.id);
    if (!existing) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, {
          stockItemId: stockItem.id,
          stockItemName: stockItem.name,
          quantity: 1,
          unit: stockItem.unit,
          costPerUnit: stockItem.cost,
        }]
      }));
    }
  };

  const updateIngredientQuantity = (stockItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeIngredient(stockItemId);
    } else {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.stockItemId === stockItemId ? { ...i, quantity } : i
        )
      }));
    }
  };

  const removeIngredient = (stockItemId: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.stockItemId !== stockItemId)
    }));
  };

  // Calculate costs
  const calculateTotalCost = () => {
    return formData.ingredients.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);
  };

  const calculateProfitMargin = () => {
    const cost = calculateTotalCost();
    if (formData.sellingPrice <= 0) return 0;
    return ((formData.sellingPrice - cost) / formData.sellingPrice) * 100;
  };

  const handleAddRecipe = async () => {
    if (!formData.menuItemId || formData.ingredients.length === 0) {
      alert('Sila pilih menu item dan tambah sekurang-kurangnya satu bahan');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const ingredients: RecipeIngredient[] = formData.ingredients.map(i => ({
      stockItemId: i.stockItemId,
      stockItemName: i.stockItemName,
      quantity: i.quantity,
      unit: i.unit,
      costPerUnit: i.costPerUnit,
      totalCost: i.quantity * i.costPerUnit,
    }));

    addRecipe({
      menuItemId: formData.menuItemId,
      menuItemName: formData.menuItemName,
      sellingPrice: formData.sellingPrice,
      ingredients,
      instructions: formData.instructions.trim() || undefined,
      prepTime: formData.prepTime,
      yieldQuantity: formData.yieldQuantity,
      yieldUnit: formData.yieldUnit,
    });

    closeModal();
  };

  const handleEditRecipe = async () => {
    if (!selectedRecipe) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const ingredients: RecipeIngredient[] = formData.ingredients.map(i => ({
      stockItemId: i.stockItemId,
      stockItemName: i.stockItemName,
      quantity: i.quantity,
      unit: i.unit,
      costPerUnit: i.costPerUnit,
      totalCost: i.quantity * i.costPerUnit,
    }));

    const totalCost = ingredients.reduce((sum, i) => sum + i.totalCost, 0);
    const profitMargin = formData.sellingPrice > 0
      ? ((formData.sellingPrice - totalCost) / formData.sellingPrice) * 100
      : 0;

    updateRecipe(selectedRecipe.id, {
      sellingPrice: formData.sellingPrice,
      ingredients,
      totalCost,
      profitMargin,
      instructions: formData.instructions.trim() || undefined,
      prepTime: formData.prepTime,
      yieldQuantity: formData.yieldQuantity,
      yieldUnit: formData.yieldUnit,
    });

    closeModal();
  };

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteRecipe(selectedRecipe.id);
    closeModal();
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'var(--success)';
    if (margin >= 30) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 50) return 'badge-success';
    if (margin >= 30) return 'badge-warning';
    return 'badge-danger';
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
        <LivePageHeader
          title="Recipe Costing"
          subtitle="Kira kos bahan dan margin keuntungan setiap menu"
          rightContent={
            <PremiumButton onClick={openAddModal} icon={Plus}>
              Tambah Resepi
            </PremiumButton>
          }
        />

        {/* Metrics Cards */}
        <div className="content-grid cols-4 mb-lg animate-slide-up-stagger">
          <StatCard
            label="Jumlah Resepi"
            value={recipeMetrics.totalRecipes}
            change="resepi tersedia"
            changeType="neutral"
            icon={ChefHat}
            gradient="primary"
          />
          <StatCard
            label="Purata Margin"
            value={`${recipeMetrics.avgMargin.toFixed(1)}%`}
            change={recipeMetrics.avgMargin >= 50 ? "bagus" : recipeMetrics.avgMargin >= 30 ? "sederhana" : "rendah"}
            changeType={recipeMetrics.avgMargin >= 50 ? "positive" : recipeMetrics.avgMargin >= 30 ? "neutral" : "negative"}
            icon={TrendingUp}
          />
          <StatCard
            label="High Margin (>50%)"
            value={recipeMetrics.highMarginCount}
            change="keuntungan tinggi"
            changeType="positive"
            icon={Star}
            gradient="amber"
          />
          <StatCard
            label="Low Margin (<30%)"
            value={recipeMetrics.lowMarginCount}
            change={recipeMetrics.lowMarginCount > 0 ? "perlu optimumkan" : "tiada"}
            changeType={recipeMetrics.lowMarginCount > 0 ? "negative" : "positive"}
            icon={AlertTriangle}
            gradient="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe List */}
          <div className="lg:col-span-2">
            <GlassCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                    <ChefHat size={24} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Senarai Resepi</h2>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari resepi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', width: '200px' }}
                  />
                </div>
              </div>

              {filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecipes.map(recipe => {
                    const profit = recipe.sellingPrice - recipe.totalCost;
                    const marginColor = getMarginColor(recipe.profitMargin); // Ensure this function is available or inline style
                    // Re-implementing simplified margin color getter for inline use if needed or relying on existing function
                    const isHighMargin = recipe.profitMargin >= 50;

                    return (
                      <div key={recipe.id} className="hover-lift" style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{recipe.menuItemName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={14} /> {recipe.prepTime} min
                              </span>
                              <span>•</span>
                              <span>{recipe.ingredients.length} bahan</span>
                            </div>
                          </div>
                          <span className={`badge ${getMarginBadge(recipe.profitMargin)}`} style={{ height: 'fit-content' }}>
                            {recipe.profitMargin.toFixed(1)}%
                          </span>
                        </div>

                        {/* Cost Breakdown */}
                        <div style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          marginBottom: '1rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kos</div>
                            <div style={{ fontWeight: 600, color: 'var(--danger)' }}>${recipe.totalCost.toFixed(2)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jual</div>
                            <div style={{ fontWeight: 600 }}>${recipe.sellingPrice.toFixed(2)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Untung</div>
                            <div style={{ fontWeight: 700, color: 'var(--success)' }}>${profit.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <PremiumButton variant="outline" size="sm" onClick={() => openEditModal(recipe)} style={{ flex: 1 }}>
                            <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
                          </PremiumButton>
                          <button
                            className="btn-icon btn-ghost-danger"
                            onClick={() => openDeleteModal(recipe)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <ChefHat size={48} color="var(--gray-400)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {searchTerm ? 'Tiada resepi dijumpai' : 'Belum ada resepi'}
                  </p>
                  <PremiumButton onClick={openAddModal}>
                    <Plus size={18} />
                    Tambah Resepi Pertama
                  </PremiumButton>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Menu Engineering & Sidebar */}
          <div className="flex flex-col gap-6">
            <GlassCard className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
                  <PieChart size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Menu Engineering</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="hover-lift" style={{ padding: '1rem', background: '#ecfdf5', borderRadius: 'var(--radius-lg)', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Star size={18} color="#059669" fill="#059669" />
                    <span style={{ fontWeight: 700, color: '#065f46' }}>Stars</span>
                    <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{menuMatrix.stars.length}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#064e3b' }}>
                    High Profit & Popular. Kekalkan kualiti & promosi!
                  </div>
                </div>

                <div className="hover-lift" style={{ padding: '1rem', background: '#fffbeb', borderRadius: 'var(--radius-lg)', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={18} color="#d97706" />
                    <span style={{ fontWeight: 700, color: '#92400e' }}>Plowhorses</span>
                    <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{menuMatrix.plowhorses.length}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                    Popular tapi Low Margin. Naikkan harga sedikit?
                  </div>
                </div>

                <div className="hover-lift" style={{ padding: '1rem', background: '#fef2f2', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Trash2 size={18} color="#dc2626" />
                    <span style={{ fontWeight: 700, color: '#991b1b' }}>Dogs</span>
                    <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{menuMatrix.dogs.length}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
                    Low Profit & Popularity. Pertimbangkan untuk buang.
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Items without recipes */}
            {menuItemsWithoutRecipes.length > 0 && (
              <GlassCard className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <div className="card-title" style={{ fontSize: '1rem' }}>Belum Ada Resepi</div>
                  <div className="card-subtitle">{menuItemsWithoutRecipes.length} item perlukan perhatian</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {menuItemsWithoutRecipes.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--warning)'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</span>
                      <button
                        className="btn btn-sm btn-ghost-primary"
                        onClick={() => {
                          setFormData({
                            menuItemId: item.id,
                            menuItemName: item.name,
                            sellingPrice: item.price,
                            ingredients: [],
                            instructions: '',
                            prepTime: 10,
                            yieldQuantity: 1,
                            yieldUnit: 'pcs',
                          });
                          setModalType('add');
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Add/Edit Recipe Modal */}
        <Modal
          isOpen={modalType === 'add' || modalType === 'edit'}
          onClose={closeModal}
          title={modalType === 'add' ? 'Tambah Resepi' : 'Edit Resepi'}
          maxWidth="600px"
        >
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Menu Item *</label>
              {modalType === 'add' ? (
                <select
                  className="form-select"
                  value={formData.menuItemId}
                  onChange={(e) => {
                    const item = menuItems.find(m => m.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      menuItemId: e.target.value,
                      menuItemName: item?.name || '',
                      sellingPrice: item?.price || 0,
                    }));
                  }}
                >
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={formData.menuItemName}
                  disabled
                />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Harga Jual (BND)</label>
              <input
                type="number"
                className="form-input"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tambah Bahan dari Inventori</label>

            {/* Search Ingredient */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Cari bahan (cth: Ayam, Garam)..."
                value={ingredientSearchTerm}
                onChange={(e) => setIngredientSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.25rem',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)'
            }}>
              {inventory
                .filter(item => item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()))
                .map(item => {
                  const isSelected = formData.ingredients.some(i => i.stockItemId === item.id);
                  return (
                    <button
                      key={item.id}
                      className={`btn btn-sm ${isSelected ? 'btn-ghost-secondary' : 'btn-outline'}`}
                      onClick={() => addIngredient({ id: item.id, name: item.name, unit: item.unit, cost: item.cost })}
                      disabled={isSelected}
                      style={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        height: 'auto',
                        padding: '0.5rem',
                        opacity: isSelected ? 0.6 : 1,
                        background: isSelected ? 'var(--gray-200)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.unit}</span>
                      </div>
                      {!isSelected && <Plus size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              {inventory.filter(item => item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())).length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Tiada bahan dijumpai.
                </div>
              )}
            </div>
          </div>

          {formData.ingredients.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Senarai Bahan</label>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bahan</th>
                      <th>Kuantiti</th>
                      <th>Unit</th>
                      <th>Kos/Unit</th>
                      <th>Jumlah</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.ingredients.map(ing => (
                      <tr key={ing.stockItemId}>
                        <td>{ing.stockItemName}</td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={ing.quantity}
                            onChange={(e) => updateIngredientQuantity(ing.stockItemId, Number(e.target.value))}
                            min="0.1"
                            step="0.1"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>{ing.unit}</td>
                        <td>BND {ing.costPerUnit.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>BND {(ing.quantity * ing.costPerUnit).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => removeIngredient(ing.stockItemId)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div style={{
            padding: '1rem',
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}>
            <div className="grid grid-cols-3" style={{ gap: '1rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kos Bahan</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
                  BND {calculateTotalCost().toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Untung</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                  BND {(formData.sellingPrice - calculateTotalCost()).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Margin</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: getMarginColor(calculateProfitMargin())
                }}>
                  {calculateProfitMargin().toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Masa Penyediaan (minit)</label>
              <input
                type="number"
                className="form-input"
                value={formData.prepTime}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: Number(e.target.value) }))}
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hasil (kuantiti)</label>
              <input
                type="number"
                className="form-input"
                value={formData.yieldQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, yieldQuantity: Number(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Arahan (Optional)</label>
            <textarea
              className="form-input"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder="Langkah-langkah penyediaan..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddRecipe : handleEditRecipe}
              disabled={isProcessing || formData.ingredients.length === 0}
              style={{ flex: 1 }}
            >
              {isProcessing ? <><LoadingSpinner size="sm" /> Memproses...</> : modalType === 'add' ? 'Simpan Resepi' : 'Kemaskini'}
            </button>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
          title="Padam Resepi"
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
              Padam resepi untuk <strong>{selectedRecipe?.menuItemName}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteRecipe} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

