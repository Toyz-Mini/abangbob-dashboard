'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`card ${className}`} style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="card-header">
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

