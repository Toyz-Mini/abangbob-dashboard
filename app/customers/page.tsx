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
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

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
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Pengurusan Pelanggan
            </h1>
            <p className="text-gray-500">
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
            value={`BND ${(metrics.totalSpent || 0).toFixed(0)}`}
            change="total spent"
            changeType="positive"
            icon={TrendingUp}
            gradient="sunset"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {/* Customer List */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <div className="card-title flex items-center gap-2">
                  <UserCheck size={20} />
                  Senarai Pelanggan
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      className="form-input pl-8 w-[200px]"
                      placeholder="Cari nama/telefon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="form-select w-auto"
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value as 'all' | 'new' | 'regular' | 'vip')}
                  >
                    <option value="all">Semua Segment</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="new">New</option>
                  </select>
                </div>
              </div>

              {filteredCustomers.length > 0 ? (
                <div className="overflow-x-auto">
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
                               <div className="font-semibold">{customer.name}</div>
                               {customer.birthday && (
                                 <div className="text-xs text-gray-500">
                                   🎂 {new Date(customer.birthday).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                                 </div>
                               )}
                             </td>
                             <td>
                               <div className="flex items-center gap-2">
                                 <Phone size={14} className="text-gray-500" />
                                 {customer.phone}
                               </div>
                             </td>
                             <td>
                               <span className={`badge ${badge.class} flex items-center gap-1 w-fit`}>
                                 <BadgeIcon size={12} />
                                 {badge.label}
                               </span>
                             </td>
                             <td>
                               <div className="flex items-center gap-1">
                                 <Gift size={14} className="text-primary" />
                                 <strong>{customer.loyaltyPoints}</strong>
                               </div>
                             </td>
                             <td>{customer.totalOrders}</td>
                             <td className="font-semibold">BND {(customer.totalSpent || 0).toFixed(2)}</td>
                             <td>
                               <div className="flex gap-1">
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
                <div className="text-center py-12">
                  <UserCheck size={48} color="var(--gray-400)" className="mb-4 mx-auto" />
                  <p className="text-gray-500 mb-4">
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
            <div className="card mb-6">
              <div className="card-header">
                <div className="card-title flex items-center gap-2">
                  <Award size={20} color="var(--warning)" />
                  Program Kesetiaan
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-md">
                  <div className="font-semibold text-sm">Cara Dapat Points</div>
                  <div className="text-xs text-gray-500">
                    BND 1 = 1 Point
                  </div>
                </div>
                <div className="p-3 bg-success-light rounded-sm">
                  <div className="font-semibold text-sm text-success-dark">Regular (100+ pts)</div>
                  <div className="text-xs text-success-dark">5% diskaun</div>
                </div>
                <div className="p-3 bg-warning-light rounded-sm">
                  <div className="font-semibold text-sm text-warning-dark">VIP (500+ pts)</div>
                  <div className="text-xs text-warning-dark">10% diskaun + Free drink</div>
                </div>
              </div>
            </div>

            {/* Upcoming Birthdays */}
            <div className="card">
              <div className="card-header">
                <div className="card-title flex items-center gap-2">
                  🎂 Birthday Minggu Ini
                </div>
              </div>
              {upcomingBirthdays.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {upcomingBirthdays.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 bg-gray-100 dark:bg-white/5 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-sm">{customer.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(customer.birthday!).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <span className="badge badge-info">🎉</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 p-4 text-sm">
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

          <div className="flex gap-2 mt-6">
            <button className="btn btn-outline flex-1" onClick={closeModal}>Batal</button>
            <button
              className="btn btn-primary flex-1"
              onClick={modalType === 'add' ? handleAddCustomer : handleEditCustomer}
              disabled={isProcessing}
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
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${selectedCustomer.segment === 'vip' ? 'bg-warning-light' : 'bg-info-light'}`}>
                  {selectedCustomer.segment === 'vip' ? '👑' : '⭐'}
                </div>
                <h3 className="text-xl font-medium m-0">{selectedCustomer.name}</h3>
                <div className="text-gray-500 mt-1">{selectedCustomer.phone}</div>
                <span className={`badge ${getSegmentBadge(selectedCustomer.segment).class} mt-2`}>
                  {getSegmentBadge(selectedCustomer.segment).label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCustomer.loyaltyPoints}
                  </div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCustomer.totalOrders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {(selectedCustomer.totalSpent || 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">Spent</div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <div className="font-semibold mb-2">Sejarah Pesanan Terkini</div>
                {getCustomerOrders(selectedCustomer.phone).slice(0, 5).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {getCustomerOrders(selectedCustomer.phone).slice(0, 5).map(order => (
                      <div
                        key={order.id}
                        className="p-3 bg-gray-100 dark:bg-white/5 rounded-md flex justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('ms-MY')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">BND {(order.total || 0).toFixed(2)}</div>
                          <span className={`badge badge-${order.status === 'completed' ? 'success' : 'warning'} text-[10px]`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center p-4">
                    Tiada sejarah pesanan
                  </p>
                )}
              </div>

              <button className="btn btn-outline w-full mt-6" onClick={closeModal}>
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
              <div className="text-center p-6 bg-gray-100 dark:bg-white/5 rounded-lg mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  Baki Points Semasa
                </div>
                <div className="text-4xl font-bold text-primary">
                  {selectedCustomer.loyaltyPoints}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tindakan</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPointsForm(prev => ({ ...prev, action: 'add' }))}
                    className={`btn flex-1 ${pointsForm.action === 'add' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    + Tambah
                  </button>
                  <button
                    onClick={() => setPointsForm(prev => ({ ...prev, action: 'redeem' }))}
                    className={`btn flex-1 ${pointsForm.action === 'redeem' ? 'btn-danger' : 'btn-outline'}`}
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

              <div className="flex gap-2 mt-6">
                <button className="btn btn-outline flex-1" onClick={closeModal}>Batal</button>
                <button
                  className={`btn flex-1 ${pointsForm.action === 'add' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={handlePointsAction}
                  disabled={isProcessing || pointsForm.points <= 0}
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

