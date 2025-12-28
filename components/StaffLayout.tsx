'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import StaffPortalNav from '@/components/StaffPortalNav';

interface StaffLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function StaffLayout({ children, showHeader = false }: StaffLayoutProps) {
  const { currentStaff, logoutStaff, isStaffLoggedIn, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    console.log('[StaffLayout] Logout button clicked');
    try {
      await logoutStaff();
      console.log('[StaffLayout] logoutStaff called successfully');
      // Redirection is handled in signOut, but we can have this as ultimate fallback
    } catch (error) {
      console.error('[StaffLayout] Logout error:', error);
      // Ensure redirect happens even on error
      window.location.href = '/login';
    }
  };


  return (
    <div className="min-h-screen light-brand flex flex-col">
      {/* Simple Header */}
      {showHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="staff-header-left">
            <div className="staff-header-avatar">
              {currentStaff?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="staff-header-info">
              <div className="staff-header-name">{currentStaff?.name || 'Staff'}</div>
              <div className="staff-header-role">{currentStaff?.role || 'Staff'}</div>
            </div>
          </div>
          <button type="button" className="staff-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </header>
      )}

      {/* Main Content */}
      <main className="staff-main">
        {children}
      </main>

      <StaffPortalNav />

      <style jsx>{`
        .staff-layout {
          min-height: 100vh;
        }

        .staff-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          padding-top: 48px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .staff-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .staff-header-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }

        .staff-header-info {
          display: flex;
          flex-direction: column;
        }

        .staff-header-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #1a1a1a;
        }

        .staff-header-role {
          font-size: 0.75rem;
          color: #666;
        }

        .staff-logout-btn {
          padding: 0.5rem;
          background: #f5f5f5;
          border: none;
          border-radius: 8px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .staff-logout-btn:hover {
          background: #ebebeb;
          color: #CC1512;
        }

        .staff-main {
          padding: 1rem;
          padding-bottom: 100px; /* Space for bottom nav */
        }
      `}</style>
    </div>
  );
}
