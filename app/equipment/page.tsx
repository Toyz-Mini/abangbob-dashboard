'use client';

import { useState, useRef, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useEquipment } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { OilTracker, OilChangeRequest, OilActionHistory, OilActionType } from '@/lib/types';
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
  Image as ImageIcon
} from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type TabType = 'fryers' | 'pending' | 'history';

export default function EquipmentPage() {
  const { 
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
    isInitialized 
  } = useEquipment();
  
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';
  const currentUserName = user?.name || 'Staff';

  const [activeTab, setActiveTab] = useState<TabType>('fryers');
  const [showAddFryerModal, setShowAddFryerModal] = useState(false);
  const [showOilActionModal, setShowOilActionModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [selectedFryer, setSelectedFryer] = useState<OilTracker | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OilChangeRequest | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [actionType, setActionType] = useState<OilActionType>('change');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add/Edit Fryer form
  const [fryerForm, setFryerForm] = useState({
    name: '',
    cycleLimit: 500,
  });

  // Oil action form
  const [oilActionForm, setOilActionForm] = useState({
    topupPercentage: 25,
    notes: '',
    photoUrl: '',
  });

  // Reject form
  const [rejectReason, setRejectReason] = useState('');

  // Camera ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');

  const pendingRequests = getPendingOilRequests();
  const pendingCount = getPendingOilRequestCount();

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Tidak dapat mengakses kamera. Sila beri kebenaran.');
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
      alert('Request berjaya dihantar! Menunggu approval dari Manager.');
    } else {
      alert(result.error || 'Gagal menghantar request');
    }
  };

  const handleApprove = async (request: OilChangeRequest) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = approveOilRequest(request.id, user?.id || '', currentUserName);
    
    setIsProcessing(false);
    
    if (result.success) {
      alert('Request berjaya diluluskan!');
    } else {
      alert(result.error || 'Gagal meluluskan request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert('Sila nyatakan sebab penolakan');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    rejectOilRequest(selectedRequest.id, user?.id || '', currentUserName, rejectReason);
    
    setIsProcessing(false);
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedRequest(null);
    alert('Request telah ditolak.');
  };

  const handleAddFryer = async () => {
    if (!fryerForm.name.trim()) {
      alert('Sila masukkan nama fryer');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    addOilTracker({
      name: fryerForm.name,
      currentCycles: 0,
      cycleLimit: fryerForm.cycleLimit,
      lastChangedDate: new Date().toISOString().split('T')[0],
      status: 'good',
    });

    setIsProcessing(false);
    setShowAddFryerModal(false);
    setFryerForm({ name: '', cycleLimit: 500 });
  };

  const handleEditFryer = (fryer: OilTracker) => {
    setSelectedFryer(fryer);
    setFryerForm({ name: fryer.name, cycleLimit: fryer.cycleLimit });
    setShowAddFryerModal(true);
  };

  const handleUpdateFryer = async () => {
    if (!selectedFryer || !fryerForm.name.trim()) {
      alert('Sila masukkan nama fryer');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    updateOilTracker(selectedFryer.fryerId, {
      name: fryerForm.name,
      cycleLimit: fryerForm.cycleLimit,
    });

    setIsProcessing(false);
    setShowAddFryerModal(false);
    setSelectedFryer(null);
    setFryerForm({ name: '', cycleLimit: 500 });
  };

  const handleDeleteFryer = async () => {
    if (!selectedFryer) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    deleteOilTracker(selectedFryer.fryerId);

    setIsProcessing(false);
    setShowDeleteConfirm(false);
    setSelectedFryer(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wrench size={28} />
              Equipment Health
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Pantau dan uruskan peralatan dapur - Oil Tracker
            </p>
          </div>
          {isManager && (
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setSelectedFryer(null);
                setFryerForm({ name: '', cycleLimit: 500 });
                setShowAddFryerModal(true);
              }}
            >
              <Plus size={18} />
              Tambah Fryer
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'fryers' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('fryers')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Droplets size={18} />
            Fryers
          </button>
          {isManager && (
            <button
              className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('pending')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}
            >
              <Clock size={18} />
              Pending
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('history')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <History size={18} />
            History
          </button>
        </div>

        {/* Fryers Tab */}
        {activeTab === 'fryers' && (
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1.5rem' }}>
            {oilTrackers.map(tracker => {
              const percentage = getStatusPercentage(tracker);
              const statusColor = getStatusColor(tracker.status);
              
              return (
                <div key={tracker.fryerId} className="card" style={{ position: 'relative' }}>
                  {tracker.hasPendingRequest && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'var(--warning)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      ⏳ PENDING
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {tracker.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Last changed: {tracker.lastChangedDate}
                      {tracker.lastTopupDate && (
                        <span> | Topup: {tracker.lastTopupDate}</span>
                      )}
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
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: statusColor,
                        transition: 'all 0.3s',
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
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
                      {tracker.status === 'good' ? 'BAIK' : 
                       tracker.status === 'warning' ? 'AWAS' : 'KRITIKAL'}
                    </span>
                  </div>

                  {tracker.status === 'critical' && (
                    <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={20} />
                      Minyak perlu ditukar segera!
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenOilAction(tracker, 'change')}
                      className="btn btn-primary btn-sm"
                      disabled={tracker.hasPendingRequest}
                      style={{ flex: 1 }}
                    >
                      Tukar Minyak
                    </button>
                    <button
                      onClick={() => handleOpenOilAction(tracker, 'topup')}
                      className="btn btn-outline btn-sm"
                      disabled={tracker.hasPendingRequest}
                      style={{ flex: 1 }}
                    >
                      Topup
                    </button>
                  </div>
                  
                  {isManager && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleEditFryer(tracker)}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFryer(tracker);
                          setShowDeleteConfirm(true);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                        Padam
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {oilTrackers.length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <Droplets size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  Tiada fryer didaftarkan. {isManager ? 'Klik "Tambah Fryer" untuk mula.' : 'Hubungi Manager untuk tambah fryer.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && isManager && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pending Approvals</div>
              <div className="card-subtitle">{pendingCount} request menunggu kelulusan</div>
            </div>
            
            {pendingRequests.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Fryer</th>
                    <th>Jenis</th>
                    <th>Staff</th>
                    <th>Tarikh</th>
                    <th>Cycles</th>
                    <th>Bukti</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(request => (
                    <tr key={request.id}>
                      <td style={{ fontWeight: 600 }}>{request.fryerName}</td>
                      <td>
                        <span className={`badge ${request.actionType === 'change' ? 'badge-success' : 'badge-info'}`}>
                          {request.actionType === 'change' ? 'TUKAR' : `TOPUP ${request.topupPercentage}%`}
                        </span>
                      </td>
                      <td>{request.requestedBy}</td>
                      <td style={{ fontSize: '0.875rem' }}>{formatDate(request.requestedAt)}</td>
                      <td>
                        {request.previousCycles} → {request.proposedCycles}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedPhoto(request.photoUrl);
                            setShowPhotoModal(true);
                          }}
                        >
                          <ImageIcon size={14} />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(request)}
                            disabled={isProcessing}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            style={{ color: 'var(--danger)' }}
                            disabled={isProcessing}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Tiada request pending.
              </p>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">History Tukar & Topup Minyak</div>
              <div className="card-subtitle">Rekod yang telah diluluskan</div>
            </div>
            
            {oilActionHistory.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarikh</th>
                    <th>Fryer</th>
                    <th>Jenis</th>
                    <th>Cycles</th>
                    <th>Staff</th>
                    <th>Approved By</th>
                    <th>Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {oilActionHistory.map(history => (
                    <tr key={history.id}>
                      <td style={{ fontSize: '0.875rem' }}>{formatDate(history.actionAt)}</td>
                      <td style={{ fontWeight: 600 }}>{history.fryerName}</td>
                      <td>
                        <span className={`badge ${history.actionType === 'change' ? 'badge-success' : 'badge-info'}`}>
                          {history.actionType === 'change' ? 'TUKAR' : `TOPUP ${history.topupPercentage}%`}
                        </span>
                      </td>
                      <td>
                        {history.previousCycles} → {history.newCycles}
                      </td>
                      <td>{history.requestedBy}</td>
                      <td>{history.approvedBy}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedPhoto(history.photoUrl);
                            setShowPhotoModal(true);
                          }}
                        >
                          <ImageIcon size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Tiada rekod history.
              </p>
            )}
          </div>
        )}

        {/* Add/Edit Fryer Modal */}
        <Modal
          isOpen={showAddFryerModal}
          onClose={() => !isProcessing && setShowAddFryerModal(false)}
          title={selectedFryer ? 'Edit Fryer' : 'Tambah Fryer Baru'}
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Nama Fryer</label>
            <input
              type="text"
              className="form-input"
              value={fryerForm.name}
              onChange={(e) => setFryerForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="cth: Fryer 1 - Ayam"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cycle Limit</label>
            <input
              type="number"
              className="form-input"
              value={fryerForm.cycleLimit}
              onChange={(e) => setFryerForm(prev => ({ ...prev, cycleLimit: Number(e.target.value) }))}
              min="100"
              placeholder="500"
            />
            <small style={{ color: 'var(--text-secondary)' }}>Bilangan kitaran maksimum sebelum perlu tukar minyak</small>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowAddFryerModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={selectedFryer ? handleUpdateFryer : handleAddFryer}
              disabled={isProcessing || !fryerForm.name.trim()}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : (selectedFryer ? 'Kemaskini' : 'Tambah')}
            </button>
          </div>
        </Modal>

        {/* Oil Action Modal (Change/Topup) */}
        <Modal
          isOpen={showOilActionModal}
          onClose={() => {
            if (!isProcessing) {
              stopCamera();
              setShowOilActionModal(false);
            }
          }}
          title={actionType === 'change' ? 'Tukar Minyak' : 'Topup Minyak'}
          subtitle={selectedFryer?.name}
          maxWidth="500px"
        >
          {selectedFryer && (
            <>
              <div style={{ background: 'var(--gray-100)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Cycles semasa:</span>
                  <strong>{selectedFryer.currentCycles} / {selectedFryer.cycleLimit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Selepas {actionType === 'change' ? 'tukar' : 'topup'}:</span>
                  <strong style={{ color: 'var(--success)' }}>
                    {actionType === 'change' 
                      ? '0' 
                      : Math.round(selectedFryer.currentCycles * (1 - oilActionForm.topupPercentage / 100))
                    } / {selectedFryer.cycleLimit}
                  </strong>
                </div>
              </div>

              {actionType === 'topup' && (
                <div className="form-group">
                  <label className="form-label">Pengurangan Cycles</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        className={`btn ${oilActionForm.topupPercentage === pct ? 'btn-primary' : 'btn-outline'} btn-sm`}
                        onClick={() => setOilActionForm(prev => ({ ...prev, topupPercentage: pct }))}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                    Cycles akan dikurangkan dari {selectedFryer.currentCycles} → {Math.round(selectedFryer.currentCycles * (1 - oilActionForm.topupPercentage / 100))}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">📸 Ambil Gambar Bukti (Wajib)</label>
                <div style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem',
                  textAlign: 'center',
                }}>
                  {!isCameraActive && !capturedPhoto && (
                    <button className="btn btn-primary" onClick={startCamera}>
                      <Camera size={18} />
                      Buka Kamera
                    </button>
                  )}
                  
                  {isCameraActive && (
                    <div>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
                      />
                      <button className="btn btn-primary" onClick={capturePhoto}>
                        <Camera size={18} />
                        Tangkap Gambar
                      </button>
                    </div>
                  )}
                  
                  {capturedPhoto && (
                    <div>
                      <img 
                        src={capturedPhoto} 
                        alt="Captured" 
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
                      />
                      <button 
                        className="btn btn-outline" 
                        onClick={() => {
                          setCapturedPhoto('');
                          startCamera();
                        }}
                      >
                        Ambil Semula
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan (Optional)</label>
                <textarea
                  className="form-input"
                  value={oilActionForm.notes}
                  onChange={(e) => setOilActionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="cth: Minyak sudah sangat gelap"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    stopCamera();
                    setShowOilActionModal(false);
                  }}
                  disabled={isProcessing}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitOilRequest}
                  disabled={isProcessing || !capturedPhoto}
                  style={{ flex: 1 }}
                >
                  {isProcessing ? <LoadingSpinner size="sm" /> : 'Submit Request'}
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => !isProcessing && setShowRejectModal(false)}
          title="Tolak Request"
          maxWidth="400px"
        >
          {selectedRequest && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <p><strong>Fryer:</strong> {selectedRequest.fryerName}</p>
                <p><strong>Jenis:</strong> {selectedRequest.actionType === 'change' ? 'Tukar' : 'Topup'}</p>
                <p><strong>Staff:</strong> {selectedRequest.requestedBy}</p>
              </div>

              <div className="form-group">
                <label className="form-label">Sebab Penolakan (Wajib)</label>
                <textarea
                  className="form-input"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nyatakan sebab penolakan..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isProcessing}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  style={{ flex: 1 }}
                >
                  {isProcessing ? <LoadingSpinner size="sm" /> : 'Tolak'}
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Photo Viewer Modal */}
        <Modal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          title="Bukti Gambar"
          maxWidth="600px"
        >
          {selectedPhoto && (
            <img 
              src={selectedPhoto} 
              alt="Proof" 
              style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            />
          )}
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteFryer}
          title="Padam Fryer"
          message={`Adakah anda pasti mahu memadam "${selectedFryer?.name}"? Tindakan ini tidak boleh dibatalkan.`}
          confirmText="Padam"
          cancelText="Batal"
          variant="danger"
        />
      </div>
    </MainLayout>
  );
}
