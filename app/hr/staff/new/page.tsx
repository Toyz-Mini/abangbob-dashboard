'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useStaff } from '@/lib/store';
import {
  StaffProfile,
  Gender,
  MaritalStatus,
  EmploymentType,
  SalaryType,
  AccessLevel,
  StaffPermissions,
  LeaveEntitlement,
  EmergencyContact,
  BankDetails,
  StatutoryContributions,
  SchedulePreferences,
  Allowance,
  StaffDocument,
} from '@/lib/types';
import {
  getDefaultStaffProfile,
  generateEmployeeNumber,
  BRUNEI_BANKS,
  RELATION_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  DEPARTMENT_OPTIONS,
  POSITION_OPTIONS,
} from '@/lib/hr-data';
import {
  ArrowLeft,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Settings,
  Plus,
  Trash2,
  Upload,
  X,
  Check,
  Cloud,
  Monitor,
  ShoppingCart,
  Boxes,
  Receipt,
  CreditCard,
  PieChart,
  Users,
  Key,
  Percent
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

type TabId = 'personal' | 'employment' | 'salary' | 'leave' | 'permissions' | 'documents' | 'other';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'personal', label: 'Peribadi', icon: <User size={18} /> },
  { id: 'employment', label: 'Pekerjaan', icon: <Briefcase size={18} /> },
  { id: 'salary', label: 'Gaji & Caruman', icon: <DollarSign size={18} /> },
  { id: 'leave', label: 'Cuti', icon: <Calendar size={18} /> },
  { id: 'permissions', label: 'Akses', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Dokumen', icon: <FileText size={18} /> },
  { id: 'other', label: 'Lain-lain', icon: <Settings size={18} /> },
];

