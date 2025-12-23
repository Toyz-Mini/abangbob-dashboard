'use client';

import { useState, useEffect, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getLeaveTypeLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Clock,
  CheckSquare,
  Calendar,
  Plane,
  DollarSign,
  FileText,
  Megaphone,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Sun,
  Moon,
  User,
  CheckCircle,
  ArrowLeftRight,
  GraduationCap,
  Receipt,
  Trophy
} from 'lucide-react';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  DarkModeToggle,
  TeamTodayWidget,
  BirthdayBanner,
  NotificationCenter,
  FeedbackModal,
  FeedbackButton,
  EmergencySOS,
  MoodCheckIn,
  AchievementBadge,
  staffAchievements
} from '@/components/staff-portal';
import VerificationWizard from '@/components/VerificationWizard';
import SOPWizard from '@/components/staff/SOPWizard';

import { AnimatePresence } from 'framer-motion';
import { getStaffXP, StaffXP } from '@/lib/gamification';
import { useSOPLogsRealtime, useStaffXPRealtime } from '@/lib/supabase/realtime-hooks';


// Circular Progress Component
function CircularProgress({
  progress,
  size = 140,
  strokeWidth = 8,
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="clock-progress-ring" style={{ width: size, height: size }}>
      <svg>
        <defs>
          <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CC1512" />
            <stop offset="100%" stopColor="#A50F0F" />
          </linearGradient>
        </defs>
        <circle
          className="progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className="progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="clock-progress-center">
        {children}
      </div>
    </div>
  );
}

// Leave Balance Ring Component
function LeaveBalanceRing({
  balance,
  total,
  type,
  label
}: {
  balance: number;
  total: number;
  type: 'annual' | 'medical' | 'emergency' | 'unpaid';
  label: string;
}) {
  const percentage = total > 0 ? (balance / total) * 100 : 0;
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="leave-balance-card">
      <div className="leave-progress-ring">
        <svg>
          <circle
            className="progress-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className={`progress-fill ${type}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="leave-progress-center">
          <span className={`leave-progress-value ${type}`}>{balance}</span>
        </div>
      </div>
      <div className="leave-balance-label">{label}</div>
      <div className="leave-balance-detail">dari {total} hari</div>
    </div>
  );
}

