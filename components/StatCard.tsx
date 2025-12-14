'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: LucideIcon;
  gradient?: 'primary' | 'success' | 'warning' | 'info' | 'none';
  sparkline?: number[];
}

export default function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'none',
  sparkline,
}: StatCardProps) {
  const gradientClass = gradient !== 'none' ? `gradient-${gradient}` : '';
  const changeClass = changeType !== 'neutral' ? changeType : '';

  // Calculate sparkline heights
  const getSparklineHeight = (point: number) => {
    if (!sparkline || sparkline.length === 0) return 0;
    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const range = max - min || 1;
    return Math.max(((point - min) / range) * 100, 10);
  };

  return (
    <div className={`stat-card ${gradientClass}`}>
      <div className="stat-card-header">
        <div className="stat-label">{label}</div>
        {Icon && (
          <div className="stat-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeClass}`}>
          {changeType === 'positive' && '↑ '}
          {changeType === 'negative' && '↓ '}
          {change}
        </div>
      )}
      {sparkline && sparkline.length > 0 && (
        <div className="sparkline">
          {sparkline.map((point, index) => (
            <div
              key={index}
              className="sparkline-bar"
              style={{ height: `${getSparklineHeight(point)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
