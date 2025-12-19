'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { usePromotions } from '@/lib/store';
import { usePromotionsRealtime } from '@/lib/supabase/realtime-hooks';
import { Promotion } from '@/lib/types';
import { MOCK_MENU } from '@/lib/menu-data';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Percent,
  Gift,
  Clock,
  Calendar,
  Copy,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import StatCard from '@/components/StatCard';

const PROMO_TYPES = [
  { value: 'percentage', label: 'Diskaun %', icon: Percent },
  { value: 'fixed_amount', label: 'Potongan Tetap', icon: Tag },
  { value: 'bogo', label: 'Buy 1 Get 1', icon: Gift },
  { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: Gift },
  { value: 'free_item', label: 'Item Percuma', icon: Zap },
];

type ModalType = 'add' | 'edit' | 'delete' | null;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Ahad' },
  { value: 1, label: 'Isnin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Khamis' },
  { value: 5, label: 'Jumaat' },
  { value: 6, label: 'Sabtu' },
];

export default function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, deletePromotion, refreshPromotions, isInitialized } = usePromotions();

  // Realtime subscription for promotions
  const handlePromotionsChange = useCallback(() => {
    console.log('[Realtime] Promotions change detected, refreshing...');
    refreshPromotions();
  }, [refreshPromotions]);

  usePromotionsRealtime(handlePromotionsChange);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'bogo' | 'free_item' | 'buy_x_get_y',
    value: 10,
    minPurchase: 0,
    maxDiscount: 0,
    promoCode: '',
    applicableItems: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysOfWeek: [] as number[],
    startTime: '',
    endTime: '',
    usageLimit: 0,
    status: 'active' as 'active' | 'inactive',
    // Buy X Get Y fields
    buyQuantity: 2,
    getQuantity: 1,
    getFreeItemId: '',
    getDiscountPercent: 100, // 100 = free
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const active = promotions.filter(p => p.status === 'active').length;
    const totalUsage = promotions.reduce((sum, p) => sum + p.usageCount, 0);
    const expiringSoon = promotions.filter(p => {
      const endDate = new Date(p.endDate);
      const today = new Date();
      const diff = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 7;
    }).length;

    return { total: promotions.length, active, totalUsage, expiringSoon };
  }, [promotions]);

  // Filter promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'expired') {
        return new Date(p.endDate) < new Date();
      }
      return p.status === filterStatus;
    });
  }, [promotions, filterStatus]);

  // Generate random promo code
  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'AB';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, promoCode: code }));
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      maxDiscount: 0,
      promoCode: '',
      applicableItems: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      usageLimit: 0,
      status: 'active',
      buyQuantity: 2,
      getQuantity: 1,
      getFreeItemId: '',
      getDiscountPercent: 100,
    });
    setModalType('add');
  };

  const openEditModal = (promo: Promotion) => {
    setSelectedPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value,
      minPurchase: promo.minPurchase || 0,
      maxDiscount: promo.maxDiscount || 0,
      promoCode: promo.promoCode || '',
      applicableItems: promo.applicableItems,
      startDate: promo.startDate,
      endDate: promo.endDate,
      daysOfWeek: promo.daysOfWeek || [],
      startTime: promo.startTime || '',
      endTime: promo.endTime || '',
      usageLimit: promo.usageLimit || 0,
      status: promo.status as 'active' | 'inactive',
      buyQuantity: promo.buyQuantity || 2,
      getQuantity: promo.getQuantity || 1,
      getFreeItemId: promo.getFreeItemId || '',
      getDiscountPercent: promo.getDiscountPercent ?? 100,
    });
    setModalType('edit');
  };

  const openDeleteModal = (promo: Promotion) => {
    setSelectedPromo(promo);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedPromo(null);
    setIsProcessing(false);
  };

  const handleAddPromotion = async () => {
    if (!formData.name.trim()) {
      alert('Sila masukkan nama promosi');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addPromotion({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      value: formData.value,
      minPurchase: formData.minPurchase > 0 ? formData.minPurchase : undefined,
      maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount : undefined,
      promoCode: formData.promoCode.trim() || undefined,
      applicableItems: formData.applicableItems,
      startDate: formData.startDate,
      endDate: formData.endDate,
      daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
      status: formData.status,
    });

    closeModal();
  };

  const handleEditPromotion = async () => {
    if (!selectedPromo) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updatePromotion(selectedPromo.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      value: formData.value,
      minPurchase: formData.minPurchase > 0 ? formData.minPurchase : undefined,
      maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount : undefined,
      promoCode: formData.promoCode.trim() || undefined,
      applicableItems: formData.applicableItems,
      startDate: formData.startDate,
      endDate: formData.endDate,
      daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
      status: formData.status,
    });

    closeModal();
  };

  const handleDeletePromotion = async () => {
    if (!selectedPromo) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deletePromotion(selectedPromo.id);
    closeModal();
  };

  const toggleStatus = (promo: Promotion) => {
    updatePromotion(promo.id, {
      status: promo.status === 'active' ? 'inactive' : 'active'
    });
  };

  const getTypeLabel = (type: string) => {
    return PROMO_TYPES.find(t => t.value === type)?.label || type;
  };

  const getPromoValue = (promo: Promotion) => {
    switch (promo.type) {
      case 'percentage': return `${promo.value}%`;
      case 'fixed_amount': return `BND ${promo.value}`;
      case 'bogo': return 'Buy 1 Get 1';
      case 'free_item': return 'Free Item';
      default: return promo.value.toString();
    }
  };

  const isExpired = (promo: Promotion) => {
    return new Date(promo.endDate) < new Date();
  };

  const isExpiringSoon = (promo: Promotion) => {
    const endDate = new Date(promo.endDate);
    const today = new Date();
    const diff = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
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
                Pengurusan Promosi
              </h1>
              <p className="page-subtitle">
                Urus diskaun, promo codes dan tawaran istimewa
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Buat Promosi
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Jumlah Promosi"
            value={metrics.total}
            change="promosi tersedia"
            changeType="neutral"
            icon={Tag}
          />
          <StatCard
            label="Aktif"
            value={metrics.active}
            change="sedang berjalan"
            changeType="positive"
            icon={CheckCircle}
            gradient="peach"
          />
          <StatCard
            label="Penggunaan"
            value={metrics.totalUsage}
            change="kali digunakan"
            changeType="neutral"
            icon={Zap}
            gradient="primary"
          />
          <StatCard
            label="Tamat Tidak Lama"
            value={metrics.expiringSoon}
            change={metrics.expiringSoon > 0 ? "perlu perhatian" : "tiada yang tamat"}
            changeType={metrics.expiringSoon > 0 ? "negative" : "positive"}
            icon={Clock}
            gradient="warning"
          />
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          {['all', 'active', 'inactive', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as 'all' | 'active' | 'inactive' | 'expired')}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
            >
              {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : status === 'inactive' ? 'Tidak Aktif' : 'Tamat'}
            </button>
          ))}
        </div>

        {/* Promotions Grid */}
        {filteredPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
            {filteredPromotions.map(promo => (
              <div
                key={promo.id}
                className="card"
                style={{
                  opacity: isExpired(promo) ? 0.6 : 1,
                  borderLeft: `4px solid ${promo.status === 'active' ? 'var(--success)' : 'var(--gray-400)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {promo.name}
                    </div>
                    <span className={`badge ${isExpired(promo) ? 'badge-danger' :
                      promo.status === 'active' ? 'badge-success' : 'badge-warning'
                      }`}>
                      {isExpired(promo) ? 'Tamat' : promo.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}>
                    {getPromoValue(promo)}
                  </div>
                </div>

                {promo.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {promo.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="var(--text-secondary)" />
                    <span>
                      {new Date(promo.startDate).toLocaleDateString('ms-MY')} - {new Date(promo.endDate).toLocaleDateString('ms-MY')}
                    </span>
                  </div>
                  {promo.promoCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={14} color="var(--text-secondary)" />
                      <code style={{
                        background: 'var(--gray-100)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600
                      }}>
                        {promo.promoCode}
                      </code>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigator.clipboard.writeText(promo.promoCode || '')}
                        style={{ padding: '0.25rem' }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                  {/* Time-based display */}
                  {(promo.startTime || promo.endTime) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                      <Clock size={14} />
                      <span style={{ fontWeight: 500 }}>
                        {promo.startTime} - {promo.endTime}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>Happy Hour</span>
                    </div>
                  )}
                  {promo.daysOfWeek && promo.daysOfWeek.length > 0 && promo.daysOfWeek.length < 7 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>📅</span>
                      <span>
                        {promo.daysOfWeek.map(d => ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'][d]).join(', ')}
                      </span>
                    </div>
                  )}
                  {promo.minPurchase && promo.minPurchase > 0 && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Min. pembelian: BND {promo.minPurchase}
                    </div>
                  )}
                </div>

                {isExpiringSoon(promo) && !isExpired(promo) && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                    Tamat dalam {Math.ceil((new Date(promo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} hari
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Digunakan: <strong>{promo.usageCount}</strong>
                    {promo.usageLimit && ` / ${promo.usageLimit}`}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {!isExpired(promo) && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => toggleStatus(promo)}
                        title={promo.status === 'active' ? 'Nyahaktif' : 'Aktifkan'}
                      >
                        {promo.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => openEditModal(promo)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => openDeleteModal(promo)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Tag size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {filterStatus !== 'all' ? 'Tiada promosi untuk filter ini' : 'Belum ada promosi'}
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Buat Promosi Pertama
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalType === 'add' || modalType === 'edit'}
          onClose={closeModal}
          title={modalType === 'add' ? 'Buat Promosi Baru' : 'Edit Promosi'}
          maxWidth="550px"
        >
          <div className="form-group">
            <label className="form-label">Nama Promosi *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Diskaun Raya 2024"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Jenis Promosi</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {PROMO_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value as typeof formData.type }))}
                    className={`btn ${formData.type === type.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Icon size={16} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Nilai {formData.type === 'percentage' ? '(%)' : '(BND)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  min="0"
                />
              </div>
              {formData.type === 'percentage' && (
                <div className="form-group">
                  <label className="form-label">Max Diskaun (BND)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                    min="0"
                    placeholder="0 = tiada had"
                  />
                </div>
              )}
            </div>
          )}

          {/* Buy X Get Y Fields */}
          {formData.type === 'buy_x_get_y' && (
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
                <Gift size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Setup Buy X Get Y
              </div>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Beli Berapa?</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.buyQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, buyQuantity: Number(e.target.value) }))}
                    min="1"
                    placeholder="cth: 2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dapat Berapa?</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.getQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, getQuantity: Number(e.target.value) }))}
                    min="1"
                    placeholder="cth: 1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Item Percuma</label>
                  <select
                    className="form-input"
                    value={formData.getFreeItemId}
                    onChange={(e) => setFormData(prev => ({ ...prev, getFreeItemId: e.target.value }))}
                  >
                    <option value="">Item Sama</option>
                    {MOCK_MENU.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Diskaun %</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.getDiscountPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, getDiscountPercent: Number(e.target.value) }))}
                    min="0"
                    max="100"
                    placeholder="100 = Percuma"
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    100% = Percuma, 50% = Separuh Harga
                  </small>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gray-100)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <strong>Preview:</strong> Beli {formData.buyQuantity}, Dapat {formData.getQuantity} {formData.getDiscountPercent === 100 ? 'PERCUMA' : `dengan diskaun ${formData.getDiscountPercent}%`}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Kod Promo (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                value={formData.promoCode}
                onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                placeholder="Contoh: RAYA2024"
                style={{ flex: 1 }}
              />
              <button className="btn btn-outline" onClick={generatePromoCode} type="button">
                Generate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tarikh Mula</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tarikh Tamat</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Min. Pembelian (BND)</label>
              <input
                type="number"
                className="form-input"
                value={formData.minPurchase}
                onChange={(e) => setFormData(prev => ({ ...prev, minPurchase: Number(e.target.value) }))}
                min="0"
                placeholder="0 = tiada minimum"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Had Penggunaan</label>
              <input
                type="number"
                className="form-input"
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                min="0"
                placeholder="0 = tiada had"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hari Sah (Kosong = Setiap Hari)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      daysOfWeek: prev.daysOfWeek.includes(day.value)
                        ? prev.daysOfWeek.filter(d => d !== day.value)
                        : [...prev.daysOfWeek, day.value]
                    }));
                  }}
                  className={`btn btn-sm ${formData.daysOfWeek.includes(day.value) ? 'btn-primary' : 'btn-outline'}`}
                >
                  {day.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time-based Promotion (Happy Hour) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} />
              Masa Sah (Kosong = Sepanjang Hari)
            </label>
            <div className="grid grid-cols-2" style={{ gap: '0.5rem' }}>
              <div>
                <input
                  type="time"
                  className="form-input"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  placeholder="Mula"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mula</span>
              </div>
              <div>
                <input
                  type="time"
                  className="form-input"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  placeholder="Tamat"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tamat</span>
              </div>
            </div>
            {formData.startTime && formData.endTime && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Zap size={14} color="var(--primary)" />
                <span>Happy Hour: {formData.startTime} - {formData.endTime}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Penerangan promosi..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddPromotion : handleEditPromotion}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
          title="Padam Promosi"
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
              Padam promosi <strong>{selectedPromo?.name}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeletePromotion} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

