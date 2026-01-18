import React from 'react';
import { DeliveryOrder } from '@/lib/types';
import { Printer, UserPlus } from 'lucide-react';

interface DeliveryKanbanColumnProps {
    title: string;
    orders: DeliveryOrder[];
    status: DeliveryOrder['status'];
    emoji: string;
    getPlatformColor: (platform: string) => string;
    onPrintSlip: (e: React.MouseEvent, orderId: string) => void;
    onAssignDriver: (order: DeliveryOrder) => void;
    onUpdateStatus: (orderId: string, status: DeliveryOrder['status']) => void;
}

export const DeliveryKanbanColumn = ({
    title,
    orders,
    status,
    emoji,
    getPlatformColor,
    onPrintSlip,
    onAssignDriver,
    onUpdateStatus
}: DeliveryKanbanColumnProps) => {
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
                                            onClick={(e) => onPrintSlip(e, order.id)}
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
                                                onAssignDriver(order);
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
                                                onUpdateStatus(order.id, nextStatus);
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
