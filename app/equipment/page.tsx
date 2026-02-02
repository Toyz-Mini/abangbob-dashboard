'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useEquipment } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
// import { useOilTrackersRealtime } from '@/lib/supabase/realtime-hooks'; // Removed in favor of store hook
import { OilTracker, OilChangeRequest, OilActionHistory, OilActionType, Equipment, MaintenanceLog } from '@/lib/types';
import NextImage from 'next/image';
import {
  Plus,
  Wrench,
  AlertTriangle,
  Camera,
  Check,
  X,
  Edit2,
  Trash2,
  Droplets,
  History,
  Clock,
  Image as ImageIcon,
  LayoutGrid,
  Calendar as CalendarIcon,
  Server,
  Thermometer,
  ClipboardCheck
} from 'lucide-react';
import Modal from '@/components/Modal';
import MaintenanceModal from '@/components/equipment/MaintenanceModal';

export default function EquipmentPage() {
  const { user: authUser } = useAuth();
  const user = authUser as any;
  const currentUserName = user?.user_metadata?.username || user?.email || 'User';
  const isManager = user?.role === 'manager' || user?.user_metadata?.role === 'manager';

  // State
  const [activeTab, setActiveTab] = useState('oil-tracker');
  const [activeOilTab, setActiveOilTab] = useState<'fryers' | 'pending' | 'history'>('fryers');

  // Modals
  const [showAddFryerModal, setShowAddFryerModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showOilActionModal, setShowOilActionModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Selection
  const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [actionType, setActionType] = useState<'change' | 'topup'>('change');

  // Camera
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Forms
  const [assetForm, setAssetForm] = useState<Partial<Equipment>>({
    name: '', type: 'fryer', location: '', status: 'good'
  });
  const [oilActionForm, setOilActionForm] = useState({
    topupPercentage: 20
  });

  // Data Hooks
  const {
    oilTrackers,
    oilChangeRequests,
    submitOilRequest,
    approveOilRequest,
    rejectOilRequest,
    addMaintenanceLog,
    addMaintenanceSchedule
  } = useEquipment();

  // Computed
  const pendingRequests = useMemo(() => {
    return oilChangeRequests ? oilChangeRequests.filter((r: any) => r.status === 'pending') : [];
  }, [oilChangeRequests]);

  const pendingCount = pendingRequests.length;
  const isProcessing = false;

  // Helper functions
  const getStatusPercentage = (tracker: OilTracker) => {
    if (!tracker.cycleLimit || tracker.cycleLimit === 0) return 0;
    return (tracker.currentCycles / tracker.cycleLimit) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#22c55e'; // green
      case 'warning': return '#eab308'; // yellow
      case 'critical': return '#ef4444'; // red
      default: return '#9ca3af'; // gray
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  const handleOpenOilAction = (tracker: OilTracker, type: 'change' | 'topup') => {
    setSelectedAsset(tracker as any);
    setActionType(type);
    setShowOilActionModal(true);
    setCapturedPhoto('');
  };

  const startCamera = async () => {
    setIsCameraActive(true);
  };
  const stopCamera = () => {
    setIsCameraActive(false);
  };
  const capturePhoto = () => {
    setCapturedPhoto('data:image/png;base64,placeholder');
    stopCamera();
  };

  const handleSubmitOilRequest = async () => {
    if (selectedAsset) {
      await submitOilRequest(
        selectedAsset.id,
        actionType,
        capturedPhoto,
        user?.id || '',
        currentUserName,
        actionType === 'topup' ? oilActionForm.topupPercentage : undefined
      );
    }
    setShowOilActionModal(false);
  };

  const handleSaveAsset = async () => {
    setShowAssetModal(false);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Equipment & Maintenance</h1>
          <div className="flex gap-2">
            <button className={`btn ${activeTab === 'oil-tracker' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('oil-tracker')}>Oil Tracker</button>
            <button className={`btn ${activeTab === 'assets' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('assets')}>Assets</button>
          </div>
        </div>

        {/* === TAB CONTENT: OIL TRACKER (Existing functionality) === */}
        {
          activeTab === 'oil-tracker' && (
            <div className="space-y-6">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
                <button
                  onClick={() => setActiveOilTab('fryers')}
                  className={`btn ${activeOilTab === 'fryers' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <Thermometer size={16} />
                  Fryer Status
                </button>
                {isManager && (
                  <button
                    onClick={() => setActiveOilTab('pending')}
                    className={`btn ${activeOilTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    <ClipboardCheck size={16} />
                    Pending Tasks
                    {pendingCount > 0 && <span className="ml-2 bg-white text-red-500 px-1 rounded-full text-xs">{pendingCount}</span>}
                  </button>
                )}
                <button
                  onClick={() => setActiveOilTab('history')}
                  className={`btn ${activeOilTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <History size={16} />
                  Log History
                </button>

                {isManager && (
                  <button className="btn btn-sm btn-outline ml-auto" onClick={() => setShowAddFryerModal(true)}>
                    <Plus size={14} className="mr-1" /> Fryer
                  </button>
                )}
              </div>

              {/* Fryers Grid */}
              {activeOilTab === 'fryers' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {oilTrackers.map(tracker => {
                    const percentage = getStatusPercentage(tracker);
                    const statusColor = getStatusColor(tracker.status);
                    return (
                      <div key={tracker.fryerId} className="card relative">
                        {tracker.hasPendingRequest && (
                          <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                            PENDING APPRV
                          </div>
                        )}
                        <h3 className="font-bold text-lg mb-1">{tracker.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Changed: {tracker.lastChangedDate}</p>

                        {/* Gauge */}
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${percentage}%`, backgroundColor: statusColor }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mb-4">
                          <span>{tracker.currentCycles} / {tracker.cycleLimit} cycles</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="btn btn-primary btn-sm flex-1"
                            disabled={tracker.hasPendingRequest}
                            onClick={() => handleOpenOilAction(tracker, 'change')}
                          >
                            Change
                          </button>
                          <button
                            className="btn btn-outline btn-sm flex-1"
                            disabled={tracker.hasPendingRequest}
                            onClick={() => handleOpenOilAction(tracker, 'topup')}
                          >
                            Topup
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pending Requests */}
              {activeOilTab === 'pending' && (
                <div className="card">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Fryer</th>
                        <th className="text-left">Type</th>
                        <th className="text-left">Staff</th>
                        <th className="text-left">Date</th>
                        <th className="text-left">Proof</th>
                        <th className="text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map(req => (
                        <tr key={req.id}>
                          <td className="font-bold">{req.fryerName}</td>
                          <td><span className="badge badge-info">{req.actionType}</span></td>
                          <td>{req.requestedBy}</td>
                          <td className="text-sm">{formatDate(req.requestedAt)}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedPhoto(req.photoUrl); setShowPhotoModal(true); }}>
                              <ImageIcon size={16} />
                            </button>
                          </td>
                          <td className="flex gap-2">
                            <button className="btn btn-success btn-sm text-white" onClick={() => approveOilRequest(req.id, user?.id || '', currentUserName)}>
                              <Check size={16} />
                            </button>
                            <button className="btn btn-error btn-sm text-white" onClick={() => rejectOilRequest(req.id, user?.id || '', currentUserName, 'Rejected')}>
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingRequests.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No pending requests</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        }

      </div >

      {/* === MODALS === */}

      {/* 1. Add Asset Modal */}
      <Modal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} title="Daftar Aset Baru">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nama Aset</label>
            <input className="form-input" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="e.g. Peti Ais Depan" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Jenis</label>
              <select
                className="form-input"
                value={assetForm.type}
                onChange={e => setAssetForm({ ...assetForm, type: e.target.value as any })}
              >
                <option value="fridge">Fridge / Chiller</option>
                <option value="freezer">Freezer</option>
                <option value="ac">Aircond</option>
                <option value="grill">Grill</option>
                <option value="fryer">Fryer (Electric/Gas)</option>
                <option value="pos">POS System</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lokasi</label>
              <select
                className="form-input"
                value={assetForm.location}
                onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
              >
                <option value="">Pilih Lokasi...</option>
                <option value="Kitchen">Dapur Utama</option>
                <option value="Counter">Kaunter Depan</option>
                <option value="Store Room">Stor Barang</option>
                <option value="Outdoor">Outdoor</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Model No.</label>
              <input className="form-input" value={assetForm.modelNumber || ''} onChange={e => setAssetForm({ ...assetForm, modelNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Serial No.</label>
              <input className="form-input" value={assetForm.serialNumber || ''} onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tarikh Beli</label>
            <input type="date" className="form-input" value={assetForm.purchaseDate || ''} onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Warranty Expired</label>
            <input type="date" className="form-input" value={assetForm.warrantyExpiry || ''} onChange={e => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" onClick={handleSaveAsset} disabled={isProcessing}>
            {isProcessing ? 'Menyimpan...' : 'Simpan Aset'}
          </button>
        </div>
      </Modal>

      {/* 2. Maintenance Modal Details */}
      {
        selectedAsset && showMaintenanceModal && (
          <MaintenanceModal
            isOpen={showMaintenanceModal}
            onClose={() => setShowMaintenanceModal(false)}
            equipment={selectedAsset}
            currentUser={{ id: user?.id || 'sys', name: currentUserName }}
            onSaveLog={addMaintenanceLog}
            onSaveSchedule={addMaintenanceSchedule}
          />
        )
      }

      {/* 3. Oil Action Modal (Existing) */}
      <Modal isOpen={showOilActionModal} onClose={() => { stopCamera(); setShowOilActionModal(false); }} title={actionType === 'change' ? 'Tukar Minyak' : 'Topup Minyak'}>
        <div className="space-y-4">
          {actionType === 'topup' && (
            <div className="form-group">
              <label>Berapa banyak topup?</label>
              <div className="flex gap-2 mt-2">
                {[20, 25, 30].map(p => (
                  <button key={p} onClick={() => setOilActionForm({ ...oilActionForm, topupPercentage: p })} className={`btn btn-sm ${oilActionForm.topupPercentage === p ? 'btn-primary' : 'btn-outline'}`}>{p}%</button>
                ))}
              </div>
            </div>
          )}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {!capturedPhoto ? (
              !isCameraActive ? (
                <button className="btn btn-outline" onClick={startCamera}><Camera className="mr-2" /> Buka Kamera</button>
              ) : (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
                  <button className="btn btn-primary absolute bottom-4 left-1/2 transform -translate-x-1/2" onClick={capturePhoto}>Tangkap</button>
                </div>
              )
            ) : (
              <div className="relative">
                <NextImage
                  src={capturedPhoto}
                  alt="Captured Proof"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="rounded"
                  unoptimized
                />
                <button className="btn btn-sm btn-circle btn-error absolute top-2 right-2 text-white" onClick={() => setCapturedPhoto('')}><X size={14} /></button>
              </div>
            )}
          </div>
          <button className="btn btn-primary w-full" onClick={handleSubmitOilRequest} disabled={!capturedPhoto}>Hantar Request</button>
        </div>
      </Modal>

      {/* 4. Photo Proof Modal */}
      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Bukti Gambar">
        <div className="relative w-full h-auto">
          <NextImage
            src={selectedPhoto}
            alt="Proof"
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            className="rounded"
            unoptimized
          />
        </div>
      </Modal>

    </MainLayout >
  );
}
