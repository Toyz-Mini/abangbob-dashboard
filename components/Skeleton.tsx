'use client';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  variant?: 'default' | 'wave' | 'pulse';
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  borderRadius,
  variant = 'default'
}: SkeletonProps) {
  const variantClass = variant === 'wave' ? 'skeleton-wave' : variant === 'pulse' ? 'animate-pulse' : '';
  
  return (
    <div 
      className={`skeleton ${variantClass} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius 
      }}
    />
  );
}

// Text skeleton variants
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-sm ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height={14} 
          className="skeleton-text"
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 32, md: 40, lg: 64 };
  return (
    <Skeleton 
      width={sizes[size]} 
      height={sizes[size]} 
      borderRadius="50%" 
      className="skeleton-avatar"
    />
  );
}

// Button skeleton
export function SkeletonButton({ width = 120 }: { width?: number | string }) {
  return (
    <Skeleton 
      width={width} 
      height={40} 
      borderRadius="var(--radius-md)" 
      className="skeleton-button"
    />
  );
}

// Image skeleton
export function SkeletonImage({ aspectRatio = '16/9' }: { aspectRatio?: string }) {
  return (
    <div style={{ aspectRatio }} className="w-full">
      <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" className="skeleton-image" />
    </div>
  );
}

// Skeleton for StatCard
export function StatCardSkeleton() {
  return (
    <div className="stat-card skeleton-card">
      <div className="stat-card-header">
        <Skeleton width="60%" height={16} />
        <Skeleton width={36} height={36} borderRadius="var(--radius-md)" />
      </div>
      <Skeleton width="80%" height={32} className="mb-sm" />
      <Skeleton width="50%" height={14} />
    </div>
  );
}

// Skeleton for Chart Card
export function ChartCardSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="card-header">
        <Skeleton width="40%" height={20} />
        <Skeleton width="30%" height={14} className="mt-sm" />
      </div>
      <div className="skeleton-chart">
        <Skeleton width="100%" height={200} borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}

// Skeleton for Table Row
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton width={i === 0 ? '80%' : '60%'} height={16} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton for Card with Table
export function TableCardSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="card skeleton-card">
      <div className="card-header">
        <Skeleton width="40%" height={20} />
        <Skeleton width="60%" height={14} className="mt-sm" />
      </div>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton width="70%" height={12} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Dashboard Page Skeleton
export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <Skeleton width="300px" height={36} className="mb-sm" />
        <Skeleton width="400px" height={20} />
      </div>

      {/* Stats Grid */}
      <div className="content-grid cols-4 mb-lg">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Quick Actions */}
      <div className="card mb-lg">
        <div className="card-header">
          <Skeleton width="150px" height={20} />
        </div>
        <div className="quick-actions">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={120} height={40} borderRadius="var(--radius-md)" />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="content-grid cols-3 mb-lg">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

