'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useCustomers, useOrders } from '@/lib/store';
import { useCustomersRealtime } from '@/lib/supabase/realtime-hooks';
import { useCallback } from 'react';
import { Customer } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Gift,
  Star,
  Crown,
  ShoppingBag,
  Calendar,
  Search,
  TrendingUp,
  Award
} from 'lucide-react';
import StatCard from '@/components/StatCard';

type ModalType = 'add' | 'edit' | 'view' | 'points' | null;

export default function CustomersPage() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    refreshCustomers,
    isInitialized
  } = useCustomers();

  const handleCustomersChange = useCallback(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  useCustomersRealtime(handleCustomersChange);

  const { orders } = useOrders();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<'all' | 'new' | 'regular' | 'vip'>('all');
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '+673',
    email: '',
    birthday: '',
    notes: '',
  });

  // Points form
  const [pointsForm, setPointsForm] = useState({
    action: 'add' as 'add' | 'redeem',
    points: 0,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter(c => c.segment === 'vip').length;
    const regular = customers.filter(c => c.segment === 'regular').length;
    const newCustomers = customers.filter(c => c.segment === 'new').length;
    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return { total, vip, regular, newCustomers, totalPoints, totalSpent };
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
      const matchesSegment = filterSegment === 'all' || c.segment === filterSegment;
      return matchesSearch && matchesSegment;
    });
  }, [customers, searchTerm, filterSegment]);

  // Get customer order history
  const getCustomerOrders = (phone: string) => {
    return orders.filter(o => o.customerPhone === phone);
  };

  // Upcoming birthdays (next 7 days)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return customers.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      bday.setFullYear(today.getFullYear());
      return bday >= today && bday <= nextWeek;
    });
  }, [customers]);

  const openAddModal = () => {
    setFormData({ name: '', phone: '+673', email: '', birthday: '', notes: '' });
    setModalType('add');
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      birthday: customer.birthday || '',
      notes: customer.notes || '',
    });
    setModalType('edit');
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalType('view');
  };

  const openPointsModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPointsForm({ action: 'add', points: 0 });
    setModalType('points');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCustomer(null);
    setIsProcessing(false);
  };

  const handleAddCustomer = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Sila masukkan nama dan nombor telefon', 'warning');
      return;
    }

    // Check for duplicate phone
    if (customers.some(c => c.phone === formData.phone)) {
      showToast('Nombor telefon ini sudah didaftarkan', 'warning');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    await addCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      birthday: formData.birthday || undefined,
      notes: formData.notes.trim() || undefined,
    });

    closeModal();
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name.trim()) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateCustomer(selectedCustomer.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      birthday: formData.birthday || undefined,
      notes: formData.notes.trim() || undefined,
    });

    closeModal();
  };

  const handlePointsAction = async () => {
    if (!selectedCustomer || pointsForm.points <= 0) {
      showToast('Sila masukkan jumlah mata ganjaran yang sah', 'warning');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (pointsForm.action === 'add') {
      addLoyaltyPoints(selectedCustomer.id, pointsForm.points);
    } else {
      const success = redeemLoyaltyPoints(selectedCustomer.id, pointsForm.points);
      if (!success) {
        showToast('Mata ganjaran tidak mencukupi', 'error');
        setIsProcessing(false);
        return;
      }
    }

    closeModal();
  };

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'vip': return { label: 'VIP', class: 'badge-warning', icon: Crown };
      case 'regular': return { label: 'Regular', class: 'badge-success', icon: Star };
      default: return { label: 'New', class: 'badge-info', icon: UserCheck };
    }
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
              Pengurusan Pelanggan
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Database pelanggan dan program kesetiaan
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Tambah Pelanggan
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Jumlah Pelanggan"
            value={metrics.total}
            change="pelanggan berdaftar"
            changeType="neutral"
            icon={UserCheck}
            gradient="primary"
          />
          <StatCard
            label="VIP Members"
            value={metrics.vip}
            change="pelanggan istimewa"
            changeType="positive"
            icon={Crown}
            gradient="warning"
          />
          <StatCard
            label="Jumlah Points"
            value={metrics.totalPoints}
            change="loyalty points"
            changeType="neutral"
            icon={Gift}
          />
          <StatCard
            label="Jumlah Perbelanjaan"
            value={`BND ${metrics.totalSpent.toFixed(0)}`}
            change="total spent"
            changeType="positive"
            icon={TrendingUp}
            gradient="sunset"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
          {/* Customer List */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={20} />
                  Senarai Pelanggan
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Cari nama/telefon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2rem', width: '200px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value as 'all' | 'new' | 'regular' | 'vip')}
                    style={{ width: 'auto' }}
                  >
                    <option value="all">Semua Segment</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="new">New</option>
                  </select>
                </div>
              </div>

              {filteredCustomers.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Pelanggan</th>
                        <th>Telefon</th>
                        <th>Segment</th>
                        <th>Points</th>
                        <th>Orders</th>
                        <th>Spent</th>
                        <th>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(customer => {
                        const badge = getSegmentBadge(customer.segment);
                        const BadgeIcon = badge.icon;
                        return (
                          <tr key={customer.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{customer.name}</div>
                              {customer.birthday && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  🎂 {new Date(customer.birthday).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={14} color="var(--text-secondary)" />
                                {customer.phone}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${badge.class}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
                                <BadgeIcon size={12} />
                                {badge.label}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Gift size={14} color="var(--primary)" />
                                <strong>{customer.loyaltyPoints}</strong>
                              </div>
                            </td>
                            <td>{customer.totalOrders}</td>
                            <td style={{ fontWeight: 600 }}>BND {customer.totalSpent.toFixed(2)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openViewModal(customer)}
                                  title="Lihat"
                                >
                                  <UserCheck size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openPointsModal(customer)}
                                  title="Points"
                                >
                                  <Gift size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openEditModal(customer)}
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
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
                  <UserCheck size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {searchTerm ? 'Tiada pelanggan dijumpai' : 'Belum ada pelanggan'}
                  </p>
                  <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    Tambah Pelanggan Pertama
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Loyalty Program Info */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="var(--warning)" />
                  Program Kesetiaan
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cara Dapat Points</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    BND 1 = 1 Point
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#065f46' }}>Regular (100+ pts)</div>
                  <div style={{ fontSize: '0.75rem', color: '#065f46' }}>5% diskaun</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#92400e' }}>VIP (500+ pts)</div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>10% diskaun + Free drink</div>
                </div>
              </div>
            </div>

            {/* Upcoming Birthdays */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎂 Birthday Minggu Ini
                </div>
              </div>
              {upcomingBirthdays.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {upcomingBirthdays.map(customer => (
                    <div
                      key={customer.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(customer.birthday!).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <span className="badge badge-info">🎉</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.875rem' }}>
                  Tiada birthday minggu ini
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Customer Modal */}
        <Modal
          isOpen={modalType === 'add' || modalType === 'edit'}
          onClose={closeModal}
          title={modalType === 'add' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Nama *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nama pelanggan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombor Telefon *</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+673..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tarikh Lahir</label>
            <input
              type="date"
              className="form-input"
              value={formData.birthday}
              onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nota</label>
            <textarea
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Catatan (allergies, preferences, dll)"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddCustomer : handleEditCustomer}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* View Customer Modal */}
        <Modal
          isOpen={modalType === 'view'}
          onClose={closeModal}
          title="Profil Pelanggan"
          maxWidth="500px"
        >
          {selectedCustomer && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: selectedCustomer.segment === 'vip' ? '#fef3c7' : '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '2rem'
                }}>
                  {selectedCustomer.segment === 'vip' ? '👑' : '⭐'}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedCustomer.name}</h3>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedCustomer.phone}</div>
                <span className={`badge ${getSegmentBadge(selectedCustomer.segment).class}`} style={{ marginTop: '0.5rem' }}>
                  {getSegmentBadge(selectedCustomer.segment).label}
                </span>
              </div>

              <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedCustomer.loyaltyPoints}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Points</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedCustomer.totalOrders}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Orders</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {selectedCustomer.totalSpent.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spent</div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Sejarah Pesanan Terkini</div>
                {getCustomerOrders(selectedCustomer.phone).slice(0, 5).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getCustomerOrders(selectedCustomer.phone).slice(0, 5).map(order => (
                      <div
                        key={order.id}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--gray-100)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.orderNumber}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.createdAt).toLocaleDateString('ms-MY')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>BND {order.total.toFixed(2)}</div>
                          <span className={`badge badge-${order.status === 'completed' ? 'success' : 'warning'}`} style={{ fontSize: '0.6rem' }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                    Tiada sejarah pesanan
                  </p>
                )}
              </div>

              <button className="btn btn-outline" onClick={closeModal} style={{ width: '100%', marginTop: '1.5rem' }}>
                Tutup
              </button>
            </>
          )}
        </Modal>

        {/* Points Modal */}
        <Modal
          isOpen={modalType === 'points'}
          onClose={closeModal}
          title="Urus Mata Ganjaran"
          subtitle={selectedCustomer?.name}
          maxWidth="400px"
        >
          {selectedCustomer && (
            <>
              <div style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Baki Points Semasa
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedCustomer.loyaltyPoints}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tindakan</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPointsForm(prev => ({ ...prev, action: 'add' }))}
                    className={`btn ${pointsForm.action === 'add' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    + Tambah
                  </button>
                  <button
                    onClick={() => setPointsForm(prev => ({ ...prev, action: 'redeem' }))}
                    className={`btn ${pointsForm.action === 'redeem' ? 'btn-danger' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    - Tebus
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Points</label>
                <input
                  type="number"
                  className="form-input"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                  min="0"
                  placeholder="0"
                />
              </div>

              {pointsForm.points > 0 && (
                <div className={`alert ${pointsForm.action === 'add' ? 'alert-success' : 'alert-warning'}`}>
                  Baki baru: <strong>
                    {pointsForm.action === 'add'
                      ? selectedCustomer.loyaltyPoints + pointsForm.points
                      : Math.max(0, selectedCustomer.loyaltyPoints - pointsForm.points)
                    } points
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
                <button
                  className={`btn ${pointsForm.action === 'add' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={handlePointsAction}
                  disabled={isProcessing || pointsForm.points <= 0}
                  style={{ flex: 1 }}
                >
                  {isProcessing ? <LoadingSpinner size="sm" /> : pointsForm.action === 'add' ? 'Tambah Points' : 'Tebus Points'}
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}

