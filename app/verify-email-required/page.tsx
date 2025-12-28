'use client';

import { useState } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function VerifyEmailRequiredPage() {
    const { user, signOut } = useAuth();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleResendEmail = async () => {
        if (!user) return;

        setSending(true);
        setError('');
        setSent(false);

        try {
            const res = await fetch('/api/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                }),
            });

            if (res.ok) {
                setSent(true);
            } else {
                setError('Gagal menghantar email. Sila cuba lagi.');
            }
        } catch {
            setError('Ralat berlaku. Sila cuba lagi.');
        } finally {
            setSending(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div className="page">
            <div className="container">
                <div className="icon">
                    <Mail size={48} />
                </div>
                <h1>Sila Sahkan Email Anda</h1>
                <p>
                    Kami telah menghantar email pengesahan ke:
                </p>
                <div className="email-box">{user?.email || 'Loading...'}</div>
                <p className="instruction">
                    Sila klik pautan dalam email tersebut untuk mengesahkan akaun anda sebelum meneruskan.
                </p>

                {sent && (
                    <div className="success-message">
                        <CheckCircle size={16} />
                        Email pengesahan telah dihantar semula!
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="actions">
                    <button
                        className="btn-primary"
                        onClick={handleResendEmail}
                        disabled={sending || sent}
                    >
                        {sending ? (
                            <>
                                <RefreshCw size={18} className="spin" />
                                Menghantar...
                            </>
                        ) : sent ? (
                            <>
                                <CheckCircle size={18} />
                                Email Dihantar
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Hantar Semula Email
                            </>
                        )}
                    </button>

                    <button className="btn-secondary" onClick={handleLogout}>
                        <LogOut size={18} />
                        Log Keluar
                    </button>
                </div>

                <p className="note">
                    Tak nampak email? Semak folder Spam atau Junk anda.
                </p>
            </div>

            <style jsx>{`
                .page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
                    padding: 1rem;
                }
                .container {
                    width: 100%;
                    max-width: 440px;
                    background: white;
                    border-radius: 24px;
                    padding: 3rem 2rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .icon {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    color: #CC1512;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }
                h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0 0 1rem;
                }
                p {
                    color: #666;
                    margin: 0 0 0.75rem;
                    line-height: 1.6;
                }
                .email-box {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 10px;
                    padding: 0.875rem;
                    color: #CC1512;
                    font-weight: 600;
                    margin: 0.5rem 0 1rem;
                    word-break: break-all;
                }
                .instruction {
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                }
                .success-message {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: #dcfce7;
                    border: 1px solid #bbf7d0;
                    border-radius: 10px;
                    color: #16a34a;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }
                .error-message {
                    padding: 0.75rem 1rem;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    color: #dc2626;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }
                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .btn-primary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(204, 21, 18, 0.3);
                }
                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.875rem;
                    background: #f5f5f5;
                    color: #666;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary:hover {
                    background: #e9ecef;
                }
                .note {
                    font-size: 0.8rem;
                    color: #999;
                    margin-top: 1.5rem;
                    margin-bottom: 0;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
