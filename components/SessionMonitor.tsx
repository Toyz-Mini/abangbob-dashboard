'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface SessionMonitorProps {
    timeoutMinutes?: number;     // Minutes before showing warning
    warningSeconds?: number;     // Seconds to show warning before logout
    enabled?: boolean;
}

export default function SessionMonitor({
    timeoutMinutes = 15,
    warningSeconds = 60,
    enabled = true
}: SessionMonitorProps) {
    const { user, signOut, isStaffLoggedIn, logoutStaff } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(warningSeconds);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const isAnyoneLoggedIn = !!user || isStaffLoggedIn;

    const handleLogout = useCallback(() => {
        setShowWarning(false);
        if (user) {
            signOut();
        }
        if (isStaffLoggedIn) {
            logoutStaff();
        }
    }, [user, isStaffLoggedIn, signOut, logoutStaff]);

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowWarning(false);
        setCountdown(warningSeconds);

        if (!enabled || !isAnyoneLoggedIn) return;

        // Set main timeout
        timeoutRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(warningSeconds);

            // Start countdown
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        handleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Final logout after warning period
            warningRef.current = setTimeout(() => {
                handleLogout();
            }, warningSeconds * 1000);

        }, timeoutMinutes * 60 * 1000);

    }, [enabled, isAnyoneLoggedIn, timeoutMinutes, warningSeconds, handleLogout]);

    const handleStayLoggedIn = () => {
        resetTimer();
    };

    // Setup event listeners
    useEffect(() => {
        if (!enabled || !isAnyoneLoggedIn) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        // Debounce reset to avoid excessive calls
        let debounceTimer: NodeJS.Timeout;
        const debouncedReset = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(resetTimer, 1000);
        };

        events.forEach(event => {
            document.addEventListener(event, debouncedReset, { passive: true });
        });

        // Initial timer
        resetTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, debouncedReset);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            clearTimeout(debounceTimer);
        };
    }, [enabled, isAnyoneLoggedIn, resetTimer]);

    // Don't render anything if not logged in or disabled
    if (!enabled || !isAnyoneLoggedIn) return null;

    return (
        <Modal
            isOpen={showWarning}
            onClose={handleStayLoggedIn}
            title=""
            maxWidth="400px"
        >
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <Clock size={40} color="white" />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Sesi Anda Akan Tamat
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Anda akan dilog keluar secara automatik dalam
                </p>

                <div style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: countdown <= 10 ? 'var(--danger)' : 'var(--primary)',
                    marginBottom: '1.5rem',
                    fontFamily: 'monospace'
                }}>
                    {countdown}
                    <span style={{ fontSize: '1rem', fontWeight: 400, marginLeft: '0.25rem' }}>saat</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className="btn btn-outline"
                        onClick={handleLogout}
                        style={{ flex: 1 }}
                    >
                        Log Keluar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleStayLoggedIn}
                        style={{ flex: 1 }}
                    >
                        <RefreshCw size={16} />
                        Teruskan Sesi
                    </button>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem' }}>
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Untuk keselamatan, sesi akan tamat selepas {timeoutMinutes} minit tidak aktif.
                </p>
            </div>
        </Modal>
    );
}
