'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore, usePaymentMethods, useTaxRates } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataMigration from '@/components/DataMigration';
import { useAuth } from '@/lib/contexts/AuthContext';
import LogoUpload from '@/components/LogoUpload';
import ReceiptDesigner from '@/components/ReceiptDesigner';
import SupabaseSetupChecker from '@/components/SupabaseSetupChecker';
import { ReceiptSettings, PrinterSettings, DEFAULT_RECEIPT_SETTINGS, DEFAULT_PRINTER_SETTINGS, PaymentMethodConfig, TaxRate } from '@/lib/types';
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
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Activity,
  XCircle,
} from 'lucide-react';
import SupabaseStatusIndicator from '@/components/SupabaseStatusIndicator';
import { getDataSourceInfo, DataSource } from '@/lib/store';
import { getSyncLogs, getSyncStats, clearSyncLogs, SyncLogEntry } from '@/lib/utils/sync-logger';
import { checkSupabaseConnection } from '@/lib/supabase/client';
import { loadSettingsFromSupabase, saveSettingsToSupabase, loadSettingsFromLocalStorage } from '@/lib/supabase/settings-sync';

type SettingSection = 'outlet' | 'operations' | 'receipt' | 'printer' | 'data' | 'notifications' | 'supabase' | 'payment' | 'tax' | 'appearance' | 'security';
type PaymentModalType = 'add-payment' | 'edit-payment' | 'delete-payment' | null;
type TaxModalType = 'add-tax' | 'edit-tax' | 'delete-tax' | null;