export default function NewStaffPage() {
  const router = useRouter();
  const { staff, addStaff } = useStaff();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File | null>>({
    ic_front: null,
    ic_back: null,
    contract: null,
    resume: null,
  });
  const [dragOver, setDragOver] = useState<string | null>(null);

  const defaultProfile = getDefaultStaffProfile();

  const [formData, setFormData] = useState<Partial<StaffProfile>>({
    ...defaultProfile,
    employeeNumber: generateEmployeeNumber(staff),
    name: '',
    pin: '',
    phone: '+673',
    email: '',
    icNumber: '',
    dateOfBirth: '',
    gender: 'male', // Default to male
    nationality: 'Bruneian',
    religion: 'Islam',
    maritalStatus: 'single', // Default to single
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'probation', // Default to probation
    salaryType: 'monthly', // Default to monthly
    baseSalary: 800, // Default base salary
    hourlyRate: 5.00, // Default hourly rate
    overtimeRate: 1.5, // Default overtime rate
    paymentFrequency: 'monthly', // Default payment frequency
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountName: '',
    },
    emergencyContact: {
      name: '',
      relation: '',
      phone: '',
      address: '',
    },
    statutoryContributions: defaultProfile.statutoryContributions,
    leaveEntitlement: defaultProfile.leaveEntitlement,
    permissions: defaultProfile.permissions,
    schedulePreferences: defaultProfile.schedulePreferences,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNestedForm = (parent: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof StaffProfile] as Record<string, unknown> || {}),
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Nama diperlukan';
    }

    if (!formData.pin || formData.pin.length < 4) {
      newErrors.pin = 'PIN mesti 4 digit';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN mesti 4 digit nombor sahaja';
    }

    if (!formData.phone || formData.phone.length < 8) {
      newErrors.phone = 'Nombor telefon diperlukan';
    }

    if ((formData.baseSalary ?? 0) <= 0) {
      newErrors.baseSalary = 'Gaji asas mesti lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Switch to the tab with the first error
      if (errors.name || errors.pin || errors.phone) {
        setActiveTab('personal');
      } else if (errors.baseSalary) {
        setActiveTab('salary');
      }
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newStaff: Omit<StaffProfile, 'id'> = {
      employeeNumber: formData.employeeNumber,
      name: formData.name!.trim(),
      icNumber: formData.icNumber || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender,
      nationality: formData.nationality || undefined,
      religion: formData.religion || undefined,
      maritalStatus: formData.maritalStatus,
      address: formData.address || undefined,
      email: formData.email || undefined,
      phone: formData.phone!.trim(),
      profilePhotoUrl: formData.profilePhotoUrl,

      role: formData.role!,
      position: formData.position || undefined,
      department: formData.department || undefined,
      employmentType: formData.employmentType,
      joinDate: formData.joinDate || undefined,
      contractEndDate: formData.contractEndDate || undefined,
      probationEndDate: formData.probationEndDate || undefined,
      reportingTo: formData.reportingTo || undefined,
      workLocation: formData.workLocation || undefined,
      status: formData.status!,

      pin: formData.pin!,

      salaryType: formData.salaryType,
      baseSalary: formData.baseSalary!,
      hourlyRate: formData.hourlyRate!,
      dailyRate: formData.dailyRate,
      overtimeRate: formData.overtimeRate,
      allowances: formData.allowances,
      fixedDeductions: formData.fixedDeductions,
      paymentFrequency: formData.paymentFrequency,

      bankDetails: formData.bankDetails?.bankName ? formData.bankDetails : undefined,
      statutoryContributions: formData.statutoryContributions,
      emergencyContact: formData.emergencyContact?.name ? formData.emergencyContact : undefined,
      leaveEntitlement: formData.leaveEntitlement,

      accessLevel: formData.accessLevel,
      permissions: formData.permissions,
      schedulePreferences: formData.schedulePreferences,

      documents: formData.documents,
      skills: formData.skills,
      certifications: formData.certifications,

      uniformSize: formData.uniformSize || undefined,
      shoeSize: formData.shoeSize || undefined,
      dietaryRestrictions: formData.dietaryRestrictions || undefined,
      medicalConditions: formData.medicalConditions || undefined,
      bloodType: formData.bloodType || undefined,
      notes: formData.notes || undefined,

      performanceBadges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addStaff(newStaff);
    router.push('/hr/staff');
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    updateForm('pin', pin);
    setShowPin(true);
  };

  const addAllowance = () => {
    const newAllowance: Allowance = {
      id: `allowance_${Date.now()}`,
      name: '',
      amount: 0,
      type: 'fixed',
    };
    updateForm('allowances', [...(formData.allowances || []), newAllowance]);
  };

  const removeAllowance = (id: string) => {
    updateForm('allowances', (formData.allowances || []).filter(a => a.id !== id));
  };

  const updateAllowance = (id: string, field: keyof Allowance, value: unknown) => {
    updateForm('allowances', (formData.allowances || []).map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'employment':
        return renderEmploymentTab();
      case 'salary':
        return renderSalaryTab();
      case 'leave':
        return renderLeaveTab();
      case 'permissions':
        return renderPermissionsTab();
      case 'documents':
        return renderDocumentsTab();
      case 'other':
        return renderOtherTab();
      default:
        return null;
    }
  };

  const renderPersonalTab = () => (
    <div className="form-section">
      <h3 className="section-title">Maklumat Peribadi</h3>

      <div className="form-group">
        <label className="form-label">Nama Penuh *</label>
        <input
          type="text"
          className="form-input"
          value={formData.name || ''}
          onChange={(e) => updateForm('name', e.target.value)}
          placeholder="Contoh: Ahmad Bin Hassan"
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">No. Kad Pengenalan / Passport</label>
          <input
            type="text"
            className="form-input"
            value={formData.icNumber || ''}
            onChange={(e) => updateForm('icNumber', e.target.value)}
            placeholder="00-123456"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tarikh Lahir</label>
          <input
            type="date"
            className="form-input"
            value={formData.dateOfBirth || ''}
            onChange={(e) => updateForm('dateOfBirth', e.target.value)}
            placeholder="dd/mm/yyyy"
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Jantina</label>
          <select
            className="form-select"
            value={formData.gender || ''}
            onChange={(e) => updateForm('gender', e.target.value as Gender || undefined)}
          >
            <option value="">Pilih jantina</option>
            <option value="male">Lelaki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status Perkahwinan</label>
          <select
            className="form-select"
            value={formData.maritalStatus || ''}
            onChange={(e) => updateForm('maritalStatus', e.target.value as MaritalStatus || undefined)}
          >
            <option value="">Pilih status</option>
            <option value="single">Bujang</option>
            <option value="married">Berkahwin</option>
            <option value="divorced">Bercerai</option>
            <option value="widowed">Balu/Duda</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Warganegara</label>
          <select
            className="form-select"
            value={formData.nationality || ''}
            onChange={(e) => updateForm('nationality', e.target.value)}
          >
            <option value="">Pilih warganegara</option>
            {NATIONALITY_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Agama</label>
          <select
            className="form-select"
            value={formData.religion || ''}
            onChange={(e) => updateForm('religion', e.target.value)}
          >
            <option value="">Pilih agama</option>
            {RELIGION_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Nombor Telefon *</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone || ''}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="+6737123456"
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.email || ''}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="ahmad@email.com"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Alamat Penuh</label>
        <textarea
          className="form-input"
          value={formData.address || ''}
          onChange={(e) => updateForm('address', e.target.value)}
          placeholder="No. 123, Simpang 456, Kampung..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">PIN Clock In (4 digit) *</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={showPin ? 'text' : 'password'}
              className="form-input"
              value={formData.pin || ''}
              onChange={(e) => updateForm('pin', e.target.value.slice(0, 4))}
              placeholder="1234"
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
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={generateRandomPin}
          >
            Auto
          </button>
        </div>
        {errors.pin && <span className="form-error">{errors.pin}</span>}
      </div>

      <h3 className="section-title" style={{ marginTop: '2rem' }}>Kenalan Kecemasan</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Nama</label>
          <input
            type="text"
            className="form-input"
            value={formData.emergencyContact?.name || ''}
            onChange={(e) => updateNestedForm('emergencyContact', 'name', e.target.value)}
            placeholder="Nama kenalan kecemasan"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Hubungan</label>
          <select
            className="form-select"
            value={formData.emergencyContact?.relation || ''}
            onChange={(e) => updateNestedForm('emergencyContact', 'relation', e.target.value)}
          >
            <option value="">Pilih hubungan</option>
            {RELATION_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Nombor Telefon Kecemasan</label>
        <input
          type="tel"
          className="form-input"
          value={formData.emergencyContact?.phone || ''}
          onChange={(e) => updateNestedForm('emergencyContact', 'phone', e.target.value)}
          placeholder="+6737123457"
        />
      </div>
    </div>
  );

  const renderEmploymentTab = () => (
    <div className="form-section">
      <h3 className="section-title">Maklumat Pekerjaan</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">No. Pekerja</label>
          <input
            type="text"
            className="form-input"
            value={formData.employeeNumber || ''}
            onChange={(e) => updateForm('employeeNumber', e.target.value)}
            placeholder="EMP001"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Jawatan</label>
          <select
            className="form-select"
            value={formData.role || 'Staff'}
            onChange={(e) => {
              const role = e.target.value as 'Manager' | 'Staff';
              updateForm('role', role);
              updateForm('position', '');
              // Update permissions based on role
              if (role === 'Manager') {
                updateForm('accessLevel', 'manager');
                updateForm('permissions', {
                  ...formData.permissions,
                  canApproveLeave: true,
                  canApproveClaims: true,
                  canViewReports: true,
                  canManageStaff: true,
                  canGiveDiscount: true,
                  maxDiscountPercent: 30,
                  canVoidTransaction: true,
                  canAccessInventory: true,
                  canAccessFinance: true,
                });
              }
            }}
          >
            <option value="Staff">Staff</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Posisi</label>
          <select
            className="form-select"
            value={formData.position || ''}
            onChange={(e) => updateForm('position', e.target.value)}
          >
            <option value="">Pilih posisi</option>
            {POSITION_OPTIONS[formData.role || 'Staff'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Jabatan</label>
          <select
            className="form-select"
            value={formData.department || ''}
            onChange={(e) => updateForm('department', e.target.value)}
          >
            <option value="">Pilih jabatan</option>
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
            value={formData.employmentType || 'probation'}
            onChange={(e) => updateForm('employmentType', e.target.value as EmploymentType)}
          >
            <option value="probation">Percubaan</option>
            <option value="permanent">Tetap</option>
            <option value="contract">Kontrak</option>
            <option value="part-time">Separuh Masa</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={formData.status || 'active'}
            onChange={(e) => updateForm('status', e.target.value)}
          >
            <option value="active">Aktif</option>
            <option value="on-leave">Cuti</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Tarikh Mula Bekerja</label>
          <input
            type="date"
            className="form-input"
            value={formData.joinDate || ''}
            onChange={(e) => updateForm('joinDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tarikh Tamat Percubaan</label>
          <input
            type="date"
            className="form-input"
            value={formData.probationEndDate || ''}
            onChange={(e) => updateForm('probationEndDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Melaporkan Kepada</label>
          <select
            className="form-select"
            value={formData.reportingTo || ''}
            onChange={(e) => updateForm('reportingTo', e.target.value)}
          >
            <option value="">Tiada</option>
            {staff.filter(s => s.role === 'Manager').map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Lokasi Kerja</label>
          <input
            type="text"
            className="form-input"
            value={formData.workLocation || ''}
            onChange={(e) => updateForm('workLocation', e.target.value)}
            placeholder="Outlet Gadong"
          />
        </div>
      </div>

      {formData.employmentType === 'contract' && (
        <div className="form-group">
          <label className="form-label">Tarikh Tamat Kontrak</label>
          <input
            type="date"
            className="form-input"
            value={formData.contractEndDate || ''}
            onChange={(e) => updateForm('contractEndDate', e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const renderSalaryTab = () => (
    <div className="form-section">
      <h3 className="section-title">Maklumat Gaji</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Jenis Gaji</label>
          <select
            className="form-select"
            value={formData.salaryType || 'monthly'}
            onChange={(e) => updateForm('salaryType', e.target.value as SalaryType)}
          >
            <option value="monthly">Bulanan</option>
            <option value="hourly">Per Jam</option>
            <option value="daily">Harian</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Kekerapan Bayaran</label>
          <select
            className="form-select"
            value={formData.paymentFrequency || 'monthly'}
            onChange={(e) => updateForm('paymentFrequency', e.target.value)}
          >
            <option value="monthly">Bulanan</option>
            <option value="biweekly">Dua Minggu Sekali</option>
            <option value="weekly">Mingguan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Gaji Asas (BND) *</label>
          <input
            type="number"
            className="form-input"
            value={formData.baseSalary || 0}
            onChange={(e) => updateForm('baseSalary', Number(e.target.value))}
            min="0"
          />
          {errors.baseSalary && <span className="form-error">{errors.baseSalary}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Kadar Jam (BND/jam)</label>
          <input
            type="number"
            className="form-input"
            value={formData.hourlyRate || 0}
            onChange={(e) => updateForm('hourlyRate', Number(e.target.value))}
            min="0"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kadar OT (x)</label>
          <input
            type="number"
            className="form-input"
            value={formData.overtimeRate || 1.5}
            onChange={(e) => updateForm('overtimeRate', Number(e.target.value))}
            min="1"
            max="3"
            step="0.5"
          />
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label className="form-label" style={{ margin: 0 }}>Elaun</label>
          <button type="button" className="btn btn-outline btn-sm" onClick={addAllowance}>
            <Plus size={14} /> Tambah Elaun
          </button>
        </div>

        {(formData.allowances || []).map((allowance) => (
          <div key={allowance.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              value={allowance.name}
              onChange={(e) => updateAllowance(allowance.id, 'name', e.target.value)}
              placeholder="Nama elaun"
              style={{ flex: 2 }}
            />
            <input
              type="number"
              className="form-input"
              value={allowance.amount}
              onChange={(e) => updateAllowance(allowance.id, 'amount', Number(e.target.value))}
              placeholder="Jumlah"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => removeAllowance(allowance.id)}
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <h3 className="section-title" style={{ marginTop: '2rem' }}>Maklumat Bank</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Nama Bank</label>
          <select
            className="form-select"
            value={formData.bankDetails?.bankName || ''}
            onChange={(e) => updateNestedForm('bankDetails', 'bankName', e.target.value)}
          >
            <option value="">Pilih bank</option>
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
            value={formData.bankDetails?.accountNumber || ''}
            onChange={(e) => updateNestedForm('bankDetails', 'accountNumber', e.target.value)}
            placeholder="1234567890"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Nama Pemegang Akaun</label>
        <input
          type="text"
          className="form-input"
          value={formData.bankDetails?.accountName || ''}
          onChange={(e) => updateNestedForm('bankDetails', 'accountName', e.target.value)}
          placeholder="Sama seperti nama penuh"
        />
      </div>

      <h3 className="section-title" style={{ marginTop: '2rem' }}>Caruman Statutori (TAP/SCP)</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">No. TAP</label>
          <input
            type="text"
            className="form-input"
            value={formData.statutoryContributions?.tapNumber || ''}
            onChange={(e) => updateNestedForm('statutoryContributions', 'tapNumber', e.target.value)}
            placeholder="TAP-XXXXXX"
          />
        </div>

        <div className="form-group">
          <label className="form-label">No. SCP</label>
          <input
            type="text"
            className="form-input"
            value={formData.statutoryContributions?.scpNumber || ''}
            onChange={(e) => updateNestedForm('statutoryContributions', 'scpNumber', e.target.value)}
            placeholder="SCP-XXXXXX"
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Kadar TAP Pekerja (%)</label>
          <input
            type="number"
            className="form-input"
            value={formData.statutoryContributions?.tapEmployeeRate || 5}
            onChange={(e) => updateNestedForm('statutoryContributions', 'tapEmployeeRate', Number(e.target.value))}
            min="0"
            max="100"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kadar TAP Majikan (%)</label>
          <input
            type="number"
            className="form-input"
            value={formData.statutoryContributions?.tapEmployerRate || 5}
            onChange={(e) => updateNestedForm('statutoryContributions', 'tapEmployerRate', Number(e.target.value))}
            min="0"
            max="100"
            step="0.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Kadar SCP Pekerja (%)</label>
          <input
            type="number"
            className="form-input"
            value={formData.statutoryContributions?.scpEmployeeRate || 3.5}
            onChange={(e) => updateNestedForm('statutoryContributions', 'scpEmployeeRate', Number(e.target.value))}
            min="0"
            max="100"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kadar SCP Majikan (%)</label>
          <input
            type="number"
            className="form-input"
            value={formData.statutoryContributions?.scpEmployerRate || 3.5}
            onChange={(e) => updateNestedForm('statutoryContributions', 'scpEmployerRate', Number(e.target.value))}
            min="0"
            max="100"
            step="0.5"
          />
        </div>
      </div>
    </div>
  );

  const renderLeaveTab = () => (
    <div className="form-section">
      <h3 className="section-title">Entitlement Cuti Tahunan</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Tetapkan jumlah hari cuti yang layak untuk staf ini.
      </p>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Cuti Tahunan</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.annual || 14}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'annual', Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cuti Sakit (MC)</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.medical || 14}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'medical', Number(e.target.value))}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Cuti Kecemasan</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.emergency || 3}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'emergency', Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cuti Ehsan (Compassionate)</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.compassionate || 3}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'compassionate', Number(e.target.value))}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Cuti Bersalin</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.maternity || 105}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'maternity', Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cuti Paterniti</label>
          <input
            type="number"
            className="form-input"
            value={formData.leaveEntitlement?.paternity || 3}
            onChange={(e) => updateNestedForm('leaveEntitlement', 'paternity', Number(e.target.value))}
            min="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Hari Bawa ke Tahun Depan (Carry Forward)</label>
        <input
          type="number"
          className="form-input"
          value={formData.leaveEntitlement?.carryForwardDays || 5}
          onChange={(e) => updateNestedForm('leaveEntitlement', 'carryForwardDays', Number(e.target.value))}
          min="0"
          style={{ maxWidth: '200px' }}
        />
      </div>

      <h3 className="section-title" style={{ marginTop: '2rem' }}>Tetapan Jadual Kerja</h3>

      <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Hari Bekerja Seminggu</label>
          <input
            type="number"
            className="form-input"
            value={formData.schedulePreferences?.workDaysPerWeek || 6}
            onChange={(e) => updateNestedForm('schedulePreferences', 'workDaysPerWeek', Number(e.target.value))}
            min="1"
            max="7"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Had OT Seminggu (Jam)</label>
          <input
            type="number"
            className="form-input"
            value={formData.schedulePreferences?.maxOTHoursPerWeek || 10}
            onChange={(e) => updateNestedForm('schedulePreferences', 'maxOTHoursPerWeek', Number(e.target.value))}
            min="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <input
            type="checkbox"
            checked={formData.schedulePreferences?.isFlexibleSchedule || false}
            onChange={(e) => updateNestedForm('schedulePreferences', 'isFlexibleSchedule', e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Jadual Fleksibel
        </label>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Staf dengan jadual fleksibel boleh memilih waktu kerja sendiri.
        </p>
      </div>
    </div>
  );

  const renderPermissionsTab = () => {
    const roles = [
      {
        id: 'staff',
        label: 'Staff',
        icon: <User size={24} />,
        description: 'Akses asas untuk operasi harian',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
      },
      {
        id: 'manager',
        label: 'Manager',
        icon: <Briefcase size={24} />,
        description: 'Akses penuh untuk pengurusan & laporan',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200'
      }
    ];

    const permissionGroups = [
      {
        title: 'Operasi',
        permissions: [
          { id: 'canAccessPOS', label: 'Akses POS', icon: <ShoppingCart size={18} /> },
          { id: 'canAccessKDS', label: 'Kitchen Display', icon: <Monitor size={18} /> },
          { id: 'canManageMenu', label: 'Urus Menu', icon: <FileText size={18} /> },
        ]
      },
      {
        title: 'Pengurusan',
        permissions: [
          { id: 'canManageStaff', label: 'Urus Staf', icon: <Users size={18} /> },
          { id: 'canAccessInventory', label: 'Inventori', icon: <Boxes size={18} /> },
          { id: 'canViewReports', label: 'Lihat Laporan', icon: <PieChart size={18} /> },
        ]
      },
      {
        title: 'Kewangan & Kelulusan',
        permissions: [
          { id: 'canAccessFinance', label: 'Kewangan', icon: <DollarSign size={18} /> },
          { id: 'canApproveLeave', label: 'Lulus Cuti', icon: <Calendar size={18} /> },
          { id: 'canApproveClaims', label: 'Lulus Tuntutan', icon: <Receipt size={18} /> },
          { id: 'canGiveDiscount', label: 'Beri Diskaun', icon: <Percent size={18} /> }, // Using explicit icon below
          { id: 'canVoidTransaction', label: 'Void Transaksi', icon: <X size={18} /> },
        ]
      }
    ];

    return (
      <div className="space-y-8">
        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isSelected = formData.accessLevel === role.id;
            return (
              <div
                key={role.id}
                onClick={() => updateForm('accessLevel', role.id as AccessLevel)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                  ? `border-${role.color.split('-')[1]}-500 ${role.bg}`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-white shadow-sm ${role.color}`}>
                    {role.icon}
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {role.label}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {role.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-blue-600">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Permissions */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Key size={20} className="text-primary" />
            Kebenaran Khusus
          </h3>

          <div className="grid grid-cols-1 gap-8">
            {permissionGroups.map((group) => (
              <div key={group.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                  {group.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${formData.permissions?.[perm.id as keyof StaffPermissions]
                        ? 'bg-white border-primary shadow-sm ring-1 ring-primary/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className={`p-2 rounded-md ${formData.permissions?.[perm.id as keyof StaffPermissions]
                        ? 'bg-primary-50 text-primary'
                        : 'bg-gray-100 text-gray-400'
                        }`}>
                        {perm.id === 'canGiveDiscount' ? <DollarSign size={18} /> : perm.icon}
                      </div>

                      <div className="flex-1">
                        <span className={`text-sm font-medium ${formData.permissions?.[perm.id as keyof StaffPermissions]
                          ? 'text-gray-900'
                          : 'text-gray-500'
                          }`}>
                          {perm.label}
                        </span>
                      </div>

                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.permissions?.[perm.id as keyof StaffPermissions] as boolean || false}
                          onChange={(e) => updateNestedForm('permissions', perm.id, e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Fields based on Permissions */}
        {formData.permissions?.canGiveDiscount && (
          <div className="animate-fade-in bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
                <DollarSign size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Tetapan Diskaun</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Tetapkan had maksimum diskaun yang boleh diberikan oleh staf ini.
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-full max-w-[200px]">
                    <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">
                      Max Diskaun (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="form-input pr-8"
                        value={formData.permissions?.maxDiscountPercent || 0}
                        onChange={(e) => updateNestedForm('permissions', 'maxDiscountPercent', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.permissions?.maxDiscountPercent || 0}
                    onChange={(e) => updateNestedForm('permissions', 'maxDiscountPercent', Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDocumentsTab = () => {
    const handleFileSelect = (docType: string, file: File | null) => {
      setUploadedDocs(prev => ({ ...prev, [docType]: file }));
    };

    const handleDragOver = (e: React.DragEvent, docType: string) => {
      e.preventDefault();
      setDragOver(docType);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
    };

    const handleDrop = (e: React.DragEvent, docType: string) => {
      e.preventDefault();
      setDragOver(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        // Validate file type
        const validTypes = docType === 'contract' || docType === 'resume'
          ? ['application/pdf']
          : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

        if (!validTypes.includes(file.type)) {
          alert('Jenis fail tidak sah. Sila pilih fail yang betul.');
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Fail terlalu besar. Maksimum 5MB.');
          return;
        }

        handleFileSelect(docType, file);
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const documentTypes = [
      { id: 'ic_front', label: 'IC Depan', accept: 'image/*,application/pdf', hint: 'JPG, PNG atau PDF (Max 5MB)' },
      { id: 'ic_back', label: 'IC Belakang', accept: 'image/*,application/pdf', hint: 'JPG, PNG atau PDF (Max 5MB)' },
      { id: 'contract', label: 'Surat Kontrak', accept: 'application/pdf', hint: 'PDF sahaja (Max 5MB)' },
      { id: 'resume', label: 'Resume/CV', accept: 'application/pdf', hint: 'PDF sahaja (Max 5MB)' },
    ];

    return (
      <div className="form-section">
        <h3 className="section-title">Muat Naik Dokumen</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Klik atau seret fail untuk muat naik. Dokumen akan disimpan dengan selamat.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((docType) => {
            const file = uploadedDocs[docType.id as keyof typeof uploadedDocs];
            const isDragging = dragOver === docType.id;
            const hasFile = !!file;

            return (
              <div
                key={docType.id}
                className={`transition-all duration-200 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group ${hasFile
                  ? 'border-green-500 bg-green-50'
                  : isDragging
                    ? 'border-primary bg-primary-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}
                style={{ minHeight: '200px' }}
                onDragOver={(e) => handleDragOver(e, docType.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, docType.id)}
                onClick={() => document.getElementById(`file-${docType.id}`)?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  {hasFile ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                        <Check size={24} strokeWidth={3} />
                      </div>
                      <div className="w-full overflow-hidden">
                        <p className="font-semibold text-gray-900 truncate max-w-full px-2">
                          {file!.name}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {formatFileSize(file!.size)} • Berjaya dimuat naik
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium hover:underline py-1 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileSelect(docType.id, null);
                        }}
                      >
                        Padam Fail
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`p-4 rounded-full mb-1 transition-colors ${isDragging ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary'}`}>
                        {docType.id.includes('ic') ? (
                          <div className="relative">
                            <FileText size={28} />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                              <User size={12} className="text-current" />
                            </div>
                          </div>
                        ) : (
                          <FileText size={32} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{docType.label}</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                          {isDragging ? 'Lepaskan fail di sini' : docType.hint}
                        </p>
                      </div>
                      <span className="mt-2 text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors">
                        Pilih Fail
                      </span>
                    </>
                  )}
                </div>

                <input
                  type="file"
                  id={`file-${docType.id}`}
                  accept={docType.accept}
                  style={{ display: 'none' }}
                  onClick={(e) => e.stopPropagation()} // Prevent double trigger
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      if (selectedFile.size > 5 * 1024 * 1024) {
                        alert('Fail terlalu besar. Maksimum 5MB.');
                        e.target.value = '';
                        return;
                      }
                      handleFileSelect(docType.id, selectedFile);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--gray-100) 100%)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--primary-light)'
        }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cloud size={16} style={{ color: 'var(--primary)' }} />
            <strong>Dokumen akan disimpan ke Supabase Storage</strong>
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Semua dokumen yang dimuat naik akan disimpan dengan selamat dan boleh diakses kemudian.
          </p>
        </div>
      </div>
    );
  };

  const renderOtherTab = () => (
    <div className="form-section">
      <h3 className="section-title">Maklumat Tambahan</h3>

      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Saiz Uniform</label>
          <select
            className="form-select"
            value={formData.uniformSize || ''}
            onChange={(e) => updateForm('uniformSize', e.target.value)}
          >
            <option value="">Pilih saiz</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="XXXL">XXXL</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Saiz Kasut</label>
          <input
            type="text"
            className="form-input"
            value={formData.shoeSize || ''}
            onChange={(e) => updateForm('shoeSize', e.target.value)}
            placeholder="40"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Jenis Darah</label>
          <select
            className="form-select"
            value={formData.bloodType || ''}
            onChange={(e) => updateForm('bloodType', e.target.value)}
          >
            <option value="">Tidak diketahui</option>
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

      <div className="form-group">
        <label className="form-label">Pantang Makanan / Alahan</label>
        <input
          type="text"
          className="form-input"
          value={formData.dietaryRestrictions || ''}
          onChange={(e) => updateForm('dietaryRestrictions', e.target.value)}
          placeholder="Contoh: Alah kacang, Halal sahaja"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Keadaan Kesihatan</label>
        <input
          type="text"
          className="form-input"
          value={formData.medicalConditions || ''}
          onChange={(e) => updateForm('medicalConditions', e.target.value)}
          placeholder="Contoh: Asma, Diabetes"
        />
      </div>

      <h3 className="section-title" style={{ marginTop: '2rem' }}>Kemahiran & Sijil</h3>

      <div className="form-group">
        <label className="form-label">Kemahiran</label>
        <input
          type="text"
          className="form-input"
          value={(formData.skills || []).join(', ')}
          onChange={(e) => updateForm('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          placeholder="Customer Service, Cooking, POS Operation"
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
          Pisahkan dengan koma
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Sijil / Kelayakan</label>
        <input
          type="text"
          className="form-input"
          value={(formData.certifications || []).join(', ')}
          onChange={(e) => updateForm('certifications', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          placeholder="Food Safety Level 2, First Aid"
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
          Pisahkan dengan koma
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Nota Dalaman (HR)</label>
        <textarea
          className="form-input"
          value={formData.notes || ''}
          onChange={(e) => updateForm('notes', e.target.value)}
          placeholder="Catatan untuk rujukan HR..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/hr/staff" className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }}>
            <ArrowLeft size={18} />
            Kembali ke Senarai
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Daftar Staf Baru
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Isi maklumat staf baru secara lengkap
          </p>
        </div>

        <div className="staff-form-container">
          {/* Tab Navigation */}
          <div className="staff-form-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`staff-form-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="card staff-form-content">
              {renderTabContent()}
            </div>

            {/* Submit Buttons */}
            <div className="staff-form-actions">
              <Link href="/hr/staff" className="btn btn-outline">
                Batal
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Daftar Staf
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .staff-form-container {
          max-width: 900px;
        }

        .staff-form-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          background: var(--gray-100);
          padding: 0.5rem;
          border-radius: var(--radius-lg);
        }

        .staff-form-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .staff-form-tab:hover {
          color: var(--primary);
          background: var(--white);
        }

        .staff-form-tab.active {
          background: var(--white);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .tab-label {
          display: none;
        }

        @media (min-width: 768px) {
          .tab-label {
            display: inline;
          }
        }

        .staff-form-content {
          min-height: 500px;
        }

        .staff-form-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 1.5rem;
          margin-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }

        .staff-form-actions .btn {
          flex: 1;
          max-width: 200px;
        }

        .form-section {
          padding: 0.5rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--gray-100);
        }

        .form-error {
          color: var(--danger);
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: block;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .permission-item {
          background: var(--gray-50);
          padding: 0.75rem;
          border-radius: var(--radius-md);
        }

        .permission-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .permission-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        /* Modern Document Upload Styles */
        .document-upload-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        .doc-upload-card {
          background: var(--white);
          border: 2px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .doc-upload-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--primary-dark));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .doc-upload-card:hover::before,
        .doc-upload-card.has-file::before {
          opacity: 1;
        }

        .doc-upload-card.dragging {
          border-color: var(--primary);
          background: var(--primary-light);
          transform: scale(1.02);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .doc-upload-card.has-file {
          border-color: var(--success);
          background: var(--gray-50);
        }

        .doc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .doc-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text);
          margin: 0;
        }

        .doc-delete-btn {
          background: var(--danger-light);
          color: var(--danger);
          border: none;
          padding: 0.375rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-delete-btn:hover {
          background: var(--danger);
          color: var(--white);
          transform: rotate(90deg);
        }

        .doc-upload-area {
          background: var(--gray-50);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: center;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.2s ease;
        }

        .doc-upload-card.dragging .doc-upload-area {
          background: var(--white);
        }

        .doc-upload-card.has-file .doc-upload-area {
          background: var(--white);
          border: 1px solid var(--success-light);
        }

        .doc-upload-icon {
          color: var(--text-light);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .doc-upload-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin: 0;
        }

        .doc-upload-hint {
          font-size: 0.75rem;
          color: var(--text-light);
          margin: 0;
        }

        .doc-preview {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .doc-image-preview {
          width: 100%;
          height: 120px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--gray-100);
        }

        .doc-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .doc-file-icon {
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .doc-file-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .doc-check-icon {
          color: var(--success);
          margin-bottom: 0.25rem;
        }

        .doc-filename {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
          margin: 0;
          word-break: break-all;
          text-align: center;
        }

        .doc-filesize {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .doc-browse-btn {
          margin-top: 0.75rem;
          width: 100%;
        }
      `}</style>
    </MainLayout>
  );
}
