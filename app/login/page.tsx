'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import Turnstile from '@/components/Turnstile';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Sila isi email dan password');
      return;
    }

    if (!turnstileToken) {
      setError('Sila lengkapkan pengesahan CAPTCHA');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      console.log('Sign in result:', result);

      if (result.error) {
        setError(result.error.message || 'Login gagal');
      } else {
        // Force full page reload to ensure auth state is fresh and cookies are sent
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Sign in error details:', err);
      // specific check for fetch failures
      if (err.message === 'Load failed' || err.message === 'Failed to fetch') {
        setError('Gagal menyambung ke server. Sila periksa sambungan internet anda.');
      } else {
        setError(err?.message || 'Ralat berlaku. Sila cuba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="bg-shape shape-1" />
        <div className="bg-shape shape-2" />
        <div className="bg-shape shape-3" />
      </div>

      <div className="auth-container">
        {/* Card */}
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">
              <span>AB</span>
            </div>
            <h1>AbangBob</h1>
            <p>Dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Selamat Kembali! 👋</h2>
            <p className="form-subtitle">Log masuk untuk meneruskan</p>

            {/* Email Input */}
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
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label>
                <Lock size={16} />
                Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Forgot Password */}
            <div className="forgot-password">
              <Link href="/forgot-password">Lupa password?</Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Turnstile CAPTCHA */}
            <Turnstile onVerify={handleTurnstileVerify} />

            {/* Submit Button */}
            <button type="submit" className="auth-submit" disabled={loading || !turnstileToken}>
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn size={20} />
                  Log Masuk
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>atau</span>
          </div>

          {/* Register Link */}
          <div className="auth-footer">
            <p>Belum ada akaun?</p>
            <Link href="/register" className="register-link">
              <UserPlus size={18} />
              <span>Daftar Sekarang</span>
            </Link>
          </div>
        </div>

        <p className="copyright">© 2024 AbangBob. All rights reserved.</p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        }

        .auth-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.6;
          animation: float 25s infinite ease-in-out;
        }

        .shape-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, rgba(204, 21, 18, 0.15), rgba(255, 107, 107, 0.1));
          top: -150px;
          left: -150px;
          filter: blur(60px);
        }

        .shape-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1));
          bottom: -100px;
          right: -100px;
          filter: blur(60px);
          animation-delay: -8s;
        }

        .shape-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1));
          top: 40%;
          right: 15%;
          filter: blur(50px);
          animation-delay: -15s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(-20px, -15px) scale(1.02); }
        }

        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          margin: 0 auto 1rem;
          box-shadow: 0 10px 30px rgba(204, 21, 18, 0.3);
        }

        .auth-logo h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .auth-logo p {
          color: #666;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }

        .auth-form h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
          text-align: center;
        }

        .form-subtitle {
          color: #666;
          text-align: center;
          font-size: 0.9rem;
          margin: 0 0 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
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
          transition: all 0.2s;
        }

        .form-group input::placeholder {
          color: #adb5bd;
        }

        .form-group input:focus {
          outline: none;
          border-color: #CC1512;
          background: white;
          box-shadow: 0 0 0 4px rgba(204, 21, 18, 0.1);
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
          color: #6c757d;
          cursor: pointer;
          padding: 0.25rem;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .forgot-password {
          text-align: right;
          margin-bottom: 1rem;
          margin-top: -0.5rem;
        }

        .forgot-password :global(a) {
          color: #CC1512;
          font-size: 0.875rem;
          text-decoration: none;
        }

        .forgot-password :global(a:hover) {
          text-decoration: underline;
        }

        .auth-submit {
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

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e9ecef;
        }

        .auth-divider span {
          padding: 0 1rem;
          color: #adb5bd;
          font-size: 0.85rem;
        }

        .auth-footer {
          text-align: center;
        }

        .auth-footer p {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 0.75rem;
        }

        .register-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          color: #333;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .register-link:hover {
          background: #e9ecef;
          border-color: #dee2e6;
        }

        .copyright {
          text-align: center;
          color: #adb5bd;
          font-size: 0.75rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
