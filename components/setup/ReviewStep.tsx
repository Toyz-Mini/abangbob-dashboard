'use client';

import { useEffect } from 'react';
import { useSetup } from '@/lib/contexts/SetupContext';
import { 
  Building2,
  UtensilsCrossed,
  Users,
  CreditCard,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Percent,
  Edit2,
  Sparkles,
  Rocket
} from 'lucide-react';

interface Props {
  onValidChange: (isValid: boolean) => void;
}

export default function ReviewStep({ onValidChange }: Props) {
  const { setupData, setCurrentStep } = useSetup();
  const { businessInfo, menuCategories, menuItems, staffMembers, paymentMethods } = setupData;

  // Always valid for review step
  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  const enabledPayments = paymentMethods.filter(m => m.enabled);
  const openDays = Object.entries(businessInfo.operatingHours).filter(([_, hours]) => !hours.closed);

  return (
    <div className="space-y-6">
      {/* Completion Banner */}
      <div className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/20 mb-4">
          <Rocket className="w-8 h-8 text-teal-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Hampir Siap!</h3>
        <p className="text-slate-300">
          Semak maklumat anda sebelum memulakan. Anda boleh ubah maklumat ini bila-bila masa di Tetapan.
        </p>
      </div>

      {/* Business Info Summary */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-500" />
            <h4 className="font-medium text-white">Maklumat Perniagaan</h4>
          </div>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            {businessInfo.logo ? (
              <img src={businessInfo.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-600 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div>
              <h5 className="text-lg font-bold text-white">
                {businessInfo.name || <span className="text-slate-500 italic">Belum diisi</span>}
              </h5>
              <p className="text-sm text-slate-400">{businessInfo.currency} • {businessInfo.timezone}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-slate-500" />
              {businessInfo.address || <span className="text-slate-500 italic">Belum diisi</span>}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone className="w-4 h-4 text-slate-500" />
              {businessInfo.phone || <span className="text-slate-500 italic">Belum diisi</span>}
            </div>
            {businessInfo.email && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                {businessInfo.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-slate-500" />
              {openDays.length} hari buka
            </div>
            {(businessInfo.taxRate > 0 || businessInfo.serviceCharge > 0) && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Percent className="w-4 h-4 text-slate-500" />
                {businessInfo.taxRate > 0 && `Cukai ${businessInfo.taxRate}%`}
                {businessInfo.taxRate > 0 && businessInfo.serviceCharge > 0 && ' • '}
                {businessInfo.serviceCharge > 0 && `Servis ${businessInfo.serviceCharge}%`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Summary */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-teal-500" />
            <h4 className="font-medium text-white">Menu</h4>
          </div>
          <button
            onClick={() => setCurrentStep(2)}
            className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4">
          {menuCategories.length === 0 && menuItems.length === 0 ? (
            <p className="text-slate-500 italic text-sm">Belum ada menu ditambah</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{menuCategories.length}</p>
                <p className="text-xs text-slate-400">Kategori</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{menuItems.length}</p>
                <p className="text-xs text-slate-400">Item</p>
              </div>
              {menuItems.length > 0 && (
                <div className="flex-1 text-right">
                  <p className="text-sm text-slate-300">
                    Purata harga: <span className="font-bold text-teal-400">
                      RM {(menuItems.reduce((sum, i) => sum + i.price, 0) / menuItems.length).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Staff Summary */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" />
            <h4 className="font-medium text-white">Staf</h4>
          </div>
          <button
            onClick={() => setCurrentStep(3)}
            className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4">
          {staffMembers.length === 0 ? (
            <p className="text-slate-500 italic text-sm">Belum ada staf didaftarkan</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{staffMembers.length}</p>
                <p className="text-xs text-slate-400">Jumlah Staf</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">
                  <span className="font-bold text-red-400">{staffMembers.filter(s => s.role === 'Admin').length}</span> Admin
                </span>
                <span className="text-sm text-slate-300">
                  <span className="font-bold text-amber-400">{staffMembers.filter(s => s.role === 'Manager').length}</span> Pengurus
                </span>
                <span className="text-sm text-slate-300">
                  <span className="font-bold text-teal-400">{staffMembers.filter(s => s.role === 'Staff').length}</span> Staf
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-500" />
            <h4 className="font-medium text-white">Kaedah Pembayaran</h4>
          </div>
          <button
            onClick={() => setCurrentStep(4)}
            className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{enabledPayments.length}</p>
              <p className="text-xs text-slate-400">Kaedah Aktif</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {enabledPayments.map(method => (
                <span
                  key={method.id}
                  className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {method.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-6">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Apa Seterusnya?
        </h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <span>Tour interaktif akan tunjukkan fungsi-fungsi utama sistem</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <span>Pusat Bantuan sentiasa tersedia untuk rujukan</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <span>Semua tetapan boleh diubah kemudian di menu Tetapan</span>
          </li>
        </ul>
      </div>
    </div>
  );
}




