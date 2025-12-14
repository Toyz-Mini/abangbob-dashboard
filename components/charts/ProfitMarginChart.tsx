'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface ProfitDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface ProfitMarginChartProps {
  data: ProfitDataPoint[];
  showTrend?: boolean;
}

export default function ProfitMarginChart({ data, showTrend = true }: ProfitMarginChartProps) {
  const { chartData, summary, trend } = useMemo(() => {
    // Calculate summary stats
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Calculate trend
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstAvgMargin = firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.margin, 0) / firstHalf.length
      : 0;
    const secondAvgMargin = secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.margin, 0) / secondHalf.length
      : 0;

    const trendDirection = secondAvgMargin > firstAvgMargin ? 'up' : 
                          secondAvgMargin < firstAvgMargin ? 'down' : 'stable';
    const trendPercent = firstAvgMargin > 0 
      ? ((secondAvgMargin - firstAvgMargin) / firstAvgMargin) * 100
      : 0;

    return {
      chartData: data,
      summary: { totalRevenue, totalCost, totalProfit, avgMargin },
      trend: { direction: trendDirection, percent: trendPercent },
    };
  }, [data]);

  const maxValue = Math.max(...chartData.map(d => Math.max(d.revenue, d.cost)));
  const maxMargin = Math.max(...chartData.map(d => d.margin), 100);

  if (data.length === 0) {
    return (
      <div className="profit-chart-empty">
        <DollarSign size={32} />
        <p>Tiada data profit untuk dipaparkan</p>
      </div>
    );
  }

  return (
    <div className="profit-margin-chart">
      {/* Summary Cards */}
      <div className="profit-summary-grid">
        <div className="profit-summary-card revenue">
          <div className="icon-wrapper">
            <DollarSign size={18} />
          </div>
          <div className="content">
            <span className="label">Jumlah Revenue</span>
            <span className="value">BND {summary.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="profit-summary-card cost">
          <div className="icon-wrapper">
            <TrendingDown size={18} />
          </div>
          <div className="content">
            <span className="label">Jumlah Kos</span>
            <span className="value">BND {summary.totalCost.toFixed(2)}</span>
          </div>
        </div>
        <div className="profit-summary-card profit">
          <div className="icon-wrapper">
            <TrendingUp size={18} />
          </div>
          <div className="content">
            <span className="label">Jumlah Profit</span>
            <span className="value">BND {summary.totalProfit.toFixed(2)}</span>
          </div>
        </div>
        <div className="profit-summary-card margin">
          <div className="icon-wrapper">
            <Percent size={18} />
          </div>
          <div className="content">
            <span className="label">Purata Margin</span>
            <span className="value">{summary.avgMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="profit-chart-container">
        <div className="chart-bars">
          {chartData.map((day, idx) => {
            const revenueHeight = maxValue > 0 ? (day.revenue / maxValue) * 150 : 0;
            const costHeight = maxValue > 0 ? (day.cost / maxValue) * 150 : 0;
            const marginHeight = maxMargin > 0 ? (day.margin / maxMargin) * 150 : 0;

            return (
              <div key={day.date} className="chart-bar-group">
                <div 
                  className="chart-tooltip"
                  style={{ display: 'none' }}
                >
                  <strong>{day.date}</strong>
                  <p>Revenue: BND {day.revenue.toFixed(2)}</p>
                  <p>Kos: BND {day.cost.toFixed(2)}</p>
                  <p>Profit: BND {day.profit.toFixed(2)}</p>
                  <p>Margin: {day.margin.toFixed(1)}%</p>
                </div>
                <div className="bar-stack">
                  <div 
                    className="bar revenue-bar"
                    style={{ height: `${revenueHeight}px` }}
                    title={`Revenue: BND ${day.revenue.toFixed(2)}`}
                  />
                  <div 
                    className="bar cost-bar"
                    style={{ height: `${costHeight}px` }}
                    title={`Kos: BND ${day.cost.toFixed(2)}`}
                  />
                </div>
                <div 
                  className="margin-line"
                  style={{ bottom: `${marginHeight}px` }}
                >
                  <div className="margin-dot" title={`Margin: ${day.margin.toFixed(1)}%`} />
                </div>
                <div className="bar-label">
                  {new Date(day.date).getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Margin line connector */}
        <svg className="margin-line-svg" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            points={chartData.map((day, idx) => {
              const x = (idx / (chartData.length - 1 || 1)) * 100;
              const y = 100 - (maxMargin > 0 ? (day.margin / maxMargin) * 100 : 0);
              return `${x}%,${y}%`;
            }).join(' ')}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="profit-chart-legend">
        <div className="legend-item">
          <div className="legend-color revenue" />
          <span>Revenue</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cost" />
          <span>Kos</span>
        </div>
        <div className="legend-item">
          <div className="legend-color margin" />
          <span>Margin %</span>
        </div>
      </div>

      {/* Trend indicator */}
      {showTrend && (
        <div className={`profit-trend ${trend.direction}`}>
          {trend.direction === 'up' ? (
            <TrendingUp size={16} />
          ) : trend.direction === 'down' ? (
            <TrendingDown size={16} />
          ) : null}
          <span>
            Trend margin {trend.direction === 'up' ? 'meningkat' : trend.direction === 'down' ? 'menurun' : 'stabil'}
            {trend.percent !== 0 && ` ${trend.percent > 0 ? '+' : ''}${trend.percent.toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  );
}




