'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useEquipment, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useOilTrackersRealtime } from '@/lib/supabase/realtime-hooks';
import { OilTracker, OilActionType, Equipment } from '@/lib/types';
import NextImage from 'next/image';
import {
    AlertTriangle,
    Camera,
    X,
    Droplets,
    Send,
    CheckCircle,
    Clock,
    ChevronRight
} from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

type IssuePriority = 'low' | 'medium' | 'high';

export default function StaffIssuePage() {
    const {
        oilTrackers,
        equipment: assetList,
        submitOilRequest,
        refreshOilTrackers,
        isInitialized
    } = useEquipment();

    const { user, currentStaff } = useAuth();
    const currentUserName = currentStaff?.name || user?.user_metadata?.name || 'Staff';

    // Realtime updates
    const handleOilTrackersChange = useCallback(() => {
        refreshOilTrackers();
    }, [refreshOilTrackers]);

    useOilTrackersRealtime(handleOilTrackersChange);

    // State
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showOilActionModal, setShowOilActionModal] = useState(false);
    const [selectedFryer, setSelectedFryer] = useState<OilTracker | null>(null);
    const [actionType, setActionType] = useState<OilActionType>('change');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Issue Form
    const [issueForm, setIssueForm] = useState({
        equipmentId: '',
        description: '',
        priority: 'medium' as IssuePriority,
        photoUrl: ''
    });

    // Oil Action Form
    const [oilActionForm, setOilActionForm] = useState({
        topupPercentage: 25,
        notes: ''
    });

    // Camera
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string>('');

    // Get fryers that need attention (warning or critical)
    const alertFryers = oilTrackers.filter(t => t.status === 'warning' || t.status === 'critical');

    // Camera functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch {
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
                setIssueForm(prev => ({ ...prev, photoUrl: dataUrl }));
                stopCamera();
            }
        }
    };

    // Handle oil change request
    const handleOpenOilAction = (fryer: OilTracker, type: OilActionType) => {
        setSelectedFryer(fryer);
        setActionType(type);
        setOilActionForm({ topupPercentage: 25, notes: '' });
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
            setSuccessMessage('Request tukar minyak berjaya dihantar!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            alert(result.error || 'Gagal menghantar request');
        }
    };

    // Handle issue report submit
    const handleSubmitIssue = async () => {
        if (!issueForm.equipmentId || !issueForm.description) {
            alert('Sila pilih peralatan dan masukkan penerangan masalah');
            return;
        }

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        // TODO: Implement actual issue submission to database
        // For now, just show success message
        setIsProcessing(false);
        setShowIssueModal(false);
        setIssueForm({ equipmentId: '', description: '', priority: 'medium', photoUrl: '' });
        setCapturedPhoto('');
        setSuccessMessage('Laporan masalah berjaya dihantar!');
        setTimeout(() => setSuccessMessage(''), 3000);
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

    if (!isInitialized) {
        return (
            <StaffLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <LoadingSpinner />
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="animate-fade-in" style={{ padding: '0' }}>
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
                        Lapor Masalah
                    </h1>
                    <p className="page-subtitle">
                        Report kerosakan atau masalah peralatan
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div style={{
                        background: 'var(--success-light)',
                        color: 'var(--success-dark)',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <CheckCircle size={18} />
                        {successMessage}
                    </div>
                )}

                {/* Oil Change Alerts */}
                {alertFryers.length > 0 && (
                    <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)', border: '1px solid #fed7aa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ background: '#ffedd5', padding: '0.5rem', borderRadius: '10px' }}>
                                <Droplets size={20} color="#ea580c" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⚠️ Perlu Tukar Minyak</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {alertFryers.length} fryer perlu perhatian
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {alertFryers.map(fryer => {
                                const percentage = getStatusPercentage(fryer);
                                const statusColor = getStatusColor(fryer.status);
                                return (
                                    <div
                                        key={fryer.fryerId}
                                        style={{
                                            background: 'var(--background)',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{fryer.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {fryer.currentCycles} / {fryer.cycleLimit} cycles
                                                </div>
                                            </div>
                                            <span style={{
                                                background: fryer.status === 'critical' ? 'var(--danger-light)' : 'var(--warning-light)',
                                                color: fryer.status === 'critical' ? 'var(--danger)' : 'var(--warning-dark)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}>
                                                {fryer.status === 'critical' ? 'SEGERA' : 'PERHATIAN'}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                            <div style={{ width: `${percentage}%`, height: '100%', background: statusColor, transition: 'width 0.3s' }} />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ flex: 1 }}
                                                disabled={fryer.hasPendingRequest}
                                                onClick={() => handleOpenOilAction(fryer, 'change')}
                                            >
                                                Tukar Minyak
                                            </button>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                style={{ flex: 1 }}
                                                disabled={fryer.hasPendingRequest}
                                                onClick={() => handleOpenOilAction(fryer, 'topup')}
                                            >
                                                Topup
                                            </button>
                                        </div>
                                        {fryer.hasPendingRequest && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '0.5rem', textAlign: 'center' }}>
                                                ⏳ Menunggu kelulusan
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Report Issue Button */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'var(--danger-light)', padding: '0.5rem', borderRadius: '10px' }}>
                            <AlertTriangle size={20} color="var(--danger)" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Lapor Kerosakan</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Report sebarang masalah peralatan
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => setShowIssueModal(true)}
                    >
                        <AlertTriangle size={18} style={{ marginRight: '0.5rem' }} />
                        Lapor Masalah Baru
                    </button>
                </div>

                {/* All Fryers Status */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Droplets size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 700 }}>Status Semua Fryer</span>
                    </div>

                    {oilTrackers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {oilTrackers.map(fryer => {
                                const percentage = getStatusPercentage(fryer);
                                const statusColor = getStatusColor(fryer.status);
                                return (
                                    <div
                                        key={fryer.fryerId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.75rem',
                                            background: 'var(--gray-50)',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fryer.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                Last changed: {fryer.lastChangedDate}
                                            </div>
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${percentage}%`, height: '100%', background: statusColor }} />
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '0.25rem' }}>
                                                {Math.round(percentage)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <Droplets size={40} color="var(--gray-300)" style={{ marginBottom: '0.5rem' }} />
                            <div>Tiada fryer didaftarkan</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Report Modal */}
            <Modal isOpen={showIssueModal} onClose={() => { stopCamera(); setShowIssueModal(false); }} title="Lapor Masalah">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Pilih Peralatan *</label>
                        <select
                            className="form-select"
                            value={issueForm.equipmentId}
                            onChange={e => setIssueForm({ ...issueForm, equipmentId: e.target.value })}
                        >
                            <option value="">-- Pilih Peralatan --</option>
                            {assetList.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name} ({asset.location || 'N/A'})</option>
                            ))}
                            {oilTrackers.map(fryer => (
                                <option key={fryer.fryerId} value={fryer.fryerId}>Fryer: {fryer.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Penerangan Masalah *</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={issueForm.description}
                            onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                            placeholder="Terangkan masalah yang berlaku..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tahap Keutamaan</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {(['low', 'medium', 'high'] as IssuePriority[]).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`btn btn-sm ${issueForm.priority === p ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setIssueForm({ ...issueForm, priority: p })}
                                >
                                    {p === 'low' ? 'Rendah' : p === 'medium' ? 'Sederhana' : 'Tinggi'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gambar (Pilihan)</label>
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            {!capturedPhoto ? (
                                !isCameraActive ? (
                                    <button className="btn btn-outline" onClick={startCamera}>
                                        <Camera size={18} style={{ marginRight: '0.5rem' }} />
                                        Ambil Gambar
                                    </button>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px' }} />
                                        <button
                                            className="btn btn-primary"
                                            style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }}
                                            onClick={capturePhoto}
                                        >
                                            Tangkap
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <NextImage
                                        src={capturedPhoto}
                                        alt="Issue Photo"
                                        width={0}
                                        height={0}
                                        sizes="100vw"
                                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                        unoptimized
                                    />
                                    <button
                                        className="btn btn-sm btn-circle"
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--danger)', color: 'white' }}
                                        onClick={() => { setCapturedPhoto(''); setIssueForm({ ...issueForm, photoUrl: '' }); }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleSubmitIssue}
                        disabled={isProcessing || !issueForm.equipmentId || !issueForm.description}
                    >
                        {isProcessing ? <LoadingSpinner size="sm" /> : <Send size={18} style={{ marginRight: '0.5rem' }} />}
                        Hantar Laporan
                    </button>
                </div>
            </Modal>

            {/* Oil Action Modal */}
            <Modal
                isOpen={showOilActionModal}
                onClose={() => { stopCamera(); setShowOilActionModal(false); }}
                title={actionType === 'change' ? 'Tukar Minyak' : 'Topup Minyak'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {actionType === 'topup' && (
                        <div className="form-group">
                            <label className="form-label">Berapa banyak topup?</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[20, 25, 30].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`btn btn-sm ${oilActionForm.topupPercentage === p ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ flex: 1 }}
                                        onClick={() => setOilActionForm({ ...oilActionForm, topupPercentage: p })}
                                    >
                                        {p}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Ambil Gambar Bukti *</label>
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            {!capturedPhoto ? (
                                !isCameraActive ? (
                                    <button className="btn btn-outline" onClick={startCamera}>
                                        <Camera size={18} style={{ marginRight: '0.5rem' }} />
                                        Buka Kamera
                                    </button>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px' }} />
                                        <button
                                            className="btn btn-primary"
                                            style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }}
                                            onClick={capturePhoto}
                                        >
                                            Tangkap
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <NextImage
                                        src={capturedPhoto}
                                        alt="Oil Proof"
                                        width={0}
                                        height={0}
                                        sizes="100vw"
                                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                        unoptimized
                                    />
                                    <button
                                        className="btn btn-sm btn-circle"
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--danger)', color: 'white' }}
                                        onClick={() => setCapturedPhoto('')}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleSubmitOilRequest}
                        disabled={isProcessing || !capturedPhoto}
                    >
                        {isProcessing ? <LoadingSpinner size="sm" /> : <Send size={18} style={{ marginRight: '0.5rem' }} />}
                        Hantar Request
                    </button>
                </div>
            </Modal>
        </StaffLayout>
    );
}
