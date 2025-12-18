'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useStore } from '@/lib/store';

type LoginMode = 'select' | 'email' | 'pin' | '2fa';

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

  // 2FA State
  const [twoFaPin, setTwoFaPin] = useState('');
  const [pendingAdminUser, setPendingAdminUser] = useState<string | null>(null);

  // 2FA Master PIN (configurable - in production, this would be in secure settings)
  const ADMIN_2FA_PIN = '1234'; // Default 2FA PIN - change in settings

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
      // Trigger 2FA step for Admin
      setPendingAdminUser(email);
      setMode('2fa');
      setLoading(false);
    } else {
      setError(result.error || 'Login gagal');
      setLoading(false);
    }
  };

  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (twoFaPin === ADMIN_2FA_PIN) {
      // 2FA success - proceed to dashboard
      router.push('/');
    } else {
      setError('PIN 2FA tidak sah. Sila cuba lagi.');
      setTwoFaPin('');
    }
  };

  const handle2FAPinInput = (digit: string) => {
    if (twoFaPin.length < 4) {
      setTwoFaPin(prev => prev + digit);
    }
  };

  const handle2FAPinBackspace = () => {
    setTwoFaPin(prev => prev.slice(0, -1));
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
      // Check if staff role should go to staff portal
      const staffMember = staff.find(s => s.id === selectedStaffId);
      // Explicitly check role or default to checking permissions
      if (staffMember?.role === 'Staff') {
        router.push('/staff-portal');
      } else {
        router.push('/');
      }
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
          <p className="text-white/60 font-medium tracking-wide">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#FDFBF7] text-gray-900 selection:bg-primary/20">

      {/* --- Ambient Background Effects --- */}
      {/* 1. Deep noise texture overlay (Subtle) */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}>
      </div>

      {/* 2. Primary ambient glow (Top Left - Softer) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />

      {/* 3. Secondary ambient glow (Bottom Right - Softer) */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md px-6 animate-scale-in">

        {/* Glass Card (Light Mode) */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] ring-1 ring-white/80">

          {/* Inner Highlight Border (Top) */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

          <div className="p-6 md:p-10 flex flex-col items-center text-center">

            {/* Logo Section */}
            <div className="relative group mb-8">
              {/* Logo Backlight */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 blur-[30px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

              <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-b from-white to-gray-50 p-px shadow-lg overflow-hidden shrink-0 border border-gray-100">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Abang Bob"
                    width="80"
                    height="80"
                    className="w-full h-full object-contain p-2 drop-shadow-sm transform group-hover:scale-110 transition-transform duration-500"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2 mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                AbangBob
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">.</span>
              </h1>
              <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">
                Premium F&B Management
              </p>
            </div>

            {/* Mode Selection */}
            {mode === 'select' && (
              <div className="w-full grid gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <button
                  className="group relative w-full p-4 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-200 hover:border-primary/30 transition-all duration-300 text-left overflow-hidden"
                  onClick={() => setMode('pin')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                      <KeyRound size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Login Staf</h3>
                      <p className="text-xs text-gray-500">Akses pantas guna PIN 4-digit</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                      <ArrowLeft className="rotate-180 w-4 h-4" />
                    </div>
                  </div>
                </button>

                <button
                  className="group relative w-full p-4 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-500/30 transition-all duration-300 text-left overflow-hidden"
                  onClick={() => setMode('email')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Login Admin</h3>
                      <p className="text-xs text-gray-500">Dashboard pengurusan penuh</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all">
                      <ArrowLeft className="rotate-180 w-4 h-4" />
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Email Form */}
            {mode === 'email' && (
              <form className="w-full animate-slide-up" onSubmit={handleEmailLogin}>
                <button
                  type="button"
                  className="mb-8 group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  onClick={() => { setMode('select'); setError(''); }}
                >
                  <div className="p-1 rounded-md bg-gray-100 group-hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={14} />
                  </div>
                  <span>Kembali</span>
                </button>

                {error && (
                  <div className="mb-6 w-full p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-shake">
                    <EyeOff size={16} className="text-red-500 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-5 mb-8">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:shadow-sm transition-all text-sm font-medium"
                        placeholder="admin@abangbob.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-11 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:shadow-sm transition-all text-sm font-medium font-mono"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <PremiumButton
                  type="submit"
                  className="w-full py-4 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  loading={loading}
                >
                  Log Masuk Dashboard
                </PremiumButton>
              </form>
            )}

            {/* 2FA Verification Step */}
            {mode === '2fa' && (
              <form className="w-full animate-slide-up" onSubmit={handle2FAVerify}>
                <div className="mb-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Pengesahan 2FA</h3>
                  <p className="text-sm text-gray-500 mt-1">Masukkan PIN keselamatan 4 digit</p>
                  <p className="text-xs text-gray-400 mt-1">{pendingAdminUser}</p>
                </div>

                {error && (
                  <div className="mb-6 w-full p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-shake">
                    <EyeOff size={16} className="text-red-500 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* 2FA PIN Dots */}
                <div className="flex justify-center gap-6 mb-8 h-4">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${twoFaPin.length > i
                        ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-125'
                        : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>

                {/* 2FA PIN Pad */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-6 max-w-[220px] md:max-w-[260px] mx-auto mb-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                    <button
                      key={digit}
                      type="button"
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 shadow-sm text-lg md:text-2xl font-light text-gray-800 transition-all active:scale-95 flex items-center justify-center"
                      onClick={() => handle2FAPinInput(digit.toString())}
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-red-50 text-red-500/70 hover:text-red-600 transition-all flex items-center justify-center"
                    onClick={() => setTwoFaPin('')}
                  >
                    <span className="text-[10px] md:text-xs font-bold tracking-widest">CLR</span>
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 shadow-sm text-lg md:text-2xl font-light text-gray-800 transition-all active:scale-95 flex items-center justify-center"
                    onClick={() => handle2FAPinInput('0')}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center"
                    onClick={handle2FAPinBackspace}
                  >
                    <ArrowLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>

                <PremiumButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                  disabled={twoFaPin.length !== 4}
                >
                  Sahkan PIN
                </PremiumButton>

                <button
                  type="button"
                  className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => { setMode('email'); setTwoFaPin(''); setPendingAdminUser(null); }}
                >
                  Batal dan kembali
                </button>
              </form>
            )}

            {/* PIN Form */}
            {mode === 'pin' && (
              <div className="w-full animate-slide-up">
                <button
                  type="button"
                  className="mb-6 group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  onClick={() => { setMode('select'); setError(''); setPin(''); setSelectedStaffId(''); }}
                >
                  <div className="p-1 rounded-md bg-gray-100 group-hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={14} />
                  </div>
                  <span>Kembali</span>
                </button>

                {error && (
                  <div className="mb-6 w-full p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-shake">
                    <EyeOff size={16} className="text-red-500 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Staff Selection Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                  {activeStaff.map(s => {
                    const isSelected = selectedStaffId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSelectedStaffId(s.id); setError(''); }}
                        className={`relative group p-3 rounded-xl border transition-all duration-300 ${isSelected
                          ? 'bg-primary/5 border-primary/50 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300 ${isSelected
                            ? 'bg-primary text-white border-primary-light shadow-md scale-110'
                            : 'bg-gray-100 text-gray-500 border-transparent group-hover:bg-gray-200'
                            }`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-center">
                            <span className={`block text-xs font-bold truncate max-w-[100px] mb-1 ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                              {s.name}
                            </span>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider">{s.role}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* PIN Input Visualization */}
                <div className="flex justify-center gap-6 mb-8 h-4">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${pin.length > i
                        ? 'bg-primary shadow-[0_0_15px_rgba(204,21,18,0.4)] scale-125'
                        : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>

                {/* PIN Pad */}
                {/* PIN Pad */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-6 max-w-[220px] md:max-w-[260px] mx-auto mb-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                    <button
                      key={digit}
                      type="button"
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm text-lg md:text-2xl font-light text-gray-800 transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:shadow-none"
                      onClick={() => handlePinInput(digit.toString())}
                      disabled={!selectedStaffId}
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-red-50 text-red-500/70 hover:text-red-600 transition-all flex items-center justify-center"
                    onClick={handlePinClear}
                  >
                    <span className="text-[10px] md:text-xs font-bold tracking-widest">CLR</span>
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm text-lg md:text-2xl font-light text-gray-800 transition-all active:scale-95 flex items-center justify-center disabled:opacity-30"
                    onClick={() => handlePinInput('0')}
                    disabled={!selectedStaffId}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center"
                    onClick={handlePinBackspace}
                  >
                    <ArrowLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>

                <PremiumButton
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  onClick={handlePinLogin}
                  disabled={loading || !selectedStaffId || pin.length !== 4}
                  loading={loading}
                >
                  Log Masuk
                </PremiumButton>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-gray-50/80 p-3 text-center border-t border-gray-200/60 backdrop-blur-md">
            <p className="text-[10px] text-gray-400 font-mono tracking-widest opacity-80 hover:opacity-100 transition-opacity">
              ABANGBOB DASHBOARD v2.0 • SYSTEM SECURE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




