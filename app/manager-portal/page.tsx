'use client';

import { useState, useEffect, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff, useOrderHistory } from '@/lib/store';
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
    Trophy,
    Users,
    LayoutDashboard,
    BarChart3,
    Monitor,
    History
} from 'lucide-react';
import ManagerPortalNav from '@/components/ManagerPortalNav';
import VerificationWizard from '@/components/VerificationWizard';
import SOPWizard from '@/components/staff/SOPWizard';
import { AnimatePresence } from 'framer-motion';
import { getStaffXP, StaffXP } from '@/lib/gamification';
import { useSOPLogsRealtime, useStaffXPRealtime } from '@/lib/supabase/realtime-hooks';

export default function ManagerPortalPage() {
    const router = useRouter();
    const { currentStaff: authStaff, isStaffLoggedIn, user } = useAuth();
    const userRole = user?.role || authStaff?.role;


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
        getTodayChecklist,
        getPendingLeaveRequests,
        getPendingClaimRequests,
        getPendingOTClaims,
        getPendingSalaryAdvances,
        schedules,
        shifts,
        refreshChecklistCompletions,
    } = useStaffPortal();
    const { getPendingVoidRefundCount } = useOrderHistory();

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

    const leaveRequests = getStaffLeaveRequests(staffId);
    const claimRequests = getStaffClaimRequests(staffId);
    const pendingLeaveCountPriv = leaveRequests?.filter(r => r.status === 'pending').length || 0;
    const pendingClaimCountPriv = claimRequests?.filter(r => r.status === 'pending').length || 0;

    // Management counts
    const pendingLeaves = getPendingLeaveRequests().length;
    const pendingClaims = getPendingClaimRequests().length;
    const pendingOT = getPendingOTClaims().length;
    const pendingSalary = getPendingSalaryAdvances().length;
    const pendingVoids = getPendingVoidRefundCount();
    const totalManagementPending = pendingLeaves + pendingClaims + pendingOT + pendingSalary + pendingVoids;

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

    return (
        <StaffLayout>
            <div style={{
                background: '#f9fafb',
                minHeight: '100vh',
                padding: '1rem',
                paddingBottom: '6rem'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.15rem' }}>
                            {getGreeting()}, {currentStaff.name.split(' ')[0]}!
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <Bell size={18} color="#6b7280" />
                            {totalManagementPending > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    background: '#dc2626',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700
                                }}>{totalManagementPending}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Section: Personal Portal */}
                <div style={{ marginBottom: '1.5rem' }}>
                    {/* Clock-In Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        marginBottom: '0.75rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>
                                    {currentTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    Shift: {currentShift?.name || 'Tiada Shift'}
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
                                    padding: '0.75rem 1.25rem',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: hasCompletedShift ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isClocking ? <LoadingSpinner size="sm" /> : <Clock size={18} />}
                                {isClockedIn ? 'Clock Out' : hasCompletedShift ? 'Done ✓' : 'Clock In'}
                            </button>
                        </div>
                    </div>

                    {/* SOP Checklist Button */}
                    <div
                        onClick={() => setShowWizard(true)}
                        style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#fef3c7', padding: '0.4rem', borderRadius: '8px' }}>
                                <CheckSquare size={16} color="#d97706" />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>SOP Checklist</span>
                        </div>
                        <ChevronRight size={16} color="#9ca3af" />
                    </div>
                </div>

                {/* Section Header: Team Management */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    marginTop: '1.5rem'
                }}>
                    <Users size={18} color="#CC1512" />
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Pengurusan Pasukan</h2>
                </div>

                {/* Management Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    {/* Item 1: Approvals */}
                    <Link href="/hr/approvals" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            padding: '1.25rem 1rem',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            position: 'relative',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                background: '#fee2e2',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <CheckCircle size={18} color="#dc2626" />
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Kelulusan</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Staff Requests</div>
                            {totalManagementPending > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: '#dc2626',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    fontWeight: 700
                                }}>{totalManagementPending}</span>
                            )}
                        </div>
                    </Link>

                    {/* Item 2: Team Status */}
                    <Link href="/hr" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            padding: '1.25rem 1rem',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                background: '#dcfce7',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <Users size={18} color="#059669" />
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Status Team</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Siapa bertugas?</div>
                        </div>
                    </Link>

                    {/* Item 3: Inventory */}
                    <Link href="/inventory" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            padding: '1.25rem 1rem',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                background: '#dbeafe',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <Package size={18} color="#2563eb" />
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Inventori</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Semak stok</div>
                        </div>
                    </Link>

                    {/* Item 4: Finance */}
                    <Link href="/finance" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            padding: '1.25rem 1rem',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                background: '#fef3c7',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <DollarSign size={18} color="#d97706" />
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Kewangan</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Jualan & Belanja</div>
                        </div>
                    </Link>
                </div>

                {/* Section Header: Reports / Stats */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <BarChart3 size={18} color="#CC1512" />
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Ringkasan Operasi</h2>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Jualan Hari Ini</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>BND 0.00</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>+0% vs semalam</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Staff Hadir</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>0 / 0</div>
                        </div>
                        <Link href="/hr" style={{ fontSize: '0.75rem', color: '#CC1512', fontWeight: 600, textDecoration: 'none' }}>
                            Lihat Semua →
                        </Link>
                    </div>
                </div>

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
                <ManagerPortalNav currentPage="home" pendingCount={totalManagementPending} />
            </div>
        </StaffLayout>
    );
}
