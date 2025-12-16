'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useInventory } from '@/lib/store';
import { useInventoryRealtime } from '@/lib/supabase/realtime-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { StockItem } from '@/lib/types';
import Modal from '@/components/Modal';
import { AlertTriangle, Plus, Edit2, Trash2, ArrowUp, ArrowDown, History, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

type ModalType = 'add' | 'edit' | 'adjust' | 'delete' | 'history' | null;

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
  const { inventory, inventoryLogs, addStockItem, updateStockItem, deleteStockItem, adjustStock, refreshInventory, isInitialized } = useInventory();
  const { t, language } = useTranslation();

  // Realtime subscription for inventory
  const handleInventoryChange = useCallback(() => {
    console.log('[Realtime] Inventory change detected, refreshing...');
    refreshInventory();
  }, [refreshInventory]);

  useInventoryRealtime(handleInventoryChange);

  const { user, isStaffLoggedIn, currentStaff } = useAuth();
  const role = user ? 'Admin' : (isStaffLoggedIn && currentStaff ? currentStaff.role : null);
  const canDeleteItems = role === 'Admin' || role === 'Manager'; // Simplified check matching requirements

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Protein',
    currentQuantity: 0,
    minQuantity: 0,
    unit: 'kg',
    cost: 0,
    supplier: '',
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

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                {t('inventory.title')}
              </h1>
              <p className="page-subtitle">
                {t('inventory.subtitle')}
              </p>
            </div>
            {canDeleteItems && (
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} />
                {t('inventory.addItem')}
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ maxWidth: '200px' }}
          >
            <option value="All">{t('inventory.allCategories')}</option>
            {STOCK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            <strong>{lowStock.length} {t('inventory.lowStockAlert')}</strong> {t('inventory.pleaseRestock')}
          </div>
        )}

        {/* Stock Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} />
              {t('inventory.stockList')}
            </div>
            <div className="card-subtitle">{t('common.total')}: {inventory.length} items</div>
          </div>

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
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
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
        </div>

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

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kos per Unit (BND)</label>
              <input
                type="number"
                className="form-input"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-input"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Nama supplier (optional)"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={closeModal}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddStock : handleEditStock}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Memproses...
                </>
              ) : (
                modalType === 'add' ? 'Tambah' : 'Simpan'
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'in' }))}
                className={`btn ${adjustmentData.type === 'in' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <ArrowUp size={18} />
                Stok Masuk
              </button>
              <button
                onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'out' }))}
                className={`btn ${adjustmentData.type === 'out' ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <ArrowDown size={18} />
                Stok Keluar
              </button>
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

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={closeModal}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className={`btn ${adjustmentData.type === 'in' ? 'btn-primary' : 'btn-danger'}`}
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
      </div>
    </MainLayout >
  );
}
