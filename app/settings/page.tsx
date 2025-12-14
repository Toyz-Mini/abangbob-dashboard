'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataMigration from '@/components/DataMigration';
import { useAuth } from '@/lib/contexts/AuthContext';
import LogoUpload from '@/components/LogoUpload';
import ReceiptDesigner from '@/components/ReceiptDesigner';
import SupabaseSetupChecker from '@/components/SupabaseSetupChecker';
import { ReceiptSettings, PrinterSettings, DEFAULT_RECEIPT_SETTINGS, DEFAULT_PRINTER_SETTINGS } from '@/lib/types';
import { thermalPrinter, loadReceiptSettings, saveReceiptSettings } from '@/lib/services';
import { 
  Settings, 
  Store, 
  Clock, 
  Receipt,
  Download,
  Upload,
  Trash2,
  Save,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Users,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Cloud,
  LogOut,
  User,
  CreditCard,
  Palette,
  Lock,
  Instagram,
  Facebook,
  MessageCircle,
  Printer,
  Usb,
  Wifi,
  WifiOff,
  Play,
  Power,
} from 'lucide-react';

type SettingSection = 'outlet' | 'operations' | 'receipt' | 'printer' | 'data' | 'notifications' | 'supabase' | 'payment' | 'appearance' | 'security';

