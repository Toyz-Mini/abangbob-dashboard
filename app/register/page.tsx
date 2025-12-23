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
  Sparkles,
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
        // Send verification email
        await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.data?.user?.id,
            email,
            name,
          }),
        });

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
        <div className="auth-bg">
          <div className="bg-blob blob-1" />
          <div className="bg-blob blob-2" />
        </div>
        <div className="auth-container">
          <div className="auth-card success-card">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h2>Pendaftaran Berjaya! 🎉</h2>
            <p>
              Sila semak email anda untuk mengesahkan akaun.
              <br />
              <span className="email-highlight">{email}</span>
            </p>
            <Link href="/login" className="auth-submit">
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
            background: linear-gradient(135deg, #22c55e, #4ade80);
            top: -100px;
            left: -100px;
          }
          .blob-2 {
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #22c55e, #86efac);
            bottom: -50px;
            right: -50px;
          }
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
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
            border-radius: 24px;
            padding: 3rem 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
          }
          .success-icon {
            width: 100px;
            height: 100px;
            background: rgba(34, 197, 94, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: #4ade80;
          }
          h2 {
            color: white;
            margin: 0 0 1rem;
            font-size: 1.5rem;
          }
          p {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            margin: 0 0 2rem;
          }
          .email-highlight {
            color: #4ade80;
            font-weight: 600;
          }
          .auth-submit {
            display: inline-flex;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #22c55e, #4ade80);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">
              <span>AB</span>
              <Sparkles className="sparkle" size={16} />
            </div>
            <h1>AbangBob</h1>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Daftar Akaun Baru ✨</h2>
            <p className="form-subtitle">Sertai keluarga AbangBob</p>

            {/* Name Input */}
            <div className="form-group">
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Penuh"
                  disabled={loading}
                />
              </div>
            </div>

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
                  placeholder="Password (min. 8 aksara)"
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
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Sahkan Password"
                  autoComplete="new-password"
                  disabled={loading}
                />
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
                  <UserPlus size={20} />
                  Daftar
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>atau</span>
          </div>

          {/* Login Link */}
          <div className="auth-footer">
            <p>Sudah ada akaun?</p>
            <Link href="/login" className="login-link">
              <LogIn size={18} />
              Log Masuk
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
          right: -100px;
        }

        .blob-2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          bottom: -50px;
          left: -50px;
          animation-delay: -5s;
        }

        .blob-3 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #f093fb, #f5576c);
          top: 30%;
          left: 10%;
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
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #CC1512 0%, #ff6b6b 100%);
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          margin: 0 auto 0.75rem;
          box-shadow: 0 10px 30px rgba(204, 21, 18, 0.4);
          position: relative;
        }

        .logo-icon :global(.sparkle) {
          position: absolute;
          top: -4px;
          right: -4px;
          color: #fbbf24;
        }

        .auth-logo h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }

        .auth-form h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin: 0 0 0.5rem;
          text-align: center;
        }

        .form-subtitle {
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          font-size: 0.85rem;
          margin: 0 0 1.25rem;
        }

        .form-group {
          margin-bottom: 0.875rem;
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
          padding: 0.875rem 2.75rem 0.875rem 2.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          font-size: 0.95rem;
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
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 10px;
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
          padding: 0.875rem;
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
          margin: 1.25rem 0;
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
          font-size: 0.8rem;
        }

        .auth-footer {
          text-align: center;
        }

        .auth-footer p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          margin: 0 0 0.5rem;
        }

        .login-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .login-link:hover {
          background: rgba(255, 255, 255, 0.2);
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
