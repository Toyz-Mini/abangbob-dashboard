'use client';

import { useMemo } from 'react';
import { ReceiptSettings, Order, CartItem, DEFAULT_RECEIPT_SETTINGS } from '@/lib/types';

interface ReceiptPreviewProps {
  settings: Partial<ReceiptSettings>;
  sampleOrder?: Partial<Order>;
  width?: '58mm' | '80mm';
  scale?: number;
}

// Sample order for preview
const SAMPLE_ORDER: Order = {
  id: 'sample-001',
  orderNumber: 'AB-001',
  items: [
    {
      id: '1',
      name: 'Nasi Lemak Special',
      category: 'Main',
      price: 8.00,
      isAvailable: true,
      modifierGroupIds: [],
      quantity: 2,
      selectedModifiers: [
        { groupId: 'g1', groupName: 'Extra', optionId: 'o1', optionName: 'Telur Mata', extraPrice: 1.00 }
      ],
      itemTotal: 9.00,
    },
    {
      id: '2',
      name: 'Teh Tarik',
      category: 'Drinks',
      price: 2.50,
      isAvailable: true,
      modifierGroupIds: [],
      quantity: 2,
      selectedModifiers: [],
      itemTotal: 2.50,
    },
  ],
  total: 23.00,
  customerName: 'Ahmad',
  customerPhone: '+673 712 3456',
  orderType: 'takeaway',
  paymentMethod: 'cash',
  status: 'completed',
  createdAt: new Date().toISOString(),
};

