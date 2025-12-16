'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// Route name mappings
const routeNames: Record<string, string> = {
  '': 'Dashboard',
  'pos': 'POS',
  'kds': 'Kitchen Display',
  'tables': 'Meja',
  'inventory': 'Inventori',
  'hr': 'HR & Staf',
  'staff': 'Staf',
  'new': 'Tambah Baru',
  'payroll': 'Gaji',
  'schedule': 'Jadual',
  'timeclock': 'Clock In/Out',
  'production': 'Production',
  'delivery': 'Delivery Hub',
  'finance': 'Kewangan',
  'analytics': 'Analytics',
  'customers': 'Pelanggan',
  'suppliers': 'Supplier',
  'recipes': 'Resepi',
  'promotions': 'Promosi',
  'notifications': 'Notifikasi',
  'audit-log': 'Audit Log',
  'settings': 'Tetapan',
  'menu': 'Menu',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on home page or staff portal
  if (pathname === '/' || pathname.startsWith('/staff-portal')) {
    return null;
  }

  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isCurrentPage = index === pathSegments.length - 1;

    // Handle dynamic routes (e.g., [tableId])
    const label = segment.startsWith('[')
      ? segment.replace(/[\[\]]/g, '')
      : (routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));

    return { label, href, isCurrentPage };
  });

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link breadcrumb-home">
            <Home size={16} />
            <span>Dashboard</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="breadcrumb-item">
            <ChevronRight size={14} className="breadcrumb-separator" />
            {item.isCurrentPage ? (
              <span className="breadcrumb-current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}