export default function StaffPortalPage() {
  const router = useRouter();

  // Get current logged-in staff from AuthContext
  const { currentStaff: authStaff, isStaffLoggedIn, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isStaffLoggedIn && !user) {
      router.push('/staff-login');
    }
  }, [isStaffLoggedIn, user, router]);

  const {
    staff,
    attendance,
    getStaffAttendanceToday,
    clockIn,
    clockOut,
    isInitialized
  } = useStaff();

  const {
    getLeaveBalance,
    getStaffLeaveRequests,
    getStaffClaimRequests,
    getStaffRequestsByStaff,
    getActiveAnnouncements,
    getTodayChecklist,
    schedules,
    shifts,
    refreshChecklistCompletions,
  } = useStaffPortal();

  const [isClocking, setIsClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Verification Wizard State
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'IN' | 'OUT'>('IN');

  // SOP Wizard State
  const [showWizard, setShowWizard] = useState(false);

  const [wizardType, setWizardType] = useState<'morning' | 'mid' | 'night'>('morning');
  const [xpData, setXPData] = useState<StaffXP | null>(null);





  const handleWizardComplete = () => {
    setShowWizard(false);
    // Optional: Refresh data or show success toast
  };

  // Get staff ID - prioritize PIN login, fall back to Supabase user
  // If logged in as Admin via Supabase, use first available staff or show admin view
  const staffId = authStaff?.id || user?.id || '';

  // Get current staff profile from store (may have more data than authStaff)
  const currentStaff = staff.find(s => s.id === staffId) || (authStaff ? {
    id: authStaff.id,
    name: authStaff.name,
    role: authStaff.role,
    email: authStaff.email || '',
    status: authStaff.status,
  } : null);

  const todayAttendance = staffId ? getStaffAttendanceToday(staffId) : undefined;

  useEffect(() => {
    if (staffId) {
      getStaffXP(staffId).then(setXPData);
    }
  }, [staffId, showWizard]);

  // Realtime Subscriptions
  useSOPLogsRealtime(() => {
    console.log('SOP Update detected, refreshing...');
    refreshChecklistCompletions();
  });

  useStaffXPRealtime((payload) => {
    // Only refresh if it affects current staff
    if (!staffId) return;
    if (payload.new.staff_id === staffId || payload.old.staff_id === staffId) {
      console.log('XP Update detected, refreshing...');
      getStaffXP(staffId).then(setXPData);
    }
  });

  // Get today's schedule
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = useMemo(() => {
    if (!staffId) return null;
    return schedules.find(s => s.staffId === staffId && s.date === today);
  }, [schedules, today, staffId]);

  const currentShift = useMemo(() => {
    if (!todaySchedule) return null;
    return shifts.find(s => s.id === todaySchedule.shiftId);
  }, [todaySchedule, shifts]);

  // Get leave balance
  const leaveBalance = getLeaveBalance(staffId);

  // Get pending requests
  const leaveRequests = getStaffLeaveRequests(staffId);
  const claimRequests = getStaffClaimRequests(staffId);
  const staffRequests = getStaffRequestsByStaff(staffId);

  const pendingLeaveCount = leaveRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingClaimCount = claimRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingRequestCount = staffRequests?.filter(r => r.status === 'pending').length || 0;
  const totalPending = pendingLeaveCount + pendingClaimCount + pendingRequestCount;

  // Get announcements - handle 'Admin' role by treating as 'Manager'
  const roleForAnnouncements = currentStaff?.role === 'Admin' ? 'Manager' : currentStaff?.role;
  const announcements = getActiveAnnouncements(roleForAnnouncements);

  // Get today's checklist status
  const openingChecklist = getTodayChecklist('opening');
  const closingChecklist = getTodayChecklist('closing');

  // Determine which checklist to show based on shift
  const isOpeningShift = currentShift?.startTime && currentShift.startTime < '12:00';
  const isClosingShift = currentShift?.endTime && currentShift.endTime >= '20:00';

  useEffect(() => {
    if (isOpeningShift) setWizardType('morning');
    else if (isClosingShift) setWizardType('night');
    else setWizardType('mid');
  }, [isOpeningShift, isClosingShift]);

  // Get earned achievements
  const earnedAchievements = staffAchievements?.filter(a => a.earnedDate).slice(0, 3) || [];

  // Update time every second for smooth clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate work progress
  const workProgress = useMemo(() => {
    if (!todayAttendance?.clockInTime || !currentShift) return 0;

    const [inH, inM] = todayAttendance.clockInTime.split(':').map(Number);
    const [shiftEndH, shiftEndM] = currentShift.endTime.split(':').map(Number);
    const clockInMinutes = inH * 60 + inM;
    const shiftEndMinutes = shiftEndH * 60 + shiftEndM;
    const totalShiftMinutes = shiftEndMinutes - clockInMinutes;

    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const workedMinutes = now - clockInMinutes;

    if (todayAttendance.clockOutTime) return 100;
    return Math.min(100, Math.max(0, (workedMinutes / totalShiftMinutes) * 100));
  }, [todayAttendance, currentShift, currentTime]);

  // Format worked time
  const workedTime = useMemo(() => {
    if (!todayAttendance?.clockInTime) return '0:00';

    const [inH, inM] = todayAttendance.clockInTime.split(':').map(Number);
    const clockInMinutes = inH * 60 + inM;

    let endMinutes: number;
    if (todayAttendance.clockOutTime) {
      const [outH, outM] = todayAttendance.clockOutTime.split(':').map(Number);
      endMinutes = outH * 60 + outM;
    } else {
      endMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    }

    const workedMinutes = Math.max(0, endMinutes - clockInMinutes);
    const hours = Math.floor(workedMinutes / 60);
    const mins = workedMinutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }, [todayAttendance, currentTime]);

  // Greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Petang';
    return 'Selamat Malam';
  };

  const handleClockIn = () => {
    if (!currentStaff || !staffId) return;
    setVerificationMode('IN');
    setIsVerificationOpen(true);
  };

  const handleClockOut = () => {
    if (!staffId) return;
    setVerificationMode('OUT');
    setIsVerificationOpen(true);
  };

  const handleVerificationSuccess = async (photoBlob: Blob, location: { lat: number; lng: number }) => {
    setIsClocking(true);

    try {
      // Get pin from full staff profile if available (store version has the pin)
      const fullStaff = staff.find(s => s.id === staffId);
      const pin = fullStaff?.pin || '';

      let result;

      if (verificationMode === 'IN') {
        result = await clockIn(staffId, pin, photoBlob, location.lat, location.lng);
      } else {
        // Clock out supports verification data now
        result = await clockOut(staffId, pin, photoBlob, location.lat, location.lng);
      }

      setClockMessage(result.message);
      setTimeout(() => setClockMessage(''), 5000);
    } catch (error) {
      console.error('Verification error:', error);
      setClockMessage('Ralat semasa proses kehadiran.');
    } finally {
      setIsClocking(false);
      setIsVerificationOpen(false);
    }
  };

  if (!isInitialized || !currentStaff) {
    return (
      <StaffLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  const isClockedIn = !!(todayAttendance?.clockInTime && !todayAttendance?.clockOutTime);
  const hasCompletedShift = !!(todayAttendance?.clockInTime && todayAttendance?.clockOutTime);

  return (
    <StaffLayout>
      <div className="staff-portal animate-fade-in">
        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        {/* Mood Check-in */}
        <MoodCheckIn staffId={staffId} staffName={currentStaff.name} />

        {/* Birthday Banner */}
        <BirthdayBanner currentStaffId={staffId} />

        {/* Premium Compact Header - Glassmorphism & Living Gradient */}
        <div className="staff-header glass-panel living-gradient animate-slide-up" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 30px -10px rgba(204, 21, 18, 0.4)' }}>
          <div className="staff-header-content">
            <div className="staff-greeting">
              <div className="staff-info">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>
                  {getGreeting()}, <span style={{ fontWeight: 800 }}>{currentStaff.name.split(' ')[0]}</span>
                </h1>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>

            {/* Compact Status Badge */}
            <div className={`status-pill ${isClockedIn ? 'active' : 'inactive'}`} style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isClockedIn ? '#4ade80' : 'rgba(255,255,255,0.5)',
                boxShadow: isClockedIn ? '0 0 8px #4ade80' : 'none'
              }} />
              <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500 }}>
                {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>
          </div>

          {/* Compact Clock Action Row */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {todayAttendance?.clockInTime && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, color: 'white' }}>MASUK</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{todayAttendance.clockInTime}</div>
                </div>
              )}
              {todayAttendance?.clockOutTime && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, color: 'white' }}>KELUAR</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{todayAttendance.clockOutTime}</div>
                </div>
              )}
              {!todayAttendance?.clockInTime && (
                <div style={{ fontSize: '0.9rem', opacity: 0.9, color: 'white', fontStyle: 'italic' }}>
                  Sedia untuk shift hari ini?
                </div>
              )}
            </div>

            <button
              className={`btn ${isClockedIn ? 'btn-outline-white' : 'btn-white'}`}
              onClick={isClockedIn ? handleClockOut : hasCompletedShift ? undefined : handleClockIn}
              disabled={hasCompletedShift}
              style={{
                borderRadius: '2rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                background: isClockedIn ? 'rgba(255,255,255,0.15)' : 'white',
                color: isClockedIn ? 'white' : 'var(--primary)',
                border: isClockedIn ? '1px solid rgba(255,255,255,0.5)' : 'none'
              }}
            >
              {isClocking ? <LoadingSpinner size="sm" /> : (
                <>
                  <Clock size={18} style={{ marginRight: '0.5rem' }} />
                  {isClockedIn ? 'Clock Out' : hasCompletedShift ? 'Selesai' : 'Clock In'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* XP Bar Widget */}
        {xpData && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden animate-slide-up delay-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <div className="flex justify-between items-center mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <Trophy size={24} className="text-yellow-300 drop-shadow-md" />
                </div>
                <div>
                  <div className="text-xs font-bold opacity-80 tracking-wider">LEVEL {xpData.currentLevel}</div>
                  <div className="font-bold text-lg leading-tight">{currentStaff?.name || 'Staff'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black tracking-tighter drop-shadow-sm">{xpData.currentXP} <span className="text-sm font-normal opacity-70">XP</span></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                style={{ width: `${xpData.progress}%`, transition: 'width 1s ease-out' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs opacity-70 font-mono font-medium relative z-10">
              <span>Curr: {xpData.currentXP}</span>
              <span>Next: {xpData.nextLevelXP} XP</span>
            </div>
          </div>
        )}

        {/* Clock Message */}
        {clockMessage && (
          <div className={`staff-message ${clockMessage.includes('berjaya') ? 'success' : 'error'} animate-slide-up delay-100`} style={{ marginBottom: '1.5rem' }}>
            {clockMessage.includes('berjaya') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {clockMessage}
          </div>
        )}

        {/* --- SECTION 1: DAILY OPERATIONS (High Priority) --- */}
        <div className="animate-slide-up delay-200" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '4px', height: '16px', background: 'var(--primary)', borderRadius: '2px' }}></span>
            Operasi Harian
          </h3>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {/* Checklist Card - Updated to Open Wizard */}
            <div
              onClick={() => setShowWizard(true)}
              className="staff-action-card featured cursor-pointer"
              style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', padding: '1rem', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}
            >
              <div className="staff-action-icon checklist" style={{ marginRight: '1rem' }}>
                <CheckSquare size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="staff-action-label" style={{ fontSize: '1rem' }}>Daily Mission</div>
                <div className="staff-action-sublabel" style={{ color: isOpeningShift && !openingChecklist?.completedAt ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {isOpeningShift ? '☀️ Opening Check' : isClosingShift ? '🌙 Closing Check' : '📋 SOP Harian'}
                  {!openingChecklist?.completedAt && !closingChecklist?.completedAt && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-bold">Pending</span>}
                </div>
              </div>
              <ChevronRight size={20} color="var(--text-light)" />
            </div>

            {/* Schedule Card */}
            <Link href="/staff-portal/schedule" className="staff-action-card">
              <div className="staff-action-icon schedule">
                <Calendar size={22} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div className="staff-action-label">Jadual</div>
                <div className="staff-action-sublabel">Shift minggu ini</div>
              </div>
            </Link>

            {/* Swap Shift */}
            <Link href="/staff-portal/swap-shift" className="staff-action-card">
              <div className="staff-action-icon">
                <ArrowLeftRight size={22} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div className="staff-action-label">Tukar Shift</div>
                <div className="staff-action-sublabel">Request swap</div>
              </div>
            </Link>
          </div>
        </div>

        {/* --- SECTION 2: HR & MANAGEMENT (Secondary) --- */}
        <div className="animate-slide-up delay-300" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '4px', height: '16px', background: 'var(--secondary)', borderRadius: '2px' }}></span>
            Pengurusan Saya
          </h3>

          <div className="grid grid-cols-4" style={{ gap: '0.75rem' }}>
            {/* Leaves */}
            <Link href="/staff-portal/leave" className="staff-action-card compact" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem' }}>
              <div className="staff-action-icon leave" style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}>
                <Plane size={18} />
              </div>
              <div className="staff-action-label" style={{ fontSize: '0.75rem' }}>Cuti</div>
              {pendingLeaveCount > 0 && <span className="notification-dot" />}
            </Link>

            {/* Claims */}
            <Link href="/staff-portal/claims" className="staff-action-card compact" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem' }}>
              <div className="staff-action-icon claims" style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}>
                <DollarSign size={18} />
              </div>
              <div className="staff-action-label" style={{ fontSize: '0.75rem' }}>Tuntutan</div>
            </Link>

            {/* Payslip */}
            <Link href="/staff-portal/payslip" className="staff-action-card compact" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem' }}>
              <div className="staff-action-icon" style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}>
                <Receipt size={18} />
              </div>
              <div className="staff-action-label" style={{ fontSize: '0.75rem' }}>Payslip</div>
            </Link>

            {/* Requests (Lain-lain / OT) */}
            <Link href="/staff-portal/requests" className="staff-action-card compact" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem' }}>
              <div className="staff-action-icon requests" style={{ width: '40px', height: '40px', marginBottom: '0.5rem', background: 'var(--blue-100)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                <FileText size={18} />
              </div>
              <div className="staff-action-label" style={{ fontSize: '0.75rem' }}>Lain-lain</div>
              {pendingRequestCount > 0 && <span className="notification-dot" />}
            </Link>

            {/* Profile */}
            <Link href="/staff-portal/profile" className="staff-action-card compact" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem' }}>
              <div className="staff-action-icon profile" style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}>
                <User size={18} />
              </div>
              <div className="staff-action-label" style={{ fontSize: '0.75rem' }}>Profil</div>
            </Link>
          </div>
        </div>

        {/* Team Today Widget */}
        <div className="animate-slide-up delay-400">
          <TeamTodayWidget currentStaffId={staffId} />

          {/* Recent Achievements */}
          {earnedAchievements.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                <div className="card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={18} color="var(--secondary)" />
                  Pencapaian Terkini
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {earnedAchievements.map(achievement => (
                  <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
                ))}
              </div>
              <Link href="/staff-portal/profile" className="team-today-link" style={{ marginTop: '0.5rem' }}>
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>


        {/* Announcements Section */}
        {announcements && announcements.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={20} color="var(--primary)" />
                Pengumuman
              </div>
            </div>
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {announcements.map(ann => (
                <div
                  key={ann.id}
                  className={`staff-announcement ${ann.priority === 'high' ? 'high-priority' : ''}`}
                >
                  <div className="staff-announcement-header">
                    <div className="announcement-icon">
                      <Megaphone size={16} />
                    </div>
                    <div className="staff-announcement-title">{ann.title}</div>
                  </div>
                  <div className="staff-announcement-message">{ann.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave Balance & Pending Requests */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Leave Balance */}
          {leaveBalance && leaveBalance.annual && (
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plane size={20} color="var(--success)" />
                  Baki Cuti {new Date().getFullYear()}
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <LeaveBalanceRing
                  balance={leaveBalance.annual.balance}
                  total={leaveBalance.annual.entitled}
                  type="annual"
                  label="Tahunan"
                />
                <LeaveBalanceRing
                  balance={leaveBalance.medical?.balance || 0}
                  total={leaveBalance.medical?.entitled || 0}
                  type="medical"
                  label="Sakit"
                />
                <LeaveBalanceRing
                  balance={leaveBalance.emergency?.balance || 0}
                  total={leaveBalance.emergency?.entitled || 0}
                  type="emergency"
                  label="Kecemasan"
                />
                <LeaveBalanceRing
                  balance={leaveBalance.unpaid?.taken || 0}
                  total={5}
                  type="unpaid"
                  label="Tanpa Gaji"
                />
              </div>

              <Link href="/staff-portal/leave" className="btn btn-outline btn-sm" style={{ marginTop: '1rem', width: '100%' }}>
                Mohon Cuti <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Pending Requests */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} color="var(--warning)" />
                Status Permohonan
              </div>
              <div className="card-subtitle">{totalPending} menunggu kelulusan</div>
            </div>

            {totalPending > 0 ? (
              <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leaveRequests && leaveRequests.filter(r => r.status === 'pending').slice(0, 3).map(req => (
                  <div key={req.id} className="staff-info-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {getLeaveTypeLabel(req.type)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {req.startDate} - {req.endDate}
                      </div>
                    </div>
                    <span className={`badge badge-${getStatusColor(req.status)}`} style={{ fontSize: '0.7rem' }}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                ))}

                {pendingClaimCount > 0 && (
                  <div className="staff-info-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Tuntutan</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {pendingClaimCount} pending
                      </div>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Menunggu</span>
                  </div>
                )}

                <Link href="/staff-portal/leave" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
                  Lihat Semua <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                <div>Tiada permohonan pending</div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Button */}
        <FeedbackButton onClick={() => setShowFeedbackModal(true)} />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          staffName={currentStaff.name}
        />

        {/* Verification Wizard */}
        <VerificationWizard
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          onSuccess={handleVerificationSuccess}
          staffName={currentStaff.name}
        />

        {/* SOP Wizard Modal */}
        <AnimatePresence>
          {showWizard && (
            <SOPWizard
              shiftType={wizardType}
              staffId={staffId}
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation for Mobile */}
        <StaffPortalNav currentPage="home" pendingCount={totalPending} />
      </div>
    </StaffLayout>
  );
}
