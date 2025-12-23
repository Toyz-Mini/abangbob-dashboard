'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useEquipment } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useOilTrackersRealtime } from '@/lib/supabase/realtime-hooks';
import { OilTracker, OilChangeRequest, OilActionHistory, OilActionType, Equipment, MaintenanceLog } from '@/lib/types';
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
  Server
} from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import AssetCard from '@/components/equipment/AssetCard';
import MaintenanceModal from '@/components/equipment/MaintenanceModal';

type TabType = 'overview' | 'assets' | 'maintenance' | 'oil-tracker';
type OilTabType = 'fryers' | 'pending' | 'history';

export default function EquipmentPage() {
  const {
    // Oil Tracker
    oilTrackers,
    oilChangeRequests,
    oilActionHistory,
    addOilTracker,
    updateOilTracker,
    deleteOilTracker,
    submitOilRequest,
    approveOilRequest,
    rejectOilRequest,
    getPendingOilRequests,
    getPendingOilRequestCount,
    refreshOilTrackers,

    // General Equipment
    equipment: assetList,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addMaintenanceLog,
    addMaintenanceSchedule,

    isInitialized
  } = useEquipment();

  const handleOilTrackersChange = useCallback(() => {
    refreshOilTrackers();
  }, [refreshOilTrackers]);

  useOilTrackersRealtime(handleOilTrackersChange);

  const { user, currentStaff } = useAuth();
  const isManager = currentStaff?.role === 'Admin' || currentStaff?.role === 'Manager';
  const currentUserName = user?.user_metadata?.name || 'Staff';

  // Main Tabs
  const [activeTab, setActiveTab] = useState<TabType>('assets');

  // Oil Tracker Sub-tabs
  const [activeOilTab, setActiveOilTab] = useState<OilTabType>('fryers');

  // Modals
  const [showAddFryerModal, setShowAddFryerModal] = useState(false);
  const [showOilActionModal, setShowOilActionModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Selected State
  const [selectedFryer, setSelectedFryer] = useState<OilTracker | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OilChangeRequest | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);

  const [actionType, setActionType] = useState<OilActionType>('change');
  const [isProcessing, setIsProcessing] = useState(false);

  // Forms
  const [fryerForm, setFryerForm] = useState({ name: '', cycleLimit: 500 });
  const [oilActionForm, setOilActionForm] = useState({ topupPercentage: 25, notes: '', photoUrl: '' });
  const [rejectReason, setRejectReason] = useState('');

  // Asset Form
  const [assetForm, setAssetForm] = useState<Partial<Equipment>>({
    name: '',
    type: 'other',
    location: '',
    status: 'good'
  });

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');

  const pendingRequests = getPendingOilRequests();
  const pendingCount = getPendingOilRequestCount();

  // --- HELPERS ---

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // --- ASSET MANAGEMENT HANDLERS ---

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.type) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));

    if (selectedAsset) {
      updateEquipment(selectedAsset.id, assetForm);
    } else {
      addEquipment(assetForm as any);
    }

    setIsProcessing(false);
    setShowAssetModal(false);
    setAssetForm({ name: '', type: 'other', location: '', status: 'good' });
    setSelectedAsset(null);
  };

  const handleDeleteAsset = (asset: Equipment) => {
    if (confirm(`Padam asset ${asset.name}?`)) {
      deleteEquipment(asset.id);
    }
  };

  // --- CAMERA HANDLERS ---

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      alert('Tidak dapat mengakses kamera.');
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setOilActionForm(prev => ({ ...prev, photoUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  // --- OIL TRACKER HANDLERS ---

  const handleOpenOilAction = (fryer: OilTracker, type: OilActionType) => {
    setSelectedFryer(fryer);
    setActionType(type);
    setOilActionForm({ topupPercentage: 25, notes: '', photoUrl: '' });
    setCapturedPhoto('');
    setShowOilActionModal(true);
  };

  const handleSubmitOilRequest = async () => {
    if (!selectedFryer || !capturedPhoto) {
      alert('Sila ambil gambar bukti terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = submitOilRequest(
      selectedFryer.fryerId,
      actionType,
      capturedPhoto,
      user?.id || '',
      currentUserName,
      actionType === 'topup' ? oilActionForm.topupPercentage : undefined,
      oilActionForm.notes || undefined
    );

    setIsProcessing(false);

    if (result.success) {
      setShowOilActionModal(false);
      setCapturedPhoto('');
      alert('Request berjaya dihantar!');
    } else {
      alert(result.error || 'Gagal menghantar request');
    }
  };

  // Render Loading
  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server className="text-blue-600" />
              Equipment & Facilities
            </h1>
            <p className="text-gray-500">Uruskan aset, penyelenggaraan, dan fryer di satu tempat.</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'assets' && (
              <button className="btn btn-primary" onClick={() => {
                setSelectedAsset(null);
                setAssetForm({ name: '', type: 'other', location: '', status: 'good' });
                setShowAssetModal(true);
              }}>
                <Plus size={18} className="mr-2" />
                Daftar Aset
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assets')}
          >
            <LayoutGrid size={18} className="inline mr-2" />
            Asset Register
          </button>

          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'maintenance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <CalendarIcon size={18} className="inline mr-2" />
            Maintenance
          </button>

          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'oil-tracker' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('oil-tracker')}
          >
            <Droplets size={18} className="inline mr-2" />
            Oil Tracker
          </button>
        </div>

        {/* === TAB CONTENT: ASSET REGISTER === */}
        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetList.map(asset => (
              <AssetCard
                key={asset.id}
                equipment={asset}
                onEdit={(a) => {
                  setSelectedAsset(a);
                  setAssetForm(a);
                  setShowAssetModal(true);
                }}
                onDelete={handleDeleteAsset}
                onViewSchedule={(a) => {
                  setSelectedAsset(a);
                  setShowMaintenanceModal(true);
                }}
              />
            ))}

            {assetList.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                <Server size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Tiada aset didaftarkan lagi.</p>
                <button className="btn btn-outline mt-4" onClick={() => setShowAssetModal(true)}>
                  Daftar Aset Pertama
                </button>
              </div>
            )}
          </div>
        )}

        {/* === TAB CONTENT: MAINTENANCE === */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="text-blue-500" />
                  Upcoming Scheduled Tasks
                </h3>
                {/* This will be populated with maintenanceSchedules from store later */}
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>Tiada jadual maintenance akan datang.</p>
                  <p className="text-sm mt-2">Set jadual pada setiap aset untuk melihat di sini.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card bg-blue-50 border-blue-100">
                <h3 className="font-bold mb-2 text-blue-800">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="btn btn-white w-full text-left justify-start" onClick={() => {
                    // Open asset modal first then maintenance? 
                    // For now just alert or redirect
                    alert('Sila pilih Aset di tab Asset Register untuk lapor isu.');
                    setActiveTab('assets');
                  }}>
                    <AlertTriangle size={16} className="mr-2 text-red-500" />
                    Report Issue / Breakdown
                  </button>
                  <button className="btn btn-white w-full text-left justify-start" onClick={() => setActiveTab('oil-tracker')}>
                    <Droplets size={16} className="mr-2 text-yellow-500" />
                    Check Fryer Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB CONTENT: OIL TRACKER (Existing functionality) === */}
        {activeTab === 'oil-tracker' && (
          <div>
            {/* Internal Oil Tracker Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                className={`btn btn-sm ${activeOilTab === 'fryers' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveOilTab('fryers')}
              >
                Fryers
              </button>
              {isManager && (
                <button
                  className={`btn btn-sm ${activeOilTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveOilTab('pending')}
                >
                  Pending
                  {pendingCount > 0 && <span className="ml-2 bg-white text-red-500 px-1 rounded-full text-xs">{pendingCount}</span>}
                </button>
              )}
              <button
                className={`btn btn-sm ${activeOilTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveOilTab('history')}
              >
                History
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
        )}

      </div>

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
      {selectedAsset && showMaintenanceModal && (
        <MaintenanceModal
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          equipment={selectedAsset}
          currentUser={{ id: user?.id || 'sys', name: currentUserName }}
          onSaveLog={addMaintenanceLog}
          onSaveSchedule={addMaintenanceSchedule}
        />
      )}

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
                <img src={capturedPhoto} className="w-full rounded" />
                <button className="btn btn-sm btn-circle btn-error absolute top-2 right-2 text-white" onClick={() => setCapturedPhoto('')}><X size={14} /></button>
              </div>
            )}
          </div>
          <button className="btn btn-primary w-full" onClick={handleSubmitOilRequest} disabled={!capturedPhoto}>Hantar Request</button>
        </div>
      </Modal>

      {/* 4. Photo Proof Modal */}
      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Bukti Gambar">
        <img src={selectedPhoto} alt="Proof" className="w-full rounded" />
      </Modal>

    </MainLayout>
  );
}
