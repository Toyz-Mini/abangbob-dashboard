'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import Turnstile from '@/components/Turnstile';
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
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

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

    if (!turnstileToken) {
      setError('Sila lengkapkan pengesahan CAPTCHA');
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
          <div className="bg-shape shape-1 success" />
          <div className="bg-shape shape-2 success" />
        </div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h2>Pendaftaran Berjaya! 🎉</h2>
            <p>
              Sila semak email anda untuk mengesahkan akaun.
            </p>
            <div className="email-box">{email}</div>
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
            filter: blur(60px);
            opacity: 0.5;
          }
          .shape-1.success {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.1));
            top: -100px;
            left: -100px;
          }
          .shape-2.success {
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(134, 239, 172, 0.1));
            bottom: -50px;
            right: -50px;
          }
          .auth-container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 420px;
          }
          .auth-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 2.5rem;
            border: 1px solid rgba(255, 255, 255, 0.9);
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
          .auth-submit {
            display: inline-flex;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="bg-shape shape-1" />
        <div className="bg-shape shape-2" />
        <div className="bg-shape shape-3" />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">
              <span>AB</span>
            </div>
            <h1>AbangBob</h1>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Daftar Akaun Baru ✨</h2>
            <p className="form-subtitle">Sertai keluarga AbangBob</p>

            {/* Name Input */}
            <div className="form-group">
              <label>
                <User size={16} />
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
                <Lock size={16} />
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

            {/* Turnstile CAPTCHA */}
            <Turnstile onVerify={handleTurnstileVerify} />

            {/* Submit Button */}
            <button type="submit" className="auth-submit" disabled={loading || !turnstileToken}>
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
          right: -150px;
          filter: blur(60px);
        }

        .shape-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1));
          bottom: -100px;
          left: -100px;
          filter: blur(60px);
          animation-delay: -8s;
        }

        .shape-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1));
          top: 35%;
          left: 10%;
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
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
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
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          margin: 0 auto 0.75rem;
          box-shadow: 0 10px 30px rgba(204, 21, 18, 0.3);
        }

        .auth-logo h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .auth-form h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
          text-align: center;
        }

        .form-subtitle {
          color: #666;
          text-align: center;
          font-size: 0.85rem;
          margin: 0 0 1.25rem;
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
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 0.95rem;
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
          background: #e9ecef;
        }

        .auth-divider span {
          padding: 0 1rem;
          color: #adb5bd;
          font-size: 0.8rem;
        }

        .auth-footer {
          text-align: center;
        }

        .auth-footer p {
          color: #666;
          font-size: 0.85rem;
          margin: 0 0 0.5rem;
        }

        .login-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          color: #333;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .login-link:hover {
          background: #e9ecef;
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
