'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useNotifications, useInventory, useOrders, useStore } from '@/lib/store';
import { Notification as NotificationType } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Users,
  DollarSign,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  ChefHat,
  Clock,
  Inbox
} from 'lucide-react';
import StatCard from '@/components/StatCard';

export default function NotificationsPage() {
  const { 
    notifications, 
    addNotification,
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification,
    getUnreadCount,
    isInitialized 
  } = useNotifications();

  const { inventory } = useInventory();
  const { orders, getTodayOrders } = useOrders();
  const { deliveryOrders, productionLogs } = useStore();

  const [filterType, setFilterType] = useState<'all' | 'unread' | NotificationType['type']>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate smart notifications based on current data
  const generateSmartNotifications = () => {
    setIsRefreshing(true);

    // Check for low stock
    const lowStockItems = inventory.filter(item => item.currentQuantity <= item.minQuantity);
    lowStockItems.forEach(item => {
      const exists = notifications.some(n => 
        n.type === 'low_stock' && 
        n.message.includes(item.name) &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      );
      if (!exists) {
        addNotification({
          type: 'low_stock',
          priority: item.currentQuantity <= item.minQuantity * 0.5 ? 'critical' : 'high',
          title: 'Stok Rendah',
          message: `${item.name} tinggal ${item.currentQuantity} ${item.unit}. Minimum: ${item.minQuantity} ${item.unit}`,
          actionUrl: '/inventory',
        });
      }
    });

    // Check for new delivery orders
    const newDeliveryOrders = deliveryOrders.filter(o => o.status === 'new');
    if (newDeliveryOrders.length > 0) {
      const exists = notifications.some(n => 
        n.type === 'new_order' && 
        n.message.includes(`${newDeliveryOrders.length} pesanan baru`) &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      );
      if (!exists) {
        addNotification({
          type: 'new_order',
          priority: 'high',
          title: 'Pesanan Delivery Baru',
          message: `${newDeliveryOrders.length} pesanan baru menunggu diproses`,
          actionUrl: '/delivery',
        });
      }
    }

    // Check for pending orders too long
    const todayOrders = getTodayOrders();
    const pendingTooLong = todayOrders.filter(o => {
      if (o.status !== 'pending') return false;
      const created = new Date(o.createdAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
      return diffMinutes > 15;
    });

    if (pendingTooLong.length > 0) {
      const exists = notifications.some(n => 
        n.type === 'new_order' && 
        n.message.includes('lebih 15 minit') &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      );
      if (!exists) {
        addNotification({
          type: 'new_order',
          priority: 'critical',
          title: 'Pesanan Tertunda',
          message: `${pendingTooLong.length} pesanan pending lebih 15 minit!`,
          actionUrl: '/pos',
        });
      }
    }

    // Check production logs for waste
    const todayLogs = productionLogs.filter(log => log.date === new Date().toISOString().split('T')[0]);
    const totalWaste = todayLogs.reduce((sum, log) => sum + log.wasteAmount, 0);
    if (totalWaste > 10) {
      const exists = notifications.some(n => 
        n.type === 'equipment' && 
        n.message.includes('pembaziran') &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      );
      if (!exists) {
        addNotification({
          type: 'equipment',
          priority: 'medium',
          title: 'Pembaziran Tinggi',
          message: `${totalWaste} unit dibazirkan hari ini. Sila semak production log.`,
          actionUrl: '/production',
        });
      }
    }

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Auto-generate on mount
  useEffect(() => {
    if (isInitialized) {
      generateSmartNotifications();
    }
  }, [isInitialized]);

  // Calculate stats
  const stats = useMemo(() => {
    const unread = getUnreadCount();
    const critical = notifications.filter(n => n.priority === 'critical' && !n.isRead).length;
    const today = notifications.filter(n => 
      new Date(n.createdAt).toDateString() === new Date().toDateString()
    ).length;

    return { unread, critical, today, total: notifications.length };
  }, [notifications, getUnreadCount]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === 'all') return true;
      if (filterType === 'unread') return !n.isRead;
      return n.type === filterType;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filterType]);

  const getTypeIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'low_stock': return Package;
      case 'new_order': return ShoppingCart;
      case 'equipment': return ChefHat;
      case 'staff': return Users;
      case 'finance': return DollarSign;
      default: return Settings;
    }
  };

  const getTypeColor = (type: NotificationType['type']) => {
    switch (type) {
      case 'low_stock': return '#f59e0b';
      case 'new_order': return '#3b82f6';
      case 'equipment': return '#8b5cf6';
      case 'staff': return '#10b981';
      case 'finance': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const getPriorityStyle = (priority: NotificationType['priority']) => {
    switch (priority) {
      case 'critical': return { background: '#fee2e2', borderColor: '#ef4444' };
      case 'high': return { background: '#fef3c7', borderColor: '#f59e0b' };
      case 'medium': return { background: '#dbeafe', borderColor: '#3b82f6' };
      default: return { background: 'var(--gray-100)', borderColor: 'var(--gray-300)' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru sahaja';
    if (diffMins < 60) return `${diffMins} minit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Semalam';
    return date.toLocaleDateString('ms-MY');
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
              Pusat Notifikasi
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Semua amaran dan peringatan penting
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={generateSmartNotifications}
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            {stats.unread > 0 && (
              <button className="btn btn-primary" onClick={markAllNotificationsRead}>
                <CheckCheck size={18} />
                Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Belum Dibaca"
            value={stats.unread}
            change={stats.unread > 0 ? "perlu perhatian" : "semua dibaca"}
            changeType={stats.unread > 0 ? "neutral" : "positive"}
            icon={Bell}
            gradient="primary"
          />
          <StatCard
            label="Kritikal"
            value={stats.critical}
            change={stats.critical > 0 ? "tindakan segera" : "tiada kritikal"}
            changeType={stats.critical > 0 ? "negative" : "positive"}
            icon={AlertTriangle}
            gradient="warning"
          />
          <StatCard
            label="Hari Ini"
            value={stats.today}
            change="notifikasi baharu"
            changeType="neutral"
            icon={Clock}
            gradient="coral"
          />
          <StatCard
            label="Jumlah"
            value={stats.total}
            change="semua notifikasi"
            changeType="neutral"
            icon={Inbox}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`btn btn-sm ${filterType === 'unread' ? 'btn-primary' : 'btn-outline'}`}
          >
            Belum Dibaca ({stats.unread})
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`btn btn-sm ${filterType === 'low_stock' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Package size={14} />
            Stok
          </button>
          <button
            onClick={() => setFilterType('new_order')}
            className={`btn btn-sm ${filterType === 'new_order' ? 'btn-primary' : 'btn-outline'}`}
          >
            <ShoppingCart size={14} />
            Pesanan
          </button>
          <button
            onClick={() => setFilterType('equipment')}
            className={`btn btn-sm ${filterType === 'equipment' ? 'btn-primary' : 'btn-outline'}`}
          >
            <ChefHat size={14} />
            Equipment
          </button>
          <button
            onClick={() => setFilterType('staff')}
            className={`btn btn-sm ${filterType === 'staff' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Users size={14} />
            Staf
          </button>
        </div>

        {/* Notifications List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} />
              Senarai Notifikasi
            </div>
            <div className="card-subtitle">{filteredNotifications.length} notifikasi</div>
          </div>

          {filteredNotifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map((notif, idx) => {
                const Icon = getTypeIcon(notif.type);
                const priorityStyle = getPriorityStyle(notif.priority);
                const typeColor = getTypeColor(notif.type);

                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '1rem',
                      borderBottom: idx < filteredNotifications.length - 1 ? '1px solid var(--gray-200)' : 'none',
                      background: notif.isRead ? 'transparent' : 'var(--gray-50)',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${typeColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color={typeColor} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{notif.title}</span>
                        {!notif.isRead && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                          }} />
                        )}
                        <span className={`badge ${
                          notif.priority === 'critical' ? 'badge-danger' :
                          notif.priority === 'high' ? 'badge-warning' :
                          notif.priority === 'medium' ? 'badge-info' : 'badge-success'
                        }`} style={{ fontSize: '0.6rem' }}>
                          {notif.priority}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {notif.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatTime(notif.createdAt)}
                        </span>
                        {notif.actionUrl && (
                          <a
                            href={notif.actionUrl}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Lihat
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      {!notif.isRead && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => markNotificationRead(notif.id)}
                          title="Tandai dibaca"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => deleteNotification(notif.id)}
                        title="Padam"
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Bell size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {filterType === 'unread' 
                  ? 'Tiada notifikasi belum dibaca' 
                  : 'Tiada notifikasi untuk ditunjukkan'
                }
              </p>
            </div>
          )}
        </div>

        {/* Smart Suggestions Card */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💡 Cadangan Pintar
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
            {inventory.filter(i => i.currentQuantity <= i.minQuantity).length > 0 && (
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
                  📦 Restock Stok
                </div>
                <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  {inventory.filter(i => i.currentQuantity <= i.minQuantity).length} item perlu diisi semula. 
                  <a href="/suppliers" style={{ marginLeft: '0.5rem', textDecoration: 'underline' }}>Buat PO →</a>
                </p>
              </div>
            )}

            {getTodayOrders().filter(o => o.status === 'pending').length > 3 && (
              <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
                  🍳 Masa Sibuk
                </div>
                <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                  Banyak pesanan pending. Pertimbangkan untuk tambah staf.
                  <a href="/hr/schedule" style={{ marginLeft: '0.5rem', textDecoration: 'underline' }}>Jadual →</a>
                </p>
              </div>
            )}

            <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '0.5rem' }}>
                📊 Semak Analytics
              </div>
              <p style={{ fontSize: '0.875rem', color: '#065f46' }}>
                Lihat insights jualan dan prestasi kedai anda.
                <a href="/analytics" style={{ marginLeft: '0.5rem', textDecoration: 'underline' }}>Analytics →</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

