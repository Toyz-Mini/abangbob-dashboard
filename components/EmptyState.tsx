'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Bell, 
  Search,
  Plus,
  type LucideIcon
} from 'lucide-react';

type EmptyStateVariant = 'default' | 'inventory' | 'orders' | 'staff' | 'documents' | 'notifications' | 'search';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  children?: ReactNode;
}

// Default configurations for each variant
const variantConfigs: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  default: {
    icon: FileText,
    title: 'Tiada data',
    description: 'Belum ada data untuk dipaparkan di sini.',
  },
  inventory: {
    icon: Package,
    title: 'Inventori kosong',
    description: 'Tiada item inventori dijumpai. Tambah item pertama anda sekarang.',
  },
  orders: {
    icon: ShoppingCart,
    title: 'Tiada pesanan',
    description: 'Belum ada pesanan untuk hari ini. Pesanan baru akan muncul di sini.',
  },
  staff: {
    icon: Users,
    title: 'Tiada staf',
    description: 'Belum ada staf didaftarkan. Tambah staf pertama anda sekarang.',
  },
  documents: {
    icon: FileText,
    title: 'Tiada dokumen',
    description: 'Belum ada dokumen atau laporan tersedia.',
  },
  notifications: {
    icon: Bell,
    title: 'Tiada notifikasi',
    description: 'Anda sudah up-to-date! Tiada notifikasi baru.',
  },
  search: {
    icon: Search,
    title: 'Tiada hasil carian',
    description: 'Cuba ubah kata kunci atau filter carian anda.',
  },
};

export default function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  children,
}: EmptyStateProps) {
  const config = variantConfigs[variant];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className="empty-state-container">
      <div className="empty-state-illustration">
        <div className="empty-state-icon-wrapper">
          <Icon size={48} strokeWidth={1.5} />
        </div>
        {/* Decorative elements */}
        <div className="empty-state-decoration">
          <div className="decoration-circle decoration-1" />
          <div className="decoration-circle decoration-2" />
          <div className="decoration-circle decoration-3" />
        </div>
      </div>
      
      <h3 className="empty-state-title">{displayTitle}</h3>
      <p className="empty-state-description">{displayDescription}</p>
      
      {children}
      
      {(actionLabel && (actionHref || onAction)) && (
        <div className="empty-state-action">
          {actionHref ? (
            <Link href={actionHref} className="btn btn-primary">
              <Plus size={18} />
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn btn-primary">
              <Plus size={18} />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}