export default function ReceiptPreview({
  settings,
  sampleOrder,
  width,
  scale = 1
}: ReceiptPreviewProps) {
  const mergedSettings = useMemo(() => ({
    ...DEFAULT_RECEIPT_SETTINGS,
    ...settings,
  }), [settings]);

  const order = sampleOrder || SAMPLE_ORDER;
  const receiptWidth = width || mergedSettings.receiptWidth;
  const pixelWidth = receiptWidth === '58mm' ? 200 : 280;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const subtotal = order.items?.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0) || 0;

  return (
    <div
      className="receipt-preview-container"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      <div
        className="receipt-preview"
        style={{
          width: `${pixelWidth}px`,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: receiptWidth === '58mm' ? '10px' : '12px',
          lineHeight: 1.4,
          background: '#fff',
          color: '#000',
          padding: receiptWidth === '58mm' ? '8px' : '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: '4px',
        }}
      >
        {/* Logo Top */}
        {mergedSettings.showLogoTop && mergedSettings.logoTopUrl && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img
              src={mergedSettings.logoTopUrl}
              alt="Logo"
              style={{
                maxWidth: '80%',
                maxHeight: '60px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        )}

        {/* Business Name & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            fontSize: receiptWidth === '58mm' ? '14px' : '16px',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}>
            {mergedSettings.businessName}
          </div>
          {mergedSettings.businessTagline && (
            <div style={{ fontSize: receiptWidth === '58mm' ? '9px' : '10px' }}>
              {mergedSettings.businessTagline}
            </div>
          )}
          {mergedSettings.businessAddress && (
            <div style={{
              fontSize: receiptWidth === '58mm' ? '8px' : '9px',
              marginTop: '2px',
              color: '#666',
            }}>
              {mergedSettings.businessAddress}
            </div>
          )}
          {mergedSettings.businessPhone && (
            <div style={{ fontSize: receiptWidth === '58mm' ? '8px' : '9px', color: '#666' }}>
              Tel: {mergedSettings.businessPhone}
            </div>
          )}
        </div>

        {/* Header Text */}
        {mergedSettings.headerText && (
          <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: receiptWidth === '58mm' ? '9px' : '10px',
            whiteSpace: 'pre-line',
          }}>
            {mergedSettings.headerText}
          </div>
        )}

        {/* Divider */}
        <div style={{
          borderTop: '1px dashed #000',
          margin: '8px 0'
        }} />

        {/* Order Info */}
        <div style={{ marginBottom: '4px' }}>
          <strong>No: {order.orderNumber}</strong>
        </div>
        <div style={{
          fontSize: receiptWidth === '58mm' ? '8px' : '9px',
          color: '#666',
          marginBottom: '4px',
        }}>
          {formatDate(order.createdAt || new Date().toISOString())}
        </div>

        {/* Customer Info */}
        {mergedSettings.showCustomerName && order.customerName && (
          <div style={{ marginBottom: '2px' }}>
            Pelanggan: <strong>{order.customerName}</strong>
          </div>
        )}
        {mergedSettings.showCustomerPhone && order.customerPhone && (
          <div style={{ marginBottom: '2px', fontSize: receiptWidth === '58mm' ? '9px' : '10px' }}>
            Tel: {order.customerPhone}
          </div>
        )}

        <div style={{ marginBottom: '4px' }}>
          {order.orderType === 'takeaway' ? 'Bungkus (Takeaway)' : 'GoMamam'}
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px dashed #000',
          margin: '8px 0'
        }} />

        {/* Items */}
        <div style={{ marginBottom: '8px' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 500,
              }}>
                <span>{item.quantity}x {item.name}</span>
                <span>BND {(item.itemTotal * item.quantity).toFixed(2)}</span>
              </div>
              {item.description && (
                <div style={{
                  fontSize: receiptWidth === '58mm' ? '7px' : '8px',
                  color: '#888',
                  fontStyle: 'italic',
                  marginBottom: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.2'
                }}>
                  {item.description}
                </div>
              )}
              {item.selectedModifiers?.length > 0 && (
                <div style={{
                  paddingLeft: '0px',
                  fontSize: receiptWidth === '58mm' ? '9px' : '10px',
                  lineHeight: '1.5',
                  marginTop: '4px'
                }}>
                  {item.selectedModifiers.map((mod, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{
                        color: '#666',
                        marginRight: '4px',
                        minWidth: receiptWidth === '58mm' ? '85px' : '100px',
                        display: 'inline-block',
                        fontSize: receiptWidth === '58mm' ? '8px' : '9px'
                      }}>
                        - {mod.groupName?.replace('Pilih ', '').replace('Flavour ', '')}:
                      </span>
                      <span style={{ fontWeight: 800, color: '#000' }}>
                        {mod.optionName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px dashed #000',
          margin: '8px 0'
        }} />

        {/* Totals */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: receiptWidth === '58mm' ? '9px' : '10px',
          }}>
            <span>Subtotal:</span>
            <span>BND {subtotal.toFixed(2)}</span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 'bold',
          fontSize: receiptWidth === '58mm' ? '12px' : '14px',
          marginTop: '4px',
        }}>
          <span>JUMLAH:</span>
          <span>BND {(order.total || subtotal).toFixed(2)}</span>
        </div>

        {/* Payment Method */}
        {order.paymentMethod && (
          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: receiptWidth === '58mm' ? '9px' : '10px',
            padding: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
          }}>
            Bayar: {order.paymentMethod === 'cash' ? 'TUNAI' :
              order.paymentMethod === 'card' ? 'KAD' :
                order.paymentMethod === 'qr' ? 'QR CODE' : 'E-WALLET'}
          </div>
        )}

        {/* Divider */}
        <div style={{
          borderTop: '1px dashed #000',
          margin: '8px 0'
        }} />

        {/* Custom Message */}
        {mergedSettings.customMessage && (
          <div style={{
            textAlign: 'center',
            fontSize: receiptWidth === '58mm' ? '9px' : '10px',
            fontStyle: 'italic',
            marginBottom: '8px',
            padding: '6px',
            background: '#f5f5f5',
            borderRadius: '2px',
            whiteSpace: 'pre-line',
          }}>
            {mergedSettings.customMessage}
          </div>
        )}

        {/* Footer Text */}
        {mergedSettings.footerText && (
          <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            whiteSpace: 'pre-line',
            fontWeight: 500,
          }}>
            {mergedSettings.footerText}
          </div>
        )}

        {/* Social Media */}
        {mergedSettings.showSocialMedia && (
          <div style={{
            textAlign: 'center',
            fontSize: receiptWidth === '58mm' ? '8px' : '9px',
            color: '#666',
            marginBottom: '8px',
          }}>
            {mergedSettings.instagram && <div>IG: {mergedSettings.instagram}</div>}
            {mergedSettings.facebook && <div>FB: {mergedSettings.facebook}</div>}
            {mergedSettings.tiktok && <div>TikTok: {mergedSettings.tiktok}</div>}
            {mergedSettings.whatsapp && <div>WhatsApp: {mergedSettings.whatsapp}</div>}
          </div>
        )}

        {/* QR Code Placeholder */}
        {mergedSettings.showQrCode && mergedSettings.qrCodeUrl && (
          <div style={{
            textAlign: 'center',
            marginBottom: '8px',
          }}>
            <div style={{
              width: receiptWidth === '58mm' ? '60px' : '80px',
              height: receiptWidth === '58mm' ? '60px' : '80px',
              margin: '0 auto',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#666',
            }}>
              [QR CODE]
            </div>
            {mergedSettings.qrCodeLabel && (
              <div style={{
                fontSize: receiptWidth === '58mm' ? '7px' : '8px',
                color: '#666',
                marginTop: '2px',
              }}>
                {mergedSettings.qrCodeLabel}
              </div>
            )}
          </div>
        )}

        {/* Logo Bottom */}
        {mergedSettings.showLogoBottom && mergedSettings.logoBottomUrl && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <img
              src={mergedSettings.logoBottomUrl}
              alt="Logo"
              style={{
                maxWidth: '60%',
                maxHeight: '40px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Receipt End */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: receiptWidth === '58mm' ? '7px' : '8px',
          color: '#999',
        }}>
          *** TERIMA KASIH ***
        </div>
      </div>

      <style jsx>{`
        .receipt-preview-container {
          display: flex;
          justify-content: center;
        }
        .receipt-preview {
          position: relative;
        }
        .receipt-preview::before,
        .receipt-preview::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 12px;
        }
        .receipt-preview::before {
          top: -12px;
          background-image: linear-gradient(45deg, transparent 50%, #fff 50%), linear-gradient(-45deg, transparent 50%, #fff 50%);
          background-size: 12px 12px;
          background-position: bottom left;
          background-repeat: repeat-x;
        }
        .receipt-preview::after {
          bottom: -12px;
          background-image: linear-gradient(45deg, transparent 50%, #fff 50%), linear-gradient(-45deg, transparent 50%, #fff 50%);
          background-size: 12px 12px;
          background-position: top left;
          background-repeat: repeat-x;
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
}

