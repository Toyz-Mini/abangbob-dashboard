'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrders, useStaff } from '@/lib/store';
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
  User
} from 'lucide-react';
import Link from 'next/link';

type OrderColumn = 'pending' | 'preparing' | 'ready';

export default function KDSPage() {
  const { orders, updateOrderStatus, getTodayOrders, isInitialized } = useOrders();
  const { staff, isInitialized: staffInitialized } = useStaff();
  const { playSound, settings: soundSettings } = useSound();
  const { t, language } = useLanguage();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        background: 'var(--bg-primary)',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isFullscreen && (
            <Link href="/" className="btn btn-ghost">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat size={28} />
              {t('kds.title')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {currentTime.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'short' })} •
              {currentTime.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#fef3c7',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>{pendingOrders.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>{t('kds.pending')}</div>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#dbeafe',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>{preparingOrders.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#1e40af' }}>{t('kds.preparing')}</div>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#d1fae5',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065f46' }}>{readyOrders.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#065f46' }}>{t('kds.ready')}</div>
            </div>
          </div>

          {/* Staff Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: selectedStaffId ? '#dbeafe' : '#fef3c7',
            borderRadius: 'var(--radius-md)',
            border: '2px solid ' + (selectedStaffId ? '#3b82f6' : '#f59e0b')
          }}>
            <User size={18} color={selectedStaffId ? '#1e40af' : '#92400e'} />
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: selectedStaffId ? '#1e40af' : '#92400e',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              <option value="">{t('kds.selectStaff')}</option>
              {activeStaff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Sound indicator */}
          <div style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            color: soundSettings.enabled ? 'var(--success)' : 'var(--danger)'
          }}>
            {soundSettings.enabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-outline"
            style={{ padding: '0.75rem' }}
            title={isFullscreen ? t('kds.exitFullscreen') : t('kds.fullscreen')}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Order Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)'
      }}>
        {/* Pending Column */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isUrgent={isUrgent(order)}
                  timeElapsed={getTimeElapsed(order.createdAt)}
                  onAction={() => handleStatusChange(order.id, 'preparing')}
                  actionLabel={t('kds.start')}
                  actionColor="var(--primary)"
                />
              ))
            ) : (
              <EmptyState message={t('kds.noNewOrders')} />
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div style={{
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {preparingOrders.length > 0 ? (
              preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isUrgent={isUrgent(order)}
                  timeElapsed={getTimeElapsed(order.createdAt)}
                  onAction={() => handleStatusChange(order.id, 'ready')}
                  actionLabel={t('kds.done')}
                  actionColor="var(--success)"
                />
              ))
            ) : (
              <EmptyState message={t('kds.noPreparing')} />
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div style={{
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {readyOrders.length > 0 ? (
              readyOrders.map(order => (
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
              ))
            ) : (
              <EmptyState message={t('kds.noReady')} />
            )}
          </div>
        </div>
      </div>
    </div>
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
                        {mod.optionName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
