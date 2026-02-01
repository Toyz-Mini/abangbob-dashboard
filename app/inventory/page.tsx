'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';
import { useInventory } from '@/lib/store';
import {
  useAddInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation
} from '@/lib/hooks/mutations/useInventoryMutations';
import { useInventoryRealtime } from '@/lib/supabase/realtime-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { StockItem } from '@/lib/types';
import Modal from '@/components/Modal';
import { AlertTriangle, Plus, Edit2, Trash2, ArrowUp, ArrowDown, History, Package, LayoutGrid, List as ListIcon, Search, Filter, ClipboardList, Upload, TrendingUp, AlertCircle, BarChart3, ArrowRightLeft } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import { useToast } from '@/lib/contexts/ToastContext';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';

// Dynamic Imports for Heavy Components
const VarianceReportModal = dynamic(() => import('@/components/inventory/VarianceReportModal'), { ssr: false });
const StockImporter = dynamic(() => import('@/components/StockImporter'), { ssr: false });
const WasteModal = dynamic(() => import('@/components/inventory/WasteModal'), { ssr: false });
const WasteHistoryView = dynamic(() => import('@/components/inventory/WasteHistoryView'), { ssr: false });
const SmartReorderView = dynamic(() => import('@/components/inventory/SmartReorderView'), { ssr: false });
const StockTransferView = dynamic(() => import('@/components/inventory/StockTransferView'), { ssr: false });
const StockDashboard = dynamic(() => import('@/components/inventory/StockDashboard'), { ssr: false });

type ModalType = 'add' | 'edit' | 'adjust' | 'delete' | 'history' | 'waste' | null;

const STOCK_CATEGORIES = ['Protein', 'Staple', 'Condiment', 'Bread', 'Dairy', 'Beverage', 'Packaging', 'Other'];
const STOCK_UNITS = ['kg', 'pcs', 'litre', 'gram', 'slices', 'boxes', 'packets'];
const ADJUSTMENT_REASONS = [
  'new_purchase',
  'restock',
  'daily_use',
  'damaged',
  'waste',
  'stock_take',
  'other'
];

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

