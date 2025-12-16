'use client';

import { useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff } from '@/lib/store';
import { useStaffRealtime } from '@/lib/supabase/realtime-hooks';
import {
  StaffProfile,
  Gender,
  MaritalStatus,
  EmploymentType,
  SalaryType,
  AccessLevel,
  BankDetails,
  EmergencyContact,
  StatutoryContributions,
  LeaveEntitlement,
  StaffPermissions,
} from '@/lib/types';
import {
  BRUNEI_BANKS,
  RELATION_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  DEPARTMENT_OPTIONS,
  POSITION_OPTIONS,
} from '@/lib/hr-data';
import Link from 'next/link';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  UserPlus,
  Phone,
  DollarSign,
  Clock,
  User,
  Briefcase,
  Calendar,
  Shield,
  FileText,
  MapPin,
  Mail,
  CreditCard,
  Heart,
  Award,
  AlertCircle,
  ChevronRight,
  Lock,
  Download,
} from 'lucide-react';

type EditTab = 'personal' | 'employment' | 'salary' | 'permissions';

export default function StaffListPage() {
  const { staff, updateStaff, deleteStaff, getStaffAttendanceToday, refreshStaff, isInitialized } = useStaff();

  // Realtime subscription for staff
  const handleStaffChange = useCallback(() => {
    console.log('[Realtime] Staff change detected, refreshing...');
    refreshStaff();
  }, [refreshStaff]);

  useStaffRealtime(handleStaffChange);

  const [filter, setFilter] = useState<'all' | 'active' | 'on-leave'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>('personal');
  const [detailTab, setDetailTab] = useState<'info' | 'employment' | 'permissions'>('info');

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<StaffProfile>>({});

  const filteredStaff = staff.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.position?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.employeeNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openEditModal = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setEditForm({
      ...staffMember,
      bankDetails: staffMember.bankDetails || { bankName: '', accountNumber: '', accountName: '' },
      emergencyContact: staffMember.emergencyContact || { name: '', relation: '', phone: '' },
      statutoryContributions: staffMember.statutoryContributions || {},
      leaveEntitlement: staffMember.leaveEntitlement || {
        annual: 14, medical: 14, emergency: 3, maternity: 105, paternity: 3, compassionate: 3, carryForwardDays: 5
      },
      permissions: staffMember.permissions || {
        canApproveLeave: false, canApproveClaims: false, canViewReports: false,
        canManageStaff: false, canAccessPOS: true, canGiveDiscount: false,
        maxDiscountPercent: 0, canVoidTransaction: false, canAccessInventory: false,
        canAccessFinance: false, canAccessKDS: false, canManageMenu: false,
      },
    });
    setShowEditModal(true);
    setShowPin(false);
    setEditTab('personal');
  };

  const openDeleteModal = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  };

  const openDetailModal = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setDetailTab('info');
    setShowDetailModal(true);
  };

  const updateEditForm = (field: string, value: unknown) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedEditForm = (parent: string, field: string, value: unknown) => {
    setEditForm(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof StaffProfile] as Record<string, unknown> || {}),
        [field]: value,
      },
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedStaff || !editForm.name?.trim()) {
      alert('Sila masukkan nama staf');
      return;
    }

    if (!editForm.pin || editForm.pin.length !== 4 || !/^\d{4}$/.test(editForm.pin)) {
      alert('PIN mesti 4 digit nombor');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedData: Partial<StaffProfile> = {
      // Personal
      name: editForm.name.trim(),
      icNumber: editForm.icNumber || undefined,
      dateOfBirth: editForm.dateOfBirth || undefined,
      gender: editForm.gender,
      nationality: editForm.nationality,
      religion: editForm.religion,
      maritalStatus: editForm.maritalStatus,
      address: editForm.address || undefined,
      email: editForm.email || undefined,
      phone: editForm.phone?.trim() || '',
      pin: editForm.pin,
      emergencyContact: editForm.emergencyContact?.name ? editForm.emergencyContact as EmergencyContact : undefined,

      // Employment
      role: editForm.role,
      position: editForm.position || undefined,
      department: editForm.department || undefined,
      employmentType: editForm.employmentType,
      joinDate: editForm.joinDate || undefined,
      probationEndDate: editForm.probationEndDate || undefined,
      contractEndDate: editForm.contractEndDate || undefined,
      reportingTo: editForm.reportingTo || undefined,
      workLocation: editForm.workLocation || undefined,
      status: editForm.status,

      // Salary
      salaryType: editForm.salaryType,
      baseSalary: editForm.baseSalary,
      hourlyRate: editForm.hourlyRate,
      overtimeRate: editForm.overtimeRate,
      bankDetails: (editForm.bankDetails as BankDetails)?.bankName ? editForm.bankDetails as BankDetails : undefined,
      statutoryContributions: editForm.statutoryContributions as StatutoryContributions,
      leaveEntitlement: editForm.leaveEntitlement as LeaveEntitlement,

      // Permissions
      accessLevel: editForm.accessLevel,
      permissions: editForm.permissions as StaffPermissions,

      // Other
      uniformSize: editForm.uniformSize || undefined,
      shoeSize: editForm.shoeSize || undefined,
      bloodType: editForm.bloodType || undefined,
      dietaryRestrictions: editForm.dietaryRestrictions || undefined,
      medicalConditions: editForm.medicalConditions || undefined,
      notes: editForm.notes || undefined,
      skills: editForm.skills,
      certifications: editForm.certifications,

      updatedAt: new Date().toISOString(),
    };

    updateStaff(selectedStaff.id, updatedData);

    setIsProcessing(false);
    setShowEditModal(false);
    setSelectedStaff(null);
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteStaff(selectedStaff.id);

    setIsProcessing(false);
    setShowDeleteModal(false);
    setSelectedStaff(null);
  };

  const getAttendanceStatus = (staffId: string) => {
    const attendance = getStaffAttendanceToday(staffId);
    if (attendance?.clockInTime && !attendance?.clockOutTime) {
      return { status: 'On Duty', badge: 'badge-success', time: attendance.clockInTime };
    }
    if (attendance?.clockInTime && attendance?.clockOutTime) {
      return { status: 'Sudah Clock Out', badge: 'badge-info', time: `${attendance.clockInTime} - ${attendance.clockOutTime}` };
    }
    return { status: 'Belum Clock In', badge: 'badge-warning', time: null };
  };

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

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const renderEditPersonalTab = () => (
    <div className="edit-tab-content">
      <div className="form-group">
        <label className="form-label">Nama Penuh *</label>
        <input
          type="text"
          className="form-input"
          value={editForm.name || ''}
          onChange={(e) => updateEditForm('name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">No. IC</label>
          <input
            type="text"
            className="form-input"
            value={editForm.icNumber || ''}
            onChange={(e) => updateEditForm('icNumber', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tarikh Lahir</label>
          <input
            type="date"
            className="form-input"
            value={editForm.dateOfBirth || ''}
            onChange={(e) => updateEditForm('dateOfBirth', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Jantina</label>
          <select
            className="form-select"
            value={editForm.gender || ''}
            onChange={(e) => updateEditForm('gender', e.target.value as Gender || undefined)}
          >
            <option value="">Pilih</option>
            <option value="male">Lelaki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status Perkahwinan</label>
          <select
            className="form-select"
            value={editForm.maritalStatus || ''}
            onChange={(e) => updateEditForm('maritalStatus', e.target.value as MaritalStatus || undefined)}
          >
            <option value="">Pilih</option>
            <option value="single">Bujang</option>
            <option value="married">Berkahwin</option>
            <option value="divorced">Bercerai</option>
            <option value="widowed">Balu/Duda</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Telefon *</label>
          <input
            type="tel"
            className="form-input"
            value={editForm.phone || ''}
            onChange={(e) => updateEditForm('phone', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={editForm.email || ''}
            onChange={(e) => updateEditForm('email', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Alamat</label>
        <textarea
          className="form-input"
          value={editForm.address || ''}
          onChange={(e) => updateEditForm('address', e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">PIN (4 digit) *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPin ? 'text' : 'password'}
              className="form-input"
              value={editForm.pin || ''}
              onChange={(e) => updateEditForm('pin', e.target.value.slice(0, 4))}
              maxLength={4}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Jenis Darah</label>
          <select
            className="form-select"
            value={editForm.bloodType || ''}
            onChange={(e) => updateEditForm('bloodType', e.target.value)}
          >
            <option value="">Pilih</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
        Kenalan Kecemasan
      </h4>
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Nama</label>
          <input
            type="text"
            className="form-input"
            value={(editForm.emergencyContact as EmergencyContact)?.name || ''}
            onChange={(e) => updateNestedEditForm('emergencyContact', 'name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Hubungan</label>
          <select
            className="form-select"
            value={(editForm.emergencyContact as EmergencyContact)?.relation || ''}
            onChange={(e) => updateNestedEditForm('emergencyContact', 'relation', e.target.value)}
          >
            <option value="">Pilih</option>
            {RELATION_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Telefon Kecemasan</label>
        <input
          type="tel"
          className="form-input"
          value={(editForm.emergencyContact as EmergencyContact)?.phone || ''}
          onChange={(e) => updateNestedEditForm('emergencyContact', 'phone', e.target.value)}
        />
      </div>
    </div>
  );

  const renderEditEmploymentTab = () => (
    <div className="edit-tab-content">
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Jawatan</label>
          <select
            className="form-select"
            value={editForm.role || 'Staff'}
            onChange={(e) => updateEditForm('role', e.target.value as 'Manager' | 'Staff')}
          >
            <option value="Staff">Staff</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={editForm.status || 'active'}
            onChange={(e) => updateEditForm('status', e.target.value)}
          >
            <option value="active">Aktif</option>
            <option value="on-leave">Cuti</option>
            <option value="terminated">Tamat</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Posisi</label>
          <select
            className="form-select"
            value={editForm.position || ''}
            onChange={(e) => updateEditForm('position', e.target.value)}
          >
            <option value="">Pilih</option>
            {POSITION_OPTIONS[editForm.role || 'Staff'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Jabatan</label>
          <select
            className="form-select"
            value={editForm.department || ''}
            onChange={(e) => updateEditForm('department', e.target.value)}
          >
            <option value="">Pilih</option>
            {DEPARTMENT_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Jenis Pekerjaan</label>
          <select
            className="form-select"
            value={editForm.employmentType || 'permanent'}
            onChange={(e) => updateEditForm('employmentType', e.target.value as EmploymentType)}
          >
            <option value="probation">Percubaan</option>
            <option value="permanent">Tetap</option>
            <option value="contract">Kontrak</option>
            <option value="part-time">Separuh Masa</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tarikh Mula</label>
          <input
            type="date"
            className="form-input"
            value={editForm.joinDate || ''}
            onChange={(e) => updateEditForm('joinDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Lokasi Kerja</label>
          <input
            type="text"
            className="form-input"
            value={editForm.workLocation || ''}
            onChange={(e) => updateEditForm('workLocation', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Melaporkan Kepada</label>
          <select
            className="form-select"
            value={editForm.reportingTo || ''}
            onChange={(e) => updateEditForm('reportingTo', e.target.value)}
          >
            <option value="">Tiada</option>
            {staff.filter(s => s.role === 'Manager' && s.id !== selectedStaff?.id).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderEditSalaryTab = () => (
    <div className="edit-tab-content">
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Gaji Asas (BND)</label>
          <input
            type="number"
            className="form-input"
            value={editForm.baseSalary || 0}
            onChange={(e) => updateEditForm('baseSalary', Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Kadar Jam (BND)</label>
          <input
            type="number"
            className="form-input"
            value={editForm.hourlyRate || 0}
            onChange={(e) => updateEditForm('hourlyRate', Number(e.target.value))}
            step="0.5"
          />
        </div>
      </div>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
        Maklumat Bank
      </h4>
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Bank</label>
          <select
            className="form-select"
            value={(editForm.bankDetails as BankDetails)?.bankName || ''}
            onChange={(e) => updateNestedEditForm('bankDetails', 'bankName', e.target.value)}
          >
            <option value="">Pilih</option>
            {BRUNEI_BANKS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">No. Akaun</label>
          <input
            type="text"
            className="form-input"
            value={(editForm.bankDetails as BankDetails)?.accountNumber || ''}
            onChange={(e) => updateNestedEditForm('bankDetails', 'accountNumber', e.target.value)}
          />
        </div>
      </div>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
        Caruman TAP/SCP
      </h4>
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">No. TAP</label>
          <input
            type="text"
            className="form-input"
            value={(editForm.statutoryContributions as StatutoryContributions)?.tapNumber || ''}
            onChange={(e) => updateNestedEditForm('statutoryContributions', 'tapNumber', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">No. SCP</label>
          <input
            type="text"
            className="form-input"
            value={(editForm.statutoryContributions as StatutoryContributions)?.scpNumber || ''}
            onChange={(e) => updateNestedEditForm('statutoryContributions', 'scpNumber', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Kadar TAP Pekerja (%)</label>
          <input
            type="number"
            className="form-input"
            value={(editForm.statutoryContributions as StatutoryContributions)?.tapEmployeeRate || 5}
            onChange={(e) => updateNestedEditForm('statutoryContributions', 'tapEmployeeRate', Number(e.target.value))}
            min="0" max="100" step="0.5"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Kadar TAP Majikan (%)</label>
          <input
            type="number"
            className="form-input"
            value={(editForm.statutoryContributions as StatutoryContributions)?.tapEmployerRate || 5}
            onChange={(e) => updateNestedEditForm('statutoryContributions', 'tapEmployerRate', Number(e.target.value))}
            min="0" max="100" step="0.5"
          />
        </div>
      </div>
    </div>
  );

  const renderEditPermissionsTab = () => (
    <div className="edit-tab-content">
      <div className="form-group">
        <label className="form-label">Tahap Akses</label>
        <select
          className="form-select"
          value={editForm.accessLevel || 'staff'}
          onChange={(e) => updateEditForm('accessLevel', e.target.value as AccessLevel)}
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
        Kebenaran
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {[
          { key: 'canAccessPOS', label: 'Akses POS' },
          { key: 'canAccessKDS', label: 'Akses Kitchen Display' },
          { key: 'canAccessInventory', label: 'Akses Inventori' },
          { key: 'canAccessFinance', label: 'Akses Kewangan' },
          { key: 'canManageMenu', label: 'Urus Menu' },
          { key: 'canManageStaff', label: 'Urus Staf' },
          { key: 'canApproveLeave', label: 'Lulus Cuti' },
          { key: 'canApproveClaims', label: 'Lulus Tuntutan' },
          { key: 'canViewReports', label: 'Lihat Laporan' },
          { key: 'canGiveDiscount', label: 'Beri Diskaun' },
          { key: 'canVoidTransaction', label: 'Void Transaksi' },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={(editForm.permissions as StaffPermissions)?.[key as keyof StaffPermissions] as boolean || false}
              onChange={(e) => updateNestedEditForm('permissions', key, e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            {label}
          </label>
        ))}
      </div>

      {(editForm.permissions as StaffPermissions)?.canGiveDiscount && (
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">Had Diskaun Maksimum (%)</label>
          <input
            type="number"
            className="form-input"
            value={(editForm.permissions as StaffPermissions)?.maxDiscountPercent || 0}
            onChange={(e) => updateNestedEditForm('permissions', 'maxDiscountPercent', Number(e.target.value))}
            min="0" max="100"
            style={{ maxWidth: '150px' }}
          />
        </div>
      )}
    </div>
  );

  const renderDetailInfo = () => {
    if (!selectedStaff) return null;
    const age = calculateAge(selectedStaff.dateOfBirth);

    const SectionCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] h-full overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
          <div className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-500 shadow-sm">
            <Icon size={16} />
          </div>
          <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h4>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    );

    const Field = ({ label, value, sub }: { label: string, value: string | number | undefined | null, sub?: string }) => (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold leading-none">{label}</span>
        <div className="text-[14px] font-medium text-gray-900 break-words flex items-baseline gap-2 leading-snug">
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="text-gray-300 italic font-normal text-xs">Tidak dinyatakan</span>
          )}
          {sub && <span className="text-gray-400 text-xs font-normal">({sub})</span>}
        </div>
      </div>
    );

    return (
      <div className="detail-content bg-gray-50/50 -m-6 p-6 min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Personal Info */}
          <SectionCard title="Maklumat Peribadi" icon={User}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <Field label="Nama Penuh" value={selectedStaff.name} />
              <Field label="No. IC" value={selectedStaff.icNumber} />
              <Field label="Tarikh Lahir" value={formatDate(selectedStaff.dateOfBirth)} sub={age ? `${age} tahun` : undefined} />
              <Field label="Jantina" value={selectedStaff.gender === 'male' ? 'Lelaki' : selectedStaff.gender === 'female' ? 'Perempuan' : '-'} />
              <Field label="Status" value={
                selectedStaff.maritalStatus === 'single' ? 'Bujang' :
                  selectedStaff.maritalStatus === 'married' ? 'Berkahwin' :
                    selectedStaff.maritalStatus === 'divorced' ? 'Bercerai' :
                      selectedStaff.maritalStatus === 'widowed' ? 'Balu/Duda' : '-'
              } />
              <Field label="Warganegara" value={selectedStaff.nationality} />
              <Field label="Agama" value={selectedStaff.religion} />
              <Field label="Jenis Darah" value={selectedStaff.bloodType} />
            </div>
          </SectionCard>

          {/* Contact Info */}
          <SectionCard title="Hubungi" icon={Phone}>
            <div className="space-y-6">
              <Field label="Telefon" value={selectedStaff.phone} />
              <Field label="Email" value={selectedStaff.email} />
              <Field label="Alamat" value={selectedStaff.address} />
            </div>
          </SectionCard>

          {/* Emergency Contact */}
          <SectionCard title="Kecemasan" icon={AlertCircle}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <Field label="Nama" value={selectedStaff.emergencyContact?.name} />
              </div>
              <Field label="Hubungan" value={selectedStaff.emergencyContact?.relation} />
              <Field label="Telefon" value={selectedStaff.emergencyContact?.phone} />
            </div>
          </SectionCard>

          {/* Bank Info */}
          <SectionCard title="Bank" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <Field label="Nama Bank" value={selectedStaff.bankDetails?.bankName} />
              </div>
              <Field label="No. Akaun" value={selectedStaff.bankDetails?.accountNumber} />
              <Field label="Pemegang Akaun" value={selectedStaff.bankDetails?.accountName} />
            </div>
          </SectionCard>

          {/* TAP/SCP */}
          <div className="md:col-span-2">
            <SectionCard title="Caruman TAP / SCP" icon={Shield}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-sky-50/40 rounded-xl border border-sky-100/60">
                  <h5 className="text-[13px] font-bold text-sky-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> TAP
                  </h5>
                  <div className="space-y-4">
                    <Field label="No. Ahli" value={selectedStaff.statutoryContributions?.tapNumber} />
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sky-100/50">
                      <Field label="Pekerja" value={selectedStaff.statutoryContributions?.tapEmployeeRate ? `${selectedStaff.statutoryContributions.tapEmployeeRate}%` : '5%'} />
                      <Field label="Majikan" value={selectedStaff.statutoryContributions?.tapEmployerRate ? `${selectedStaff.statutoryContributions.tapEmployerRate}%` : '5%'} />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-violet-50/40 rounded-xl border border-violet-100/60">
                  <h5 className="text-[13px] font-bold text-violet-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span> SCP
                  </h5>
                  <div className="space-y-4">
                    <Field label="No. Ahli" value={selectedStaff.statutoryContributions?.scpNumber} />
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-violet-100/50">
                      <Field label="Pekerja" value={selectedStaff.statutoryContributions?.scpEmployeeRate ? `${selectedStaff.statutoryContributions.scpEmployeeRate}%` : '3.5%'} />
                      <Field label="Majikan" value={selectedStaff.statutoryContributions?.scpEmployerRate ? `${selectedStaff.statutoryContributions.scpEmployerRate}%` : '3.5%'} />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailEmployment = () => {
    if (!selectedStaff) return null;

    const SectionCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] h-full overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
          <div className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-500 shadow-sm">
            <Icon size={16} />
          </div>
          <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h4>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    );

    const Field = ({ label, value, badge }: { label: string, value: string | number | undefined | null, badge?: string }) => (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold leading-none">{label}</span>
        <div className="text-[14px] font-medium text-gray-900 break-words flex items-center gap-2 leading-snug">
          {value || <span className="text-gray-300 italic font-normal text-xs">Tidak dinyatakan</span>}
          {badge && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge === 'active' ? 'bg-green-100 text-green-700' :
            badge === 'permanent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>{badge}</span>}
        </div>
      </div>
    );

    return (
      <div className="detail-content bg-gray-50/50 -m-6 p-6 min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Job Info Card */}
          <SectionCard title="Maklumat Pekerjaan" icon={Briefcase}>
            <div className="space-y-6">
              <Field label="No. Pekerja" value={selectedStaff.employeeNumber} />
              <Field label="Jawatan" value={selectedStaff.role} />
              <Field label="Posisi" value={selectedStaff.position} />
              <Field label="Jabatan" value={selectedStaff.department} />
              <Field label="Jenis Pekerjaan" value={
                selectedStaff.employmentType === 'permanent' ? 'Tetap' :
                  selectedStaff.employmentType === 'contract' ? 'Kontrak' :
                    selectedStaff.employmentType === 'part-time' ? 'Separuh Masa' :
                      selectedStaff.employmentType === 'probation' ? 'Percubaan' : '-'
              } badge={selectedStaff.employmentType} />
              <Field label="Lokasi Kerja" value={selectedStaff.workLocation} />
              <Field label="Tarikh Mula" value={formatDate(selectedStaff.joinDate)} />
              <Field label="Melaporkan Kepada" value={
                selectedStaff.reportingTo ? staff.find(s => s.id === selectedStaff.reportingTo)?.name : '-'
              } />
            </div>
          </SectionCard>

          {/* Salary Info Card */}
          <SectionCard title="Maklumat Gaji" icon={DollarSign}>
            <div className="space-y-6">
              <Field label="Gaji Asas" value={selectedStaff.baseSalary ? `BND ${selectedStaff.baseSalary.toLocaleString()}` : '-'} />
              <Field label="Kadar Jam" value={selectedStaff.hourlyRate ? `BND ${selectedStaff.hourlyRate}/jam` : '-'} />
              <Field label="Kadar OT" value={`${selectedStaff.overtimeRate || 1.5}x`} />
              <Field label="Jenis Gaji" value={
                selectedStaff.salaryType === 'monthly' ? 'Bulanan' :
                  selectedStaff.salaryType === 'hourly' ? 'Per Jam' :
                    selectedStaff.salaryType === 'daily' ? 'Harian' : 'Bulanan'
              } />
            </div>
          </SectionCard>

          {/* Leave Entitlement Card */}
          <SectionCard title="Entitlement Cuti" icon={Calendar}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <Field label="Tahunan" value={`${selectedStaff.leaveEntitlement?.annual || 14} hari`} />
              <Field label="Sakit" value={`${selectedStaff.leaveEntitlement?.medical || 14} hari`} />
              <Field label="Kecemasan" value={`${selectedStaff.leaveEntitlement?.emergency || 3} hari`} />
              <Field label="Ehsan" value={`${selectedStaff.leaveEntitlement?.compassionate || 3} hari`} />
              <Field label="Bersalin" value={`${selectedStaff.leaveEntitlement?.maternity || 105} hari`} />
              <Field label="Paterniti" value={`${selectedStaff.leaveEntitlement?.paternity || 3} hari`} />
            </div>
          </SectionCard>

          {/* Skills & Certs Card (Full Width) */}
          {(selectedStaff.skills?.length || selectedStaff.certifications?.length) ? (
            <div className="md:col-span-2 lg:col-span-3">
              <SectionCard title="Kemahiran & Sijil" icon={Award}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedStaff.skills?.length ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Kemahiran</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStaff.skills.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedStaff.certifications?.length ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Sijil</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStaff.certifications.map(cert => (
                          <span key={cert} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDetailPermissions = () => {
    if (!selectedStaff) return null;

    const permissions = selectedStaff.permissions;
    const permissionsList = [
      { key: 'canAccessPOS', label: 'Akses POS' },
      { key: 'canAccessKDS', label: 'Akses Kitchen Display' },
      { key: 'canAccessInventory', label: 'Akses Inventori' },
      { key: 'canAccessFinance', label: 'Akses Kewangan' },
      { key: 'canManageMenu', label: 'Urus Menu' },
      { key: 'canManageStaff', label: 'Urus Staf' },
      { key: 'canApproveLeave', label: 'Lulus Permohonan Cuti' },
      { key: 'canApproveClaims', label: 'Lulus Tuntutan' },
      { key: 'canViewReports', label: 'Lihat Laporan' },
      { key: 'canGiveDiscount', label: 'Beri Diskaun' },
      { key: 'canVoidTransaction', label: 'Void Transaksi' },
    ];

    const SectionCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] h-full overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
          <div className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-500 shadow-sm">
            <Icon size={16} />
          </div>
          <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h4>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    );

    return (
      <div className="detail-content bg-gray-50/50 -m-6 p-6 min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Access Level Card */}
          <SectionCard title="Tahap Akses" icon={Shield}>
            <div className="flex flex-col gap-6">
              <div className="text-sm text-gray-600 leading-relaxed">
                Tahap akses menentukan modul mana yang boleh dilihat oleh staf ini secara umum.
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Peranan Semasa</div>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${selectedStaff.accessLevel === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                  selectedStaff.accessLevel === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                  {selectedStaff.accessLevel === 'admin' ? 'Administrator' :
                    selectedStaff.accessLevel === 'manager' ? 'Manager' : 'Staff'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Special Permissions Card */}
          <div className="md:col-span-2">
            <SectionCard title="Kebenaran Khusus" icon={Lock}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissionsList.map(({ key, label }) => {
                  const hasPermission = permissions?.[key as keyof StaffPermissions] as boolean;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200 ${hasPermission
                        ? 'bg-green-50/50 border-green-100'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasPermission ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                        }`}>
                        {hasPermission ? <span className="text-xs">✓</span> : <span className="text-[10px]">✕</span>}
                      </div>
                      <span className={`text-sm font-medium ${hasPermission ? 'text-green-800' : 'text-gray-500'
                        }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {permissions?.canGiveDiscount && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-orange-800 font-bold mb-0.5">Had Diskaun Maksimum</div>
                    <div className="text-xl font-bold text-orange-900">{permissions.maxDiscountPercent}%</div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                Senarai Staf
              </h1>
              <p className="page-subtitle">
                Database lengkap semua staf ({staff.length} orang)
              </p>
            </div>
            <Link href="/hr/staff/new" className="btn btn-primary">
              <UserPlus size={18} />
              Daftar Staf Baru
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama, jawatan, no. pekerja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              Semua ({staff.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            >
              Aktif ({staff.filter(s => s.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('on-leave')}
              className={`btn btn-sm ${filter === 'on-leave' ? 'btn-primary' : 'btn-outline'}`}
            >
              Cuti ({staff.filter(s => s.status === 'on-leave').length})
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
          {filteredStaff.map(staffMember => {
            const attendanceStatus = getAttendanceStatus(staffMember.id);
            return (
              <div key={staffMember.id} className="card staff-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--gradient-primary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1.25rem'
                    }}>
                      {staffMember.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.15rem' }}>
                        {staffMember.name}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {staffMember.position || staffMember.role}
                        {staffMember.employeeNumber && <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>({staffMember.employeeNumber})</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${staffMember.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {staffMember.status === 'active' ? 'Aktif' : 'Cuti'}
                  </span>
                </div>

                {/* Today's Attendance */}
                <div style={{
                  background: 'var(--gray-100)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hari Ini:</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${attendanceStatus.badge}`} style={{ fontSize: '0.7rem' }}>
                      {attendanceStatus.status}
                    </span>
                    {attendanceStatus.time && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {attendanceStatus.time}
                      </div>
                    )}
                  </div>
                </div>

                {staffMember.performanceBadges && staffMember.performanceBadges.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {staffMember.performanceBadges.map(badge => (
                        <span key={badge} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          <Award size={10} style={{ marginRight: '0.25rem' }} />
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DollarSign size={14} />
                      BND {staffMember.baseSalary?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>BND {staffMember.hourlyRate}/jam</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={14} />
                    {staffMember.phone}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openEditModal(staffMember)}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openDetailModal(staffMember)}
                  >
                    <Eye size={14} />
                    Detail
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.5rem', color: 'var(--danger)' }}
                    onClick={() => openDeleteModal(staffMember)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStaff.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tiada staf dijumpai
            </p>
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => !isProcessing && setShowEditModal(false)}
          title="Edit Maklumat Staf"
          subtitle={selectedStaff?.employeeNumber}
          maxWidth="650px"
        >
          {/* Edit Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
            {[
              { id: 'personal', label: 'Peribadi', icon: <User size={16} /> },
              { id: 'employment', label: 'Pekerjaan', icon: <Briefcase size={16} /> },
              { id: 'salary', label: 'Gaji', icon: <DollarSign size={16} /> },
              { id: 'permissions', label: 'Akses', icon: <Shield size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditTab(tab.id as EditTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: editTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: editTab === tab.id ? 'white' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {editTab === 'personal' && renderEditPersonalTab()}
          {editTab === 'employment' && renderEditEmploymentTab()}
          {editTab === 'salary' && renderEditSalaryTab()}
          {editTab === 'permissions' && renderEditPermissionsTab()}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowEditModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSubmit}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !isProcessing && setShowDeleteModal(false)}
          title="Padam Staf"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Anda pasti mahu padam <strong>{selectedStaff?.name}</strong>?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Semua rekod kehadiran staf ini juga akan dipadam.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Memproses...
                </>
              ) : (
                'Padam'
              )}
            </button>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Maklumat Staf"
          subtitle={selectedStaff?.employeeNumber}
          maxWidth="700px"
        >
          {selectedStaff && (
            <>
              {/* Profile Header */}
              <div style={{
                background: 'var(--gray-100)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'var(--gradient-primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 700
                }}>
                  {selectedStaff.name.charAt(0)}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {selectedStaff.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {selectedStaff.position || selectedStaff.role} • {selectedStaff.department || '-'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${selectedStaff.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedStaff.status === 'active' ? 'Aktif' : 'Cuti'}
                  </span>
                  {selectedStaff.performanceBadges?.map(badge => (
                    <span key={badge} className="badge badge-info">
                      <Award size={10} style={{ marginRight: '0.25rem' }} />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detail Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
                {[
                  { id: 'info', label: 'Maklumat Peribadi', icon: <User size={16} /> },
                  { id: 'employment', label: 'Pekerjaan & Gaji', icon: <Briefcase size={16} /> },
                  { id: 'permissions', label: 'Akses', icon: <Shield size={16} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id as 'info' | 'employment' | 'permissions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: detailTab === tab.id ? 'var(--primary)' : 'transparent',
                      color: detailTab === tab.id ? 'white' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {detailTab === 'info' && renderDetailInfo()}
                {detailTab === 'employment' && renderDetailEmployment()}
                {detailTab === 'permissions' && renderDetailPermissions()}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
                <button
                  className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm text-sm"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedStaff);
                  }}
                >
                  <Edit2 size={16} />
                  Edit Profil
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>

      <style jsx>{`
        .staff-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .staff-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .edit-tab-content {
          min-height: 300px;
        }
        .detail-content {
          padding: 0.5rem;
        }
        .detail-section {
          margin-bottom: 1.5rem;
        }
        .detail-section:last-child {
          margin-bottom: 0;
        }
        .detail-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--gray-200);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .detail-item {
          background: var(--gray-50);
          padding: 0.75rem;
          border-radius: var(--radius-md);
        }
        .detail-item.full-width {
          grid-column: 1 / -1;
        }
        .detail-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        .detail-value {
          font-weight: 500;
          font-size: 0.875rem;
        }
      `}</style>
    </MainLayout >
  );
}
