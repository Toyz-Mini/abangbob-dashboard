'use client';

import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: LucideIcon;
  gradient?: 'primary' | 'success' | 'warning' | 'info' | 'coral' | 'sunset' | 'peach' | 'amber' | 'accent' | 'subtle' | 'none';
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
  // Map old gradient names to new GlassCard gradients
  const glassGradientMap: Record<string, 'primary' | 'accent' | 'subtle' | 'none'> = {
    'primary': 'primary',
    'coral': 'accent',
    'sunset': 'accent',
    'accent': 'accent',
    'warning': 'subtle',
    'info': 'subtle',
    'subtle': 'subtle',
    'none': 'none'
  };

  const glassGradient = glassGradientMap[gradient] || 'none';
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
    <GlassCard
      gradient={glassGradient}
      hoverEffect={true}
      className={`stat-card ${gradient !== 'none' ? `gradient-${gradient}` : ''}`}
    >
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
    </GlassCard>
  );
}