// Sync Debug Section Component
function SyncDebugSection() {
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [syncStats, setSyncStats] = useState({ total: 0, success: 0, errors: 0, pending: 0, lastError: null as SyncLogEntry | null, lastSuccess: null as SyncLogEntry | null });
  const [dataSource, setDataSource] = useState(getDataSourceInfo());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    // Initial load
    setSyncLogs(getSyncLogs());
    setSyncStats(getSyncStats());
    setDataSource(getDataSourceInfo());

    // Refresh periodically
    const interval = setInterval(() => {
      setSyncLogs(getSyncLogs());
      setSyncStats(getSyncStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshConnection = async () => {
    setIsRefreshing(true);
    await checkSupabaseConnection();
    setDataSource(getDataSourceInfo());
    setSyncStats(getSyncStats());
    setIsRefreshing(false);
  };

  const handleClearLogs = () => {
    clearSyncLogs();
    setSyncLogs([]);
    setSyncStats(getSyncStats());
  };

  const getDataSourceBadge = (source: DataSource) => {
    switch (source) {
      case 'supabase':
        return <span className="badge badge-success">Supabase</span>;
      case 'localStorage':
        return <span className="badge badge-warning">Local</span>;
      case 'mock':
        return <span className="badge badge-info">Mock</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} />
          Sync Status & Debugging
        </div>
        <div className="card-subtitle">Monitor data synchronization and troubleshoot issues</div>
      </div>

      {/* Connection Status Indicator */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SupabaseStatusIndicator showDetails />
      </div>

      {/* Data Source Info */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          Data Sources (Last Load: {dataSource.lastLoadTime?.toLocaleTimeString() || 'Never'})
        </h4>
        <div className="grid grid-cols-3" style={{ gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Menu Items</div>
            {getDataSourceBadge(dataSource.menuItems)}
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Modifiers</div>
            {getDataSourceBadge(dataSource.modifierGroups)}
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inventory</div>
            {getDataSourceBadge(dataSource.inventory)}
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Staff</div>
            {getDataSourceBadge(dataSource.staff)}
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Orders</div>
            {getDataSourceBadge(dataSource.orders)}
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supabase</div>
            <span className={`badge ${dataSource.supabaseConnected ? 'badge-success' : 'badge-danger'}`}>
              {dataSource.supabaseConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Statistics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Sync Statistics</h4>
        <div className="grid grid-cols-4" style={{ gap: '0.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{syncStats.total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Ops</div>
          </div>
          <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>{syncStats.success}</div>
            <div style={{ fontSize: '0.7rem', color: '#047857' }}>Success</div>
          </div>
          <div style={{ padding: '0.75rem', background: syncStats.errors > 0 ? '#fee2e2' : 'var(--gray-100)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: syncStats.errors > 0 ? '#dc2626' : 'inherit' }}>{syncStats.errors}</div>
            <div style={{ fontSize: '0.7rem', color: syncStats.errors > 0 ? '#b91c1c' : 'var(--text-secondary)' }}>Errors</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{syncStats.pending}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pending</div>
          </div>
        </div>
      </div>

      {/* Recent Sync Logs */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Recent Sync Operations</h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowAllLogs(!showAllLogs)}
            >
              {showAllLogs ? 'Show Less' : 'Show All'}
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handleClearLogs}
              disabled={syncLogs.length === 0}
            >
              <Trash2 size={14} />
              Clear Logs
            </button>
          </div>
        </div>

        {syncLogs.length > 0 ? (
          <div style={{
            maxHeight: showAllLogs ? '400px' : '200px',
            overflowY: 'auto',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-sm)',
          }}>
            {syncLogs.slice(0, showAllLogs ? 50 : 10).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid var(--gray-100)',
                  fontSize: '0.75rem',
                  background: log.status === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                }}
              >
                {log.status === 'success' && <CheckCircle size={14} color="#059669" />}
                {log.status === 'error' && <XCircle size={14} color="#dc2626" />}
                {log.status === 'pending' && <RefreshCw size={14} color="#3b82f6" className="animate-spin" />}
                {log.status === 'retrying' && <RefreshCw size={14} color="#f59e0b" />}

                <span style={{
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  padding: '0.125rem 0.25rem',
                  background: 'var(--gray-100)',
                  borderRadius: '2px',
                }}>
                  {log.operation}
                </span>

                <span style={{ color: 'var(--text-secondary)' }}>{log.entity}</span>

                {log.entityId && (
                  <span style={{ color: 'var(--gray-400)', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                    {log.entityId.substring(0, 8)}...
                  </span>
                )}

                {log.error && (
                  <span style={{ color: 'var(--danger)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.error}
                  </span>
                )}

                {log.durationMs !== undefined && (
                  <span style={{ color: 'var(--gray-400)', marginLeft: 'auto' }}>
                    {log.durationMs}ms
                  </span>
                )}

                <span style={{ color: 'var(--gray-400)', fontSize: '0.65rem' }}>
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-sm)',
          }}>
            No sync operations recorded yet
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-outline"
          onClick={handleRefreshConnection}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Test Connection
        </button>
      </div>
    </div>
  );
}

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

  // Payment method settings - Now using store
  const {
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = usePaymentMethods();

  // Tax rates - Using store
  const {
    taxRates,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
  } = useTaxRates();

  // Payment modal state
  const [paymentModalType, setPaymentModalType] = useState<PaymentModalType>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodConfig | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    name: '',
    code: '',
    color: '#3b82f6',
    isEnabled: true,
    sortOrder: 1,
  });

  // Tax modal state
  const [taxModalType, setTaxModalType] = useState<TaxModalType>(null);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [taxForm, setTaxForm] = useState({
    name: '',
    rate: 0,
    description: '',
    isDefault: false,
    isActive: true,
  });

  // Order number prefix (kept for backward compatibility)
  const [orderNumberPrefix, setOrderNumberPrefix] = useState('AB');

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

  // Load all settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try Supabase first
        const supabaseSettings = await loadSettingsFromSupabase();

        if (supabaseSettings) {
          console.log('[Settings Page] Loaded settings from Supabase');
          setOutletSettings(supabaseSettings.outlet);
          setOperatingHours(DAYS_OF_WEEK.map((day, idx) => {
            const dayData = supabaseSettings.operatingHours[day];
            let isOpen = idx !== 0; // Default: closed on Sunday
            if (dayData) {
              isOpen = dayData.isOpen !== undefined ? dayData.isOpen : !dayData.closed;
            }
            return {
              dayOfWeek: idx,
              dayName: day,
              isOpen,
              openTime: dayData?.open ?? '08:00',
              closeTime: dayData?.close ?? '22:00',
            };
          }));
          setNotificationSettings(prev => ({
            ...prev,
            lowStockAlert: supabaseSettings.notification.lowStock,
            equipmentReminder: supabaseSettings.notification.equipmentReminder,
          }));
          setSocialMedia(supabaseSettings.socialMedia);
          setAppearanceSettings(prev => ({ ...prev, ...supabaseSettings.appearance }));
          setSecuritySettings(prev => ({ ...prev, ...supabaseSettings.security }));
        } else {
          // Fallback to localStorage
          console.log('[Settings Page] Loading from localStorage (Supabase unavailable)');
          const localSettings = loadSettingsFromLocalStorage();
          setOutletSettings(localSettings.outlet);
          setNotificationSettings(prev => ({
            ...prev,
            lowStockAlert: localSettings.notification.lowStock,
            equipmentReminder: localSettings.notification.equipmentReminder,
          }));
          setSocialMedia(localSettings.socialMedia);
        }
      } catch (error) {
        console.error('[Settings Page] Error loading settings:', error);
      }
    };

    loadSettings();
  }, [DAYS_OF_WEEK]);

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

    try {
      // Prepare operating hours in the format for Supabase
      const operatingHoursMap: Record<string, { open: string; close: string; isOpen: boolean }> = {};
      operatingHours.forEach(day => {
        operatingHoursMap[day.dayName] = {
          open: day.openTime,
          close: day.closeTime,
          isOpen: day.isOpen,
        };
      });

      // Save to Supabase (also saves to localStorage as backup)
      const success = await saveSettingsToSupabase({
        outlet: outletSettings,
        operatingHours: operatingHoursMap,
        receipt: {
          headerText: receiptSettings.headerText || '',
          footerText: receiptSettings.footerText || 'Terima kasih!',
          showLogo: receiptSettings.showLogoTop ?? true,
          autoPrint: receiptSettings.autoPrint ?? false,
          printKitchenSlip: receiptSettings.printKitchenSlip ?? true,
        },
        notification: {
          lowStock: notificationSettings.lowStockAlert,
          orderReminder: notificationSettings.newOrderSound,
          equipmentReminder: notificationSettings.equipmentReminder,
        },
        socialMedia,
        paymentMethods: {
          cash: paymentMethods.some(p => p.code === 'cash' && p.isEnabled),
          card: paymentMethods.some(p => p.code === 'card' && p.isEnabled),
          qr: paymentMethods.some(p => p.code === 'qr' && p.isEnabled),
          ewallet: paymentMethods.some(p => p.code === 'ewallet' && p.isEnabled),
        },
        appearance: {
          sidebarCollapsed: false,
        },
        security: {
          requirePIN: securitySettings.pinMinLength >= 4,
          autoLogout: securitySettings.autoLockRegister,
          autoLogoutMinutes: securitySettings.sessionTimeoutMinutes,
        },
      });

      if (success) {
        console.log('[Settings] Saved to Supabase successfully');
      } else {
        console.log('[Settings] Saved to localStorage only (Supabase unavailable)');
      }

      // Also save receipt settings using the existing service
      saveReceiptSettings(receiptSettings);

      alert(t('settings.saveSuccess'));
    } catch (error) {
      console.error('[Settings] Save error:', error);
      alert('Gagal menyimpan settings. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
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
      paymentMethods,
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
    { id: 'tax', labelKey: 'Cukai', icon: Percent },
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
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={20} />
                      Kaedah Pembayaran
                    </div>
                    <div className="card-subtitle">Tetapkan kaedah pembayaran yang diterima</div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setPaymentForm({
                        name: '',
                        code: '',
                        color: '#3b82f6',
                        isEnabled: true,
                        sortOrder: paymentMethods.length + 1,
                      });
                      setPaymentModalType('add-payment');
                    }}
                  >
                    <Plus size={16} />
                    Tambah
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {paymentMethods
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((pm) => (
                      <div
                        key={pm.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'var(--gray-100)',
                          borderRadius: 'var(--radius-md)',
                          opacity: pm.isEnabled ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: pm.color,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem'
                          }}>
                            {pm.code.toUpperCase().slice(0, 4)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{pm.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Kod: {pm.code}
                              {pm.isSystem && <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Sistem</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => updatePaymentMethod(pm.id, { isEnabled: !pm.isEnabled })}
                            title={pm.isEnabled ? 'Nyahaktifkan' : 'Aktifkan'}
                          >
                            {pm.isEnabled ? <ToggleRight size={18} color="var(--success)" /> : <ToggleLeft size={18} />}
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedPaymentMethod(pm);
                              setPaymentForm({
                                name: pm.name,
                                code: pm.code,
                                color: pm.color,
                                isEnabled: pm.isEnabled,
                                sortOrder: pm.sortOrder,
                              });
                              setPaymentModalType('edit-payment');
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          {!pm.isSystem && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setSelectedPaymentMethod(pm);
                                setPaymentModalType('delete-payment');
                              }}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Tetapan Pesanan</h4>
                  <div className="form-group">
                    <label className="form-label">Prefix Nombor Pesanan</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={orderNumberPrefix}
                        onChange={(e) => setOrderNumberPrefix(e.target.value.toUpperCase())}
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

            {/* Tax Settings */}
            {activeSection === 'tax' && (
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={20} />
                      Cukai
                    </div>
                    <div className="card-subtitle">Tetapkan kadar cukai untuk produk</div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setTaxForm({
                        name: '',
                        rate: 0,
                        description: '',
                        isDefault: false,
                        isActive: true,
                      });
                      setTaxModalType('add-tax');
                    }}
                  >
                    <Plus size={16} />
                    Tambah
                  </button>
                </div>

                {taxRates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {taxRates.map((tax) => (
                      <div
                        key={tax.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'var(--gray-100)',
                          borderRadius: 'var(--radius-md)',
                          opacity: tax.isActive ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '50px',
                            height: '40px',
                            background: 'var(--primary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}>
                            {tax.rate}%
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {tax.name}
                              {tax.isDefault && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Default</span>}
                              {!tax.isActive && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Tidak Aktif</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {tax.description || `Cukai ${tax.rate}%`}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedTaxRate(tax);
                              setTaxForm({
                                name: tax.name,
                                rate: tax.rate,
                                description: tax.description || '',
                                isDefault: tax.isDefault,
                                isActive: tax.isActive,
                              });
                              setTaxModalType('edit-tax');
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedTaxRate(tax);
                              setTaxModalType('delete-tax');
                            }}
                            style={{ color: 'var(--danger)' }}
                            disabled={tax.isDefault}
                            title={tax.isDefault ? 'Cukai default tidak boleh dipadam' : 'Padam cukai'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Percent size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Belum ada kadar cukai</p>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        setTaxForm({
                          name: '',
                          rate: 0,
                          description: '',
                          isDefault: true,
                          isActive: true,
                        });
                        setTaxModalType('add-tax');
                      }}
                    >
                      <Plus size={16} />
                      Tambah Cukai Pertama
                    </button>
                  </div>
                )}
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

                {/* Sync Status & Debugging */}
                <SyncDebugSection />

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

        {/* Add/Edit Payment Method Modal */}
        <Modal
          isOpen={paymentModalType === 'add-payment' || paymentModalType === 'edit-payment'}
          onClose={() => {
            setPaymentModalType(null);
            setSelectedPaymentMethod(null);
          }}
          title={paymentModalType === 'add-payment' ? 'Tambah Kaedah Pembayaran' : 'Edit Kaedah Pembayaran'}
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Nama *</label>
            <input
              type="text"
              className="form-input"
              value={paymentForm.name}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Tunai (Cash)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kod *</label>
            <input
              type="text"
              className="form-input"
              value={paymentForm.code}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
              placeholder="Contoh: cash, card, qr"
              disabled={paymentModalType === 'edit-payment' && selectedPaymentMethod?.isSystem}
            />
            {paymentModalType === 'edit-payment' && selectedPaymentMethod?.isSystem && (
              <small style={{ color: 'var(--text-secondary)' }}>Kod untuk kaedah sistem tidak boleh diubah</small>
            )}
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Warna</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={paymentForm.color}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, color: e.target.value }))}
                  style={{ width: '50px', height: '36px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={paymentForm.color}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, color: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Urutan</label>
              <input
                type="number"
                className="form-input"
                value={paymentForm.sortOrder}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPaymentForm(prev => ({ ...prev, isEnabled: true }))}
                className={`btn ${paymentForm.isEnabled ? 'btn-success' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <CheckCircle size={16} />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setPaymentForm(prev => ({ ...prev, isEnabled: false }))}
                className={`btn ${!paymentForm.isEnabled ? 'btn-warning' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Tidak Aktif
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setPaymentModalType(null);
                setSelectedPaymentMethod(null);
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!paymentForm.name.trim() || !paymentForm.code.trim()) {
                  alert('Sila masukkan nama dan kod');
                  return;
                }
                if (paymentModalType === 'add-payment') {
                  addPaymentMethod({
                    name: paymentForm.name.trim(),
                    code: paymentForm.code.trim(),
                    color: paymentForm.color,
                    isEnabled: paymentForm.isEnabled,
                    isSystem: false,
                    sortOrder: paymentForm.sortOrder,
                  });
                } else if (selectedPaymentMethod) {
                  updatePaymentMethod(selectedPaymentMethod.id, {
                    name: paymentForm.name.trim(),
                    code: selectedPaymentMethod.isSystem ? selectedPaymentMethod.code : paymentForm.code.trim(),
                    color: paymentForm.color,
                    isEnabled: paymentForm.isEnabled,
                    sortOrder: paymentForm.sortOrder,
                  });
                }
                setPaymentModalType(null);
                setSelectedPaymentMethod(null);
              }}
              style={{ flex: 1 }}
            >
              {paymentModalType === 'add-payment' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Payment Method Modal */}
        <Modal
          isOpen={paymentModalType === 'delete-payment'}
          onClose={() => {
            setPaymentModalType(null);
            setSelectedPaymentMethod(null);
          }}
          title="Padam Kaedah Pembayaran"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: '#fee2e2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam kaedah pembayaran <strong>{selectedPaymentMethod?.name}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setPaymentModalType(null);
                setSelectedPaymentMethod(null);
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (selectedPaymentMethod) {
                  deletePaymentMethod(selectedPaymentMethod.id);
                }
                setPaymentModalType(null);
                setSelectedPaymentMethod(null);
              }}
              style={{ flex: 1 }}
            >
              Padam
            </button>
          </div>
        </Modal>

        {/* Add/Edit Tax Rate Modal */}
        <Modal
          isOpen={taxModalType === 'add-tax' || taxModalType === 'edit-tax'}
          onClose={() => {
            setTaxModalType(null);
            setSelectedTaxRate(null);
          }}
          title={taxModalType === 'add-tax' ? 'Tambah Kadar Cukai' : 'Edit Kadar Cukai'}
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Nama Cukai *</label>
            <input
              type="text"
              className="form-input"
              value={taxForm.name}
              onChange={(e) => setTaxForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: GST, Cukai Perkhidmatan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kadar (%) *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                className="form-input"
                value={taxForm.rate}
                onChange={(e) => setTaxForm(prev => ({ ...prev, rate: Number(e.target.value) }))}
                min="0"
                max="100"
                step="0.1"
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <textarea
              className="form-input"
              value={taxForm.description}
              onChange={(e) => setTaxForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Penerangan cukai..."
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTaxForm(prev => ({ ...prev, isActive: true }))}
                  className={`btn ${taxForm.isActive ? 'btn-success' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setTaxForm(prev => ({ ...prev, isActive: false }))}
                  className={`btn ${!taxForm.isActive ? 'btn-warning' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  Tidak
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Default</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTaxForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                  className={`btn ${taxForm.isDefault ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  {taxForm.isDefault ? 'Ya' : 'Tidak'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setTaxModalType(null);
                setSelectedTaxRate(null);
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!taxForm.name.trim()) {
                  alert('Sila masukkan nama cukai');
                  return;
                }
                if (taxModalType === 'add-tax') {
                  addTaxRate({
                    name: taxForm.name.trim(),
                    rate: taxForm.rate,
                    description: taxForm.description.trim() || undefined,
                    isDefault: taxForm.isDefault,
                    isActive: taxForm.isActive,
                  });
                } else if (selectedTaxRate) {
                  updateTaxRate(selectedTaxRate.id, {
                    name: taxForm.name.trim(),
                    rate: taxForm.rate,
                    description: taxForm.description.trim() || undefined,
                    isDefault: taxForm.isDefault,
                    isActive: taxForm.isActive,
                  });
                }
                setTaxModalType(null);
                setSelectedTaxRate(null);
              }}
              style={{ flex: 1 }}
            >
              {taxModalType === 'add-tax' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Tax Rate Modal */}
        <Modal
          isOpen={taxModalType === 'delete-tax'}
          onClose={() => {
            setTaxModalType(null);
            setSelectedTaxRate(null);
          }}
          title="Padam Kadar Cukai"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: '#fee2e2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam kadar cukai <strong>{selectedTaxRate?.name}</strong>?
            </p>
            {selectedTaxRate?.isDefault && (
              <p style={{ fontSize: '0.875rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                Cukai default tidak boleh dipadam.
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setTaxModalType(null);
                setSelectedTaxRate(null);
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (selectedTaxRate && !selectedTaxRate.isDefault) {
                  deleteTaxRate(selectedTaxRate.id);
                }
                setTaxModalType(null);
                setSelectedTaxRate(null);
              }}
              disabled={selectedTaxRate?.isDefault}
              style={{ flex: 1 }}
            >
              Padam
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
