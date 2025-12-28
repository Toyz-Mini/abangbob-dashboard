'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';
import { useInventory } from '@/lib/store';
import { useInventoryRealtime } from '@/lib/supabase/realtime-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { StockItem } from '@/lib/types';
import Modal from '@/components/Modal';
import { AlertTriangle, Plus, Edit2, Trash2, ArrowUp, ArrowDown, History, Package, LayoutGrid, List as ListIcon, Search, Filter, ClipboardList, Upload, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import { useToast } from '@/lib/contexts/ToastContext';

// Dynamic Imports for Heavy Components
const VarianceReportModal = dynamic(() => import('@/components/inventory/VarianceReportModal'), { ssr: false });
const StockImporter = dynamic(() => import('@/components/StockImporter'), { ssr: false });
const WasteModal = dynamic(() => import('@/components/inventory/WasteModal'), { ssr: false });
const WasteHistoryView = dynamic(() => import('@/components/inventory/WasteHistoryView'), { ssr: false });
const SmartReorderView = dynamic(() => import('@/components/inventory/SmartReorderView'), { ssr: false });

type ModalType = 'add' | 'edit' | 'adjust' | 'delete' | 'history' | 'waste' | null;

const STOCK_CATEGORIES = ['Protein', 'Staple', 'Condiment', 'Bread', 'Dairy', 'Beverage', 'Packaging', 'Other'];
const STOCK_UNITS = ['kg', 'pcs', 'litre', 'gram', 'slices', 'boxes', 'packets'];
const ADJUSTMENT_REASONS = [
  'Pembelian baru',
  'Penambahan stok',
  'Penggunaan harian',
  'Rosak/Expired',
  'Pembaziran',
  'Stock take adjustment',
  'Lain-lain'
];

export default function InventoryPage() {
  const { inventory, inventoryLogs, addStockItem, updateStockItem, deleteStockItem, adjustStock, refreshInventory, isInitialized, weatherForecast } = useInventory();
  const { t, language } = useTranslation();
  const { showToast } = useToast();

  // Realtime subscription for inventory
  const handleInventoryChange = useCallback(() => {
    console.log('[Realtime] Inventory change detected, refreshing...');
    refreshInventory();
  }, [refreshInventory]);

  useInventoryRealtime(handleInventoryChange);

  const { user, isStaffLoggedIn, currentStaff } = useAuth();
  const role = user?.role || (isStaffLoggedIn && currentStaff ? currentStaff.role : null);
  // TEMPORARY: Allow all users to edit for setup/testing
  const canDeleteItems = role === 'Admin' || role === 'Manager';

  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [activeTab, setActiveTab] = useState<'inventory' | 'waste' | 'smart-reorder'>('inventory');

  // Security check: If staff somehow lands on smart-reorder, switch back to inventory
  if (!canDeleteItems && activeTab === 'smart-reorder') {
    setActiveTab('inventory');
  }

  // ... (existing form states)


  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Protein',
    currentQuantity: 0,
    minQuantity: 0,
    unit: 'kg',
    cost: 0,
    supplier: '',
    countDaily: false,
  });

  // Adjustment form states
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 0,
    reason: ADJUSTMENT_REASONS[0],
    customReason: '',
  });

  const lowStock = inventory.filter(item => item.currentQuantity <= item.minQuantity);

  const filteredStock = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (item: StockItem) => {
    const percentage = (item.currentQuantity / item.minQuantity) * 100;
    if (percentage <= 100) return { label: 'Rendah', badge: 'badge-danger' };
    if (percentage <= 150) return { label: 'Awas', badge: 'badge-warning' };
    return { label: 'Cukup', badge: 'badge-success' };
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Protein',
      currentQuantity: 0,
      minQuantity: 0,
      unit: 'kg',
      cost: 0,
      supplier: '',
      countDaily: false,
    });
    setModalType('add');
  };

  const openEditModal = (item: StockItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      cost: item.cost,
      supplier: item.supplier || '',
      countDaily: item.countDaily || false,
    });
    setModalType('edit');
  };

  const openAdjustModal = (item: StockItem) => {
    setSelectedItem(item);
    setAdjustmentData({
      type: 'in',
      quantity: 0,
      reason: ADJUSTMENT_REASONS[0],
      customReason: '',
    });
    setModalType('adjust');
  };

  const openDeleteModal = (item: StockItem) => {
    setSelectedItem(item);
    setModalType('delete');
  };

  const openHistoryModal = (item: StockItem) => {
    setSelectedItem(item);
    setModalType('history');
  };

  const openWasteModal = (item: StockItem) => {
    setSelectedItem(item);
    setModalType('waste');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setIsProcessing(false);
  };

  const handleAddStock = async () => {
    if (!formData.name.trim()) {
      alert('Sila masukkan nama item');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    addStockItem({
      name: formData.name.trim(),
      category: formData.category,
      currentQuantity: formData.currentQuantity,
      minQuantity: formData.minQuantity,
      unit: formData.unit,
      cost: formData.cost,
      supplier: formData.supplier.trim() || undefined,
      countDaily: formData.countDaily,
    });

    closeModal();
  };

  const handleEditStock = async () => {
    if (!selectedItem || !formData.name.trim()) {
      alert('Sila masukkan nama item');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateStockItem(selectedItem.id, {
      name: formData.name.trim(),
      category: formData.category,
      currentQuantity: formData.currentQuantity,
      minQuantity: formData.minQuantity,
      unit: formData.unit,
      cost: formData.cost,
      supplier: formData.supplier.trim() || undefined,
      countDaily: formData.countDaily,
    });

    closeModal();
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || adjustmentData.quantity <= 0) {
      alert('Sila masukkan kuantiti yang sah');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const reason = adjustmentData.reason === 'Lain-lain'
      ? adjustmentData.customReason
      : adjustmentData.reason;

    adjustStock(selectedItem.id, adjustmentData.quantity, adjustmentData.type, reason);

    closeModal();
  };

  const handleDeleteStock = async () => {
    if (!selectedItem) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteStockItem(selectedItem.id);

    closeModal();
  };

  const getItemLogs = (itemId: string) => {
    return inventoryLogs.filter(log => log.stockItemId === itemId).slice(0, 20);
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

  // Helper for Stock Level Ring
  const StockLevelRing = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    // Map tailwind/css variable colors to hex for SVG
    const getColor = (c: string) => {
      if (c.includes('success')) return '#10b981';
      if (c.includes('warning')) return '#f59e0b';
      if (c.includes('danger')) return '#ef4444';
      return '#3b82f6';
    };

    return (
      <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={getColor(color)}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <LivePageHeader
          title={t('inventory.title')}
          subtitle={t('inventory.subtitle')}
          rightContent={
            (role === 'Admin' || role === 'Manager') && (
              <div className="flex gap-2 w-full sm:w-auto">
                <PremiumButton
                  onClick={() => setShowImportModal(true)}
                  variant="secondary"
                  icon={Upload}
                >
                  Import Stock
                </PremiumButton>
                <PremiumButton
                  onClick={openAddModal}
                  variant="primary"
                  icon={Plus}
                >
                  {t('inventory.addItem')}
                </PremiumButton>
              </div>
            )
          }
        />

        {/* Weather Forecast Widget */}
        {weatherForecast && (
          <GlassCard className="mb-6 animate-slide-up" gradient="subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{weatherForecast.code <= 3 ? '☀️' : weatherForecast.code >= 60 ? '🌧️' : '☁️'}</div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Ramalan Cuaca Esok
                    <span className="text-xs font-normal opacity-70 border border-gray-400 rounded px-1.5">{weatherForecast.date}</span>
                  </h3>
                  <div className="text-sm text-secondary">{weatherForecast.description} • Chance: {weatherForecast.precipitationProbability}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-secondary">Inventory Logic</div>
                <div className={`text-lg font-bold ${weatherForecast.impactFactor < 1 ? 'text-red-500' : weatherForecast.impactFactor > 1 ? 'text-green-500' : 'text-gray-700'}`}>
                  {weatherForecast.impactFactor === 1 ? 'Normal Order' : weatherForecast.impactFactor < 1 ? `Kurangkan ${(1 - weatherForecast.impactFactor) * 100}%` : `Lebihkan ${(weatherForecast.impactFactor - 1) * 100}%`}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Stats Grid */}

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'inventory'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'waste'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-red-600'
              }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              Waste Logs
            </div>
          </button>
          {canDeleteItems && (
            <button
              onClick={() => setActiveTab('smart-reorder')}
              className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'smart-reorder'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-blue-600'
                }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                Smart Reorder
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">New</span>
              </div>
            </button>
          )}
        </div>

        {
          activeTab === 'waste' ? (
            <WasteHistoryView />
          ) : activeTab === 'smart-reorder' ? (
            <SmartReorderView />
          ) : (
            <>
              {/* Controls Bar */}
              <GlassCard className="mb-lg" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('inventory.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                  </div>
                  <div style={{ position: 'relative', width: '200px' }}>
                    <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select
                      className="form-select"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                    >
                      <option value="All">{t('inventory.allCategories')}</option>
                      {STOCK_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                      color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                      color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ListIcon size={20} />
                  </button>
                </div>
              </GlassCard>

              {/* Low Stock Alert */}
              {lowStock.length > 0 && (
                <GlassCard gradient="subtle" className="mb-lg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                    <AlertTriangle size={24} color="var(--warning)" />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>{lowStock.length} {t('inventory.lowStockAlert')}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('inventory.pleaseRestock')}</span>
                  </div>
                </GlassCard>
              )}

              {/* Content View */}
              {viewMode === 'grid' ? (
                <div className="content-grid cols-3 animate-slide-up-stagger">
                  {filteredStock.map((item) => {
                    const status = getStockStatus(item);
                    const percentage = (item.currentQuantity / item.minQuantity) * 100; // >100 is good
                    // Invert logic for visual ring: 100% means full/good. 
                    // Actually for stock: if qty > min, it's >100%. We just want to show health.
                    // Let's cap at 100 for the ring visual if it's full.
                    const ringPercentage = Math.min(percentage, 100);

                    return (
                      <GlassCard key={item.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="badge badge-sm" style={{ marginBottom: '0.5rem' }}>{item.category}</div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{item.name}</h3>
                              {item.countDaily && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium" title="Dikira Setiap Hari">
                                  Daily
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>BND {item.cost.toFixed(2)} / {item.unit}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {canDeleteItems && (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn-icon btn-ghost"
                                  onClick={() => openEditModal(item)}
                                  title="Edit Item"
                                  style={{ width: '28px', height: '28px' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn-icon btn-ghost-danger"
                                  onClick={() => openDeleteModal(item)}
                                  title="Padam Item"
                                  style={{ width: '28px', height: '28px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                            <StockLevelRing percentage={ringPercentage} color={status.badge} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: 'auto' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{item.currentQuantity}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.unit}</span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Min: {item.minQuantity}</span>
                          <span className={`text-${status.badge.replace('badge-', '')}`}>{status.label}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                          <PremiumButton variant="secondary" size="sm" onClick={() => openAdjustModal(item)}>
                            <ArrowUp size={14} style={{ marginRight: '4px' }} /> Laras
                          </PremiumButton>
                          <PremiumButton variant="ghost" size="sm" onClick={() => openHistoryModal(item)}>
                            <History size={14} />
                          </PremiumButton>
                        </div>


                      </GlassCard>
                    );
                  })}
                </div>
              ) : (
                <GlassCard>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="hidden-mobile">Kategori</th>
                          <th>Kuantiti Semasa</th>
                          <th className="hidden-mobile">Minimum</th>
                          <th className="hidden-mobile">Unit</th>
                          <th className="hidden-mobile">Kos</th>
                          <th className="hidden-mobile">Supplier</th>
                          <th>Status</th>
                          <th>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStock.map(item => {
                          const status = getStockStatus(item);
                          return (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 600 }}>
                                <div className="flex items-center gap-2">
                                  {item.name}
                                  {item.countDaily && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
                                      Daily
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="hidden-mobile">{item.category}</td>
                              <td>{item.currentQuantity}</td>
                              <td className="hidden-mobile">{item.minQuantity}</td>
                              <td className="hidden-mobile">{item.unit}</td>
                              <td className="hidden-mobile">BND {item.cost.toFixed(2)}</td>
                              <td className="hidden-mobile">{item.supplier || '-'}</td>
                              <td>
                                <span className={`badge ${status.badge}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    className="btn-icon btn-ghost-primary"
                                    onClick={() => openAdjustModal(item)}
                                    title="Laras Stok"
                                  >
                                    <ArrowUp size={14} />
                                  </button>

                                  <button
                                    className="btn-icon btn-ghost"
                                    onClick={() => openHistoryModal(item)}
                                    title="Lihat Sejarah"
                                  >
                                    <History size={14} />
                                  </button>

                                  {canDeleteItems && (
                                    <>
                                      <button
                                        className="btn-icon btn-ghost"
                                        onClick={() => openEditModal(item)}
                                        title="Edit Item"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        className="btn-icon btn-ghost-danger"
                                        onClick={() => deleteStockItem(item.id)}
                                        title="Padam Item"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}


            </>
          )
        }

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalType === 'add' || modalType === 'edit'}
          onClose={closeModal}
          title={modalType === 'add' ? 'Tambah Item Stok Baru' : 'Edit Item Stok'}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Nama Item *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Ayam, Nasi, dll"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {STOCK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              >
                {STOCK_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kuantiti Semasa</label>
              <input
                type="number"
                className="form-input"
                value={formData.currentQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, currentQuantity: Number(e.target.value) }))}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kuantiti Minimum</label>
              <input
                type="number"
                className="form-input"
                value={formData.minQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: Number(e.target.value) }))}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Kos per Unit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">BND</span>
                <input
                  type="number"
                  className="form-input"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{ paddingLeft: '3.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-input"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Nama supplier"
              />
            </div>
          </div>

          <div
            className={`form-group mt-4 p-3 rounded-lg border transition-colors cursor-pointer ${formData.countDaily ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
            onClick={() => setFormData(prev => ({ ...prev, countDaily: !prev.countDaily }))}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.countDaily ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                {formData.countDaily && <ArrowUp size={14} className="text-white transform rotate-45" strokeWidth={3} />}
              </div>
              <div>
                <span className={`font-medium block ${formData.countDaily ? 'text-purple-900' : 'text-gray-700'}`}>
                  Audit Setiap Hari (Daily Count)
                </span>
                <p className={`text-xs mt-0.5 ${formData.countDaily ? 'text-purple-700' : 'text-gray-500'}`}>
                  Wajib dikira semasa Opening/Closing kedai
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              onClick={closeModal}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddStock : handleEditStock}
              disabled={isProcessing}
              style={{ minWidth: '120px' }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Memproses...
                </>
              ) : (
                modalType === 'add' ? 'Tambah Item' : 'Simpan Perubahan'
              )}
            </button>
          </div>
        </Modal>

        {/* Stock Adjustment Modal */}
        <Modal
          isOpen={modalType === 'adjust'}
          onClose={closeModal}
          title="Adjust Stok"
          subtitle={selectedItem?.name}
          maxWidth="450px"
        >
          <div style={{
            background: 'var(--gray-100)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kuantiti Semasa</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {selectedItem?.currentQuantity} {selectedItem?.unit}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jenis Pelarasan</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'in' }))}
                className={`btn ${adjustmentData.type === 'in' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <ArrowUp size={18} />
                Stok Masuk
              </button>
              {(role === 'Admin' || role === 'Manager') && (
                <button
                  onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'out' }))}
                  className={`btn ${adjustmentData.type === 'out' ? 'btn-danger' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  <ArrowDown size={18} />
                  Stok Keluar
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kuantiti</label>
            <input
              type="number"
              className="form-input"
              value={adjustmentData.quantity}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              min="0"
              placeholder="Masukkan kuantiti"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sebab</label>
            <select
              className="form-select"
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
            >
              {ADJUSTMENT_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {adjustmentData.reason === 'Lain-lain' && (
            <div className="form-group">
              <label className="form-label">Sebab Lain</label>
              <input
                type="text"
                className="form-input"
                value={adjustmentData.customReason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Nyatakan sebab"
              />
            </div>
          )}

          {adjustmentData.quantity > 0 && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              Kuantiti baru: <strong>
                {adjustmentData.type === 'in'
                  ? (selectedItem?.currentQuantity || 0) + adjustmentData.quantity
                  : Math.max(0, (selectedItem?.currentQuantity || 0) - adjustmentData.quantity)
                } {selectedItem?.unit}
              </strong>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              className="btn btn-outline order-2 sm:order-1"
              onClick={closeModal}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className={`btn ${adjustmentData.type === 'in' ? 'btn-primary' : 'btn-danger'} order-1 sm:order-2`}
              onClick={handleAdjustStock}
              disabled={isProcessing || adjustmentData.quantity <= 0}
              style={{ flex: 1 }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Memproses...
                </>
              ) : (
                adjustmentData.type === 'in' ? 'Tambah Stok' : 'Kurangkan Stok'
              )}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
          title="Padam Item Stok"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Anda pasti mahu padam <strong>{selectedItem?.name}</strong>?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Tindakan ini tidak boleh dibatalkan.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={closeModal}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteStock}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Memproses...
                </>
              ) : (
                'Padam'
              )}
            </button>
          </div>
        </Modal>

        {/* Variance Report Modal */}
        <VarianceReportModal
          isOpen={showVarianceModal}
          onClose={() => setShowVarianceModal(false)}
        />

        {/* History Modal */}
        <Modal
          isOpen={modalType === 'history'}
          onClose={closeModal}
          title="Sejarah Stok"
          subtitle={selectedItem?.name}
          maxWidth="600px"
        >
          {selectedItem && (
            <>
              <div style={{
                background: 'var(--gray-100)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kuantiti Semasa</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {selectedItem.currentQuantity} {selectedItem.unit}
                  </div>
                </div>
                <span className={`badge ${getStockStatus(selectedItem).badge}`}>
                  {getStockStatus(selectedItem).label}
                </span>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {getItemLogs(selectedItem.id).length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tarikh</th>
                        <th>Jenis</th>
                        <th>Kuantiti</th>
                        <th>Sebab</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getItemLogs(selectedItem.id).map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.875rem' }}>
                            {new Date(log.createdAt).toLocaleDateString('ms-MY')}
                            <br />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              {new Date(log.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${log.type === 'in' || log.type === 'initial' ? 'badge-success' : 'badge-danger'}`}>
                              {log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Keluar' : log.type === 'initial' ? 'Baru' : 'Adjust'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {log.type === 'in' || log.type === 'initial' ? '+' : '-'}{log.quantity}
                            </span>
                            <br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {log.previousQuantity} → {log.newQuantity}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {log.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    Tiada sejarah perubahan untuk item ini
                  </p>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={closeModal} style={{ width: '100%' }}>
                  Tutup
                </button>
              </div>
            </>
          )}
        </Modal>
        {
          showImportModal && (
            <StockImporter
              onClose={() => setShowImportModal(false)}
              onSuccess={() => {
                setShowImportModal(false);
                showToast('Import berjaya!', 'success');
              }}
            />
          )
        }
      </div >
    </MainLayout >
  );
}
