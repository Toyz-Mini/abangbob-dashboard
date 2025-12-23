'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, LogOut, CheckCircle } from 'lucide-react';

export default function PendingApprovalPage() {
    const router = useRouter();
    const { user, loading: authLoading, signOut } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    if (authLoading) {
        return (
            <div className="pending-page">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="pending-page">
            <div className="pending-container">
                <div className="pending-icon">
                    <Clock size={48} />
                </div>

                <h1>Menunggu Kelulusan</h1>

                <p>
                    Terima kasih, <strong>{user?.name}</strong>!
                    Profil anda telah dihantar untuk kelulusan.
                </p>

                <div className="pending-info">
                    <div className="info-item">
                        <CheckCircle size={20} />
                        <span>Akaun berjaya didaftarkan</span>
                    </div>
                    <div className="info-item">
                        <CheckCircle size={20} />
                        <span>Profil telah dilengkapkan</span>
                    </div>
                    <div className="info-item pending">
                        <Clock size={20} />
                        <span>Menunggu kelulusan admin</span>
                    </div>
                </div>

                <p className="pending-note">
                    Admin akan menyemak permohonan anda dalam masa 1-2 hari bekerja.
                    Anda akan dimaklumkan melalui email setelah diluluskan.
                </p>

                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    Log Keluar
                </button>
            </div>

            <style jsx>{`
        .pending-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 1rem;
        }

        .pending-container {
          width: 100%;
          max-width: 450px;
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .pending-icon {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 1rem;
        }

        p {
          color: #666;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .pending-info {
          background: #f9fafb;
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #22c55e;
          font-weight: 500;
        }

        .info-item.pending {
          color: #f59e0b;
        }

        .info-item + .info-item {
          border-top: 1px solid #e5e7eb;
        }

        .pending-note {
          font-size: 0.875rem;
          color: #888;
        }

        .btn-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .btn-logout:hover {
          background: #e5e5e5;
        }
      `}</style>
        </div>
    );
}
