'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  LogIn, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChefHat,
  Loader2,
  KeyRound,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useStore } from '@/lib/store';

type LoginMode = 'select' | 'email' | 'pin';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, loginWithPin, isStaffLoggedIn, user, loading: authLoading } = useAuth();
  const { staff, isInitialized } = useStore();
  
  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && (user || isStaffLoggedIn)) {
      router.push('/');
    }
  }, [user, isStaffLoggedIn, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInWithEmail(email, password);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login gagal');
    }
    
    setLoading(false);
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedStaffId) {
      setError('Sila pilih staf');
      return;
    }
    
    if (pin.length !== 4) {
      setError('PIN mesti 4 digit');
      return;
    }

    setLoading(true);
    const result = await loginWithPin(selectedStaffId, pin);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login gagal');
    }
    
    setLoading(false);
  };

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

  const activeStaff = staff.filter(s => s.status === 'active');

  if (authLoading || !isInitialized) {
    return (
      <div className="login-page">
        <div className="login-loading">
          <Loader2 size={40} className="spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <ChefHat size={48} />
          </div>
          <h1>AbangBob Dashboard</h1>
          <p>Sistem Pengurusan F&B</p>
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="login-modes">
            <button 
              className="login-mode-btn"
              onClick={() => setMode('pin')}
            >
              <div className="mode-icon">
                <KeyRound size={28} />
              </div>
              <div className="mode-info">
                <span className="mode-title">Login Staf</span>
                <span className="mode-desc">Guna PIN untuk akses cepat</span>
              </div>
            </button>
            
            <button 
              className="login-mode-btn"
              onClick={() => setMode('email')}
            >
              <div className="mode-icon admin">
                <User size={28} />
              </div>
              <div className="mode-info">
                <span className="mode-title">Login Admin</span>
                <span className="mode-desc">Email & password untuk admin</span>
              </div>
            </button>
          </div>
        )}

        {/* Email Login Form */}
        {mode === 'email' && (
          <form className="login-form" onSubmit={handleEmailLogin}>
            <button 
              type="button" 
              className="back-btn"
              onClick={() => { setMode('select'); setError(''); }}
            >
              <ArrowLeft size={18} />
              Kembali
            </button>

            <h2>Login Admin</h2>
            
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@abangbob.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Loading...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Log Masuk
                </>
              )}
            </button>
          </form>
        )}

        {/* PIN Login */}
        {mode === 'pin' && (
          <div className="pin-login">
            <button 
              type="button" 
              className="back-btn"
              onClick={() => { setMode('select'); setError(''); setPin(''); setSelectedStaffId(''); }}
            >
              <ArrowLeft size={18} />
              Kembali
            </button>

            <h2>Login Staf</h2>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* Staff Selection */}
            <div className="staff-select">
              <label>
                <Users size={16} />
                Pilih Staf
              </label>
              <div className="staff-grid">
                {activeStaff.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`staff-option ${selectedStaffId === s.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedStaffId(s.id); setError(''); }}
                  >
                    <div className="staff-avatar">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="staff-name">{s.name}</span>
                    <span className="staff-role">{s.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PIN Display */}
            <div className="pin-display">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}>
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            {/* PIN Pad */}
            <div className="pin-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                <button
                  key={digit}
                  type="button"
                  className="pin-key"
                  onClick={() => handlePinInput(digit.toString())}
                  disabled={!selectedStaffId}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                className="pin-key pin-clear"
                onClick={handlePinClear}
              >
                C
              </button>
              <button
                type="button"
                className="pin-key"
                onClick={() => handlePinInput('0')}
                disabled={!selectedStaffId}
              >
                0
              </button>
              <button
                type="button"
                className="pin-key pin-backspace"
                onClick={handlePinBackspace}
              >
                ←
              </button>
            </div>

            {/* Submit */}
            <button 
              type="button"
              className="btn btn-primary btn-lg login-btn"
              onClick={handlePinLogin}
              disabled={loading || !selectedStaffId || pin.length !== 4}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Loading...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Log Masuk
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>© 2024 AbangBob Dashboard</p>
        </div>
      </div>
    </div>
  );
}

