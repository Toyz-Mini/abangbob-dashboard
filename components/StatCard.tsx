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
    'peach': 'subtle',
    'amber': 'subtle',
    'none': 'none'
  };

  const glassGradient = glassGradientMap[gradient] || 'none';

  // Resolve color for change text
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5';
    }
  };

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
      className="flex flex-col justify-between h-full min-h-[140px]"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/50 dark:bg-white/10 text-gray-400 group-hover:text-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
          {value}
        </div>

        {change && (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold w-fit ${getChangeColor()}`}>
            {changeType === 'positive' && '↑'}
            {changeType === 'negative' && '↓'}
            {change}
          </div>
        )}
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="flex items-end gap-1 h-8 mt-3 opacity-60">
          {sparkline.map((point, index) => (
            <div
              key={index}
              className="flex-1 bg-primary rounded-t-sm transition-all hover:bg-primary-dark"
              style={{ height: `${getSparklineHeight(point)}%` }}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
