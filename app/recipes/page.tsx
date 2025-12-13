'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useRecipes, useMenu } from '@/lib/store';
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
  PieChart
} from 'lucide-react';
import StatCard from '@/components/StatCard';

type ModalType = 'add' | 'edit' | 'delete' | null;

export default function RecipesPage() {
  const { recipes, inventory, addRecipe, updateRecipe, deleteRecipe, isInitialized } = useRecipes();
  const { menuItems } = useMenu();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Recipe Costing
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Kira kos bahan dan margin keuntungan setiap menu
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Tambah Resepi
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="content-grid cols-4 mb-lg">
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
            gradient="success"
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

        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
          {/* Recipe List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChefHat size={20} />
                  Senarai Resepi
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cari resepi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '200px' }}
                />
              </div>

              {filteredRecipes.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Menu Item</th>
                        <th>Kos Bahan</th>
                        <th>Harga Jual</th>
                        <th>Untung</th>
                        <th>Margin</th>
                        <th>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecipes.map(recipe => {
                        const profit = recipe.sellingPrice - recipe.totalCost;
                        return (
                          <tr key={recipe.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{recipe.menuItemName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {recipe.ingredients.length} bahan • {recipe.prepTime} min
                              </div>
                            </td>
                            <td style={{ color: 'var(--danger)' }}>
                              BND {recipe.totalCost.toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              BND {recipe.sellingPrice.toFixed(2)}
                            </td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                              BND {profit.toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge ${getMarginBadge(recipe.profitMargin)}`}>
                                {recipe.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openEditModal(recipe)}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openDeleteModal(recipe)}
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
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <ChefHat size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {searchTerm ? 'Tiada resepi dijumpai' : 'Belum ada resepi'}
                  </p>
                  <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    Tambah Resepi Pertama
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Menu Engineering */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChart size={20} />
                  Menu Engineering
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Star size={16} color="#065f46" />
                    <span style={{ fontWeight: 600, color: '#065f46' }}>Stars (High Margin)</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#065f46' }}>
                    {menuMatrix.stars.length} item - Fokus promosi!
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} color="#92400e" />
                    <span style={{ fontWeight: 600, color: '#92400e' }}>Plowhorses (Popular, Low Margin)</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    {menuMatrix.plowhorses.length} item - Naikkan harga atau kurangkan kos
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Trash2 size={16} color="#991b1b" />
                    <span style={{ fontWeight: 600, color: '#991b1b' }}>Dogs (Low Margin)</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                    {menuMatrix.dogs.length} item - Pertimbangkan untuk buang
                  </div>
                </div>
              </div>
            </div>

            {/* Items without recipes */}
            {menuItemsWithoutRecipes.length > 0 && (
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <div className="card-title">Belum Ada Resepi</div>
                  <div className="card-subtitle">{menuItemsWithoutRecipes.length} item</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {menuItemsWithoutRecipes.slice(0, 5).map(item => (
                    <div 
                      key={item.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                      <button
                        className="btn btn-sm btn-outline"
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
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '120px', overflowY: 'auto' }}>
              {inventory.map(item => (
                <button
                  key={item.id}
                  className="btn btn-sm btn-outline"
                  onClick={() => addIngredient({ id: item.id, name: item.name, unit: item.unit, cost: item.cost })}
                  disabled={formData.ingredients.some(i => i.stockItemId === item.id)}
                  style={{ 
                    opacity: formData.ingredients.some(i => i.stockItemId === item.id) ? 0.5 : 1 
                  }}
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </div>

          {formData.ingredients.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Senarai Bahan</label>
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

