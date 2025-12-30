'use client';

import { useState, useCallback } from 'react';
import {
  ReceiptSettings,
  PrinterSettings,
  DEFAULT_RECEIPT_SETTINGS,
  DEFAULT_PRINTER_SETTINGS
} from '@/lib/types';
import ReceiptPreview from './ReceiptPreview';
import LogoUpload from './LogoUpload';
import {
  Receipt,
  Image as ImageIcon,
  Type,
  MessageSquare,
  Share2,
  QrCode,
  User,
  Printer,
  Settings2,
  Eye,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Usb,
  Save,
  RotateCcw,
} from 'lucide-react';

interface ReceiptDesignerProps {
  initialSettings?: Partial<ReceiptSettings>;
  initialPrinterSettings?: Partial<PrinterSettings>;
  onSettingsChange?: (settings: ReceiptSettings) => void;
  onPrinterSettingsChange?: (settings: PrinterSettings) => void;
  onSave?: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section" style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--gray-100)',
          border: 'none',
          borderRadius: isOpen ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && (
        <div style={{
          padding: '1rem',
          border: '1px solid var(--gray-200)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          background: 'var(--card-bg)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ReceiptDesigner({
  initialSettings,
  initialPrinterSettings,
  onSettingsChange,
  onPrinterSettingsChange,
  onSave,
}: ReceiptDesignerProps) {
  const [settings, setSettings] = useState<ReceiptSettings>({
    ...DEFAULT_RECEIPT_SETTINGS,
    ...initialSettings,
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    ...DEFAULT_PRINTER_SETTINGS,
    ...initialPrinterSettings,
  });

  const [previewWidth, setPreviewWidth] = useState<'58mm' | '80mm'>(settings.receiptWidth);

  const updateSettings = useCallback((updates: Partial<ReceiptSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [onSettingsChange]);

  const updatePrinterSettings = useCallback((updates: Partial<PrinterSettings>) => {
    setPrinterSettings(prev => {
      const newSettings = { ...prev, ...updates };
      onPrinterSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [onPrinterSettingsChange]);

  const resetToDefaults = () => {
    setSettings(DEFAULT_RECEIPT_SETTINGS);
    onSettingsChange?.(DEFAULT_RECEIPT_SETTINGS);
  };

  return (
    <div className="receipt-designer">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Editor Panel */}
        <div className="editor-panel">
          {/* Logo Section */}
          <CollapsibleSection title="Logo" icon={<ImageIcon size={18} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Logo Atas (Header)
                </label>
                <LogoUpload
                  currentLogoUrl={settings.logoTopUrl}
                  onLogoChange={(url) => updateSettings({ logoTopUrl: url || '' })}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}>
                  <input
                    type="checkbox"
                    checked={settings.showLogoTop}
                    onChange={(e) => updateSettings({ showLogoTop: e.target.checked })}
                  />
                  Papar logo atas
                </label>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Logo Bawah (Footer)
                </label>
                <LogoUpload
                  currentLogoUrl={settings.logoBottomUrl}
                  onLogoChange={(url) => updateSettings({ logoBottomUrl: url || '' })}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}>
                  <input
                    type="checkbox"
                    checked={settings.showLogoBottom}
                    onChange={(e) => updateSettings({ showLogoBottom: e.target.checked })}
                  />
                  Papar logo bawah
                </label>
              </div>
            </div>
          </CollapsibleSection>

          {/* Business Info Section */}
          <CollapsibleSection title="Maklumat Perniagaan" icon={<Type size={18} />}>
            <div className="form-group">
              <label className="form-label">Nama Perniagaan</label>
              <input
                type="text"
                className="form-input"
                value={settings.businessName}
                onChange={(e) => updateSettings({ businessName: e.target.value })}
                placeholder="ABANGBOB"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                type="text"
                className="form-input"
                value={settings.businessTagline}
                onChange={(e) => updateSettings({ businessTagline: e.target.value })}
                placeholder="Nasi Lemak & Burger"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <textarea
                className="form-input"
                value={settings.businessAddress}
                onChange={(e) => updateSettings({ businessAddress: e.target.value })}
                placeholder="Lot 123, Kg ABC, Brunei"
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="form-label">No. Telefon</label>
              <input
                type="text"
                className="form-input"
                value={settings.businessPhone}
                onChange={(e) => updateSettings({ businessPhone: e.target.value })}
                placeholder="+673 712 3456"
              />
            </div>
          </CollapsibleSection>

          {/* Custom Text Section */}
          <CollapsibleSection title="Teks Kustom" icon={<MessageSquare size={18} />}>
            <div className="form-group">
              <label className="form-label">Header Text (atas)</label>
              <textarea
                className="form-input"
                value={settings.headerText}
                onChange={(e) => updateSettings({ headerText: e.target.value })}
                placeholder="Teks tambahan di atas receipt..."
                rows={2}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Dipaparkan selepas logo dan nama perniagaan
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Footer Text (bawah)</label>
              <textarea
                className="form-input"
                value={settings.footerText}
                onChange={(e) => updateSettings({ footerText: e.target.value })}
                placeholder="Terima kasih!&#10;Sila datang lagi"
                rows={3}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Gunakan Enter untuk baris baru
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Mesej Promosi / Custom</label>
              <textarea
                className="form-input"
                value={settings.customMessage}
                onChange={(e) => updateSettings({ customMessage: e.target.value })}
                placeholder="Promosi bulan ini: Beli 5 dapat 1 FREE!"
                rows={2}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Dipaparkan dalam kotak khas di tengah receipt
              </small>
            </div>
          </CollapsibleSection>

          {/* Social Media Section */}
          <CollapsibleSection title="Media Sosial" icon={<Share2 size={18} />} defaultOpen={false}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={settings.showSocialMedia}
                onChange={(e) => updateSettings({ showSocialMedia: e.target.checked })}
              />
              <span style={{ fontWeight: 500 }}>Papar media sosial pada receipt</span>
            </label>

            <div style={{ opacity: settings.showSocialMedia ? 1 : 0.5 }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.instagram}
                    onChange={(e) => updateSettings({ instagram: e.target.value })}
                    placeholder="@abangbob.bn"
                    disabled={!settings.showSocialMedia}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Facebook</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.facebook}
                    onChange={(e) => updateSettings({ facebook: e.target.value })}
                    placeholder="abangbobnl"
                    disabled={!settings.showSocialMedia}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">TikTok</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.tiktok}
                    onChange={(e) => updateSettings({ tiktok: e.target.value })}
                    placeholder="@abangbob.bn"
                    disabled={!settings.showSocialMedia}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.whatsapp}
                    onChange={(e) => updateSettings({ whatsapp: e.target.value })}
                    placeholder="+673 712 3456"
                    disabled={!settings.showSocialMedia}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* QR Code Section */}
          <CollapsibleSection title="QR Code" icon={<QrCode size={18} />} defaultOpen={false}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={settings.showQrCode}
                onChange={(e) => updateSettings({ showQrCode: e.target.checked })}
              />
              <span style={{ fontWeight: 500 }}>Papar QR Code pada receipt</span>
            </label>

            <div style={{ opacity: settings.showQrCode ? 1 : 0.5 }}>
              <div className="form-group">
                <label className="form-label">URL untuk QR Code</label>
                <input
                  type="url"
                  className="form-input"
                  value={settings.qrCodeUrl}
                  onChange={(e) => updateSettings({ qrCodeUrl: e.target.value })}
                  placeholder="https://forms.google.com/feedback"
                  disabled={!settings.showQrCode}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Link ke form feedback, website, atau menu online
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Label QR Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.qrCodeLabel}
                  onChange={(e) => updateSettings({ qrCodeLabel: e.target.value })}
                  placeholder="Scan untuk feedback"
                  disabled={!settings.showQrCode}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Customer Display Section */}
          <CollapsibleSection title="Maklumat Pelanggan" icon={<User size={18} />} defaultOpen={false}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Pilih maklumat pelanggan yang akan dipaparkan pada receipt
            </p>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
            }}>
              <input
                type="checkbox"
                checked={settings.showCustomerName}
                onChange={(e) => updateSettings({ showCustomerName: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Papar Nama Pelanggan</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Personalize receipt dengan nama pelanggan
                </div>
              </div>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
            }}>
              <input
                type="checkbox"
                checked={settings.showCustomerPhone}
                onChange={(e) => updateSettings({ showCustomerPhone: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Papar No. Telefon Pelanggan</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Berguna untuk pesanan delivery
                </div>
              </div>
            </label>
          </CollapsibleSection>

          {/* Printing Options Section */}
          <CollapsibleSection title="Tetapan Cetakan" icon={<Settings2 size={18} />} defaultOpen={false}>
            <div className="form-group">
              <label className="form-label">Saiz Kertas Receipt</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${settings.receiptWidth === '58mm' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    updateSettings({ receiptWidth: '58mm' });
                    setPreviewWidth('58mm');
                  }}
                  style={{ flex: 1 }}
                >
                  58mm
                </button>
                <button
                  type="button"
                  className={`btn ${settings.receiptWidth === '80mm' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    updateSettings({ receiptWidth: '80mm' });
                    setPreviewWidth('80mm');
                  }}
                  style={{ flex: 1 }}
                >
                  80mm
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
              }}>
                <input
                  type="checkbox"
                  checked={settings.autoPrint}
                  onChange={(e) => updateSettings({ autoPrint: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Auto Print Selepas Bayar</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Cetak receipt secara automatik
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
              }}>
                <input
                  type="checkbox"
                  checked={settings.printKitchenSlip}
                  onChange={(e) => updateSettings({ printKitchenSlip: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Cetak Slip Dapur</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Cetak slip untuk kitchen display
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
              }}>
                <input
                  type="checkbox"
                  checked={settings.openCashDrawer}
                  onChange={(e) => updateSettings({ openCashDrawer: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Buka Cash Drawer</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Buka drawer secara automatik selepas bayaran tunai
                  </div>
                </div>
              </label>
            </div>
          </CollapsibleSection>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)',
            marginTop: '1rem',
          }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={resetToDefaults}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={16} />
              Reset Default
            </button>
            {onSave && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}
              >
                <Save size={16} />
                Simpan Tetapan
              </button>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel" style={{ position: 'sticky', top: '1rem' }}>
          <div style={{
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
              }}>
                <Eye size={18} />
                Preview Receipt
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${previewWidth === '58mm' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPreviewWidth('58mm')}
                >
                  58mm
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${previewWidth === '80mm' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPreviewWidth('80mm')}
                >
                  80mm
                </button>
              </div>
            </div>

            <div style={{
              background: '#e5e5e5',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem 1rem',
              display: 'flex',
              justifyContent: 'center',
              minHeight: '400px',
              alignItems: 'flex-start',
              overflow: 'auto',
            }}>
              <ReceiptPreview
                settings={settings}
                width={previewWidth}
                scale={previewWidth === '58mm' ? 0.9 : 0.85}
              />
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}>
              Preview menggunakan data contoh. Receipt sebenar akan memaparkan data pesanan sebenar.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .receipt-designer {
          max-width: 1200px;
        }
        
        @media (max-width: 900px) {
          .receipt-designer > div {
            grid-template-columns: 1fr !important;
          }
          .preview-panel {
            position: relative !important;
            top: 0 !important;
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}

