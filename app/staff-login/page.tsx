'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useStore } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    User,
    Lock,
    LogIn,
    ChevronRight,
    Users
} from 'lucide-react';

export default function StaffLoginPage() {
    const router = useRouter();
    const { loginWithPin, isStaffLoggedIn, loading: authLoading } = useAuth();
    const { staff, isInitialized } = useStore();

    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isStaffLoggedIn) {
            router.push('/staff-portal');
        }
    }, [isStaffLoggedIn, authLoading, router]);

    // Get active staff only
    const activeStaff = staff.filter(s => s.status === 'active');

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
        }
    };

    const handlePinBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handlePinClear = () => {
        setPin('');
    };

    const handleLogin = async () => {
        if (!selectedStaffId) {
            setError('Sila pilih nama anda');
            return;
        }

        if (pin.length !== 4) {
            setError('PIN mestilah 4 digit');
            return;
        }

        setError('');
        setLoading(true);

        const result = await loginWithPin(selectedStaffId, pin);

        if (result.success) {
            router.push('/staff-portal');
        } else {
            setError(result.error || 'PIN tidak sah');
            setPin('');
        }

        setLoading(false);
    };

    // Auto-submit when PIN is 4 digits
    useEffect(() => {
        if (pin.length === 4 && selectedStaffId) {
            handleLogin();
        }
    }, [pin]);

    if (authLoading || !isInitialized) {
        return (
            <div className="staff-login-page">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="staff-login-page">
            <div className="staff-login-container">
                {/* Header */}
                <div className="staff-login-header">
                    <div className="staff-login-logo">
                        <Users size={40} />
                    </div>
                    <h1>AbangBob Staff</h1>
                    <p>Portal Staf</p>
                </div>

                {/* Staff Selection */}
                {!selectedStaffId ? (
                    <div className="staff-selection">
                        <h2>Pilih Nama Anda</h2>
                        <div className="staff-list">
                            {activeStaff.map(s => (
                                <button
                                    key={s.id}
                                    className="staff-item"
                                    onClick={() => setSelectedStaffId(s.id)}
                                >
                                    <div className="staff-avatar">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="staff-name">{s.name}</div>
                                    <ChevronRight size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="pin-entry">
                        {/* Selected Staff */}
                        <div className="selected-staff">
                            <div className="staff-avatar large">
                                {activeStaff.find(s => s.id === selectedStaffId)?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="staff-name">
                                {activeStaff.find(s => s.id === selectedStaffId)?.name}
                            </div>
                            <button
                                className="change-staff-btn"
                                onClick={() => {
                                    setSelectedStaffId('');
                                    setPin('');
                                    setError('');
                                }}
                            >
                                Tukar
                            </button>
                        </div>

                        {/* PIN Display */}
                        <h2>Masukkan PIN</h2>
                        <div className="pin-display">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        {/* PIN Pad */}
                        <div className="pin-pad">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                                <button
                                    key={key}
                                    className={`pin-key ${key === 'C' || key === '⌫' ? 'action' : ''}`}
                                    onClick={() => {
                                        if (key === '⌫') handlePinBackspace();
                                        else if (key === 'C') handlePinClear();
                                        else handlePinInput(key);
                                    }}
                                    disabled={loading}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="login-loading">
                                <LoadingSpinner size="sm" />
                                <span>Mengesahkan...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .staff-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          padding: 1rem;
        }

        .staff-login-container {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .staff-login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .staff-login-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .staff-login-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .staff-login-header p {
          color: #666;
          margin: 0.25rem 0 0;
        }

        .staff-selection h2,
        .pin-entry h2 {
          font-size: 1rem;
          color: #666;
          text-align: center;
          margin-bottom: 1rem;
        }

        .staff-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .staff-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f5f5f5;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .staff-item:hover {
          background: #ebebeb;
          transform: translateX(4px);
        }

        .staff-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .staff-avatar.large {
          width: 60px;
          height: 60px;
          font-size: 1.5rem;
        }

        .staff-name {
          flex: 1;
          text-align: left;
          font-weight: 500;
          color: #1a1a1a;
        }

        .selected-staff {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .change-staff-btn {
          background: none;
          border: none;
          color: #CC1512;
          font-size: 0.875rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .pin-display {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e0e0e0;
          transition: all 0.2s;
        }

        .pin-dot.filled {
          background: #CC1512;
          transform: scale(1.1);
        }

        .login-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .pin-pad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .pin-key {
          padding: 1.25rem;
          font-size: 1.5rem;
          font-weight: 600;
          background: #f5f5f5;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pin-key:hover:not(:disabled) {
          background: #ebebeb;
        }

        .pin-key:active:not(:disabled) {
          transform: scale(0.95);
          background: #ddd;
        }

        .pin-key.action {
          background: #e5e5e5;
          font-size: 1.25rem;
        }

        .pin-key:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          color: #666;
        }
      `}</style>
        </div>
    );
}
