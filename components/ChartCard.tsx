'use client';

import { ReactNode } from 'react';

import GlassCard from './GlassCard';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <GlassCard className={`chart-card ${className}`} gradient="subtle" hoverEffect={true}>
      <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{subtitle}</div>}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {children}
      </div>
    </GlassCard>
  );
}

