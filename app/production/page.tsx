'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { MOCK_OIL_TRACKERS, addFryingCycles } from '@/lib/production-data';
import { useStore } from '@/lib/store';
import { OilTracker, ProductionLog } from '@/lib/types';
import { AlertTriangle, Plus, Trash2, Package, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';

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

export default function ProductionPage() {
  const { productionLogs, addProductionLog, isInitialized } = useStore();
  const [oilTrackers, setOilTrackers] = useState<OilTracker[]>(MOCK_OIL_TRACKERS);
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

  const handleChangeOil = (fryerId: string) => {
    setOilTrackers(prev => prev.map(tracker => 
      tracker.fryerId === fryerId 
        ? { ...tracker, currentCycles: 0, lastChangedDate: new Date().toISOString().split('T')[0], status: 'good' as const }
        : tracker
    ));
    alert('Minyak berjaya ditukar! Counter reset.');
  };

  const handleAddCycles = (fryerId: string, quantity: number) => {
    const updated = addFryingCycles(fryerId, quantity);
    if (updated) {
      setOilTrackers(prev => prev.map(t => t.fryerId === fryerId ? updated : t));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'critical': return 'var(--danger)';
      default: return 'var(--gray-400)';
    }
  };

  const getStatusPercentage = (tracker: OilTracker) => {
    return Math.min((tracker.currentCycles / tracker.cycleLimit) * 100, 100);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Production & Kitchen Ops
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Pantau peralatan dan log production harian
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowAddLogModal(true)}>
              <Plus size={18} />
              Log Production
            </button>
            <button className="btn btn-outline" onClick={() => setShowWasteModal(true)} style={{ color: 'var(--danger)' }}>
              <Trash2 size={18} />
              Log Pembaziran
            </button>
          </div>
        </div>

        {/* Equipment Health Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Equipment Health - Oil Tracker
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1.5rem' }}>
            {oilTrackers.map(tracker => {
              const percentage = getStatusPercentage(tracker);
              const statusColor = getStatusColor(tracker.status);
              
              return (
                <div key={tracker.fryerId} className="card">
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {tracker.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Last changed: {tracker.lastChangedDate}
                    </div>
                  </div>

                  {/* Gauge */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      width: '100%',
                      height: '20px',
                      background: 'var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: statusColor,
                        transition: 'all 0.3s'
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>{tracker.currentCycles} / {tracker.cycleLimit}</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <span className={`badge ${
                      tracker.status === 'good' ? 'badge-success' :
                      tracker.status === 'warning' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {tracker.status === 'good' ? 'Baik' : 
                       tracker.status === 'warning' ? 'Awas' : 'Kritikal'}
                    </span>
                  </div>

                  {tracker.status === 'critical' && (
                    <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={20} />
                      Minyak perlu ditukar segera!
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleChangeOil(tracker.fryerId)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      Tukar Minyak
                    </button>
                    <button
                      onClick={() => handleAddCycles(tracker.fryerId, 50)}
                      className="btn btn-outline btn-sm"
                    >
                      +50 Test
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Stats */}
        <div className="content-grid cols-3 mb-lg">
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
            gradient="success"
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

        {/* Production Logs */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily Production Log</div>
            <div className="card-subtitle">{new Date().toLocaleDateString('ms-MY')}</div>
          </div>
          
          {todayLogs.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Kuantiti Dihasilkan</th>
                  <th>Sisa/Buangan</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.item}</td>
                    <td>
                      {log.quantityProduced > 0 && (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{log.quantityProduced}</span>
                      )}
                    </td>
                    <td>
                      {log.wasteAmount > 0 && (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{log.wasteAmount}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Tiada log production hari ini. Klik "Log Production" untuk mula.
            </p>
          )}
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

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowAddLogModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddProductionLog}
              disabled={isProcessing || logForm.quantityProduced <= 0}
              style={{ flex: 1 }}
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

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowWasteModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleAddWasteLog}
              disabled={isProcessing || wasteForm.wasteAmount <= 0}
              style={{ flex: 1 }}
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
    </MainLayout>
  );
}
