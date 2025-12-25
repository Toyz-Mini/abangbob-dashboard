'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useProductionLogsRealtime } from '@/lib/supabase/realtime-hooks';
import { useCallback } from 'react';
import { Plus, Trash2, Package, CheckCircle, Wrench, ArrowRight, ClipboardList, AlertOctagon } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';

const PRODUCTION_ITEMS = [
  'Nasi Lemak Ayam',
  'Nasi Lemak Biasa',
  'Burger Ayam',
  'Burger Daging',
  'Teh Tarik',
  'Kopi O',
  'Ayam Goreng',
  'Sambal',
  'Lain-lain'
];

const WASTE_REASONS = [
  'Terlebih masak',
  'Jatuh/Tumpah',
  'Customer complaint',
  'Expired',
  'Kualiti tidak memuaskan',
  'Lain-lain'
];

import { useAuth } from '@/lib/contexts/AuthContext';

export default function ProductionPage() {
  const { productionLogs, addProductionLog, refreshProductionLogs, isInitialized } = useStore();
  const { user, isStaffLoggedIn, currentStaff } = useAuth();
  const role = user ? 'Admin' : (isStaffLoggedIn && currentStaff ? currentStaff.role : null);
  const canDeleteLogs = role === 'Admin' || role === 'Manager';

  const handleProductionLogsChange = useCallback(() => {
    refreshProductionLogs();
  }, [refreshProductionLogs]);

  useProductionLogsRealtime(handleProductionLogsChange);

  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Production log form
  const [logForm, setLogForm] = useState({
    item: PRODUCTION_ITEMS[0],
    customItem: '',
    quantityProduced: 0,
    notes: '',
  });

  // Waste form
  const [wasteForm, setWasteForm] = useState({
    item: PRODUCTION_ITEMS[0],
    customItem: '',
    wasteAmount: 0,
    reason: WASTE_REASONS[0],
    customReason: '',
  });

  const handleAddProductionLog = async () => {
    if (logForm.quantityProduced <= 0) {
      alert('Sila masukkan kuantiti yang dihasilkan');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const itemName = logForm.item === 'Lain-lain' ? logForm.customItem : logForm.item;

    addProductionLog({
      date: new Date().toISOString().split('T')[0],
      item: itemName,
      quantityProduced: logForm.quantityProduced,
      wasteAmount: 0,
      notes: logForm.notes || undefined,
    });

    setLogForm({
      item: PRODUCTION_ITEMS[0],
      customItem: '',
      quantityProduced: 0,
      notes: '',
    });
    setShowAddLogModal(false);
    setIsProcessing(false);
  };

  const handleAddWasteLog = async () => {
    if (wasteForm.wasteAmount <= 0) {
      alert('Sila masukkan kuantiti pembaziran');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const itemName = wasteForm.item === 'Lain-lain' ? wasteForm.customItem : wasteForm.item;
    const reason = wasteForm.reason === 'Lain-lain' ? wasteForm.customReason : wasteForm.reason;

    addProductionLog({
      date: new Date().toISOString().split('T')[0],
      item: itemName,
      quantityProduced: 0,
      wasteAmount: wasteForm.wasteAmount,
      notes: `Pembaziran: ${reason}`,
    });

    setWasteForm({
      item: PRODUCTION_ITEMS[0],
      customItem: '',
      wasteAmount: 0,
      reason: WASTE_REASONS[0],
      customReason: '',
    });
    setShowWasteModal(false);
    setIsProcessing(false);
  };

  const todayLogs = productionLogs.filter(log => log.date === new Date().toISOString().split('T')[0]);
  const todayProduction = todayLogs.filter(log => log.quantityProduced > 0);
  const todayWaste = todayLogs.filter(log => log.wasteAmount > 0);

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
        <LivePageHeader
          title="Production & Kitchen Ops"
          subtitle="Pantau peralatan dan log production harian"
          rightContent={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <PremiumButton onClick={() => setShowAddLogModal(true)} icon={Plus}>
                Log Production
              </PremiumButton>
              <PremiumButton variant="glass" onClick={() => setShowWasteModal(true)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} icon={Trash2}>
                Log Sisa
              </PremiumButton>
            </div>
          }
        />

        {/* Daily Stats */}
        <div className="content-grid cols-3 mb-lg animate-slide-up-stagger">
          <StatCard
            label="Item Dihasilkan Hari Ini"
            value={todayProduction.length}
            change="jenis item"
            changeType="neutral"
            icon={Package}
            gradient="primary"
          />
          <StatCard
            label="Jumlah Unit Dihasilkan"
            value={todayProduction.reduce((sum, log) => sum + log.quantityProduced, 0)}
            change="unit hari ini"
            changeType="positive"
            icon={CheckCircle}
            gradient="peach"
          />
          <StatCard
            label="Unit Pembaziran"
            value={todayWaste.reduce((sum, log) => sum + log.wasteAmount, 0)}
            change={todayWaste.reduce((sum, log) => sum + log.wasteAmount, 0) > 0 ? "perlu kurangkan" : "tiada pembaziran"}
            changeType={todayWaste.reduce((sum, log) => sum + log.wasteAmount, 0) > 0 ? "negative" : "positive"}
            icon={Trash2}
            gradient="warning"
          />
        </div>

        {/* Kanban Layout for Logs */}
        <div className="content-grid cols-2 animate-slide-up-stagger" style={{ animationDelay: '0.2s', alignItems: 'start' }}>
          {/* Produced Column */}
          <GlassCard>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Production Log</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Item siap dimasak</div>
                </div>
              </div>
            </div>

            {todayProduction.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {todayProduction.map(log => (
                  <div key={log.id} style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--success)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{log.item}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.notes || 'Tiada catatan'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>+{log.quantityProduced}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unit</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Package size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Tiada rekod production hari ini.</p>
                <button className="btn btn-link btn-sm" onClick={() => setShowAddLogModal(true)}>+ Tambah Rekod</button>
              </div>
            )}
          </GlassCard>

          {/* Waste Column */}
          <GlassCard>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Waste Log</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sisa & Kerosakan</div>
                </div>
              </div>
            </div>

            {todayWaste.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {todayWaste.map(log => (
                  <div key={log.id} style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--danger)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{log.item}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.notes ? log.notes.replace('Pembaziran: ', '') : 'Tiada sebab'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>-{log.wasteAmount}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unit</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', color: 'var(--success)' }} />
                <p>Tiada pembaziran direkodkan.</p>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Kerja yang bagus!</div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Add Production Log Modal */}
        <Modal
          isOpen={showAddLogModal}
          onClose={() => !isProcessing && setShowAddLogModal(false)}
          title="Log Production"
          subtitle="Rekod item yang dihasilkan"
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Item</label>
            <select
              className="form-select"
              value={logForm.item}
              onChange={(e) => setLogForm(prev => ({ ...prev, item: e.target.value }))}
            >
              {PRODUCTION_ITEMS.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {logForm.item === 'Lain-lain' && (
            <div className="form-group">
              <label className="form-label">Nama Item</label>
              <input
                type="text"
                className="form-input"
                value={logForm.customItem}
                onChange={(e) => setLogForm(prev => ({ ...prev, customItem: e.target.value }))}
                placeholder="Masukkan nama item"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Kuantiti Dihasilkan</label>
            <input
              type="number"
              className="form-input"
              value={logForm.quantityProduced}
              onChange={(e) => setLogForm(prev => ({ ...prev, quantityProduced: Number(e.target.value) }))}
              min="0"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Catatan (Optional)</label>
            <textarea
              className="form-input"
              value={logForm.notes}
              onChange={(e) => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Contoh: Batch pagi"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              onClick={() => setShowAddLogModal(false)}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddProductionLog}
              disabled={isProcessing || logForm.quantityProduced <= 0}
              style={{ minWidth: '120px' }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </Modal>

        {/* Add Waste Log Modal */}
        <Modal
          isOpen={showWasteModal}
          onClose={() => !isProcessing && setShowWasteModal(false)}
          title="Log Pembaziran"
          subtitle="Rekod item yang rosak/buang"
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Item</label>
            <select
              className="form-select"
              value={wasteForm.item}
              onChange={(e) => setWasteForm(prev => ({ ...prev, item: e.target.value }))}
            >
              {PRODUCTION_ITEMS.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {wasteForm.item === 'Lain-lain' && (
            <div className="form-group">
              <label className="form-label">Nama Item</label>
              <input
                type="text"
                className="form-input"
                value={wasteForm.customItem}
                onChange={(e) => setWasteForm(prev => ({ ...prev, customItem: e.target.value }))}
                placeholder="Masukkan nama item"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Kuantiti Pembaziran</label>
            <input
              type="number"
              className="form-input"
              value={wasteForm.wasteAmount}
              onChange={(e) => setWasteForm(prev => ({ ...prev, wasteAmount: Number(e.target.value) }))}
              min="0"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sebab</label>
            <select
              className="form-select"
              value={wasteForm.reason}
              onChange={(e) => setWasteForm(prev => ({ ...prev, reason: e.target.value }))}
            >
              {WASTE_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {wasteForm.reason === 'Lain-lain' && (
            <div className="form-group">
              <label className="form-label">Sebab Lain</label>
              <input
                type="text"
                className="form-input"
                value={wasteForm.customReason}
                onChange={(e) => setWasteForm(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Nyatakan sebab"
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              onClick={() => setShowWasteModal(false)}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleAddWasteLog}
              disabled={isProcessing || wasteForm.wasteAmount <= 0}
              style={{ minWidth: '140px' }}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Menyimpan...
                </>
              ) : (
                'Log Pembaziran'
              )}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout >
  );
}
