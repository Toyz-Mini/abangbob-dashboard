'use client';

import { useEffect } from 'react';
import { useSetup, PaymentMethod } from '@/lib/contexts/SetupContext';
import { 
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  CheckCircle2,
  XCircle,
  Wallet,
  Building2
} from 'lucide-react';

interface Props {
  onValidChange: (isValid: boolean) => void;
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  ewallet: Smartphone,
  qr: QrCode,
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'text-green-400 bg-green-500/10',
  card: 'text-blue-400 bg-blue-500/10',
  ewallet: 'text-purple-400 bg-purple-500/10',
  qr: 'text-orange-400 bg-orange-500/10',
};

export default function PaymentSetupStep({ onValidChange }: Props) {
  const { setupData, updatePaymentMethods } = useSetup();
  const { paymentMethods } = setupData;

  // At least cash should be enabled
  useEffect(() => {
    const hasEnabled = paymentMethods.some(m => m.enabled);
    onValidChange(hasEnabled);
  }, [paymentMethods, onValidChange]);

  const togglePaymentMethod = (id: string) => {
    const updated = paymentMethods.map(method => 
      method.id === id ? { ...method, enabled: !method.enabled } : method
    );
    updatePaymentMethods(updated);
  };

  const groupedMethods = {
    cash: paymentMethods.filter(m => m.type === 'cash'),
    card: paymentMethods.filter(m => m.type === 'card'),
    ewallet: paymentMethods.filter(m => m.type === 'ewallet'),
    qr: paymentMethods.filter(m => m.type === 'qr'),
  };

  const enabledCount = paymentMethods.filter(m => m.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-teal-500" />
          Kaedah Pembayaran
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Pilih kaedah pembayaran yang anda terima di kedai anda.
        </p>
      </div>

      {/* Cash Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          Tunai
        </h4>
        {groupedMethods.cash.map(method => (
          <PaymentMethodCard 
            key={method.id} 
            method={method} 
            onToggle={() => togglePaymentMethod(method.id)} 
          />
        ))}
      </div>

      {/* Card Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Kad Kredit / Debit
        </h4>
        {groupedMethods.card.map(method => (
          <PaymentMethodCard 
            key={method.id} 
            method={method} 
            onToggle={() => togglePaymentMethod(method.id)} 
          />
        ))}
        {groupedMethods.card.some(m => m.enabled) && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              Untuk terima bayaran kad, anda perlu mendaftar dengan penyedia terminal seperti 
              <span className="font-medium"> iPay88, Fiuu, atau Revenue Monster</span>.
            </p>
          </div>
        )}
      </div>

      {/* E-Wallet Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          E-Wallet
        </h4>
        {groupedMethods.ewallet.map(method => (
          <PaymentMethodCard 
            key={method.id} 
            method={method} 
            onToggle={() => togglePaymentMethod(method.id)} 
          />
        ))}
      </div>

      {/* QR Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          QR Payment
        </h4>
        {groupedMethods.qr.map(method => (
          <PaymentMethodCard 
            key={method.id} 
            method={method} 
            onToggle={() => togglePaymentMethod(method.id)} 
          />
        ))}
        {groupedMethods.qr.some(m => m.enabled) && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <p className="text-sm text-orange-300">
              DuitNow QR ialah sistem pembayaran kebangsaan. Daftar melalui bank anda untuk mendapat QR code.
            </p>
          </div>
        )}
      </div>

      {/* Bank Transfer - Additional */}
      <div className="border-t border-slate-700 pt-6">
        <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-600">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">Pindahan Bank (Manual)</h4>
              <p className="text-sm text-slate-400 mt-1">
                Untuk pembayaran besar atau deposit, anda boleh terima pindahan bank manual. 
                Maklumat bank boleh dikonfigurasi kemudian di Tetapan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-center justify-between">
        <span className="text-teal-400">Kaedah Aktif</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{enabledCount}</span>
          <span className="text-slate-400">/ {paymentMethods.length}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCard({ 
  method, 
  onToggle 
}: { 
  method: PaymentMethod; 
  onToggle: () => void;
}) {
  const Icon = PAYMENT_ICONS[method.type] || CreditCard;
  const colorClass = PAYMENT_COLORS[method.type] || 'text-slate-400 bg-slate-500/10';
  const [iconColor, bgColor] = colorClass.split(' ');

  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
        ${method.enabled 
          ? 'border-teal-500 bg-teal-500/5' 
          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className={`font-medium ${method.enabled ? 'text-white' : 'text-slate-400'}`}>
          {method.name}
        </span>
      </div>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center transition-all
        ${method.enabled ? 'bg-teal-500' : 'bg-slate-600'}
      `}>
        {method.enabled ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : (
          <XCircle className="w-4 h-4 text-slate-400" />
        )}
      </div>
    </button>
  );
}


