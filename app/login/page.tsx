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
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('/grid-pattern.svg')] bg-fixed bg-cover relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black -z-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 opacity-40 -z-10 animate-pulse-slow" />

      {/* Main Card */}
      <GlassCard
        className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-scale-in border-white/10"
        gradient="subtle"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <div className="p-8 flex flex-col items-center text-center relative">
          {/* Logo Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -z-10" />

          <div className="w-24 h-24 mb-6 relative hover-lift transition-all duration-500">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse" />
            <img
              src="/logo.png"
              alt="Abang Bob"
              className="w-full h-full object-contain relative z-10 drop-shadow-xl"
            />
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-2">
            AbangBob Dashboard
          </h1>
          <p className="text-white/50 text-sm mb-8 font-medium tracking-wide uppercase">
            Sistem Pengurusan F&B Premium
          </p>

          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="w-full grid grid-cols-1 gap-4 animate-slide-up">
              <button
                className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
                onClick={() => setMode('pin')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30">
                    <KeyRound size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Login Staf</h3>
                    <p className="text-white/50 text-xs">Guna PIN 4-digit akses cepat</p>
                  </div>
                  <ArrowLeft className="ml-auto rotate-180 text-white/20 group-hover:text-white/60 transition-colors" size={20} />
                </div>
              </button>

              <button
                className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
                onClick={() => setMode('email')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-accent to-orange-600 text-white shadow-lg shadow-accent/30">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Login Admin</h3>
                    <p className="text-white/50 text-xs">Akses penuh pengurusan</p>
                  </div>
                  <ArrowLeft className="ml-auto rotate-180 text-white/20 group-hover:text-white/60 transition-colors" size={20} />
                </div>
              </button>
            </div>
          )}

          {/* Email Login Form */}
          {mode === 'email' && (
            <form className="w-full animate-slide-up" onSubmit={handleEmailLogin}>
              <button
                type="button"
                className="mb-8 text-white/50 hover:text-white flex items-center gap-2 text-sm transition-colors"
                onClick={() => { setMode('select'); setError(''); }}
              >
                <ArrowLeft size={16} /> Pilih Mode Lain
              </button>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-shake">
                  <div className="p-1 rounded-full bg-red-500/20"><EyeOff size={12} /></div>
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    placeholder="admin@abangbob.com"
                    required
                  />
                </div>

                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <PremiumButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                icon={LogIn}
              >
                Log Masuk
              </PremiumButton>
            </form>
          )}

          {/* PIN Login */}
          {mode === 'pin' && (
            <div className="w-full animate-slide-up">
              <button
                type="button"
                className="mb-6 text-white/50 hover:text-white flex items-center gap-2 text-sm transition-colors"
                onClick={() => { setMode('select'); setError(''); setPin(''); setSelectedStaffId(''); }}
              >
                <ArrowLeft size={16} /> Pilih Mode Lain
              </button>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-shake">
                  <div className="p-1 rounded-full bg-red-500/20"><EyeOff size={12} /></div>
                  {error}
                </div>
              )}

              {/* Staff Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                {activeStaff.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${selectedStaffId === s.id
                      ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(204,21,18,0.3)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    onClick={() => { setSelectedStaffId(s.id); setError(''); }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border ${selectedStaffId === s.id ? 'bg-primary text-white border-primary-light' : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold leading-tight ${selectedStaffId === s.id ? 'text-white' : 'text-gray-300'}`}>
                        {s.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{s.role}</div>
                    </div>
                    {selectedStaffId === s.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                    )}
                  </button>
                ))}
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i
                      ? 'bg-primary shadow-[0_0_10px_var(--primary)] scale-110'
                      : 'bg-white/10 border border-white/10'
                      }`}
                  />
                ))}
              </div>

              {/* PIN Pad */}
              <div className="grid grid-cols-3 gap-3 mb-8 max-w-[280px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    className="h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-2xl font-medium text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={!selectedStaffId}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  className="h-16 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all active:scale-90"
                  onClick={handlePinClear}
                >
                  <span className="text-sm font-bold">CLR</span>
                </button>
                <button
                  type="button"
                  className="h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-2xl font-medium text-white transition-all active:scale-90 disabled:opacity-30"
                  onClick={() => handlePinInput('0')}
                  disabled={!selectedStaffId}
                >
                  0
                </button>
                <button
                  type="button"
                  className="h-16 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
                  onClick={handlePinBackspace}
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <PremiumButton
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handlePinLogin}
                disabled={loading || !selectedStaffId || pin.length !== 4}
                loading={loading}
              >
                Log Masuk
              </PremiumButton>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/20 p-4 text-center border-t border-white/5">
          <p className="text-white/30 text-xs font-mono">
            © 2024 AbangBob Dashboard v2.0 • Premium System
          </p>
        </div>
      </GlassCard>
    </div>
  );
}




