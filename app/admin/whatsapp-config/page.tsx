'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import GlassCard from '@/components/GlassCard';
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Activity,
  LogOut
} from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

import { QRCodeSVG } from 'qrcode.react';

// Types
type ConnectionStatus = 'open' | 'connecting' | 'close';

export default function WhatsAppConfigPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Test Message Form
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Poll status every 3 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Pointing to Production Railway URL
        const res = await fetch('https://abangbob-whatsapp-gateway-production.up.railway.app/status');
        const data = await res.json();
        
        setStatus(data.status);
        
        // Update QR only if we are not connected
        if (data.status !== 'open' && data.qr && data.qr !== 'none') {
           setQrCode(data.qr);
        } else {
           setQrCode(null);
        }
      } catch (err) {
        console.error('Failed to fetch WhatsApp status', err);
        setStatus('close');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) {
        showToast('Sila isi nombor telefon dan mesej', 'error');
        return;
    }

    setIsSending(true);
    try {
        const res = await fetch('https://abangbob-whatsapp-gateway-production.up.railway.app/send-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });
        
        const result = await res.json();
        
        if (res.ok) {
            showToast('Mesej berjaya dihantar!', 'success');
            setMessage(''); // Clear message but keep phone
        } else {
            showToast(result.error || 'Gagal menghantar mesej', 'error');
        }
    } catch (err) {
        showToast('Ralat server', 'error');
    } finally {
        setIsSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Smartphone className="text-green-500" size={32} />
              WhatsApp Gateway
            </h1>
            <p className="text-gray-500 mt-1">
              Uruskan sambungan WhatsApp bot AbangBob di sini.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
            <Activity size={16} className={status === 'open' ? 'text-green-500' : status === 'connecting' ? 'text-yellow-500' : 'text-red-500'} />
            <span className="text-sm font-bold uppercase">
                {status === 'open' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Connection Status */}
            <GlassCard className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                {status === 'open' ? (
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sistem Bersambung</h2>
                        <p className="text-gray-500">Bot WhatsApp sedang aktif dan bersedia untuk menghantar notifikasi.</p>
                        
                        <div className="pt-6">
                            <button 
                                className="px-6 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                onClick={() => showToast('Sila delete folder auth manual di server untuk logout', 'info')}
                            >
                                <LogOut size={16} />
                                Putuskan Sambungan
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 w-full max-w-sm">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Imbas Kod QR</h2>
                            <p className="text-sm text-gray-500">Buka WhatsApp &gt; Linked Devices &gt; Link a Device</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 mx-auto w-64 h-64 flex items-center justify-center relative overflow-hidden">
                            {qrCode ? (
                                <div className="text-center">
                                    <QRCodeSVG value={qrCode} size={200} level="H" includeMargin={true} />
                                    <p className="text-xs text-gray-500 mt-2">Scan with WhatsApp</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <RefreshCw size={24} className="animate-spin" />
                                    <span className="text-xs">Menunggu QR Code...</span>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-gray-400 bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                            Nota: Pastikan server 'whatsapp-service' sedang berjalan di port 4000.
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Right Column: Test Sender */}
            <div className="space-y-6">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Send size={20} className="text-primary" />
                        Uji Penghantaran
                    </h3>
                    
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                No. Telefon Penerima
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g. 60123456789"
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-1">Gunakan format antarabangsa (60...)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mesej
                            </label>
                            <textarea 
                                rows={4}
                                placeholder="Tulis mesej percubaan di sini..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSending || status !== 'open'}
                            className={`w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
                                ${status === 'open' 
                                    ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20' 
                                    : 'bg-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {isSending ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                            {isSending ? 'Menghantar...' : 'Hantar Mesej'}
                        </button>
                    </form>
                </GlassCard>

                {/* Quick Tips */}
                <GlassCard className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Tips Penggunaan
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-disc pl-4">
                        <li>Jangan spam mesej marketing terlalu kerap (risiko ban).</li>
                        <li>Pastikan telefon yang di-scan sentiasa ada internet.</li>
                        <li>Gunakan nombor bisnes rasmi AbangBob.</li>
                    </ul>
                </GlassCard>
            </div>
        </div>

      </div>
    </MainLayout>
  );
}
