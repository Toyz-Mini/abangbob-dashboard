'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Sila masukkan email');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Ralat berlaku');
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('Ralat berlaku. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h2>Email Dihantar! ✉️</h2>
                        <p>
                            Jika email wujud dalam sistem, anda akan menerima link untuk reset password.
                        </p>
                        <div className="email-box">{email}</div>
                        <Link href="/login" className="back-link">
                            <ArrowLeft size={18} />
                            Kembali ke Log Masuk
                        </Link>
                    </div>
                </div>

                <style jsx>{`
          .auth-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          }
          .auth-container {
            width: 100%;
            max-width: 420px;
          }
          .auth-card {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success-icon {
            width: 100px;
            height: 100px;
            background: #dcfce7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: #22c55e;
          }
          h2 {
            color: #1a1a1a;
            margin: 0 0 0.75rem;
            font-size: 1.5rem;
          }
          p {
            color: #666;
            margin: 0 0 1rem;
            line-height: 1.6;
          }
          .email-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 0.875rem;
            color: #22c55e;
            font-weight: 600;
            margin-bottom: 1.5rem;
          }
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #666;
            text-decoration: none;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="logo-icon">AB</div>
                    <h1>Lupa Password?</h1>
                    <p className="subtitle">Masukkan email anda untuk reset password</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@example.com"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? <LoadingSpinner size="sm" /> : 'Hantar Link Reset'}
                        </button>
                    </form>

                    <Link href="/login" className="back-link">
                        <ArrowLeft size={18} />
                        Kembali ke Log Masuk
                    </Link>
                </div>
            </div>

            <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        }
        .auth-container {
          width: 100%;
          max-width: 420px;
        }
        .auth-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          margin: 0 auto 1rem;
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
        }
        .subtitle {
          color: #666;
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 1rem;
          text-align: left;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
          margin-bottom: 0.5rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          color: #1a1a1a;
        }
        .form-group input:focus {
          outline: none;
          border-color: #CC1512;
          background: white;
        }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .auth-submit {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 1.5rem;
        }
        .auth-submit:disabled {
          opacity: 0.7;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          text-decoration: none;
          font-size: 0.9rem;
        }
      `}</style>
        </div>
    );
}
