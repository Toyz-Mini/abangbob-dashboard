'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataMigration from '@/components/DataMigration';
import { useAuth } from '@/lib/contexts/AuthContext';
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
  User
} from 'lucide-react';

type SettingSection = 'outlet' | 'operations' | 'receipt' | 'data' | 'notifications' | 'supabase';

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

  // Receipt settings
  const [receiptSettings, setReceiptSettings] = useState({
    header: 'ABANGBOB\nNasi Lemak & Burger\nSejak 2020',
    footer: 'Terima kasih!\nSila datang lagi\nIG: @abangbob.bn',
    showLogo: true,
    printKitchenSlip: true,
    autoPrint: false,
  });

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
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'supabase', labelKey: 'settings.supabaseCloud', icon: Cloud },
    { id: 'data', labelKey: 'settings.dataBackup', icon: Database },
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
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
          <div className="lg:col-span-3">
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

            {/* Receipt Settings */}
            {activeSection === 'receipt' && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={20} />
                    {t('settings.receiptSettings')}
                  </div>
                  <div className="card-subtitle">{t('settings.receiptSettingsDesc')}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('settings.receiptHeader')}</label>
                  <textarea
                    className="form-input"
                    value={receiptSettings.header}
                    onChange={(e) => setReceiptSettings(prev => ({ ...prev, header: e.target.value }))}
                    rows={3}
                    placeholder={t('settings.receiptHeaderPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('settings.receiptFooter')}</label>
                  <textarea
                    className="form-input"
                    value={receiptSettings.footer}
                    onChange={(e) => setReceiptSettings(prev => ({ ...prev, footer: e.target.value }))}
                    rows={3}
                    placeholder={t('settings.receiptFooterPlaceholder')}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={receiptSettings.showLogo}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, showLogo: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>{t('settings.showLogo')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={receiptSettings.printKitchenSlip}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, printKitchenSlip: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>{t('settings.printKitchenSlip')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={receiptSettings.autoPrint}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, autoPrint: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>{t('settings.autoPrint')}</span>
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
