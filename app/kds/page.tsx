'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrders, useStaff } from '@/lib/store';
import { useOrdersRealtime } from '@/lib/supabase/realtime-hooks';
import { useSound } from '@/lib/contexts/SoundContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Order } from '@/lib/types';
import {
  Maximize,
  Minimize,
  Clock,
  ChefHat,
  CheckCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  ArrowLeft,
  RefreshCw,
  User,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { WhatsAppService } from '@/lib/services/whatsapp';

type OrderColumn = 'pending' | 'preparing' | 'ready';

export default function KDSPage() {
  const { orders, updateOrderStatus, getTodayOrders, refreshOrders, isInitialized } = useOrders();
  const { staff, isInitialized: staffInitialized } = useStaff();
  const { playSound, settings: soundSettings } = useSound();
  const { t, language } = useLanguage();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OrderColumn>('pending');

  // Subscribe to realtime order changes
  const handleOrderChange = useCallback(() => {
    console.log('[KDS Realtime] Order change detected, refreshing...');
    refreshOrders();
  }, [refreshOrders]);

  useOrdersRealtime(handleOrderChange);

  // Locale for date formatting
  const dateLocale = language === 'en' ? 'en-MY' : 'ms-MY';

  // Load saved staff selection from localStorage
  useEffect(() => {
    const savedStaffId = localStorage.getItem('kds_staff_id');
    if (savedStaffId) {
      setSelectedStaffId(savedStaffId);
    }
  }, []);

  // Save staff selection to localStorage
  const handleStaffChange = (staffId: string) => {
    setSelectedStaffId(staffId);
    localStorage.setItem('kds_staff_id', staffId);
  };

  // Get active staff for dropdown
  const activeStaff = staff.filter(s => s.status === 'active');

  // Get today's orders
  const todayOrders = getTodayOrders();

  // Categorize orders
  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Play sound when new order arrives
  useEffect(() => {
    if (pendingOrders.length > lastOrderCount && lastOrderCount > 0) {
      playSound('newOrder');
    }
    setLastOrderCount(pendingOrders.length);
  }, [pendingOrders.length, lastOrderCount, playSound]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate time elapsed since order creation
  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return language === 'en' ? 'New' : 'Baru';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Determine if order is urgent (>10 mins for pending, >15 mins for preparing)
  const isUrgent = (order: Order) => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000);

    if (order.status === 'pending' && diffMins >= 5) return true;
    if (order.status === 'preparing' && diffMins >= 15) return true;
    return false;
  };

  // Handle order status change
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    // Pass staffId for speed tracking when status changes to preparing or ready
    updateOrderStatus(orderId, newStatus, selectedStaffId || undefined);
    if (newStatus === 'ready') {
      playSound('orderReady');
    } else if (newStatus === 'preparing') {
      playSound('success');
    }
  };

  if (!isInitialized || !staffInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-secondary)'
      }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  // Get selected staff name
  const selectedStaffName = activeStaff.find(s => s.id === selectedStaffId)?.name;

  return (
    <div className={isFullscreen ? 'kds-fullscreen' : ''} style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: isFullscreen ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '1rem',
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0'
      }}>
        {/* Left: Brand & Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!isFullscreen && (
            <Link href="/" style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: '#64748b',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowLeft size={20} />
            </Link>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Abang Bob Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                KITCHEN DISPLAY
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                {t('kds.title')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="kds-stats-desktop" style={{ display: 'flex', gap: '2rem' }}>
          {/* Pending Stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: '#f59e0b', background: '#fffbeb', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{pendingOrders.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t('kds.pending')}</div>
            </div>
          </div>
          {/* Preparing Stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: '#3b82f6', background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <ChefHat size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{preparingOrders.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t('kds.preparing')}</div>
            </div>
          </div>
          {/* Ready Stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: '#10b981', background: '#ecfdf5', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{readyOrders.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t('kds.ready')}</div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Time */}
          <div className="kds-time" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
              {currentTime.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              {currentTime.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Staff Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              height: '48px'
            }}>
              <User size={18} color={'#64748b'} />
              <select
                value={selectedStaffId}
                onChange={(e) => handleStaffChange(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: '120px'
                }}
              >
                <option value="">Staff</option>
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Sound */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              background: soundSettings.enabled ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${soundSettings.enabled ? '#bbf7d0' : '#fecaca'}`,
              color: soundSettings.enabled ? '#16a34a' : '#dc2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {soundSettings.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="kds-mobile-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          style={{ borderColor: '#f59e0b', color: activeTab === 'pending' ? '#92400e' : '#666' }}
        >
          {t('kds.pending')} ({pendingOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'preparing' ? 'active' : ''}`}
          onClick={() => setActiveTab('preparing')}
          style={{ borderColor: '#3b82f6', color: activeTab === 'preparing' ? '#1e40af' : '#666' }}
        >
          {t('kds.preparing')} ({preparingOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
          style={{ borderColor: '#10b981', color: activeTab === 'ready' ? '#065f46' : '#666' }}
        >
          {t('kds.ready')} ({readyOrders.length})
        </button>
      </div>

      {/* Order Columns */}
      <div className="kds-grid" style={{
        gap: '1rem',
        height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)'
      }}>
        {/* Pending Column */}
        <div className={`kds-column ${activeTab === 'pending' ? 'active' : ''}`} style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex', // Default display, will be overridden by CSS for mobile
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            background: '#fef3c7',
            borderBottom: '3px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#92400e" />
              <span style={{ fontWeight: 700, color: '#92400e' }}>{t('kds.pending')}</span>
            </div>
            <span style={{
              background: '#f59e0b',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 700
            }}>
              {pendingOrders.length}
            </span>
          </div>

          {pendingOrders.length > 0 ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isUrgent={isUrgent(order)}
                  timeElapsed={getTimeElapsed(order.createdAt)}
                  onAction={() => handleStatusChange(order.id, 'preparing')}
                  actionLabel={t('kds.start')}
                  actionColor="var(--primary)"
                />
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState message={t('kds.noNewOrders')} />
            </div>
          )}
        </div>

        {/* Preparing Column */}
        <div className={`kds-column ${activeTab === 'preparing' ? 'active' : ''}`} style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            background: '#dbeafe',
            borderBottom: '3px solid #3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat size={20} color="#1e40af" />
              <span style={{ fontWeight: 700, color: '#1e40af' }}>{t('kds.preparing')}</span>
            </div>
            <span style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 700
            }}>
              {preparingOrders.length}
            </span>
          </div>

          {preparingOrders.length > 0 ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isUrgent={isUrgent(order)}
                  timeElapsed={getTimeElapsed(order.createdAt)}
                  onAction={() => handleStatusChange(order.id, 'ready')}
                  actionLabel={t('kds.done')}
                  actionColor="var(--success)"
                />
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState message={t('kds.noPreparing')} />
            </div>
          )}
        </div>

        {/* Ready Column */}
        <div className={`kds-column ${activeTab === 'ready' ? 'active' : ''}`} style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            background: '#d1fae5',
            borderBottom: '3px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="#065f46" />
              <span style={{ fontWeight: 700, color: '#065f46' }}>{t('kds.ready')}</span>
            </div>
            <span style={{
              background: '#10b981',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 700
            }}>
              {readyOrders.length}
            </span>
          </div>

          {readyOrders.length > 0 ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isUrgent={false}
                  timeElapsed={getTimeElapsed(order.createdAt)}
                  onAction={() => handleStatusChange(order.id, 'completed')}
                  actionLabel={t('kds.bump')}
                  actionColor="var(--gray-600)"
                  isReady
                />
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState message={t('kds.noReady')} />
            </div>
          )}
        </div>
      </div>


      <style jsx>{`
        .kds-mobile-tabs {
          display: none;
          margin-bottom: 1rem;
          gap: 0.5rem;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 4px;
        }
        
        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-bottom: 3px solid transparent;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-btn.active {
          background: #f9fafb;
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .kds-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1024px) {
          .kds-mobile-tabs {
            display: flex;
          }

          .kds-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch !important;
            padding: 1rem !important;
            margin-bottom: 0.75rem !important;
          }

          .kds-stats-desktop {
            display: none !important;
          }

          .kds-controls {
            justify-content: space-between;
            width: 100%;
          }

          .kds-grid {
            display: block; /* Stack or just show one */
            grid-template-columns: 1fr;
          }

          .kds-column {
            display: none !important;
            height: 100%;
          }

          .kds-column.active {
            display: flex !important;
          }
        }
      `}</style>
    </div >
  );
}

