'use client';

import { useState, useEffect, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
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
  Trophy
} from 'lucide-react';
import StaffPortalNav from '@/components/StaffPortalNav';
import VerificationWizard from '@/components/VerificationWizard';
import SOPWizard from '@/components/staff/SOPWizard';
import { AnimatePresence } from 'framer-motion';
import { getStaffXP, StaffXP } from '@/lib/gamification';
import { useSOPLogsRealtime, useStaffXPRealtime } from '@/lib/supabase/realtime-hooks';

export default function StaffPortalV2() {
  const router = useRouter();
  const { currentStaff: authStaff, isStaffLoggedIn, user } = useAuth();

  useEffect(() => {
    if (!isStaffLoggedIn && !user) {
      router.push('/staff-login');
    }
  }, [isStaffLoggedIn, user, router]);

  const { staff, getStaffAttendanceToday, clockIn, clockOut, isInitialized } = useStaff();
  const {
    getLeaveBalance,
    getStaffLeaveRequests,
    getStaffClaimRequests,
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
  const pendingLeaveCount = leaveRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingClaimCount = claimRequests?.filter(r => r.status === 'pending').length || 0;
  const totalPending = pendingLeaveCount + pendingClaimCount;

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
        background: '#f9fafb',
        minHeight: '100vh',
        padding: '1rem',
        paddingBottom: '5rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
              {getGreeting()}, {currentStaff.name.split(' ')[0]}!
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={20} color="#6b7280" />
            {totalPending > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: 'white',
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
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937' }}>
                {currentTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Shift: {currentShift?.name || 'Tiada Shift'} {currentShift ? `(${currentShift.startTime} - ${currentShift.endTime})` : ''}
              </div>
            </div>
            <button
              onClick={isClockedIn ? handleClockOut : hasCompletedShift ? undefined : handleClockIn}
              disabled={hasCompletedShift || isClocking}
              style={{
                background: hasCompletedShift ? '#9ca3af' : isClockedIn ? '#fef3c7' : '#dc2626',
                color: hasCompletedShift ? 'white' : isClockedIn ? '#92400e' : 'white',
                border: isClockedIn ? '2px solid #f59e0b' : 'none',
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
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '2rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Masuk</div>
                <div style={{ fontWeight: 600, color: '#059669' }}>{todayAttendance.clockInTime}</div>
              </div>
              {todayAttendance.clockOutTime && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Keluar</div>
                  <div style={{ fontWeight: 600, color: '#dc2626' }}>{todayAttendance.clockOutTime}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clock Message */}
        {clockMessage && (
          <div style={{
            background: clockMessage.includes('berjaya') ? '#d1fae5' : '#fee2e2',
            color: clockMessage.includes('berjaya') ? '#065f46' : '#991b1b',
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
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Hari Ini</div>
            <div style={{ fontWeight: 700, color: todayAttendance?.clockInTime ? '#059669' : '#6b7280', fontSize: '0.9rem' }}>
              {todayAttendance?.clockInTime ? '✓ On Time' : '—'}
            </div>
          </div>
          <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Level</div>
            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>⭐ Lv.{xpData?.currentLevel || 1}</div>
          </div>
          <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>XP</div>
            <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>{xpData?.currentXP || 0}</div>
          </div>
        </div>

        {/* Checklist Card with Progress */}
        <div
          onClick={() => setShowWizard(true)}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: '#fef3c7',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckSquare size={20} color="#d97706" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>Checklist Shift</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {isOpeningShift ? '☀️ Opening' : isClosingShift ? '🌙 Closing' : '📋 Harian'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {checklistCompleted === 0 && (
                <span style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>Pending</span>
              )}
              <ChevronRight size={20} color="#9ca3af" />
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{checklistCompleted}/{checklistTotal} selesai</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: checklistProgress === 100 ? '#059669' : '#d97706' }}>{checklistProgress}%</span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${checklistProgress}%`,
                height: '100%',
                background: checklistProgress === 100 ? '#059669' : '#f59e0b',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Task Preview */}
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {checklistCompleted === 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>☐ Bersihkan meja</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>☐ Cek suhu fridge</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>☐ Susun display</div>
              </>
            ) : (
              <div style={{ color: '#059669', fontWeight: 500 }}>✓ Semua tugas selesai!</div>
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
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#dbeafe', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Calendar size={20} color="#2563eb" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Jadual</div>
            </div>
          </Link>

          <Link href="/staff-portal/leave" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', position: 'relative' }}>
              <div style={{ background: '#d1fae5', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Plane size={20} color="#059669" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Cuti</div>
              {pendingLeaveCount > 0 && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }} />}
            </div>
          </Link>

          <Link href="/staff-portal/claims" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#fef3c7', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <DollarSign size={20} color="#d97706" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Claim</div>
            </div>
          </Link>

          <Link href="/staff-portal/ot-claim" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#ede9fe', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Timer size={20} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>OT</div>
            </div>
          </Link>

          {/* Row 2 */}
          <Link href="/staff-portal/payslip" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#fee2e2', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Receipt size={20} color="#dc2626" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Gaji</div>
            </div>
          </Link>

          <Link href="/staff-portal/swap-shift" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#fce7f3', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <ArrowLeftRight size={20} color="#db2777" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Swap</div>
            </div>
          </Link>

          <Link href="/equipment" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#fef3c7', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Wrench size={20} color="#d97706" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Issue</div>
            </div>
          </Link>

          <Link href="/inventory" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ background: '#dbeafe', margin: '0 auto', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Package size={20} color="#2563eb" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1f2937' }}>Stock</div>
            </div>
          </Link>
        </div>

        {/* Performance / Leave Balance Mini Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={24} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>Level {xpData?.currentLevel || 1}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{xpData?.currentXP || 0} / {xpData?.nextLevelXP || 500} XP</div>
            </div>
          </div>
          <div style={{ width: '100px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${xpData?.progress || 0}%`, height: '100%', background: '#f59e0b' }} />
          </div>
        </div>

        {/* Profile Link */}
        <Link href="/staff-portal/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#6b7280" />
              </div>
              <div>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{currentStaff.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{currentStaff.role}</div>
              </div>
            </div>
            <ChevronRight size={20} color="#9ca3af" />
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

        {/* Bottom Navigation */}
        <StaffPortalNav currentPage="home" pendingCount={totalPending} />
      </div>
    </StaffLayout>
  );
}
