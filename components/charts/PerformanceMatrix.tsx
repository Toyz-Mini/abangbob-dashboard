'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react';

interface PerformanceMatrixProps {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    category: string;
  }>;
  maxItems?: number;
}

export default function PerformanceMatrix({ items, maxItems = 10 }: PerformanceMatrixProps) {
  const { analyzedItems, avgMargin, avgRevenue } = useMemo(() => {
    const analyzed = items.map(item => {
      const margin = item.revenue > 0 
        ? ((item.revenue - item.cost) / item.revenue) * 100 
        : 0;
      return {
        ...item,
        margin,
        profitContribution: item.revenue - item.cost,
      };
    });

    const totalRevenue = analyzed.reduce((sum, i) => sum + i.revenue, 0);
    const avgRev = items.length > 0 ? totalRevenue / items.length : 0;
    const avgMarg = analyzed.length > 0 
      ? analyzed.reduce((sum, i) => sum + i.margin, 0) / analyzed.length 
      : 0;

    return { 
      analyzedItems: analyzed.slice(0, maxItems), 
      avgMargin: avgMarg,
      avgRevenue: avgRev,
    };
  }, [items, maxItems]);

  const getQuadrant = (item: typeof analyzedItems[0]) => {
    const highMargin = item.margin >= avgMargin;
    const highRevenue = item.revenue >= avgRevenue;

    if (highMargin && highRevenue) return 'star'; // High margin, high revenue
    if (highMargin && !highRevenue) return 'puzzle'; // High margin, low revenue (hidden gem)
    if (!highMargin && highRevenue) return 'workhorse'; // Low margin, high revenue
    return 'problem'; // Low margin, low revenue
  };

  const quadrantStyles = {
    star: { bg: '#d1fae5', border: '#10b981', icon: Star, color: '#059669' },
    puzzle: { bg: '#fef3c7', border: '#f59e0b', icon: TrendingUp, color: '#d97706' },
    workhorse: { bg: '#dbeafe', border: '#3b82f6', icon: TrendingDown, color: '#2563eb' },
    problem: { bg: '#fee2e2', border: '#ef4444', icon: AlertTriangle, color: '#dc2626' },
  };

  const quadrantLabels = {
    star: 'Bintang',
    puzzle: 'Berpotensi',
    workhorse: 'Volume Tinggi',
    problem: 'Perlu Semak',
  };

  return (
    <div className="performance-matrix">
      {/* Header legend */}
      <div className="matrix-legend">
        {Object.entries(quadrantStyles).map(([key, style]) => {
          const Icon = style.icon;
          return (
            <div key={key} className="matrix-legend-item">
              <div 
                className="matrix-legend-color"
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              >
                <Icon size={12} color={style.color} />
              </div>
              <span>{quadrantLabels[key as keyof typeof quadrantLabels]}</span>
            </div>
          );
        })}
      </div>

      {/* Items list */}
      <div className="matrix-items">
        {analyzedItems.map((item, idx) => {
          const quadrant = getQuadrant(item);
          const style = quadrantStyles[quadrant];
          const Icon = style.icon;
          const maxRevenue = Math.max(...analyzedItems.map(i => i.revenue));
          const revenueWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

          return (
            <div 
              key={item.id} 
              className="matrix-item"
              style={{ 
                backgroundColor: style.bg,
                borderLeftColor: style.border,
              }}
            >
              <div className="matrix-item-rank">#{idx + 1}</div>
              <div className="matrix-item-content">
                <div className="matrix-item-header">
                  <span className="matrix-item-name">{item.name}</span>
                  <Icon size={14} color={style.color} />
                </div>
                <div className="matrix-item-stats">
                  <span>{item.quantity} unit</span>
                  <span>•</span>
                  <span>BND {item.revenue.toFixed(2)}</span>
                  <span>•</span>
                  <span style={{ color: item.margin >= 50 ? '#059669' : item.margin >= 30 ? '#d97706' : '#dc2626' }}>
                    {item.margin.toFixed(1)}% margin
                  </span>
                </div>
                <div className="matrix-item-bar">
                  <div 
                    className="matrix-item-bar-fill"
                    style={{ 
                      width: `${revenueWidth}%`,
                      backgroundColor: style.border,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="matrix-summary">
        <div className="matrix-summary-item">
          <span>Purata Margin</span>
          <strong>{avgMargin.toFixed(1)}%</strong>
        </div>
        <div className="matrix-summary-item">
          <span>Purata Revenue</span>
          <strong>BND {avgRevenue.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

