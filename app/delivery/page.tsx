'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { DELIVERY_PLATFORMS } from '@/lib/delivery-data';
import { useStore } from '@/lib/store';
import { useDeliveryOrdersRealtime } from '@/lib/supabase/realtime-hooks';
import { DeliveryOrder } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Volume2, VolumeX, Printer, Bell, RefreshCw, ShoppingBag, ChefHat, CheckCircle, Truck, UserPlus } from 'lucide-react';
import StatCard from '@/components/StatCard';

// Sample driver list (in production, this would come from API)
const AVAILABLE_DRIVERS = [
  { id: 'd1', name: 'Ahmad', phone: '0812345678', plate: 'BKC 1234' },
  { id: 'd2', name: 'Rahman', phone: '0812345679', plate: 'BKC 5678' },
  { id: 'd3', name: 'Faizal', phone: '0812345670', plate: 'BKC 9012' },
  { id: 'd4', name: 'Syafiq', phone: '0812345671', plate: 'BKC 3456' },
];

export default function DeliveryHubPage() {
  const { deliveryOrders, updateDeliveryStatus, refreshDeliveryOrders, isInitialized } = useStore();

  // Realtime subscription for delivery orders
  const handleDeliveryOrderChange = useCallback(() => {
    console.log('[Realtime] Delivery order change detected, refreshing...');
    refreshDeliveryOrders();
  }, [refreshDeliveryOrders]);

  useDeliveryOrdersRealtime(handleDeliveryOrderChange);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  // Initialize audio for notification
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAkAHIHa3LqdTwtAmNnMlnk8D0SYx86ZfjUDVrPXwpSDKgpdsuTJj3UqC2m578qKaykOdsD42IN0HRuK2O6vgFsYCo/k9aeAYBYLnfL8oH1hDxiz/faNh2ETCL7//HuXaxYJyvz9cJ9wFQzb/vxqpHERDen99mmpchIQ9v71ZK10Dwz6/vRfr3QNDP3/82GwdQwM//7yY7F0DAz+//FjsnQLDf//8WOydAsO//7xY7J0Cw7///FjsXQLD///8WSxdAsP//7xZLF0Cw////BksHQLD///8GSwdAsP//7wZLB0Cw////BksHQKD///8GSwdAoP//7wZLB0Cg///vBksHQKD//+8GSwdAoP//7wZLB0Cg');
  }, []);

  // Check for new orders and play sound
  useEffect(() => {
    const newOrders = deliveryOrders.filter(o => o.status === 'new');

    if (newOrders.length > lastOrderCount && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }

    setLastOrderCount(newOrders.length);
  }, [deliveryOrders, soundEnabled, lastOrderCount]);

  const getOrdersByStatus = (status: DeliveryOrder['status']) => {
    return deliveryOrders.filter(order => order.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'var(--primary)';
      case 'preparing': return 'var(--warning)';
      case 'ready': return 'var(--success)';
      case 'picked_up': return 'var(--gray-400)';
      default: return 'var(--gray-400)';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Grab': return '#00b14f';
      case 'Panda': return '#d70f64';
      case 'Shopee': return '#ee4d2d';
      default: return 'var(--primary)';
    }
  };

  const handlePrintSlip = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    // Lookup fresh order data from deliveryOrders array to avoid stale state
    const freshOrder = deliveryOrders.find(o => o.id === orderId);
    if (freshOrder) {
      setSelectedOrder(freshOrder);
      setShowSlipModal(true);
    }
  };

  const printDeliverySlip = () => {
    if (slipRef.current) {
      const printContent = slipRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Slip Delivery - ${selectedOrder?.id}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  width: 80mm;
                  margin: 0 auto;
                  padding: 10px;
                  font-size: 12px;
                }
                .header { text-align: center; margin-bottom: 10px; font-weight: bold; }
                .platform { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .item { margin: 4px 0; }
                .footer { text-align: center; margin-top: 10px; font-size: 10px; }
                .large { font-size: 14px; font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const KanbanColumn = ({ title, orders, status, emoji }: { title: string; orders: DeliveryOrder[]; status: DeliveryOrder['status']; emoji: string }) => {
    const canMoveTo = (currentStatus: DeliveryOrder['status']): DeliveryOrder['status'] | null => {
      const flow: DeliveryOrder['status'][] = ['new', 'preparing', 'ready', 'picked_up'];
      const currentIndex = flow.indexOf(currentStatus);
      return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
    };

    return (
      <div className="card" style={{ minHeight: '450px' }}>
        <div className="card-header">
          <div className="card-title">{emoji} {title}</div>
          <div className="card-subtitle">{orders.length} order(s)</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
          {orders.map(order => {
            const nextStatus = canMoveTo(order.status);
            const platformColor = getPlatformColor(order.platform);

            return (
              <div
                key={order.id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  borderLeft: `4px solid ${platformColor}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                      {order.customerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      #{order.id.slice(-6)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: `${platformColor}20`,
                      color: platformColor,
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  >
                    {order.platform}
                  </span>
                </div>

                <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ marginBottom: '0.25rem' }}>
                      <strong>{item.quantity}x</strong> {item.name}
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    BND {order.totalAmount.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {status !== 'picked_up' && (
                      <button
                        onClick={(e) => handlePrintSlip(e, order.id)}
                        className="btn btn-sm btn-outline"
                        title="Print Slip"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <Printer size={14} />
                      </button>
                    )}
                    {/* Assign Driver Button */}
                    {(status === 'ready' || status === 'preparing') && !order.driverName && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setSelectedDriver('');
                          setShowDriverModal(true);
                        }}
                        className="btn btn-sm btn-outline"
                        title="Assign Driver"
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--warning)' }}
                      >
                        <UserPlus size={14} />
                      </button>
                    )}
                    {nextStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDeliveryStatus(order.id, nextStatus);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        → {nextStatus === 'preparing' ? 'Prepare' :
                          nextStatus === 'ready' ? 'Ready' : 'Picked Up'}
                      </button>
                    )}
                  </div>
                </div>

                {order.driverName && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    padding: '0.5rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    🚗 {order.driverName} ({order.driverPlate})
                  </div>
                )}
              </div>
            );
          })}
          {orders.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Tiada pesanan
            </p>
          )}
        </div>
      </div>
    );
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

  const newOrders = getOrdersByStatus('new');
  const preparingOrders = getOrdersByStatus('preparing');
  const readyOrders = getOrdersByStatus('ready');
  const pickedUpOrders = getOrdersByStatus('picked_up');

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                Unified Delivery Hub
              </h1>
              <p className="page-subtitle">
                Terima semua order delivery dalam satu skrin
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`btn ${soundEnabled ? 'btn-primary' : 'btn-outline'}`}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </button>
            </div>
          </div>
        </div>

        {/* New Order Alert */}
        {newOrders.length > 0 && (
          <div className="alert alert-warning" style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} />
              <strong>{newOrders.length} pesanan baru!</strong> Sila proses dengan segera.
            </div>
          </div>
        )}

        {/* Platform Status Bar */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">Platform Status</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {DELIVERY_PLATFORMS.map(platform => (
              <div
                key={platform.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: platform.status === 'online' ? '#d1fae5' : '#fee2e2',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${getPlatformColor(platform.name)}`
                }}
              >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: platform.status === 'online' ? 'var(--success)' : 'var(--danger)',
                  animation: platform.status === 'online' ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{ fontWeight: 600 }}>
                  {platform.name}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase'
                }}>
                  {platform.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="New Orders"
            value={newOrders.length}
            change={newOrders.length > 0 ? "perlu diproses" : "tiada order baru"}
            changeType={newOrders.length > 0 ? "neutral" : "positive"}
            icon={ShoppingBag}
            gradient="primary"
          />
          <StatCard
            label="Preparing"
            value={preparingOrders.length}
            change="sedang disediakan"
            changeType="neutral"
            icon={ChefHat}
            gradient="warning"
          />
          <StatCard
            label="Ready"
            value={readyOrders.length}
            change="siap untuk pickup"
            changeType={readyOrders.length > 0 ? "positive" : "neutral"}
            icon={CheckCircle}
            gradient="peach"
          />
          <StatCard
            label="Completed Today"
            value={pickedUpOrders.length}
            change="sudah dihantar"
            changeType="neutral"
            icon={Truck}
          />
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
          <KanbanColumn title="New Orders" orders={newOrders} status="new" emoji="🆕" />
          <KanbanColumn title="Preparing" orders={preparingOrders} status="preparing" emoji="👨‍🍳" />
          <KanbanColumn title="Ready" orders={readyOrders} status="ready" emoji="✅" />
          <KanbanColumn title="Picked Up" orders={pickedUpOrders} status="picked_up" emoji="🚚" />
        </div>

        {/* Print Slip Modal */}
        <Modal
          isOpen={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          title="Delivery Slip"
          maxWidth="400px"
        >
          {selectedOrder && (
            <>
              <div
                ref={slipRef}
                style={{
                  background: 'var(--gray-50)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                <div className="header" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div className="platform" style={{ fontSize: '1.25rem', fontWeight: 700, color: getPlatformColor(selectedOrder.platform) }}>
                    {selectedOrder.platform}
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>ABANGBOB - Delivery Order</div>
                </div>

                <div className="divider" style={{ borderTop: '1px dashed var(--gray-300)', margin: '0.75rem 0' }} />

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Order ID:</strong> #{selectedOrder.id.slice(-6)}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Customer:</strong> {selectedOrder.customerName}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Phone:</strong> {selectedOrder.customerPhone}
                </div>
                <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('ms-MY')}
                </div>

                <div className="divider" style={{ borderTop: '1px dashed var(--gray-300)', margin: '0.75rem 0' }} />

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Items:</strong>
                </div>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="item" style={{ marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                    <strong>{item.quantity}x</strong> {item.name}
                  </div>
                ))}

                <div className="divider" style={{ borderTop: '1px dashed var(--gray-300)', margin: '0.75rem 0' }} />

                <div className="large" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>TOTAL:</span>
                  <span>BND {selectedOrder.totalAmount.toFixed(2)}</span>
                </div>

                {selectedOrder.driverName && (
                  <>
                    <div className="divider" style={{ borderTop: '1px dashed var(--gray-300)', margin: '0.75rem 0' }} />
                    <div className="footer" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                      <div>Driver: {selectedOrder.driverName}</div>
                      <div>Plate: {selectedOrder.driverPlate}</div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Tutup
                </button>
                <button
                  onClick={printDeliverySlip}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Printer size={18} />
                  Cetak Slip
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Driver Assignment Modal */}
        <Modal
          isOpen={showDriverModal}
          onClose={() => setShowDriverModal(false)}
          title="Assign Driver"
          maxWidth="400px"
        >
          {selectedOrder && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Order: #{selectedOrder.id.slice(-6)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedOrder.customerName} • {selectedOrder.items.length} items
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Driver</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {AVAILABLE_DRIVERS.map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver.id)}
                      className={`btn ${selectedDriver === driver.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{driver.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          📞 {driver.phone} • 🚗 {driver.plate}
                        </div>
                      </div>
                      {selectedDriver === driver.id && <CheckCircle size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (selectedDriver && selectedOrder) {
                      const driver = AVAILABLE_DRIVERS.find(d => d.id === selectedDriver);
                      if (driver) {
                        // Update order with driver info (simulated - in production this would call API)
                        console.log(`Assigned driver ${driver.name} to order ${selectedOrder.id}`);
                        // For now, we just close the modal - in production this would update the order
                        setShowDriverModal(false);
                        // Show success feedback
                        alert(`Driver ${driver.name} telah di-assign untuk order #${selectedOrder.id.slice(-6)}`);
                      }
                    }
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={!selectedDriver}
                >
                  <UserPlus size={18} />
                  Assign Driver
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
