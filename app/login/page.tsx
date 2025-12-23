'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Sila isi email dan password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Login gagal');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
      </div>

      <div className="auth-container">
        {/* Glass Card */}
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">
              <span>AB</span>
              <Sparkles className="sparkle" size={16} />
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
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* Footer */}
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
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }

        .auth-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: float 20s infinite ease-in-out;
        }

        .blob-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #CC1512, #ff6b6b);
          top: -100px;
          left: -100px;
        }

        .blob-2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          bottom: -50px;
          right: -50px;
          animation-delay: -5s;
        }

        .blob-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #f093fb, #f5576c);
          top: 50%;
          right: 20%;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(-30px, -20px) scale(1.05); }
        }

        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #CC1512 0%, #ff6b6b 100%);
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          margin: 0 auto 1rem;
          box-shadow: 0 10px 30px rgba(204, 21, 18, 0.4);
          position: relative;
          animation: pulse-glow 3s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 10px 30px rgba(204, 21, 18, 0.4); }
          50% { box-shadow: 0 10px 40px rgba(204, 21, 18, 0.6); }
        }

        .logo-icon :global(.sparkle) {
          position: absolute;
          top: -4px;
          right: -4px;
          color: #fbbf24;
        }

        .auth-logo h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }

        .auth-logo p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }

        .auth-form h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin: 0 0 0.5rem;
          text-align: center;
        }

        .form-subtitle {
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          font-size: 0.9rem;
          margin: 0 0 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper :global(.input-icon) {
          position: absolute;
          left: 1rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .input-wrapper input {
          width: 100%;
          padding: 1rem 3rem 1rem 3rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 1rem;
          color: white;
          transition: all 0.3s;
        }

        .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #CC1512;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 4px rgba(204, 21, 18, 0.2);
        }

        .toggle-password {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #CC1512 0%, #ff6b6b 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(204, 21, 18, 0.4);
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(204, 21, 18, 0.5);
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
          background: rgba(255, 255, 255, 0.2);
        }

        .auth-divider span {
          padding: 0 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        .auth-footer {
          text-align: center;
        }

        .auth-footer p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          margin: 0 0 0.75rem;
        }

        .register-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .register-link:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .copyright {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
