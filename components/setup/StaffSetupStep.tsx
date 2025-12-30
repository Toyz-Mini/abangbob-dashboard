'use client';

import { useEffect, useState } from 'react';
import { useSetup, SetupStaffMember } from '@/lib/contexts/SetupContext';
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Shield,
  UserCog,
  User,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface Props {
  onValidChange: (isValid: boolean) => void;
}

const ROLES = [
  { id: 'Admin', label: 'Admin', icon: Shield, description: 'Akses penuh ke semua fungsi', color: 'text-red-400' },
  { id: 'Manager', label: 'Pengurus', icon: UserCog, description: 'Urus operasi harian', color: 'text-amber-400' },
  { id: 'Staff', label: 'Staf', icon: User, description: 'Fungsi asas sahaja', color: 'text-teal-400' },
];

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function StaffSetupStep({ onValidChange }: Props) {
  const { setupData, updateStaffMembers } = useSetup();
  const { staffMembers } = setupData;

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SetupStaffMember | null>(null);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Staff'>('Staff');
  const [pin, setPin] = useState('');

  // Always valid - staff can be added later
  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  const handleAddStaff = () => {
    if (!name.trim() || !pin) return;

    const newStaff: SetupStaffMember = {
      id: editingStaff?.id || `staff_${Date.now()}`,
      name,
      email,
      phone,
      role,
      pin,
    };

    if (editingStaff) {
      updateStaffMembers(staffMembers.map(s => s.id === editingStaff.id ? newStaff : s));
    } else {
      updateStaffMembers([...staffMembers, newStaff]);
    }

    resetForm();
  };

  const handleDeleteStaff = (id: string) => {
    updateStaffMembers(staffMembers.filter(s => s.id !== id));
  };

  const handleEditStaff = (staff: SetupStaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone);
    setRole(staff.role);
    setPin(staff.pin);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('Staff');
    setPin('');
  };

  const openNewForm = () => {
    resetForm();
    setPin(generatePin());
    setShowForm(true);
  };

  const togglePinVisibility = (staffId: string) => {
    setShowPins(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const getRoleInfo = (roleId: string) => {
    return ROLES.find(r => r.id === roleId) || ROLES[2];
  };

  const staffByRole = {
    Admin: staffMembers.filter(s => s.role === 'Admin'),
    Manager: staffMembers.filter(s => s.role === 'Manager'),
    Staff: staffMembers.filter(s => s.role === 'Staff'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" />
            Senarai Staf
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tambah staf dan tetapkan peranan mereka. Setiap staf akan mempunyai PIN untuk clock-in.
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Staf
        </button>
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold text-white mb-4">
              {editingStaff ? 'Edit Staf' : 'Tambah Staf Baru'}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <User className="w-4 h-4 text-teal-500" />
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth: Ahmad bin Abu"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                    <Mail className="w-4 h-4 text-teal-500" />
                    Emel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="emel@contoh.com"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                    <Phone className="w-4 h-4 text-teal-500" />
                    No. Telefon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012-3456789"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <Shield className="w-4 h-4 text-teal-500" />
                  Peranan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as 'Admin' | 'Manager' | 'Staff')}
                        className={`
                          p-3 rounded-xl border-2 transition-all text-center
                          ${role === r.id
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${r.color}`} />
                        <span className="text-sm text-white">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {getRoleInfo(role).description}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <KeyRound className="w-4 h-4 text-teal-500" />
                  PIN (4 digit) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-center font-mono text-xl tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPin(generatePin())}
                    className="px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors text-sm"
                  >
                    Jana Baru
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  PIN ini digunakan untuk clock-in dan akses POS
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddStaff}
                  disabled={!name.trim() || pin.length !== 4}
                  className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingStaff ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff List by Role */}
      {staffMembers.length === 0 ? (
        <div className="text-center py-12 bg-slate-700/30 rounded-xl">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Belum ada staf didaftarkan</p>
          <p className="text-sm text-slate-500">Klik &quot;Tambah Staf&quot; untuk mula mendaftarkan pekerja anda
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {ROLES.map(roleInfo => {
            const staffInRole = staffByRole[roleInfo.id as keyof typeof staffByRole];
            if (staffInRole.length === 0) return null;

            const Icon = roleInfo.icon;

            return (
              <div key={roleInfo.id}>
                <h4 className={`text-sm font-medium ${roleInfo.color} mb-3 flex items-center gap-2`}>
                  <Icon className="w-4 h-4" />
                  {roleInfo.label} ({staffInRole.length})
                </h4>
                <div className="space-y-2">
                  {staffInRole.map(staff => (
                    <div
                      key={staff.id}
                      className="group flex items-center justify-between bg-slate-700/30 border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 ${roleInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-white">{staff.name}</h5>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            {staff.email && <span>{staff.email}</span>}
                            {staff.phone && <span>{staff.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* PIN Display */}
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
                          <KeyRound className="w-4 h-4 text-slate-500" />
                          <span className="font-mono text-sm text-white">
                            {showPins[staff.id] ? staff.pin : '••••'}
                          </span>
                          <button
                            onClick={() => togglePinVisibility(staff.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {showPins[staff.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditStaff(staff)}
                            className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Info Card */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-400 mb-1">Tentang Peranan</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li><span className="text-red-400 font-medium">Admin:</span> Akses penuh termasuk tetapan, laporan, dan urus staf</li>
              <li><span className="text-amber-400 font-medium">Pengurus:</span> Urus operasi harian, jadual, dan lapor kehadiran</li>
              <li><span className="text-teal-400 font-medium">Staf:</span> POS, clock-in/out, dan tugas harian</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-center justify-between">
        <span className="text-teal-400">Jumlah Staf</span>
        <div className="flex gap-6 text-sm">
          <span className="text-slate-300">
            <span className="font-bold text-red-400">{staffByRole.Admin.length}</span> Admin
          </span>
          <span className="text-slate-300">
            <span className="font-bold text-amber-400">{staffByRole.Manager.length}</span> Pengurus
          </span>
          <span className="text-slate-300">
            <span className="font-bold text-teal-400">{staffByRole.Staff.length}</span> Staf
          </span>
        </div>
      </div>
    </div>
  );
}




