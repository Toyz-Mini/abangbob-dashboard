'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Package,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { 
  getForecastSummary, 
  ForecastSummary,
  SalesDataPoint 
} from '@/lib/services/forecasting';
import Link from 'next/link';

interface AIInsightsWidgetProps {
  compact?: boolean;
}

export default function AIInsightsWidget({ compact = false }: AIInsightsWidgetProps) {
  const { orders, inventory, isInitialized } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Generate sales data from orders
  const salesData: SalesDataPoint[] = useMemo(() => {
    if (!isInitialized) return [];

    // Group orders by date
    const ordersByDate: Record<string, { orders: typeof orders; revenue: number }> = {};

    orders.forEach(order => {
      if (order.status === 'completed') {
        const date = order.createdAt.split('T')[0];
        if (!ordersByDate[date]) {
          ordersByDate[date] = { orders: [], revenue: 0 };
        }
        ordersByDate[date].orders.push(order);
        ordersByDate[date].revenue += order.total;
      }
    });

    // Convert to SalesDataPoint format
    return Object.entries(ordersByDate).map(([date, data]) => ({
      date,
      dayOfWeek: new Date(date).getDay(),
      revenue: data.revenue,
      orders: data.orders.length,
      items: data.orders.flatMap(o => o.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
      }))),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, isInitialized]);

  // Convert inventory to forecasting format
  const inventoryData = useMemo(() => {
    return inventory.map(item => ({
      id: item.id,
      name: item.name,
      currentQuantity: item.currentQuantity,
      minQuantity: item.minQuantity,
      cost: item.cost,
    }));
  }, [inventory]);

  // Get forecast summary
  const forecastSummary: ForecastSummary | null = useMemo(() => {
    if (salesData.length < 3) return null;
    return getForecastSummary(salesData, inventoryData);
  }, [salesData, inventoryData]);

  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [isInitialized]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 800);
  };

  if (!isInitialized) {
    return null;
  }

  const TrendIcon = forecastSummary?.trend === 'up' 
    ? TrendingUp 
    : forecastSummary?.trend === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = forecastSummary?.trend === 'up'
    ? 'var(--success)'
    : forecastSummary?.trend === 'down'
      ? 'var(--danger)'
      : 'var(--text-secondary)';

  // Compact version for sidebar or smaller displays
  if (compact) {
    return (
      <div className="ai-insights-compact">
        <div className="ai-insights-header-compact">
          <Brain size={16} className="ai-icon" />
          <span>AI Insights</span>
        </div>
        {forecastSummary?.nextDayForecast && (
          <div className="ai-insight-mini">
            <span>Esok:</span>
            <strong>~BND {forecastSummary.nextDayForecast.predictedRevenue.toFixed(0)}</strong>
          </div>
        )}
        {(forecastSummary?.criticalItems?.length ?? 0) > 0 && (
          <div className="ai-alert-mini">
            <AlertTriangle size={12} />
            <span>{forecastSummary?.criticalItems?.length} item kritikal</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ai-insights-widget">
      {/* Header */}
      <div className="ai-insights-header">
        <div className="ai-insights-title">
          <div className="ai-icon-wrapper">
            <Brain size={24} />
            <Sparkles size={12} className="sparkle-icon" />
          </div>
          <div>
            <h3>AI Insights</h3>
            <p className="ai-subtitle">Ramalan & Cadangan Pintar</p>
          </div>
        </div>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="ai-loading">
          <div className="ai-loading-pulse" />
          <span>Menganalisis data...</span>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !forecastSummary && (
        <div className="ai-no-data">
          <Lightbulb size={32} />
          <p>Data tidak mencukupi untuk ramalan</p>
          <span>Teruskan rekod jualan untuk mendapatkan insights yang lebih tepat</span>
        </div>
      )}

      {/* Forecast Content */}
      {!isLoading && forecastSummary && (
        <div className="ai-insights-content">
          {/* Tomorrow's Forecast */}
          {forecastSummary.nextDayForecast && (
            <div className="ai-forecast-card">
              <div className="ai-forecast-header">
                <Calendar size={18} />
                <span>Ramalan Esok</span>
                <div className="ai-confidence">
                  {forecastSummary.nextDayForecast.confidence}% yakin
                </div>
              </div>
              <div className="ai-forecast-value">
                <DollarSign size={24} />
                <span className="ai-forecast-amount">
                  BND {forecastSummary.nextDayForecast.predictedRevenue.toFixed(2)}
                </span>
              </div>
              <div className="ai-forecast-orders">
                ~{forecastSummary.nextDayForecast.predictedOrders} pesanan dijangka
              </div>
              {forecastSummary.nextDayForecast.factors.length > 0 && (
                <div className="ai-factors">
                  {forecastSummary.nextDayForecast.factors.map((factor, idx) => (
                    <span key={idx} className="ai-factor-tag">{factor}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Forecast & Trend */}
          <div className="ai-stats-row">
            <div className="ai-stat">
              <span className="ai-stat-label">Ramalan 7 Hari</span>
              <span className="ai-stat-value">
                BND {forecastSummary.weeklyForecast.toFixed(2)}
              </span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">Trend</span>
              <div className="ai-trend" style={{ color: trendColor }}>
                <TrendIcon size={18} />
                <span>
                  {forecastSummary.trendPercentage >= 0 ? '+' : ''}
                  {forecastSummary.trendPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Critical Items Alert */}
          {forecastSummary.criticalItems.length > 0 && (
            <div className="ai-critical-section">
              <div className="ai-section-header">
                <AlertTriangle size={18} className="text-warning" />
                <span>Item Perlu Perhatian</span>
                <span className="ai-badge">{forecastSummary.criticalItems.length}</span>
              </div>
              <div className="ai-critical-list">
                {forecastSummary.criticalItems.slice(0, 3).map(item => (
                  <div key={item.itemId} className={`ai-critical-item urgency-${item.urgency}`}>
                    <Package size={14} />
                    <div className="ai-critical-info">
                      <span className="ai-critical-name">{item.itemName}</span>
                      <span className="ai-critical-reason">{item.reason}</span>
                    </div>
                    <span className="ai-critical-stock">
                      {item.currentStock}/{item.minStock}
                    </span>
                  </div>
                ))}
              </div>
              {forecastSummary.criticalItems.length > 3 && (
                <Link href="/inventory" className="ai-view-more">
                  Lihat semua <ChevronRight size={14} />
                </Link>
              )}
            </div>
          )}

          {/* Smart Insights */}
          {forecastSummary.insights.length > 0 && (
            <div className="ai-insights-section">
              <div className="ai-section-header">
                <Lightbulb size={18} className="text-warning" />
                <span>Insights Pintar</span>
              </div>
              <div className="ai-insights-list">
                {forecastSummary.insights.map((insight, idx) => (
                  <div key={idx} className="ai-insight-item">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="ai-insights-footer">
        <span>Dikemaskini: {lastUpdated.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