export default function InventoryPage() {
  const { inventory, inventoryLogs, adjustStock, refreshInventory, weatherForecast, isSecondaryInitialized } = useInventory();

  // Mutations
  const addInventoryItemMutation = useAddInventoryItemMutation();
  const updateInventoryItemMutation = useUpdateInventoryItemMutation();
  const deleteInventoryItemMutation = useDeleteInventoryItemMutation();

  const isInitialized = isSecondaryInitialized;

  const { t, language } = useTranslation();
  const { showToast } = useToast();

  // Realtime subscription for inventory
  const handleInventoryChange = useCallback(() => {
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'dashboard' | 'waste' | 'smart-reorder' | 'transfers'>('inventory');

  // Security check: If staff somehow lands on smart-reorder, switch back to inventory
  if (!canDeleteItems && activeTab === 'smart-reorder') {
    setActiveTab('inventory');
  }

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

  // Duplicate detection - find existing items with similar names
  const duplicateItem = useMemo(() => {
    if (!formData.name.trim() || modalType !== 'add') return null;
    const searchName = formData.name.trim().toLowerCase();
    return (inventory || []).find(item =>
      item && item.name && item.name.toLowerCase() === searchName
    );
  }, [formData.name, inventory, modalType]);

  const lowStock = (inventory || []).filter(item => item && item.currentQuantity <= item.minQuantity);

  const filteredStock = (inventory || []).filter(item => {
    if (!item || !item.name) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setIsProcessing(false);
  };

  const handleAddStock = async () => {
    if (!formData.name.trim()) {
      alert(t('inventory.alert.enterName'));
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    addInventoryItemMutation.mutate({
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
      alert(t('inventory.alert.enterName'));
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateInventoryItemMutation.mutate({
      id: selectedItem.id,
      updates: {
        name: formData.name.trim(),
        category: formData.category,
        currentQuantity: formData.currentQuantity,
        minQuantity: formData.minQuantity,
        unit: formData.unit,
        cost: formData.cost,
        supplier: formData.supplier.trim() || undefined,
        countDaily: formData.countDaily,
      }
    });

    closeModal();
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || adjustmentData.quantity <= 0) {
      alert(t('inventory.alert.enterValidQty'));
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const reason = adjustmentData.reason === 'other'
      ? adjustmentData.customReason
      : t(`inventory.reasons.${adjustmentData.reason}`);

    adjustStock(selectedItem.id, adjustmentData.quantity, adjustmentData.type, reason);
    closeModal();
  };

  const handleDeleteStock = async () => {
    if (!selectedItem) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteInventoryItemMutation.mutate(selectedItem.id);
    closeModal();
  };

  const getItemLogs = (itemId: string) => {
    return inventoryLogs.filter(log => log.stockItemId === itemId).slice(0, 20);
  };

  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-[1600px] mx-auto p-4">
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
                  {t('inventory.buttons.importStock')}
                </PremiumButton>
                <PremiumButton
                  onClick={openAddModal}
                  variant="primary"
                  icon={Plus}
                >
                  {t('inventory.buttons.addItem')}
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
                    {t('inventory.weather.forecastTitle')}
                    <span className="text-xs font-normal opacity-70 border border-gray-400 rounded px-1.5">{weatherForecast.date}</span>
                  </h3>
                  <div className="text-sm text-secondary">{weatherForecast.description} • Chance: {weatherForecast.precipitationProbability}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-secondary">{t('inventory.weather.logic')}</div>
                <div className={`text-lg font-bold ${weatherForecast.impactFactor < 1 ? 'text-red-500' : weatherForecast.impactFactor > 1 ? 'text-green-500' : 'text-gray-700'}`}>
                  {weatherForecast.impactFactor === 1
                    ? t('inventory.weather.impact.normal')
                    : weatherForecast.impactFactor < 1
                      ? t('inventory.weather.impact.reduce', { percent: Math.round((1 - (weatherForecast.impactFactor || 1)) * 100) })
                      : t('inventory.weather.impact.increase', { percent: Math.round(((weatherForecast.impactFactor || 1) - 1) * 100) })}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'inventory'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t('inventory.tabs.stock')}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'dashboard'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-green-600'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              Dashboard
              <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">NEW</span>
            </div>
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
              {t('inventory.tabs.waste')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'transfers'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-purple-600'
              }`}
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={16} />
              Transfers
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
                {t('inventory.tabs.smartReorder')}
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">{t('inventory.tabs.new')}</span>
              </div>
            </button>
          )}
        </div>

        {
          activeTab === 'dashboard' ? (
            <StockDashboard onRefresh={() => refreshInventory()} />
          ) : activeTab === 'waste' ? (
            <WasteHistoryView />
          ) : activeTab === 'transfers' ? (
            <StockTransferView />
          ) : activeTab === 'smart-reorder' ? (
            <SmartReorderView />
          ) : (
            <>
              {/* Controls Bar */}
              <GlassCard className="mb-6 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 flex-1 w-full md:w-auto min-w-[300px]">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="pl-10 pr-4 py-2 w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder={t('inventory.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative w-[200px]">
                    <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      className="pl-10 pr-8 py-2 w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="All">{t('inventory.allCategories')}</option>
                      {STOCK_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{t(`inventory.categories.${cat}`)}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <ListIcon size={20} />
                  </button>
                </div>
              </GlassCard>

              {/* Low Stock Alert */}
              {lowStock.length > 0 && (
                <GlassCard gradient="subtle" className="mb-6 flex items-center gap-4 border-l-4 border-amber-500">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-full">
                    <AlertTriangle size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <strong className="text-lg block text-amber-900 dark:text-amber-400">{lowStock.length} {t('inventory.lowStockAlert')}</strong>
                    <span className="text-gray-500">{t('inventory.pleaseRestock')}</span>
                  </div>
                </GlassCard>
              )}

              {/* Content View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up-stagger">
                  {filteredStock.map((item) => {
                    const status = getStockStatus(item);
                    const percentage = item.minQuantity > 0
                      ? (item.currentQuantity / item.minQuantity) * 100
                      : (item.currentQuantity > 0 ? 100 : 0);
                    const ringPercentage = Math.min(percentage, 100);

                    return (
                      <GlassCard key={item.id} hoverEffect={true} className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-100 text-gray-600 mb-2 w-fit">{item.category}</div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg m-0">{item.name}</h3>
                              {item.countDaily && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold" title="Dikira Setiap Hari">
                                  DAILY
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">BND {item.cost.toFixed(2)} / {item.unit}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            {canDeleteItems && (
                              <div className="flex gap-1">
                                <button
                                  className="btn btn-ghost btn-square btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openEditModal(item)}
                                  title="Edit Item"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-square btn-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openDeleteModal(item)}
                                  title="Padam Item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                            <StockLevelRing percentage={ringPercentage} color={status.badge} />
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2 mt-auto">
                          <span className="text-3xl font-extrabold">{item.currentQuantity}</span>
                          <span className="text-gray-500 font-medium">{item.unit}</span>
                        </div>

                        <div className="text-sm text-gray-500 flex justify-between items-center bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                          <span>Min: <span className="font-mono font-bold">{item.minQuantity}</span></span>
                          <span className={`${status.badge === 'badge-success' ? 'text-green-600' : status.badge === 'badge-warning' ? 'text-amber-600' : 'text-red-500'} font-bold text-xs uppercase`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
                          <PremiumButton variant="secondary" size="sm" onClick={() => openAdjustModal(item)}>
                            <ArrowUp size={14} className="mr-1" /> Adjust
                          </PremiumButton>
                          <PremiumButton variant="ghost" size="sm" onClick={() => openHistoryModal(item)}>
                            <History size={14} className="mr-1" /> History
                          </PremiumButton>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              ) : (
                <GlassCard className="overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 font-medium border-b border-gray-100 dark:border-white/10">
                        <tr>
                          <th className="p-4">{t('inventory.table.item')}</th>
                          <th className="p-4 hidden md:table-cell">{t('inventory.table.category')}</th>
                          <th className="p-4">{t('inventory.table.quantity')}</th>
                          <th className="p-4 hidden md:table-cell">{t('inventory.table.min')}</th>
                          <th className="p-4 hidden md:table-cell">{t('inventory.table.unit')}</th>
                          <th className="p-4 hidden md:table-cell">{t('inventory.table.cost')}</th>
                          <th className="p-4 hidden md:table-cell">{t('inventory.table.supplier')}</th>
                          <th className="p-4">{t('inventory.table.status')}</th>
                          <th className="p-4 text-right">{t('inventory.table.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredStock.map(item => {
                          const status = getStockStatus(item);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {item.name}
                                  {item.countDaily && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                                      DAILY
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 hidden md:table-cell text-gray-500">{item.category}</td>
                              <td className="p-4 font-mono font-bold">{item.currentQuantity}</td>
                              <td className="p-4 hidden md:table-cell text-gray-500">{item.minQuantity}</td>
                              <td className="p-4 hidden md:table-cell text-gray-500">{item.unit}</td>
                              <td className="p-4 hidden md:table-cell text-gray-500">BND {item.cost.toFixed(2)}</td>
                              <td className="p-4 hidden md:table-cell text-gray-500">{item.supplier || '-'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${status.badge === 'badge-success' ? 'bg-green-100 text-green-700' :
                                    status.badge === 'badge-warning' ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
                                    onClick={() => openAdjustModal(item)}
                                    title="Laras Stok"
                                  >
                                    <ArrowUp size={16} />
                                  </button>

                                  <button
                                    className="btn btn-ghost btn-square btn-sm hover:bg-gray-100"
                                    onClick={() => openHistoryModal(item)}
                                    title="Lihat Sejarah"
                                  >
                                    <History size={16} />
                                  </button>

                                  {canDeleteItems && (
                                    <>
                                      <button
                                        className="btn btn-ghost btn-square btn-sm hover:bg-blue-50 text-blue-600"
                                        onClick={() => openEditModal(item)}
                                        title="Edit Item"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        className="btn btn-ghost btn-square btn-sm hover:bg-red-50 text-red-600"
                                        onClick={() => openDeleteModal(item)}
                                        title="Padam Item"
                                      >
                                        <Trash2 size={16} />
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
          title={modalType === 'add' ? t('inventory.modal.addTitle') : t('inventory.modal.editTitle')}
          maxWidth="500px"
        >
          {/* Modal Form Content Preserved */}
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 text-sm mb-1 block">{t('inventory.modal.form.name')}</label>
              <div className="relative">
                <input
                  type="text"
                  className={`border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none ${duplicateItem ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('inventory.modal.form.namePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 text-sm mb-1 block">{t('inventory.modal.form.category')}</label>
                <select
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none border-gray-300 bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {STOCK_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{t(`inventory.categories.${cat}`)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-bold text-gray-700 text-sm mb-1 block">{t('inventory.modal.form.unit')}</label>
                <select
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none border-gray-300 bg-white"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                >
                  {STOCK_UNITS.map(unit => (
                    <option key={unit} value={unit}>{t(`inventory.units.${unit}`) || unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 text-sm mb-1 block">{t('inventory.modal.form.currentQty')}</label>
                <input
                  type="number"
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none border-gray-300"
                  value={formData.currentQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentQuantity: Number(e.target.value) }))}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold text-gray-700 text-sm mb-1 block">{t('inventory.modal.form.minQty')}</label>
                <input
                  type="number"
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none border-gray-300"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: Number(e.target.value) }))}
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
              <button
                onClick={modalType === 'add' ? handleAddStock : handleEditStock}
                className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark shadow-lg shadow-primary/30"
              >
                {isProcessing ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Stock Adjustment Modal */}
        <Modal
          isOpen={modalType === 'adjust'}
          onClose={closeModal}
          title={t('inventory.modal.adjustTitle')}
          maxWidth="450px"
        >
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center border border-gray-200">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-bold">Current Stock</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{selectedItem?.currentQuantity} {selectedItem?.unit}</div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'in' }))}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 ${adjustmentData.type === 'in' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-gray-100 text-gray-500'}`}
            >
              <ArrowUp size={18} /> IN
            </button>
            <button
              onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'out' }))}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 ${adjustmentData.type === 'out' ? 'border-red-500 bg-red-50 text-red-500' : 'border-transparent bg-gray-100 text-gray-500'}`}
            >
              <ArrowDown size={18} /> OUT
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
              <input
                type="number"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full text-center text-2xl font-bold p-3 rounded-xl border border-gray-300 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
              <select
                className="w-full p-3 rounded-xl border border-gray-300 bg-white"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
              >
                {ADJUSTMENT_REASONS.map(reason => (
                  <option key={reason} value={reason}>{t(`inventory.reasons.${reason}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={closeModal} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
            <button onClick={handleAdjustStock} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30">Confirm</button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
          title={t('inventory.modal.deleteTitle')}
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <p dangerouslySetInnerHTML={{ __html: t('inventory.modal.delete.confirm', { name: selectedItem?.name || '' }) }} className="text-gray-600 mb-2"></p>
            <p className="text-xs text-gray-400">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={closeModal} className="flex-1 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
            <button onClick={handleDeleteStock} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600">Delete</button>
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
          title={t('inventory.modal.historyTitle')}
          subtitle={selectedItem?.name}
          maxWidth="600px"
        >
          {selectedItem && (
            <>
              <div className="h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Change</th>
                      <th className="p-3 text-right">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getItemLogs(selectedItem.id).map(log => (
                      <tr key={log.id}>
                        <td className="p-3 text-gray-600">
                          {new Date(log.createdAt).toLocaleDateString()} <br />
                          <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold bg-gray-100 uppercase`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          {log.type === 'in' ? '+' : '-'}{log.quantity}
                        </td>
                        <td className="p-3 text-right text-gray-500 text-xs">
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getItemLogs(selectedItem.id).length === 0 && (
                  <div className="text-center py-8 text-gray-400">No logs found.</div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                <button onClick={closeModal} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Close</button>
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
                showToast(t('inventory.alert.importSuccess'), 'success');
              }}
            />
          )
        }
      </div >
    </MainLayout >
  );
}
