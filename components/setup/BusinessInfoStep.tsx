'use client';

import { useEffect, useState } from 'react';
import { useSetup } from '@/lib/contexts/SetupContext';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Percent,
  ImagePlus,
  Globe
} from 'lucide-react';

interface Props {
  onValidChange: (isValid: boolean) => void;
}

const DAYS = [
  { key: 'monday', label: 'Isnin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Khamis' },
  { key: 'friday', label: 'Jumaat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Ahad' },
];

export default function BusinessInfoStep({ onValidChange }: Props) {
  const { setupData, updateBusinessInfo } = useSetup();
  const { businessInfo } = setupData;
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Validate on change
  useEffect(() => {
    const isValid = 
      businessInfo.name.trim().length > 0 &&
      businessInfo.address.trim().length > 0 &&
      businessInfo.phone.trim().length > 0;
    onValidChange(isValid);
  }, [businessInfo, onValidChange]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoPreview(dataUrl);
        updateBusinessInfo({ logo: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const newHours = { ...businessInfo.operatingHours };
    if (field === 'closed') {
      newHours[day] = { ...newHours[day], closed: value as boolean };
    } else {
      newHours[day] = { ...newHours[day], [field]: value as string };
    }
    updateBusinessInfo({ operatingHours: newHours });
  };

  return (
    <div className="space-y-8">
      {/* Logo & Name Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Upload */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-slate-300 mb-3">Logo Perniagaan</label>
          <div className="relative">
            <div className={`
              w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center
              transition-all cursor-pointer hover:border-teal-500 hover:bg-slate-700/50
              ${logoPreview || businessInfo.logo 
                ? 'border-teal-500 bg-slate-700/50' 
                : 'border-slate-600 bg-slate-800'
              }
            `}>
              {logoPreview || businessInfo.logo ? (
                <img 
                  src={logoPreview || businessInfo.logo} 
                  alt="Logo" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <ImagePlus className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Klik untuk muat naik</p>
        </div>

        {/* Name & Contact */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Building2 className="w-4 h-4 text-teal-500" />
              Nama Perniagaan *
            </label>
            <input
              type="text"
              value={businessInfo.name}
              onChange={(e) => updateBusinessInfo({ name: e.target.value })}
              placeholder="cth: Restoran AbangBob"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Phone className="w-4 h-4 text-teal-500" />
                No. Telefon *
              </label>
              <input
                type="tel"
                value={businessInfo.phone}
                onChange={(e) => updateBusinessInfo({ phone: e.target.value })}
                placeholder="cth: 012-3456789"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 text-teal-500" />
                Emel (Pilihan)
              </label>
              <input
                type="email"
                value={businessInfo.email}
                onChange={(e) => updateBusinessInfo({ email: e.target.value })}
                placeholder="cth: info@kedai.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <MapPin className="w-4 h-4 text-teal-500" />
          Alamat *
        </label>
        <textarea
          value={businessInfo.address}
          onChange={(e) => updateBusinessInfo({ address: e.target.value })}
          placeholder="Masukkan alamat penuh perniagaan anda"
          rows={2}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* Currency & Timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Globe className="w-4 h-4 text-teal-500" />
            Mata Wang
          </label>
          <select
            value={businessInfo.currency}
            onChange={(e) => updateBusinessInfo({ currency: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="MYR">MYR - Ringgit Malaysia</option>
            <option value="SGD">SGD - Dolar Singapura</option>
            <option value="IDR">IDR - Rupiah Indonesia</option>
            <option value="USD">USD - Dolar AS</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Zon Waktu
          </label>
          <select
            value={businessInfo.timezone}
            onChange={(e) => updateBusinessInfo({ timezone: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="Asia/Kuala_Lumpur">Malaysia (GMT+8)</option>
            <option value="Asia/Singapore">Singapura (GMT+8)</option>
            <option value="Asia/Jakarta">Jakarta (GMT+7)</option>
          </select>
        </div>
      </div>

      {/* Tax & Service Charge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Percent className="w-4 h-4 text-teal-500" />
            Cukai (SST/GST %)
          </label>
          <input
            type="number"
            value={businessInfo.taxRate}
            onChange={(e) => updateBusinessInfo({ taxRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            step="0.1"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Percent className="w-4 h-4 text-teal-500" />
            Caj Perkhidmatan (%)
          </label>
          <input
            type="number"
            value={businessInfo.serviceCharge}
            onChange={(e) => updateBusinessInfo({ serviceCharge: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            step="0.1"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Operating Hours */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
          <Clock className="w-4 h-4 text-teal-500" />
          Waktu Operasi
        </label>
        <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
          {DAYS.map(({ key, label }) => {
            const dayHours = businessInfo.operatingHours[key];
            return (
              <div key={key} className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <span className="w-20 text-sm text-slate-300">{label}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!dayHours?.closed}
                    onChange={(e) => handleDayChange(key, 'closed', !e.target.checked)}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-400">Buka</span>
                </label>
                {!dayHours?.closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={dayHours?.open || '09:00'}
                      onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                      className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="time"
                      value={dayHours?.close || '22:00'}
                      onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                      className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
                {dayHours?.closed && (
                  <span className="text-sm text-slate-500 italic">Tutup</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

