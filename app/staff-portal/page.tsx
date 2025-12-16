'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getLeaveTypeLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Link from 'next/link';
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
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
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
  // Get current logged-in staff from AuthContext
  const { currentStaff: authStaff, isStaffLoggedIn, user } = useAuth();

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
  } = useStaffPortal();

  const [isClocking, setIsClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  // Get earned achievements
  const earnedAchievements = staffAchievements.filter(a => a.earnedDate).slice(0, 3);

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

  const handleClockIn = async () => {
    if (!currentStaff || !staffId) return;
    setIsClocking(true);
    // Get pin from full staff profile if available
    const fullStaff = staff.find(s => s.id === staffId);
    const pin = fullStaff?.pin || '';
    const result = clockIn(staffId, pin);
    setClockMessage(result.message);
    setTimeout(() => setClockMessage(''), 3000);
    setIsClocking(false);
  };

  const handleClockOut = async () => {
    if (!staffId) return;
    setIsClocking(true);
    const result = clockOut(staffId);
    setClockMessage(result.message);
    setTimeout(() => setClockMessage(''), 3000);
    setIsClocking(false);
  };

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const isClockedIn = !!(todayAttendance?.clockInTime && !todayAttendance?.clockOutTime);
  const hasCompletedShift = !!(todayAttendance?.clockInTime && todayAttendance?.clockOutTime);

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        {/* Mood Check-in */}
        <MoodCheckIn staffId={staffId} staffName={currentStaff.name} />

        {/* Birthday Banner */}
        <BirthdayBanner currentStaffId={staffId} />

        {/* Header Section */}
        <div className="staff-header" style={{ marginBottom: '1.5rem' }}>
          <div className="staff-header-content">
            <div className="staff-greeting">
              <div className="staff-avatar staff-avatar-lg">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="staff-info">
                <h1>
                  {getGreeting()}, {currentStaff.name.split(' ')[0]}!
                  <span className="wave-emoji">👋</span>
                </h1>
                {currentShift ? (
                  <div className="staff-shift-badge">
                    <span className="pulse-dot"></span>
                    {isOpeningShift ? <Sun size={16} /> : <Moon size={16} />}
                    <span>Shift {currentShift.name}: {currentShift.startTime} - {currentShift.endTime}</span>
                  </div>
                ) : (
                  <div className="staff-shift-badge" style={{ opacity: 0.7 }}>
                    Tiada jadual hari ini
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <NotificationCenter />
              <EmergencySOS />
              <div className="staff-time-display">
                <div className="staff-time">
                  {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="staff-date">
                  {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clock Message */}
        {clockMessage && (
          <div className={`staff-message ${clockMessage.includes('berjaya') ? 'success' : 'error'}`} style={{ marginBottom: '1rem' }}>
            {clockMessage.includes('berjaya') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {clockMessage}
          </div>
        )}

        {/* Clock Widget, Quick Actions & Team Today Row */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Clock In/Out Widget */}
          <div className={`staff-clock-widget ${isClockedIn ? 'clocked-in' : hasCompletedShift ? 'completed' : 'clocked-out'}`}>
            <CircularProgress progress={workProgress}>
              <div className="clock-progress-time">{workedTime}</div>
              <div className="clock-progress-label">jam kerja</div>
            </CircularProgress>

            {isClocking ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <button
                className={`staff-clock-btn ${isClockedIn ? 'clock-out' : hasCompletedShift ? 'completed' : 'clock-in'}`}
                onClick={isClockedIn ? handleClockOut : hasCompletedShift ? undefined : handleClockIn}
                disabled={hasCompletedShift}
              >
                <Clock size={22} />
                {isClockedIn ? 'Clock Out' : hasCompletedShift ? 'Shift Selesai' : 'Clock In'}
              </button>
            )}

            {todayAttendance?.clockInTime && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Masuk: {todayAttendance.clockInTime}
                {todayAttendance.clockOutTime && ` • Keluar: ${todayAttendance.clockOutTime}`}
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="staff-action-grid" style={{ gridColumn: 'span 2' }}>
            {/* Checklist Card */}
            <Link href="/staff-portal/checklist" className="staff-action-card">
              <div className="staff-action-icon checklist">
                <CheckSquare size={24} />
              </div>
              <div>
                <div className="staff-action-label">Checklist</div>
                <div className="staff-action-sublabel">
                  {isOpeningShift && !openingChecklist?.completedAt && 'Opening belum siap'}
                  {isOpeningShift && openingChecklist?.completedAt && 'Selesai ✓'}
                  {isClosingShift && !closingChecklist?.completedAt && 'Closing belum siap'}
                  {isClosingShift && closingChecklist?.completedAt && 'Selesai ✓'}
                  {!isOpeningShift && !isClosingShift && 'Lihat checklist'}
                </div>
              </div>
            </Link>

            {/* Schedule Card */}
            <Link href="/staff-portal/schedule" className="staff-action-card">
              <div className="staff-action-icon schedule">
                <Calendar size={24} />
              </div>
              <div>
                <div className="staff-action-label">Jadual</div>
                <div className="staff-action-sublabel">Lihat timetable</div>
              </div>
            </Link>

            {/* Leave Card */}
            <Link href="/staff-portal/leave" className="staff-action-card">
              <div className="staff-action-icon leave">
                <Plane size={24} />
              </div>
              <div>
                <div className="staff-action-label">Cuti</div>
                <div className="staff-action-sublabel">Baki: {leaveBalance?.annual.balance || 0} hari</div>
              </div>
              {pendingLeaveCount > 0 && (
                <span className="staff-action-badge">{pendingLeaveCount}</span>
              )}
            </Link>

            {/* Claims Card */}
            <Link href="/staff-portal/claims" className="staff-action-card">
              <div className="staff-action-icon claims">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="staff-action-label">Tuntutan</div>
                <div className="staff-action-sublabel">Submit claim</div>
              </div>
              {pendingClaimCount > 0 && (
                <span className="staff-action-badge">{pendingClaimCount}</span>
              )}
            </Link>

            {/* Payslip Card */}
            <Link href="/staff-portal/payslip" className="staff-action-card">
              <div className="staff-action-icon requests">
                <Receipt size={24} />
              </div>
              <div>
                <div className="staff-action-label">Slip Gaji</div>
                <div className="staff-action-sublabel">Lihat payslip</div>
              </div>
            </Link>

            {/* Swap Shift Card */}
            <Link href="/staff-portal/swap-shift" className="staff-action-card">
              <div className="staff-action-icon profile">
                <ArrowLeftRight size={24} />
              </div>
              <div>
                <div className="staff-action-label">Tukar Shift</div>
                <div className="staff-action-sublabel">Swap dengan rakan</div>
              </div>
            </Link>

            {/* Training Card */}
            <Link href="/staff-portal/training" className="staff-action-card">
              <div className="staff-action-icon kpi">
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="staff-action-label">Latihan</div>
                <div className="staff-action-sublabel">Kursus & sijil</div>
              </div>
            </Link>

            {/* Profile Card */}
            <Link href="/staff-portal/profile" className="staff-action-card">
              <div className="staff-action-icon profile">
                <User size={24} />
              </div>
              <div>
                <div className="staff-action-label">Profil</div>
                <div className="staff-action-sublabel">Maklumat saya</div>
              </div>
            </Link>
          </div>

          {/* Team Today Widget */}
          <div>
            <TeamTodayWidget currentStaffId={staffId} />

            {/* Recent Achievements */}
            {earnedAchievements.length > 0 && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                  <div className="card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={18} color="#f59e0b" />
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
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={20} color="var(--warning)" />
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
                {leaveRequests.filter(r => r.status === 'pending').slice(0, 3).map(req => (
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

        {/* Bottom Navigation for Mobile */}
        <StaffPortalNav currentPage="home" pendingCount={totalPending} />
      </div>
    </MainLayout>
  );
}
