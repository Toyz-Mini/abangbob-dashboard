'use client';

import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff, useKPI } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  ArrowLeft,
  Phone,
  DollarSign,
  Calendar,
  Award,
  Clock,
  TrendingUp,
  CreditCard,
  Shield,
  AlertCircle,
  Star,
  Users,
  Briefcase,
  Mail,
  MapPin,
  Heart,
  FileText,
  User,
  Cake,
  BadgeCheck,
  Building,
  Banknote,
  Camera,
  LogOut
} from 'lucide-react';


// Demo: Using staff ID 2 as the logged-in user
const CURRENT_STAFF_ID = '2';

export default function ProfilePage() {
  const { staff, attendance, isInitialized } = useStaff();
  const { getLeaveBalance } = useStaffPortal();
  const { getStaffKPI } = useKPI();

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);
  const leaveBalance = getLeaveBalance(CURRENT_STAFF_ID);
  const kpi = getStaffKPI(CURRENT_STAFF_ID);

  // Calculate attendance stats
  const thisMonthAttendance = attendance.filter(a => {
    const month = new Date().toISOString().slice(0, 7);
    return a.staffId === CURRENT_STAFF_ID && a.date.startsWith(month);
  });
  const daysWorked = thisMonthAttendance.filter(a => a.clockInTime && a.clockOutTime).length;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  const age = calculateAge(currentStaff.dateOfBirth);

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>

        </div>

        {/* Profile Header Card */}
        <div className="staff-profile-header">
          <div className="staff-profile-avatar">
            {currentStaff.name.charAt(0)}
          </div>
          <h2 className="staff-profile-name">{currentStaff.name}</h2>
          <p className="staff-profile-role">
            {currentStaff.position || currentStaff.role}
            {currentStaff.employeeNumber && (
              <span style={{ opacity: 0.7, marginLeft: '0.5rem' }}>({currentStaff.employeeNumber})</span>
            )}
          </p>

          <div className="staff-profile-badges">
            <span className={`staff-profile-badge ${currentStaff.status === 'active' ? '' : 'warning'}`}>
              {currentStaff.status === 'active' ? '✓ Aktif' : '⏸ Cuti'}
            </span>
            {currentStaff.performanceBadges?.map(badge => (
              <span key={badge} className="staff-profile-badge">
                <Award size={12} />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 staff-stagger" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="staff-stat-card primary">
            <div className="staff-stat-icon primary">
              <Clock size={24} />
            </div>
            <div className="staff-stat-value">{daysWorked}</div>
            <div className="staff-stat-label">Hari Bekerja</div>
          </div>

          <div className="staff-stat-card success">
            <div className="staff-stat-icon success">
              <Calendar size={24} />
            </div>
            <div className="staff-stat-value">{leaveBalance?.annual.balance || 0}</div>
            <div className="staff-stat-label">Baki Cuti</div>
          </div>

          <div className="staff-stat-card cool">
            <div className="staff-stat-icon cool">
              <TrendingUp size={24} />
            </div>
            <div className="staff-stat-value">{kpi?.overallScore || 0}%</div>
            <div className="staff-stat-label">Skor KPI</div>
          </div>

          <div className="staff-stat-card warm">
            <div className="staff-stat-icon warm">
              <Star size={24} />
            </div>
            <div className="staff-stat-value">#{kpi?.rank || '-'}</div>
            <div className="staff-stat-label">Ranking</div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} />
              Maklumat Peribadi
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <FileText size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">No. Kad Pengenalan</span>
                <span className="profile-info-value">{currentStaff.icNumber || 'Tidak ditetapkan'}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Cake size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Tarikh Lahir</span>
                <span className="profile-info-value">
                  {formatDate(currentStaff.dateOfBirth)}
                  {age && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({age} tahun)</span>}
                </span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Phone size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Nombor Telefon</span>
                <span className="profile-info-value">{currentStaff.phone}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Mail size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{currentStaff.email || 'Tidak ditetapkan'}</span>
              </div>
            </div>

            <div className="profile-info-item full-width">
              <div className="profile-info-icon">
                <MapPin size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Alamat</span>
                <span className="profile-info-value">{currentStaff.address || 'Tidak ditetapkan'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              Kenalan Kecemasan
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <div className="profile-info-content">
                <span className="profile-info-label">Nama</span>
                <span className="profile-info-value">{currentStaff.emergencyContact?.name || 'Tidak ditetapkan'}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-content">
                <span className="profile-info-label">Hubungan</span>
                <span className="profile-info-value">{currentStaff.emergencyContact?.relation || '-'}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Phone size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Nombor Telefon</span>
                <span className="profile-info-value">{currentStaff.emergencyContact?.phone || 'Tidak ditetapkan'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} />
              Maklumat Pekerjaan
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <div className="profile-info-content">
                <span className="profile-info-label">Jawatan</span>
                <span className="profile-info-value">{currentStaff.position || currentStaff.role}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-content">
                <span className="profile-info-label">Jabatan</span>
                <span className="profile-info-value">{currentStaff.department || '-'}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-content">
                <span className="profile-info-label">Jenis Pekerjaan</span>
                <span className="profile-info-value">
                  {currentStaff.employmentType === 'permanent' ? 'Tetap' :
                    currentStaff.employmentType === 'contract' ? 'Kontrak' :
                      currentStaff.employmentType === 'part-time' ? 'Separuh Masa' :
                        currentStaff.employmentType === 'probation' ? 'Percubaan' : '-'}
                </span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Building size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Lokasi Kerja</span>
                <span className="profile-info-value">{currentStaff.workLocation || '-'}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Calendar size={16} />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Tarikh Mula Bekerja</span>
                <span className="profile-info-value">{formatDate(currentStaff.joinDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Salary & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} />
                Maklumat Gaji
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="staff-info-row">
                <span className="staff-info-label">Gaji Asas</span>
                <strong className="staff-info-value">BND {currentStaff.baseSalary?.toLocaleString()}</strong>
              </div>
              <div className="staff-info-row">
                <span className="staff-info-label">Kadar Jam</span>
                <strong className="staff-info-value">BND {currentStaff.hourlyRate}/jam</strong>
              </div>
              <div className="staff-info-row">
                <span className="staff-info-label">Kadar OT</span>
                <strong className="staff-info-value">{currentStaff.overtimeRate || 1.5}x</strong>
              </div>
              {currentStaff.bankDetails?.bankName && (
                <div className="staff-info-row">
                  <span className="staff-info-label">
                    <CreditCard size={14} style={{ marginRight: '0.25rem' }} />
                    Bank
                  </span>
                  <strong className="staff-info-value">
                    {currentStaff.bankDetails.bankName}
                    {currentStaff.bankDetails.accountNumber && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                        (...{currentStaff.bankDetails.accountNumber.slice(-4)})
                      </span>
                    )}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} />
                Caruman TAP/SCP
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="staff-info-row">
                <span className="staff-info-label">No. TAP</span>
                <strong className="staff-info-value">{currentStaff.statutoryContributions?.tapNumber || 'Tidak ditetapkan'}</strong>
              </div>
              <div className="staff-info-row">
                <span className="staff-info-label">Kadar TAP</span>
                <strong className="staff-info-value">
                  {currentStaff.statutoryContributions?.tapEmployeeRate || 5}% (Pekerja)
                </strong>
              </div>
              <div className="staff-info-row">
                <span className="staff-info-label">No. SCP</span>
                <strong className="staff-info-value">{currentStaff.statutoryContributions?.scpNumber || 'Tidak ditetapkan'}</strong>
              </div>
              <div className="staff-info-row">
                <span className="staff-info-label">Kadar SCP</span>
                <strong className="staff-info-value">
                  {currentStaff.statutoryContributions?.scpEmployeeRate || 3.5}% (Pekerja)
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Entitlement Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Baki Cuti Tahun Ini
            </div>
          </div>

          <div className="leave-balance-grid">
            <div className="leave-balance-item">
              <div className="leave-balance-label">Cuti Tahunan</div>
              <div className="leave-balance-value">
                <span className="leave-balance-current">{leaveBalance?.annual.balance || currentStaff.leaveEntitlement?.annual || 14}</span>
                <span className="leave-balance-total">/ {currentStaff.leaveEntitlement?.annual || 14} hari</span>
              </div>
              <div className="leave-balance-bar">
                <div
                  className="leave-balance-fill"
                  style={{
                    width: `${((leaveBalance?.annual.balance || currentStaff.leaveEntitlement?.annual || 14) / (currentStaff.leaveEntitlement?.annual || 14)) * 100}%`,
                    background: 'var(--primary)'
                  }}
                />
              </div>
            </div>

            <div className="leave-balance-item">
              <div className="leave-balance-label">Cuti Sakit (MC)</div>
              <div className="leave-balance-value">
                <span className="leave-balance-current">{leaveBalance?.medical.balance || currentStaff.leaveEntitlement?.medical || 14}</span>
                <span className="leave-balance-total">/ {currentStaff.leaveEntitlement?.medical || 14} hari</span>
              </div>
              <div className="leave-balance-bar">
                <div
                  className="leave-balance-fill"
                  style={{
                    width: `${((leaveBalance?.medical.balance || currentStaff.leaveEntitlement?.medical || 14) / (currentStaff.leaveEntitlement?.medical || 14)) * 100}%`,
                    background: 'var(--success)'
                  }}
                />
              </div>
            </div>

            <div className="leave-balance-item">
              <div className="leave-balance-label">Cuti Kecemasan</div>
              <div className="leave-balance-value">
                <span className="leave-balance-current">{leaveBalance?.emergency.balance || currentStaff.leaveEntitlement?.emergency || 3}</span>
                <span className="leave-balance-total">/ {currentStaff.leaveEntitlement?.emergency || 3} hari</span>
              </div>
              <div className="leave-balance-bar">
                <div
                  className="leave-balance-fill"
                  style={{
                    width: `${((leaveBalance?.emergency.balance || currentStaff.leaveEntitlement?.emergency || 3) / (currentStaff.leaveEntitlement?.emergency || 3)) * 100}%`,
                    background: 'var(--warning)'
                  }}
                />
              </div>
            </div>

            <div className="leave-balance-item">
              <div className="leave-balance-label">Cuti Ehsan</div>
              <div className="leave-balance-value">
                <span className="leave-balance-current">{leaveBalance?.compassionate.balance || currentStaff.leaveEntitlement?.compassionate || 3}</span>
                <span className="leave-balance-total">/ {currentStaff.leaveEntitlement?.compassionate || 3} hari</span>
              </div>
              <div className="leave-balance-bar">
                <div
                  className="leave-balance-fill"
                  style={{
                    width: `${((leaveBalance?.compassionate.balance || currentStaff.leaveEntitlement?.compassionate || 3) / (currentStaff.leaveEntitlement?.compassionate || 3)) * 100}%`,
                    background: 'var(--info)'
                  }}
                />
              </div>
            </div>
          </div>

          <Link
            href="/staff-portal/leave"
            className="btn btn-outline btn-sm"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            Lihat Semua Cuti
          </Link>
        </div>

        {/* Skills & Certifications */}
        {(currentStaff.skills?.length || currentStaff.certifications?.length) ? (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BadgeCheck size={20} />
                Kemahiran & Sijil
              </div>
            </div>

            {currentStaff.skills?.length ? (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Kemahiran:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {currentStaff.skills.map(skill => (
                    <span key={skill} className="badge badge-info">{skill}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStaff.certifications?.length ? (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Sijil:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {currentStaff.certifications.map(cert => (
                    <span key={cert} className="badge badge-success">{cert}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* KPI Progress (if available) */}
        {kpi && (
          <div className="card" style={{ marginBottom: '6rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} />
                Prestasi Semasa
              </div>
              <div className="card-subtitle">Bulan {new Date().toLocaleDateString('ms-MY', { month: 'long' })}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Attendance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Kehadiran</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {kpi.metrics?.attendance || 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${kpi.metrics?.attendance || 0}%` }}
                  />
                </div>
              </div>

              {/* Customer Rating */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Rating Pelanggan</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {kpi.metrics?.customerRating || 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${kpi.metrics?.customerRating || 0}%` }}
                  />
                </div>
              </div>

              {/* Upselling */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upselling</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {kpi.metrics?.upselling || 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${kpi.metrics?.upselling || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/hr/kpi/${CURRENT_STAFF_ID}`}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Lihat Laporan Penuh
            </Link>
          </div>
        )}

        {/* Bottom Navigation */}
        <StaffPortalNav currentPage="profile" />
      </div>

      <style jsx>{`
        .profile-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .profile-info-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }

        .profile-info-item.full-width {
          grid-column: 1 / -1;
        }

        .profile-info-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .profile-info-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .profile-info-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .profile-info-value {
          font-weight: 500;
          font-size: 0.9rem;
          word-break: break-word;
        }

        .leave-balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .leave-balance-item {
          padding: 1rem;
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }

        .leave-balance-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .leave-balance-value {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .leave-balance-current {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .leave-balance-total {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .leave-balance-bar {
          height: 6px;
          background: var(--gray-200);
          border-radius: 3px;
          overflow: hidden;
        }

        .leave-balance-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      `}</style>
    </MainLayout>
  );
}