export default function SettingsPage() {
  const { isInitialized } = useStore();
  const { currentStaff, isSupabaseConnected, logoutStaff } = useAuth();
  const { t, language } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingSection>('outlet');
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Days of week with translations
  const DAYS_OF_WEEK = useMemo(() => language === 'en' 
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'], [language]);

  // Outlet settings
  const [outletSettings, setOutletSettings] = useState({
    name: 'AbangBob Nasi Lemak & Burger',
    address: 'Lot 123, Simpang 456, Kampung ABC, Brunei',
    phone: '+673 712 3456',
    email: 'order@abangbob.com',
    currency: 'BND',
    timezone: 'Asia/Brunei',
    taxRate: 0,
    logoUrl: '',
  });

  // Social media settings
  const [socialMedia, setSocialMedia] = useState({
    instagram: '@abangbob.bn',
    facebook: 'abangbobnl',
    tiktok: '@abangbob.bn',
    whatsapp: '+673 712 3456',
  });

  // Payment method settings
  const [paymentSettings, setPaymentSettings] = useState({
    cash: true,
    card: true,
    qrCode: true,
    dstPay: false,
    bibdPay: false,
    orderNumberPrefix: 'AB',
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark' as 'light' | 'dark' | 'auto',
    compactMode: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeoutMinutes: 480,
    pinMinLength: 4,
    requireClockInPhoto: true,
    autoLockRegister: true,
  });

  // Operating hours
  const [operatingHours, setOperatingHours] = useState(
    DAYS_OF_WEEK.map((day, idx) => ({
      dayOfWeek: idx,
      dayName: day,
      isOpen: idx !== 0, // Closed on Sunday
      openTime: '08:00',
      closeTime: '22:00',
    }))
  );

  // Receipt settings - use new enhanced type
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);

  // Printer settings
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [isPrinterConnecting, setIsPrinterConnecting] = useState(false);

  // Load saved receipt settings on mount
  useEffect(() => {
    const savedSettings = loadReceiptSettings();
    setReceiptSettings(savedSettings);
  }, []);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    newOrderSound: true,
    dailySummary: true,
    equipmentReminder: true,
    emailNotifications: false,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, would save to backend/localStorage here
    localStorage.setItem('abangbob_outlet_settings', JSON.stringify(outletSettings));
    localStorage.setItem('abangbob_operating_hours', JSON.stringify(operatingHours));
    localStorage.setItem('abangbob_receipt_settings', JSON.stringify(receiptSettings));
    localStorage.setItem('abangbob_notification_settings', JSON.stringify(notificationSettings));
    localStorage.setItem('abangbob_social_media', JSON.stringify(socialMedia));
    localStorage.setItem('abangbob_payment_settings', JSON.stringify(paymentSettings));
    localStorage.setItem('abangbob_appearance_settings', JSON.stringify(appearanceSettings));
    localStorage.setItem('abangbob_security_settings', JSON.stringify(securitySettings));
    
    setIsSaving(false);
    alert(t('settings.saveSuccess'));
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      outlet: outletSettings,
      operatingHours,
      receiptSettings,
      notificationSettings,
      socialMedia,
      paymentSettings,
      appearanceSettings,
      securitySettings,
      // Would include all store data in real implementation
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abangbob-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleResetData = () => {
    // Clear all localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('abangbob_')) {
        localStorage.removeItem(key);
      }
    });
    
    setShowResetModal(false);
    alert(t('settings.resetSuccess'));
    window.location.reload();
  };

  const updateOperatingHour = (dayIdx: number, field: string, value: string | boolean) => {
    setOperatingHours(prev => prev.map((day, idx) => 
      idx === dayIdx ? { ...day, [field]: value } : day
    ));
  };

  // Menu items with translations
  const menuItems = [
    { id: 'outlet', labelKey: 'settings.outletProfile', icon: Store },
    { id: 'operations', labelKey: 'settings.operatingHours', icon: Clock },
    { id: 'receipt', labelKey: 'settings.receiptSettings', icon: Receipt },
    { id: 'printer', labelKey: 'Printer & Drawer', icon: Printer },
    { id: 'payment', labelKey: 'settings.paymentMethods', icon: CreditCard },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
    { id: 'security', labelKey: 'settings.security', icon: Lock },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'supabase', labelKey: 'settings.supabaseCloud', icon: Cloud },
    { id: 'data', labelKey: 'settings.dataBackup', icon: Database },
  ];

  // Printer connection handlers
  const handleConnectPrinter = async () => {
    setIsPrinterConnecting(true);
    try {
      const connected = await thermalPrinter.connect();
      if (connected) {
        setPrinterSettings(prev => ({ ...prev, isConnected: true }));
        alert('Printer berjaya disambung!');
      } else {
        alert('Gagal menyambung printer. Sila pastikan printer disambung dan cuba lagi.');
      }
    } catch (error) {
      console.error('Printer connection error:', error);
      alert('Ralat menyambung printer. Pastikan browser menyokong Web Serial API.');
    } finally {
      setIsPrinterConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    await thermalPrinter.disconnect();
    setPrinterSettings(prev => ({ ...prev, isConnected: false }));
  };

  const handleTestPrint = async () => {
    if (thermalPrinter.isConnected()) {
      try {
        await thermalPrinter.sendCommand(new Uint8Array([0x1B, 0x40])); // Init
        await thermalPrinter.printText('=== TEST PRINT ===', { align: 'center', bold: true });
        await thermalPrinter.printText('Printer berfungsi dengan baik!', { align: 'center' });
        await thermalPrinter.printText(new Date().toLocaleString('ms-MY'), { align: 'center' });
        await thermalPrinter.feedLines(3);
        await thermalPrinter.cutPaper();
        alert('Test print berjaya!');
      } catch (error) {
        console.error('Test print error:', error);
        alert('Gagal mencetak. Sila cuba lagi.');
      }
    } else {
      alert('Sila sambung printer terlebih dahulu.');
    }
  };

  const handleTestDrawer = async () => {
    if (thermalPrinter.isConnected()) {
      try {
        await thermalPrinter.openCashDrawer();
        alert('Cash drawer telah dibuka!');
      } catch (error) {
        console.error('Drawer error:', error);
        alert('Gagal membuka drawer. Sila pastikan drawer disambung ke printer.');
      }
    } else {
      alert('Sila sambung printer terlebih dahulu.');
    }
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

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {t('settings.title')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('settings.subtitle')}
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <><LoadingSpinner size="sm" /> {t('settings.saving')}</>
            ) : (
              <><Save size={18} /> {t('settings.saveSettings')}</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
          {/* Sidebar Navigation */}
          <div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                <strong>{t('settings.settingsMenu')}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as SettingSection)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: activeSection === item.id ? 'var(--primary-light)' : 'transparent',
                        color: activeSection === item.id ? 'var(--primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderLeft: activeSection === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                        fontWeight: activeSection === item.id ? 600 : 400,
                      }}
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">{t('settings.systemStatus')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>Supabase</span>
                  <span className={`badge ${isSupabaseConnected ? 'badge-success' : 'badge-warning'}`}>
                    {isSupabaseConnected ? t('settings.connected') : t('settings.offline')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>Storage</span>
                  <span className="badge badge-info">localStorage</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{t('settings.version')}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>v1.0.0</span>
                </div>
              </div>
            </div>

            {/* Current Staff */}
            {currentStaff && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} />
                    {t('settings.staffLogin')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, var(--primary), #0d9488)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700
                  }}>
                    {currentStaff.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{currentStaff.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentStaff.role}</div>
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={logoutStaff}
                  style={{ width: '100%' }}
                >
                  <LogOut size={14} />
                  {t('topnav.logout')}
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 lg:col-span-3">
            {/* Outlet Profile */}
            {activeSection === 'outlet' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={20} />
                    {t('settings.outletProfile')}
                  </div>
                  <div className="card-subtitle">{t('settings.outletProfileDesc')}</div>
                </div>

                {/* Logo Upload Section */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Logo Kedai</label>
                    <LogoUpload
                      currentLogoUrl={outletSettings.logoUrl}
                      onLogoChange={(url) => setOutletSettings(prev => ({ ...prev, logoUrl: url || '' }))}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('settings.outletName')}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={outletSettings.name}
                        onChange={(e) => setOutletSettings(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('settings.address')}</label>
                      <textarea
                        className="form-input"
                        value={outletSettings.address}
                        onChange={(e) => setOutletSettings(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('settings.phone')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={outletSettings.phone}
                      onChange={(e) => setOutletSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('settings.email')}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={outletSettings.email}
                      onChange={(e) => setOutletSettings(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('settings.currency')}</label>
                    <select
                      className="form-select"
                      value={outletSettings.currency}
                      onChange={(e) => setOutletSettings(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="BND">BND (Brunei Dollar)</option>
                      <option value="MYR">MYR (Ringgit)</option>
                      <option value="SGD">SGD (Singapore Dollar)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('settings.timezone')}</label>
                    <select
                      className="form-select"
                      value={outletSettings.timezone}
                      onChange={(e) => setOutletSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="Asia/Brunei">Brunei (UTC+8)</option>
                      <option value="Asia/Kuala_Lumpur">Malaysia (UTC+8)</option>
                      <option value="Asia/Singapore">Singapore (UTC+8)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('settings.taxRate')} (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={outletSettings.taxRate}
                      onChange={(e) => setOutletSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Social Media Section */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                    <MessageCircle size={18} />
                    Media Sosial
                  </h4>
                  <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Instagram size={16} />
                        Instagram
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={socialMedia.instagram}
                        onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Facebook size={16} />
                        Facebook
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={socialMedia.facebook}
                        onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook: e.target.value }))}
                        placeholder="Page name atau URL"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        TikTok
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={socialMedia.tiktok}
                        onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok: e.target.value }))}
                        placeholder="@username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageCircle size={16} />
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={socialMedia.whatsapp}
                        onChange={(e) => setSocialMedia(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="+673 XXX XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-outlet Ready Banner */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #818cf8'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Globe size={18} color="#4f46e5" />
                    <strong style={{ color: '#4f46e5' }}>{t('settings.multiOutletReady')}</strong>
                    <span className="badge badge-info">{t('settings.comingSoon')}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4338ca' }}>
                    {t('settings.multiOutletDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Operating Hours */}
            {activeSection === 'operations' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} />
                    {t('settings.operatingHours')}
                  </div>
                  <div className="card-subtitle">{t('settings.operatingHoursDesc')}</div>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('settings.day')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('settings.open')}</th>
                      <th>{t('settings.close')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatingHours.map((day, idx) => (
                      <tr key={day.dayOfWeek}>
                        <td style={{ fontWeight: 600 }}>{DAYS_OF_WEEK[idx]}</td>
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(e) => updateOperatingHour(idx, 'isOpen', e.target.checked)}
                              style={{ width: '18px', height: '18px' }}
                            />
                            <span className={`badge ${day.isOpen ? 'badge-success' : 'badge-warning'}`}>
                              {day.isOpen ? t('settings.open') : t('settings.closed')}
                            </span>
                          </label>
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-input"
                            value={day.openTime}
                            onChange={(e) => updateOperatingHour(idx, 'openTime', e.target.value)}
                            disabled={!day.isOpen}
                            style={{ width: '120px', opacity: day.isOpen ? 1 : 0.5 }}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-input"
                            value={day.closeTime}
                            onChange={(e) => updateOperatingHour(idx, 'closeTime', e.target.value)}
                            disabled={!day.isOpen}
                            style={{ width: '120px', opacity: day.isOpen ? 1 : 0.5 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Receipt Settings - Enhanced with ReceiptDesigner */}
            {activeSection === 'receipt' && (
              <div>
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Receipt size={20} />
                      Receipt Designer
                    </div>
                    <div className="card-subtitle">
                      Customize receipt dengan logo, teks, QR code dan banyak lagi. Preview secara langsung!
                    </div>
                  </div>
                </div>

                <ReceiptDesigner
                  initialSettings={receiptSettings}
                  onSettingsChange={(newSettings) => setReceiptSettings(newSettings)}
                  onSave={() => {
                    saveReceiptSettings(receiptSettings);
                    alert('Tetapan receipt berjaya disimpan!');
                  }}
                />
              </div>
            )}

            {/* Printer & Hardware Settings */}
            {activeSection === 'printer' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Printer size={20} />
                    Printer & Cash Drawer
                  </div>
                  <div className="card-subtitle">
                    Sambungkan thermal printer USB dan cash drawer
                  </div>
                </div>

                {/* Browser Support Notice */}
                {!thermalPrinter.isSupported() && (
                  <div style={{
                    padding: '1rem',
                    background: '#fef3c7',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}>
                    <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>
                        Browser Tidak Disokong
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#a16207' }}>
                        Browser anda tidak menyokong Web Serial API. Sila gunakan Chrome, Edge, atau Opera untuk sambungan printer terus.
                        Anda masih boleh menggunakan browser print sebagai alternatif.
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Status */}
                <div style={{
                  padding: '1.25rem',
                  background: printerSettings.isConnected ? '#d1fae5' : 'var(--gray-100)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: printerSettings.isConnected ? '#059669' : 'var(--gray-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}>
                      {printerSettings.isConnected ? <Wifi size={24} /> : <WifiOff size={24} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {printerSettings.isConnected ? 'Printer Disambung' : 'Printer Tidak Disambung'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {printerSettings.isConnected 
                          ? 'Thermal printer sedia untuk digunakan' 
                          : 'Klik "Sambung Printer" untuk mula'}
                      </div>
                    </div>
                  </div>
                  
                  {printerSettings.isConnected ? (
                    <button
                      className="btn btn-outline"
                      onClick={handleDisconnectPrinter}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Power size={16} />
                      Putuskan
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleConnectPrinter}
                      disabled={isPrinterConnecting || !thermalPrinter.isSupported()}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {isPrinterConnecting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Menyambung...
                        </>
                      ) : (
                        <>
                          <Usb size={16} />
                          Sambung Printer
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Paper Width Setting */}
                <div className="form-group">
                  <label className="form-label">Saiz Kertas Receipt</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${printerSettings.paperWidth === '58mm' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPrinterSettings(prev => ({ ...prev, paperWidth: '58mm' }))}
                      style={{ flex: 1 }}
                    >
                      58mm (Kecil)
                    </button>
                    <button
                      type="button"
                      className={`btn ${printerSettings.paperWidth === '80mm' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPrinterSettings(prev => ({ ...prev, paperWidth: '80mm' }))}
                      style={{ flex: 1 }}
                    >
                      80mm (Standard)
                    </button>
                  </div>
                </div>

                {/* Auto-cut Setting */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Auto Cut Kertas</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Potong kertas secara automatik selepas cetak
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={printerSettings.autoCut}
                      onChange={(e) => setPrinterSettings(prev => ({ ...prev, autoCut: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Buka Cash Drawer Selepas Bayar Tunai</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Drawer akan dibuka secara automatik untuk bayaran cash
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={printerSettings.openDrawerOnCashPayment}
                      onChange={(e) => setPrinterSettings(prev => ({ ...prev, openDrawerOnCashPayment: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>

                {/* Test Buttons */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  paddingTop: '1.5rem', 
                  borderTop: '1px solid var(--gray-200)',
                  display: 'flex',
                  gap: '0.75rem',
                }}>
                  <button
                    className="btn btn-outline"
                    onClick={handleTestPrint}
                    disabled={!printerSettings.isConnected}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}
                  >
                    <Play size={16} />
                    Test Print
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={handleTestDrawer}
                    disabled={!printerSettings.isConnected}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}
                  >
                    <DollarSign size={16} />
                    Test Cash Drawer
                  </button>
                </div>

                {/* Help Section */}
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #3b82f6',
                }}>
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
                    Panduan Sambungan
                  </div>
                  <ol style={{ fontSize: '0.875rem', color: '#1e40af', paddingLeft: '1.25rem', margin: 0 }}>
                    <li>Pastikan thermal printer disambung ke komputer via USB</li>
                    <li>Klik "Sambung Printer" dan pilih printer dari senarai</li>
                    <li>Untuk cash drawer, sambung kabel RJ12 dari drawer ke port DK pada printer</li>
                    <li>Gunakan "Test Print" dan "Test Cash Drawer" untuk memastikan semua berfungsi</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Payment Methods Settings */}
            {activeSection === 'payment' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={20} />
                    Kaedah Pembayaran
                  </div>
                  <div className="card-subtitle">Tetapkan kaedah pembayaran yang diterima</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#22c55e', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Tunai (Cash)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Terima bayaran tunai</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.cash}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, cash: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Kad (Card)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Debit/Credit card</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.card}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, card: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#8b5cf6', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 12h.01"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>QR Code</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Imbas & bayar</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.qrCode}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, qrCode: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f97316', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                        DST
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>DST Pay</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>E-wallet DST</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.dstPay}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, dstPay: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#0891b2', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.6rem' }}>
                        BIBD
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>BIBD Pay</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>E-wallet BIBD</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.bibdPay}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, bibdPay: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Tetapan Pesanan</h4>
                  <div className="form-group">
                    <label className="form-label">Prefix Nombor Pesanan</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={paymentSettings.orderNumberPrefix}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, orderNumberPrefix: e.target.value.toUpperCase() }))}
                        maxLength={4}
                        style={{ width: '100px' }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>- 001, - 002, ...</span>
                    </div>
                    <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      Contoh: AB-001, AB-002
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={20} />
                    Paparan
                  </div>
                  <div className="card-subtitle">Sesuaikan rupa aplikasi</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tema</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { value: 'light', label: 'Cerah', icon: '☀️', bg: '#f8fafc', border: '#e2e8f0' },
                      { value: 'dark', label: 'Gelap', icon: '🌙', bg: '#1e293b', border: '#334155' },
                      { value: 'auto', label: 'Auto', icon: '🔄', bg: 'linear-gradient(135deg, #f8fafc 50%, #1e293b 50%)', border: '#94a3b8' },
                    ].map(theme => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: theme.value as 'light' | 'dark' | 'auto' }))}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          border: `2px solid ${appearanceSettings.theme === theme.value ? 'var(--primary)' : theme.border}`,
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--card-bg)',
                          cursor: 'pointer',
                          minWidth: '100px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '60px',
                          height: '40px',
                          background: theme.bg,
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}>
                          {theme.icon}
                        </div>
                        <span style={{ 
                          fontWeight: appearanceSettings.theme === theme.value ? 600 : 400,
                          color: appearanceSettings.theme === theme.value ? 'var(--primary)' : 'var(--text-primary)'
                        }}>
                          {theme.label}
                        </span>
                        {appearanceSettings.theme === theme.value && (
                          <CheckCircle size={16} color="var(--primary)" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Mod Kompak</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Kurangkan saiz elemen untuk lebih banyak kandungan
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={appearanceSettings.compactMode}
                      onChange={(e) => setAppearanceSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={20} />
                    Keselamatan
                  </div>
                  <div className="card-subtitle">Tetapan keselamatan sistem</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tamat Masa Sesi (minit)</label>
                    <select
                      className="form-select"
                      value={securitySettings.sessionTimeoutMinutes}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
                    >
                      <option value={30}>30 minit</option>
                      <option value={60}>1 jam</option>
                      <option value={120}>2 jam</option>
                      <option value={240}>4 jam</option>
                      <option value={480}>8 jam</option>
                      <option value={0}>Tiada (sentiasa aktif)</option>
                    </select>
                    <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      Auto logout selepas tempoh tidak aktif
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Panjang Minimum PIN</label>
                    <select
                      className="form-select"
                      value={securitySettings.pinMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, pinMinLength: Number(e.target.value) }))}
                    >
                      <option value={4}>4 digit</option>
                      <option value={5}>5 digit</option>
                      <option value={6}>6 digit</option>
                    </select>
                    <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      Untuk PIN login staf
                    </small>
                  </div>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Wajib Foto Clock-In</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Staf perlu ambil gambar semasa clock-in/out
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.requireClockInPhoto}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireClockInPhoto: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Auto Kunci Kaunter</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Kunci skrin POS bila tidak aktif
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.autoLockRegister}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, autoLockRegister: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={20} />
                    {t('settings.notificationSettings')}
                  </div>
                  <div className="card-subtitle">{t('settings.notificationSettingsDesc')}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t('settings.lowStockAlert')}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {t('settings.lowStockAlertDesc')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowStockAlert}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t('settings.newOrderSound')}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {t('settings.newOrderSoundDesc')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.newOrderSound}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, newOrderSound: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t('settings.dailySummary')}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {t('settings.dailySummaryDesc')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailySummary}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailySummary: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t('settings.equipmentReminder')}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {t('settings.equipmentReminderDesc')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.equipmentReminder}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, equipmentReminder: e.target.checked }))}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Supabase & Cloud Settings */}
            {activeSection === 'supabase' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Storage Setup Checker */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cloud size={20} />
                      Supabase Storage Configuration
                    </div>
                    <div className="card-subtitle">Check dan setup storage untuk upload logo dan dokumen</div>
                  </div>
                  <SupabaseSetupChecker />
                </div>

                {/* Connection Status */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cloud size={20} />
                      {t('settings.supabaseStatus')}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: isSupabaseConnected ? '#d1fae5' : '#fef3c7',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    {isSupabaseConnected ? (
                      <>
                        <CheckCircle size={32} color="#059669" />
                        <div>
                          <div style={{ fontWeight: 700, color: '#059669' }}>{t('settings.supabaseConnected')}</div>
                          <div style={{ fontSize: '0.875rem', color: '#047857' }}>
                            {t('settings.supabaseConnectedDesc')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={32} color="#d97706" />
                        <div>
                          <div style={{ fontWeight: 700, color: '#92400e' }}>{t('settings.supabaseOffline')}</div>
                          <div style={{ fontSize: '0.875rem', color: '#a16207' }}>
                            {t('settings.supabaseOfflineDesc')}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {!isSupabaseConnected && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        {t('settings.supabaseSetupTitle')}
                      </p>
                      <ol style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                        <li>{t('settings.supabaseStep1')}</li>
                        <li>{t('settings.supabaseStep2')}</li>
                        <li>{t('settings.supabaseStep3')}</li>
                        <li>{t('settings.supabaseStep4')}</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Data Migration */}
                <DataMigration />

                {/* Features */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{t('settings.supabaseFeatures')}</div>
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--gray-100)', 
                      borderRadius: 'var(--radius-md)',
                      opacity: isSupabaseConnected ? 1 : 0.5
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>🔄 {t('settings.realTimeSync')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('settings.realTimeSyncDesc')}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--gray-100)', 
                      borderRadius: 'var(--radius-md)',
                      opacity: isSupabaseConnected ? 1 : 0.5
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>🔐 {t('settings.authentication')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('settings.authenticationDesc')}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--gray-100)', 
                      borderRadius: 'var(--radius-md)',
                      opacity: isSupabaseConnected ? 1 : 0.5
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>☁️ {t('settings.cloudStorage')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('settings.cloudStorageDesc')}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--gray-100)', 
                      borderRadius: 'var(--radius-md)',
                      opacity: isSupabaseConnected ? 1 : 0.5
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📱 {t('settings.multiDevice')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('settings.multiDeviceDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeSection === 'data' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={20} />
                    {t('settings.dataManagement')}
                  </div>
                  <div className="card-subtitle">{t('settings.dataManagementDesc')}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem' }}>
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'var(--gray-100)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <Download size={32} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('settings.exportData')}</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {t('settings.exportDataDesc')}
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
                      <Download size={16} />
                      {t('common.export')}
                    </button>
                  </div>

                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'var(--gray-100)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <Upload size={32} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('settings.importData')}</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {t('settings.importDataDesc')}
                    </p>
                    <button className="btn btn-outline" disabled>
                      <Upload size={16} />
                      {t('common.import')} ({t('settings.comingSoon')})
                    </button>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.5rem', 
                  background: '#fee2e2', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #ef4444'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={20} color="#dc2626" />
                    <strong style={{ color: '#dc2626' }}>{t('settings.dangerZone')}</strong>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '1rem' }}>
                    {t('settings.dangerZoneDesc')}
                  </p>
                  <button className="btn btn-danger" onClick={() => setShowResetModal(true)}>
                    <Trash2 size={16} />
                    {t('settings.resetAllData')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title={t('settings.exportData')}
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: '#dbeafe', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Download size={28} color="#3b82f6" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('settings.exportModalDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => setShowExportModal(false)} style={{ flex: 1 }}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleExportData} style={{ flex: 1 }}>
              <Download size={16} />
              {t('settings.download')}
            </button>
          </div>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title={t('settings.resetAllData')}
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: '#fee2e2', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>{t('common.warning')}:</strong> {t('settings.resetWarning')}
            </p>
            <ul style={{ textAlign: 'left', marginTop: '1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <li>{t('settings.resetItem1')}</li>
              <li>{t('settings.resetItem2')}</li>
              <li>{t('settings.resetItem3')}</li>
              <li>{t('settings.resetItem4')}</li>
              <li>{t('settings.resetItem5')}</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => setShowResetModal(false)} style={{ flex: 1 }}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleResetData} style={{ flex: 1 }}>
              <Trash2 size={16} />
              {t('settings.yesResetAll')}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
