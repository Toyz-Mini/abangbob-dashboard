'use client';

import { useState, useEffect, useMemo } from 'react';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/lib/contexts/ToastContext';
import {
    Package,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    TrendingDown,
    TrendingUp,
    DollarSign,
    BarChart3,
    RefreshCw,
    Box,
    Layers,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    getStockOverviewAction,
    getInventoryMovementSummaryAction
} from '@/lib/actions/inventory-deduction-actions';
import { getStockAlertsAction } from '@/lib/actions/production-actions';
import { StockAlert } from '@/lib/types';

interface StockDashboardProps {
    onRefresh?: () => void;
}

interface StockOverview {
    totalItems: number;
    totalValue: number;
    byStatus: {
        healthy: number;
        low: number;
        out: number;
        negative: number;
    };
    byType: {
        raw: number;
        'semi-finished': number;
        finished: number;
    };
    criticalItems: Array<{
        id: string;
        name: string;
        currentQuantity: number;
        minQuantity: number;
        unit: string;
        status: string;
    }>;
}

interface MovementSummary {
    totalIn: number;
    totalOut: number;
    bySource: {
        manual: { in: number; out: number };
        production: { in: number; out: number };
        order: { in: number; out: number };
        waste: { in: number; out: number };
        restock: { in: number; out: number };
        adjustment: { in: number; out: number };
    };
    topUsedItems: Array<{ name: string; quantity: number }>;
    dailyMovement: Array<{ date: string; in: number; out: number }>;
}

export default function StockDashboard({ onRefresh }: StockDashboardProps) {
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [overview, setOverview] = useState<StockOverview | null>(null);
    const [movement, setMovement] = useState<MovementSummary | null>(null);
    const [alerts, setAlerts] = useState<StockAlert[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [overviewData, movementData, alertsData] = await Promise.all([
                getStockOverviewAction(),
                getInventoryMovementSummaryAction(),
                getStockAlertsAction({ acknowledged: false })
            ]);

            setOverview(overviewData);
            setMovement(movementData);
            setAlerts(alertsData as StockAlert[]);
        } catch (error) {
            console.error('Error loading stock data:', error);
            showToast('Gagal memuatkan data stok', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        loadData();
        onRefresh?.();
    };

    // Calculate percentages for status distribution
    const statusPercentages = useMemo(() => {
        if (!overview) return { healthy: 0, low: 0, out: 0, negative: 0 };
        const total = overview.totalItems || 1;
        return {
            healthy: Math.round((overview.byStatus.healthy / total) * 100),
            low: Math.round((overview.byStatus.low / total) * 100),
            out: Math.round((overview.byStatus.out / total) * 100),
            negative: Math.round((overview.byStatus.negative / total) * 100)
        };
    }, [overview]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Stock Dashboard
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Pantau stok dan pergerakan inventori
                    </p>
                </div>
                <PremiumButton variant="glass" onClick={handleRefresh} icon={RefreshCw}>
                    Refresh
                </PremiumButton>
            </div>

            {/* Alert Banner */}
            {alerts.length > 0 && (
                <div style={{
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
                            {alerts.length} Amaran Stok
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {alerts.filter(a => a.alertType === 'negative_stock').length} negatif,
                            {' '}{alerts.filter(a => a.alertType === 'out_of_stock').length} habis,
                            {' '}{alerts.filter(a => a.alertType === 'low_stock').length} rendah
                        </div>
                    </div>
                </div>
            )}

            {/* Status Cards */}
            <div className="content-grid cols-4" style={{ marginBottom: '1.5rem' }}>
                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                {overview?.byStatus.healthy || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Stok Sihat
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(245, 158, 11, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={22} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {overview?.byStatus.low || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Stok Rendah
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Package size={22} style={{ color: 'var(--danger)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                                {(overview?.byStatus.out || 0) + (overview?.byStatus.negative || 0)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Habis / Negatif
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <DollarSign size={22} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                BND {(overview?.totalValue || 0).toFixed(0)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Nilai Inventori
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="content-grid cols-2" style={{ alignItems: 'start' }}>
                {/* Critical Items */}
                <GlassCard>
                    <div className="card-header" style={{
                        borderBottom: '1px solid var(--border-light)',
                        paddingBottom: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            padding: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--danger)'
                        }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Item Kritikal</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Memerlukan perhatian segera
                            </div>
                        </div>
                    </div>

                    {overview?.criticalItems && overview.criticalItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {overview.criticalItems.slice(0, 10).map(item => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: `3px solid ${item.status === 'negative' ? 'var(--danger)' :
                                            item.status === 'out' ? 'var(--danger)' :
                                                'var(--warning)'
                                            }`
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Min: {item.minQuantity} {item.unit}
                                        </div>
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        color: item.currentQuantity < 0 ? 'var(--danger)' :
                                            item.currentQuantity === 0 ? 'var(--danger)' : 'var(--warning)'
                                    }}>
                                        {item.currentQuantity} {item.unit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', color: 'var(--success)' }} />
                            <p>Semua stok dalam keadaan baik!</p>
                        </div>
                    )}
                </GlassCard>

                {/* Top Used Items */}
                <GlassCard>
                    <div className="card-header" style={{
                        borderBottom: '1px solid var(--border-light)',
                        paddingBottom: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            padding: '0.5rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--primary)'
                        }}>
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top Penggunaan</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                7 hari terakhir
                            </div>
                        </div>
                    </div>

                    {movement?.topUsedItems && movement.topUsedItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {movement.topUsedItems.slice(0, 8).map((item, index) => {
                                const maxQty = movement.topUsedItems[0].quantity;
                                const percentage = maxQty > 0 ? (item.quantity / maxQty) * 100 : 0;

                                return (
                                    <div key={item.name} style={{ padding: '0.5rem 0' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.25rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '4px',
                                                    background: index === 0 ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                    color: index === 0 ? 'white' : 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}>
                                                    {index + 1}
                                                </span>
                                                {item.name}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>{item.quantity.toFixed(1)}</span>
                                        </div>
                                        <div style={{
                                            height: '4px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${percentage}%`,
                                                background: index === 0
                                                    ? 'linear-gradient(90deg, var(--primary), var(--secondary))'
                                                    : 'var(--text-secondary)',
                                                borderRadius: '2px',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                            <p>Tiada data penggunaan</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Movement Summary */}
            <div className="content-grid cols-3" style={{ marginTop: '1.5rem' }}>
                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ArrowUpRight size={18} style={{ color: 'var(--success)' }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Stock Masuk (7 hari)
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                        +{movement?.totalIn.toFixed(0) || 0}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Production: {movement?.bySource.production.in.toFixed(0) || 0} |
                        Restock: {movement?.bySource.restock.in.toFixed(0) || 0}
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ArrowDownRight size={18} style={{ color: 'var(--danger)' }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Stock Keluar (7 hari)
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                        -{movement?.totalOut.toFixed(0) || 0}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Order: {movement?.bySource.order.out.toFixed(0) || 0} |
                        Production: {movement?.bySource.production.out.toFixed(0) || 0}
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Layers size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Jenis Inventori
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {overview?.byType.raw || 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Raw</div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '1rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {overview?.byType['semi-finished'] || 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Semi</div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '1rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {overview?.byType.finished || 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Finished</div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
