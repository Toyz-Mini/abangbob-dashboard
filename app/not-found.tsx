'use client';

import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <MainLayout>
      <div style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2rem'
      }}>
        <div style={{
          fontSize: '6rem',
          fontWeight: 700,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          404
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertCircle size={24} color="var(--warning)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Halaman tidak dijumpai</h2>
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '500px' }}>
          Maaf, halaman yang anda cari tidak wujud atau telah dipindahkan.
        </p>
        <Link href="/" className="btn btn-primary">
          Kembali ke Dashboard
        </Link>
      </div>
    </MainLayout>
  );
}