// Order Card Component
function OrderCard({
  order,
  isUrgent,
  timeElapsed,
  onAction,
  actionLabel,
  actionColor,
  isReady = false
}: {
  order: Order;
  isUrgent: boolean;
  timeElapsed: string;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
  isReady?: boolean;
}) {
  return (
    <div
      style={{
        background: isUrgent ? '#fef2f2' : 'var(--gray-50)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '0.75rem',
        borderLeft: `4px solid ${isUrgent ? 'var(--danger)' : isReady ? 'var(--success)' : 'var(--gray-300)'}`,
        animation: isUrgent ? 'pulse 2s infinite' : 'none'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{order.orderNumber}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          background: isUrgent ? '#fee2e2' : 'var(--gray-200)',
          color: isUrgent ? 'var(--danger)' : 'var(--text-secondary)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {isUrgent && <AlertTriangle size={12} />}
          <Clock size={12} />
          {timeElapsed}
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '0.75rem' }}>
        {order.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.5rem 0',
              borderBottom: idx < order.items.length - 1 ? '1px dashed var(--gray-300)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{
                minWidth: '28px',
                height: '28px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginRight: '0.75rem',
                fontSize: '0.875rem',
                flexShrink: 0
              }}>
                {item.quantity}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>
                  {item.name}
                </span>
                {item.description && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                    {item.description}
                  </div>
                )}
                {/* Show modifiers/flavours */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    {item.selectedModifiers.map((mod, modIdx) => (
                      <span
                        key={modIdx}
                        style={{
                          display: 'inline-block',
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          marginRight: '0.25rem',
                          marginTop: '0.25rem',
                          border: '1px solid #f59e0b'
                        }}
                      >
                        {mod.groupName ? `${mod.groupName.replace('Pilih ', '').replace('Flavour ', '')}: ` : ''}<b>{mod.optionName}</b>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp Notify Button (Only for Ready orders) */}
      {isReady && order.customerPhone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const msg = WhatsAppService.generateOrderReadyMessage(order, order.customerName);
            WhatsAppService.openWhatsApp(order.customerPhone!, msg);
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '0.5rem',
            border: '1px solid #25D366',
            borderRadius: 'var(--radius-md)',
            background: 'white',
            color: '#25D366',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <MessageCircle size={18} />
          Notify Customer
        </button>
      )}

      {/* Action Button */}
      <button
        onClick={onAction}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          background: actionColor,
          color: 'white',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {actionLabel.toUpperCase().includes('START') && <ChefHat size={18} />}
        {actionLabel.toUpperCase().includes('DONE') && <CheckCircle size={18} />}
        {actionLabel}
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: 'var(--text-secondary)'
    }}>
      <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
      <span>{message}</span>
    </div>
  );
}
