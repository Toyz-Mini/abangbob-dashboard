'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    UserPlus,
    LogIn,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name || !email || !password) {
            setError('Sila isi semua maklumat');
            return;
        }

        if (password.length < 8) {
            setError('Password mestilah sekurang-kurangnya 8 aksara');
            return;
        }

        if (password !== confirmPassword) {
            setError('Password tidak sepadan');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await signUp.email({
                name,
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || 'Pendaftaran gagal');
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
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
                <div className="auth-container success-state">
                    <CheckCircle size={64} color="#22c55e" />
                    <h2>Pendaftaran Berjaya!</h2>
                    <p>Mengalihkan ke halaman log masuk...</p>
                </div>
                <style jsx>{`
          .auth-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            padding: 1rem;
          }
          .auth-container.success-state {
            width: 100%;
            max-width: 420px;
            background: white;
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success-state h2 {
            color: #22c55e;
            margin: 1rem 0 0.5rem;
          }
          .success-state p {
            color: #666;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="logo-icon">
                        <span>AB</span>
                    </div>
                    <h1>AbangBob</h1>
                    <p>Daftar Akaun Baru</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Name Input */}
                    <div className="form-group">
                        <label>
                            <User size={18} />
                            Nama Penuh
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ahmad bin Abdullah"
                            disabled={loading}
                        />
                    </div>

                    {/* Email Input */}
                    <div className="form-group">
                        <label>
                            <Mail size={18} />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@example.com"
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="form-group">
                        <label>
                            <Lock size={18} />
                            Password
                        </label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 aksara"
                                autoComplete="new-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="form-group">
                        <label>
                            <Lock size={18} />
                            Sahkan Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Masukkan password sekali lagi"
                            autoComplete="new-password"
                            disabled={loading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <>
                                <UserPlus size={20} />
                                Daftar
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="auth-footer">
                    <p>Sudah ada akaun?</p>
                    <Link href="/login" className="login-link">
                        <LogIn size={18} />
                        Log Masuk
                    </Link>
                </div>
            </div>

            <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 1rem;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          margin: 0 auto 0.75rem;
          box-shadow: 0 8px 20px rgba(204, 21, 18, 0.3);
        }

        .auth-logo h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .auth-logo p {
          color: #666;
          margin: 0.25rem 0 0;
          font-size: 0.85rem;
        }

        .form-group {
          margin-bottom: 1rem;
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
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #fafafa;
        }

        .form-group input:focus {
          outline: none;
          border-color: #CC1512;
          background: white;
          box-shadow: 0 0 0 4px rgba(204, 21, 18, 0.1);
        }

        .form-group input::placeholder {
          color: #aaa;
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper input {
          padding-right: 3rem;
        }

        .toggle-password {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0.25rem;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(204, 21, 18, 0.3);
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(204, 21, 18, 0.4);
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .auth-footer p {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .login-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #f5f5f5;
          color: #333;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .login-link:hover {
          background: #e5e5e5;
        }
      `}</style>
        </div>
    );
}
