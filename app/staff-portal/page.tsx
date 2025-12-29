'use client';

import { useState, useEffect, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Clock,
  CheckSquare,
  Calendar,
  Plane,
  DollarSign,
  User,
  CheckCircle,
  ArrowLeftRight,
  Receipt,
  ChevronRight,
  AlertCircle,
  Wrench,
  Package,
  Bell,
  Timer,
  Trophy,
  Banknote
} from 'lucide-react';
import VerificationWizard from '@/components/VerificationWizard';
import SOPWizard from '@/components/staff/SOPWizard';
import { AnimatePresence } from 'framer-motion';
import { getStaffXP, StaffXP } from '@/lib/gamification';
import { useSOPLogsRealtime, useStaffXPRealtime } from '@/lib/supabase/realtime-hooks';

export default function StaffPortalV2() {
  const router = useRouter();
  const { currentStaff: authStaff, isStaffLoggedIn, user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isStaffLoggedIn && !user) {
      router.push('/login');
    }
  }, [isStaffLoggedIn, user, router]);

  const { staff, getStaffAttendanceToday, clockIn, clockOut, isInitialized } = useStaff();
  const {
    getLeaveBalance,
    getStaffLeaveRequests,
    getStaffClaimRequests,
    getStaffSalaryAdvances,
    getTodayChecklist,
    schedules,
    shifts,
    refreshChecklistCompletions,
  } = useStaffPortal();

  const [isClocking, setIsClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'IN' | 'OUT'>('IN');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<'morning' | 'mid' | 'night'>('morning');
  const [xpData, setXPData] = useState<StaffXP | null>(null);

  const staffId = authStaff?.id || user?.id || '';
  const currentStaff = staff.find(s => s.id === staffId) || (authStaff ? {
    id: authStaff.id,
    name: authStaff.name,
    role: authStaff.role,
    email: authStaff.email || '',
    status: authStaff.status,
    profilePhotoUrl: undefined,
  } : null);

  const todayAttendance = staffId ? getStaffAttendanceToday(staffId) : undefined;

  useEffect(() => {
    if (staffId) {
      getStaffXP(staffId).then(setXPData);
    }
  }, [staffId, showWizard]);

  useSOPLogsRealtime(() => refreshChecklistCompletions());
  useStaffXPRealtime((payload) => {
    if (staffId && (payload.new.staff_id === staffId || payload.old.staff_id === staffId)) {
      getStaffXP(staffId).then(setXPData);
    }
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = useMemo(() => {
    if (!staffId) return null;
    return schedules.find(s => s.staffId === staffId && s.date === today);
  }, [schedules, today, staffId]);

  const currentShift = useMemo(() => {
    if (!todaySchedule) return null;
    return shifts.find(s => s.id === todaySchedule.shiftId);
  }, [todaySchedule, shifts]);

  const leaveBalance = getLeaveBalance(staffId);
  const leaveRequests = getStaffLeaveRequests(staffId);
  const claimRequests = getStaffClaimRequests(staffId);
  const salaryAdvances = getStaffSalaryAdvances(staffId);
  const pendingLeaveCount = leaveRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingClaimCount = claimRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingAdvanceCount = salaryAdvances?.filter(a => a.status === 'pending').length || 0;
  const totalPending = pendingLeaveCount + pendingClaimCount + pendingAdvanceCount;

  const openingChecklist = getTodayChecklist('opening');
  const closingChecklist = getTodayChecklist('closing');
  const isOpeningShift = currentShift?.startTime && currentShift.startTime < '12:00';
  const isClosingShift = currentShift?.endTime && currentShift.endTime >= '20:00';

  useEffect(() => {
    if (isOpeningShift) setWizardType('morning');
    else if (isClosingShift) setWizardType('night');
    else setWizardType('mid');
  }, [isOpeningShift, isClosingShift]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('greetings.morning');
    if (hour < 18) return t('greetings.afternoon');
    return t('greetings.evening');
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
      const fullStaff = staff.find(s => s.id === staffId);
      const pin = fullStaff?.pin || '';
      let result;
      if (verificationMode === 'IN') {
        result = await clockIn(staffId, pin, photoBlob, location.lat, location.lng);
      } else {
        result = await clockOut(staffId, pin, photoBlob, location.lat, location.lng);
      }
      setClockMessage(result.message);
      setTimeout(() => setClockMessage(''), 5000);
    } catch (error) {
      setClockMessage('Ralat semasa proses kehadiran.');
    } finally {
      setIsClocking(false);
      setIsVerificationOpen(false);
    }
  };

  if (!isInitialized || !currentStaff) {
    return (
      <StaffLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  const isClockedIn = !!(todayAttendance?.clockInTime && !todayAttendance?.clockOutTime);
  const hasCompletedShift = !!(todayAttendance?.clockInTime && todayAttendance?.clockOutTime);

  // Calculate checklist progress
  const checklistTotal = 12; // Example: 12 total tasks
  const checklistCompleted = openingChecklist?.completedAt ? 12 : closingChecklist?.completedAt ? 12 : 0;
  const checklistProgress = Math.round((checklistCompleted / checklistTotal) * 100);

  return (
    <StaffLayout>
      <div style={{
        background: 'var(--bg-secondary)',
        minHeight: '100vh',
        padding: '1rem',
        paddingBottom: '5rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start', // Align tp top
          marginBottom: '1.5rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {getGreeting()}, {currentStaff.name.split(' ')[0]}!
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <button
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <Bell size={20} color="var(--text-secondary)" />
            {totalPending > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--primary)',
                color: 'var(--text-inverse)',
                fontSize: '0.65rem',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>{totalPending}</span>
            )}
          </button>
        </div>

        {/* Clock-In Card */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Shift: {currentShift?.name || 'Tiada Shift'} {currentShift ? `(${currentShift.startTime} - ${currentShift.endTime})` : ''}
              </div>
            </div>
            <button
              onClick={isClockedIn ? handleClockOut : hasCompletedShift ? undefined : handleClockIn}
              disabled={hasCompletedShift || isClocking}
              style={{
                background: hasCompletedShift ? 'var(--gray-400)' : isClockedIn ? 'var(--warning-light)' : 'var(--primary)',
                color: hasCompletedShift ? 'var(--text-inverse)' : isClockedIn ? 'var(--warning-dark)' : 'var(--text-inverse)',
                border: isClockedIn ? '2px solid var(--warning)' : 'none',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: hasCompletedShift ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isClocking ? <LoadingSpinner size="sm" /> : <Clock size={20} />}
              {isClockedIn ? 'Clock Out' : hasCompletedShift ? 'Selesai ✓' : 'Clock In'}
            </button>
          </div>
          {todayAttendance?.clockInTime && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '2rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Masuk</div>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{todayAttendance.clockInTime}</div>
              </div>
              {todayAttendance.clockOutTime && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Keluar</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{todayAttendance.clockOutTime}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clock Message */}
        {clockMessage && (
          <div style={{
            background: clockMessage.includes('berjaya') ? 'var(--success-light)' : 'var(--danger-light)',
            color: clockMessage.includes('berjaya') ? 'var(--success-dark)' : 'var(--danger-dark)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {clockMessage.includes('berjaya') ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {clockMessage}
          </div>
        )}

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '1rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          scrollSnapType: 'x mandatory'
        }}>
          <div style={{ minWidth: '120px', flex: '0 0 auto', scrollSnapAlign: 'start', background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hari Ini</div>
            <div style={{ fontWeight: 800, color: todayAttendance?.clockInTime ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {todayAttendance?.clockInTime ? '✓ HADIR' : '—'}
            </div>
          </div>
          <div style={{ minWidth: '120px', flex: '0 0 auto', scrollSnapAlign: 'start', background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>⭐ {xpData?.currentLevel || 1}</div>
          </div>
          <div style={{ minWidth: '120px', flex: '0 0 auto', scrollSnapAlign: 'start', background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>XP</div>
            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{xpData?.currentXP || 0}</div>
          </div>
        </div>

        {/* Checklist Card with Progress */}
        <div
          onClick={() => setShowWizard(true)}
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'var(--warning-light)',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckSquare size={20} color="var(--warning)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Checklist Shift</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {isOpeningShift ? '☀️ Opening' : isClosingShift ? '🌙 Closing' : '📋 Harian'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {checklistCompleted === 0 && (
                <span style={{
                  background: 'var(--danger-light)',
                  color: 'var(--primary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>Pending</span>
              )}
              <ChevronRight size={20} color="var(--text-light)" />
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{checklistCompleted}/{checklistTotal} selesai</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{checklistProgress}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${checklistProgress}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Task Preview */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {checklistCompleted === 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--border-color)', borderRadius: '3px' }} /> Bersihkan meja
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--border-color)', borderRadius: '3px' }} /> Cek suhu fridge
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--border-color)', borderRadius: '3px' }} /> Susun display
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} /> Semua tugas selesai!
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - 2 rows x 4 buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {/* Row 1 */}
          <Link href="/staff-portal/schedule" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Calendar size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Jadual</div>
            </div>
          </Link>

          <Link href="/staff-portal/leave" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Plane size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cuti</div>
              {pendingLeaveCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', border: '2px solid white' }} />}
            </div>
          </Link>

          <Link href="/staff-portal/claims" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <DollarSign size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Claim</div>
            </div>
          </Link>

          <Link href="/staff-portal/ot-claim" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Timer size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>OT</div>
            </div>
          </Link>

          {/* Row 2 */}
          <Link href="/staff-portal/payslip" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Receipt size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Gaji</div>
            </div>
          </Link>

          <Link href="/staff-portal/swap-shift" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <ArrowLeftRight size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Swap</div>
            </div>
          </Link>

          <Link href="/staff-portal/salary-advance" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Banknote size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Advance</div>
            </div>
          </Link>

          <Link href="/equipment" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Wrench size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Issue</div>
            </div>
          </Link>

          <Link href="/inventory" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: 'var(--primary-50)', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Package size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Stock</div>
            </div>
          </Link>
        </div>

        {/* 1. Leave Balance Widget */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Plane size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Baki Cuti</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.75rem' }}>
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{leaveBalance?.annual?.balance ?? 0}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Annual</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{leaveBalance?.medical?.balance ?? 0}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>MC</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{leaveBalance?.emergency?.balance ?? 0}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>EL</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{leaveBalance?.compassionate?.balance ?? 0}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Ehsan</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{leaveBalance?.unpaid?.taken ?? 0}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Unpaid</div>
            </div>
          </div>
        </div>

        {/* 2. Pending Requests Widget */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Permohonan</span>
            </div>
            <span style={{
              background: totalPending > 0 ? 'var(--primary-50)' : 'var(--success-light)',
              color: totalPending > 0 ? 'var(--primary)' : 'var(--success-dark)',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              border: totalPending > 0 ? '1px solid var(--primary-100)' : 'none'
            }}>
              {totalPending > 0 ? `${totalPending} Pending` : 'Tiada pending'}
            </span>
          </div>
          {leaveRequests && leaveRequests.filter(r => r.status === 'pending').slice(0, 2).map((req, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Plane size={14} color="var(--primary)" />
                <span style={{ fontWeight: 500 }}>{req.type === 'annual' ? 'Cuti Tahunan' : req.type === 'medical' ? 'MC' : 'Cuti'}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Processing...</span>
            </div>
          ))}
          {pendingClaimCount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DollarSign size={14} color="var(--primary)" />
                <span style={{ fontWeight: 500 }}>Tuntutan ({pendingClaimCount})</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Processing...</span>
            </div>
          )}
          {pendingAdvanceCount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Banknote size={14} color="var(--primary)" />
                <span style={{ fontWeight: 500 }}>Advance ({pendingAdvanceCount})</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Processing...</span>
            </div>
          )}
          {totalPending === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem', padding: '0.5rem 0' }}>
              Semua permohonan telah dikemaskini.
            </div>
          )}
        </div>

        {/* 3. Next Shift Widget */}
        {(() => {
          // Find next scheduled shift
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          const nextSchedule = schedules.find(s => s.staffId === staffId && s.date >= tomorrowStr);
          const nextShift = nextSchedule ? shifts.find(sh => sh.id === nextSchedule.shiftId) : null;

          return (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Calendar size={18} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Shift Seterusnya</span>
              </div>
              {nextSchedule && nextShift ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{nextShift.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{nextShift.startTime} - {nextShift.endTime}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                      {new Date(nextSchedule.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  Tiada shift dijadualkan
                </div>
              )}
            </div>
          );
        })()}

        {/* 4. OT Record Widget */}
        {(() => {
          const monthlyOTMinutes = 0; // TODO: Fetch from attendance records
          const otHours = Math.floor(monthlyOTMinutes / 60);
          const otMins = monthlyOTMinutes % 60;

          return (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Timer size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>OT Bulan Ini</span>
                </div>
                <div style={{
                  background: 'var(--primary-50)',
                  color: 'var(--primary)',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  border: '1px solid var(--primary-100)'
                }}>
                  {otHours}j {otMins}m
                </div>
              </div>
            </div>
          );
        })()}

        {/* XP Progress Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '10px' }}>
              <Trophy size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Level {xpData?.currentLevel || 1}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{xpData?.currentXP || 0} / {xpData?.nextLevelXP || 500} XP</div>
            </div>
          </div>
          <div style={{ width: '100px', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ width: `${xpData?.progress || 0}%`, height: '100%', background: 'var(--primary)' }} />
          </div>
        </div>

        {/* Profile Link */}
        <Link href="/staff-portal/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {currentStaff.profilePhotoUrl ? (
                <img
                  src={currentStaff.profilePhotoUrl}
                  alt={currentStaff.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
              ) : (
                <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-secondary)" />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{currentStaff.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentStaff.role}</div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--text-light)" />
          </div>
        </Link>

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
              onComplete={() => setShowWizard(false)}
              onCancel={() => setShowWizard(false)}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation is now in StaffLayout */}
      </div>
    </StaffLayout>
  );
}
