'use client';

import { useMemo } from 'react';
import { Trophy, Clock, Star, TrendingUp } from 'lucide-react';

interface StaffMetrics {
  id: string;
  name: string;
  role: string;
  hoursWorked: number;
  ordersProcessed: number;
  avgOrderTime: number; // in minutes
  rating: number; // 0-5
  efficiency: number; // percentage
}

interface StaffProductivityChartProps {
  data: StaffMetrics[];
  period?: string;
}

export default function StaffProductivityChart({ data, period = 'bulan ini' }: StaffProductivityChartProps) {
  const { rankedStaff, topPerformer, avgEfficiency } = useMemo(() => {
    // Calculate composite score and rank
    const scored = data.map(staff => {
      // Composite score formula:
      // 30% hours worked, 30% orders, 20% avg time (inverse), 20% rating
      const maxHours = Math.max(...data.map(s => s.hoursWorked), 1);
      const maxOrders = Math.max(...data.map(s => s.ordersProcessed), 1);
      const minTime = Math.min(...data.map(s => s.avgOrderTime), 1);
      
      const hoursScore = (staff.hoursWorked / maxHours) * 30;
      const ordersScore = (staff.ordersProcessed / maxOrders) * 30;
      const timeScore = staff.avgOrderTime > 0 ? (minTime / staff.avgOrderTime) * 20 : 0;
      const ratingScore = (staff.rating / 5) * 20;
      
      const totalScore = hoursScore + ordersScore + timeScore + ratingScore;

      return {
        ...staff,
        score: totalScore,
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);
    const top = sorted[0] || null;
    const avgEff = data.length > 0 
      ? data.reduce((sum, s) => sum + s.efficiency, 0) / data.length 
      : 0;

    return { rankedStaff: sorted, topPerformer: top, avgEfficiency: avgEff };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="staff-productivity-empty">
        <Clock size={32} />
        <p>Tiada data prestasi untuk {period}</p>
      </div>
    );
  }

  const maxScore = rankedStaff[0]?.score || 100;

  return (
    <div className="staff-productivity-chart">
      {/* Top Performer Highlight */}
      {topPerformer && (
        <div className="top-performer-card">
          <div className="top-performer-badge">
            <Trophy size={24} />
          </div>
          <div className="top-performer-info">
            <span className="top-performer-label">Top Performer</span>
            <span className="top-performer-name">{topPerformer.name}</span>
            <span className="top-performer-role">{topPerformer.role}</span>
          </div>
          <div className="top-performer-stats">
            <div className="stat">
              <Clock size={14} />
              <span>{topPerformer.hoursWorked}h</span>
            </div>
            <div className="stat">
              <TrendingUp size={14} />
              <span>{topPerformer.ordersProcessed}</span>
            </div>
            <div className="stat">
              <Star size={14} />
              <span>{topPerformer.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Staff Rankings */}
      <div className="staff-rankings">
        {rankedStaff.map((staff, idx) => {
          const scoreWidth = (staff.score / maxScore) * 100;
          const isTop3 = idx < 3;

          return (
            <div 
              key={staff.id} 
              className={`staff-rank-item ${isTop3 ? 'top-3' : ''}`}
            >
              <div className="rank-number" style={{
                background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                           idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                           idx === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' :
                           'var(--gray-200)'
              }}>
                {idx + 1}
              </div>
              <div className="staff-info">
                <span className="staff-name">{staff.name}</span>
                <span className="staff-role">{staff.role}</span>
              </div>
              <div className="staff-metrics">
                <div className="metric">
                  <Clock size={12} />
                  <span>{staff.hoursWorked}h</span>
                </div>
                <div className="metric">
                  <span>{staff.ordersProcessed} orders</span>
                </div>
                <div className="metric rating">
                  <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                  <span>{staff.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="score-bar">
                <div 
                  className="score-bar-fill"
                  style={{ 
                    width: `${scoreWidth}%`,
                    background: idx === 0 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' :
                               idx === 1 ? 'linear-gradient(90deg, #94a3b8, #64748b)' :
                               idx === 2 ? 'linear-gradient(90deg, #d97706, #b45309)' :
                               'var(--primary)',
                  }}
                />
              </div>
              <div className="score-value">{staff.score.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="productivity-summary">
        <div className="summary-stat">
          <span className="label">Purata Efisiensi</span>
          <span className="value" style={{ 
            color: avgEfficiency >= 80 ? 'var(--success)' : 
                   avgEfficiency >= 60 ? 'var(--warning)' : 'var(--danger)'
          }}>
            {avgEfficiency.toFixed(1)}%
          </span>
        </div>
        <div className="summary-stat">
          <span className="label">Jumlah Staf</span>
          <span className="value">{data.length}</span>
        </div>
        <div className="summary-stat">
          <span className="label">Tempoh</span>
          <span className="value">{period}</span>
        </div>
      </div>
    </div>
  );
}




