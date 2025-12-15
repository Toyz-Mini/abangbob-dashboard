'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  CheckSquare,
  Square,
  Camera,
  FileText,
  Clock,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle,
  History,
  CalendarX
} from 'lucide-react';

export default function ChecklistPage() {
  const { isInitialized } = useStaff();
  const { currentStaff } = useAuth();
  const {
    getChecklistTemplatesByType,
    getTodayChecklist,
    startChecklist,
    updateChecklistItem,
    completeChecklist,
    checklistCompletions,
    schedules,
    shifts
  } = useStaffPortal();

  const [activeTab, setActiveTab] = useState<'opening' | 'closing'>('opening');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's schedule to determine shift type
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = useMemo(() => {
    if (!currentStaff) return undefined;
    return schedules.find(s => s.staffId === currentStaff.id && s.date === today);
  }, [schedules, today, currentStaff]);

  const currentShift = useMemo(() => {
    if (!todaySchedule) return null;
    return shifts.find(s => s.id === todaySchedule.shiftId);
  }, [todaySchedule, shifts]);

  // Determine which checklist to show
  const isOpeningShift = currentShift?.startTime && currentShift.startTime < '12:00';
  const isClosingShift = currentShift?.endTime && currentShift.endTime >= '20:00';

  // Get templates and completion
  const openingTemplates = getChecklistTemplatesByType('opening');
  const closingTemplates = getChecklistTemplatesByType('closing');
  const openingChecklist = getTodayChecklist('opening');
  const closingChecklist = getTodayChecklist('closing');

  const currentTemplates = activeTab === 'opening' ? openingTemplates : closingTemplates;
  const currentChecklist = activeTab === 'opening' ? openingChecklist : closingChecklist;

  // Start a new checklist if needed
  const handleStartChecklist = () => {
    if (!currentStaff) return;
    const shiftId = todaySchedule?.shiftId || 'unscheduled';
    startChecklist(activeTab, currentStaff.id, currentStaff.name, shiftId);
  };

  // Toggle item completion
  const handleToggleItem = (templateId: string, currentlyCompleted: boolean) => {
    if (!currentChecklist) return;

    const template = currentTemplates.find(t => t.id === templateId);

    // If requires photo and not completed, open photo modal
    if (!currentlyCompleted && template?.requirePhoto) {
      setSelectedItemId(templateId);
      setPhotoUrl('');
      setShowPhotoModal(true);
      return;
    }

    // If requires notes and not completed, open notes modal
    if (!currentlyCompleted && template?.requireNotes && !template?.requirePhoto) {
      setSelectedItemId(templateId);
      setNotes('');
      setShowNotesModal(true);
      return;
    }

    // Otherwise just toggle
    updateChecklistItem(currentChecklist.id, templateId, {
      isCompleted: !currentlyCompleted,
      completedAt: !currentlyCompleted ? new Date().toISOString() : undefined,
    });
  };

  // Submit photo for item
  const handlePhotoSubmit = () => {
    if (!currentChecklist || !selectedItemId) return;

    const template = currentTemplates.find(t => t.id === selectedItemId);

    // If also requires notes, switch to notes modal
    if (template?.requireNotes) {
      setShowPhotoModal(false);
      setShowNotesModal(true);
      return;
    }

    updateChecklistItem(currentChecklist.id, selectedItemId, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
      photoUrl: photoUrl || 'photo_uploaded.jpg',
    });

    setShowPhotoModal(false);
    setSelectedItemId(null);
    setPhotoUrl('');
  };

  // Submit notes for item
  const handleNotesSubmit = () => {
    if (!currentChecklist || !selectedItemId) return;

    updateChecklistItem(currentChecklist.id, selectedItemId, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
      photoUrl: photoUrl || undefined,
      notes: notes,
    });

    setShowNotesModal(false);
    setSelectedItemId(null);
    setPhotoUrl('');
    setNotes('');
  };

  // Submit complete checklist
  const handleSubmitChecklist = async () => {
    if (!currentChecklist) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    completeChecklist(currentChecklist.id);
    setIsSubmitting(false);
  };

  // Calculate progress
  const completedCount = currentChecklist?.items.filter(i => i.isCompleted).length || 0;
  const totalCount = currentChecklist?.items.length || currentTemplates.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <Link href="/staff-portal" className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem' }}>
                <ArrowLeft size={16} />
                Kembali
              </Link>
              <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
                Checklist Harian
              </h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Link href="/staff-portal/checklist/history" className="btn btn-outline">
              <History size={18} />
              Sejarah
            </Link>
          </div>
        </div>

        {/* Shift Info */}
        {currentShift ? (
          <div
            className="staff-shift-badge"
            style={{
              background: `${currentShift.color}15`,
              borderLeft: `4px solid ${currentShift.color}`,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              // Padding and margin handled by CSS mobile override
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {isOpeningShift ? <Sun size={24} color={currentShift.color} /> : <Moon size={24} color={currentShift.color} />}
            <div>
              <div style={{ fontWeight: 600, color: currentShift.color }}>
                Shift {currentShift.name}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {currentShift.startTime} - {currentShift.endTime}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="staff-shift-badge"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              background: 'var(--gray-100)',
              borderLeft: '4px solid var(--gray-400)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <CalendarX size={24} color="var(--gray-500)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                Tiada Jadual
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Anda tiada shift berjadual hari ini
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            className={`btn ${activeTab === 'opening' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('opening')}
            style={{ flex: 1 }}
          >
            <Sun size={18} />
            Opening
            {openingChecklist?.status === 'completed' && <CheckCircle size={16} />}
          </button>
          <button
            className={`btn ${activeTab === 'closing' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('closing')}
            style={{ flex: 1 }}
          >
            <Moon size={18} />
            Closing
            {closingChecklist?.status === 'completed' && <CheckCircle size={16} />}
          </button>
        </div>

        {/* Checklist Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={20} />
              {activeTab === 'opening' ? 'Opening' : 'Closing'} Checklist
            </div>
            {currentChecklist && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {completedCount}/{totalCount} selesai
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {currentChecklist && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="progress-bar" style={{ height: '10px', borderRadius: '5px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Not Started State */}
          {!currentChecklist && currentTemplates.length > 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <CheckSquare size={40} color="#6366f1" />
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Checklist {activeTab} belum dimulakan
              </p>
              <button className="btn btn-primary" onClick={handleStartChecklist}>
                Mula Checklist
              </button>
            </div>
          )}

          {/* No Templates */}
          {currentTemplates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertCircle size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Tiada checklist items dikonfigurasi
              </p>
            </div>
          )}

          {/* Checklist Items */}
          {currentChecklist && (
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentChecklist.items.map((item, index) => {
                const template = currentTemplates.find(t => t.id === item.templateId);

                return (
                  <div
                    key={item.templateId}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      background: item.isCompleted
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)'
                        : 'var(--gray-50)',
                      border: `1px solid ${item.isCompleted ? '#86efac' : 'var(--gray-200)'}`,
                      cursor: currentChecklist.status === 'completed' ? 'default' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => currentChecklist.status !== 'completed' && handleToggleItem(item.templateId, item.isCompleted)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      {item.isCompleted ? (
                        <CheckSquare size={24} color="#16a34a" />
                      ) : (
                        <Square size={24} color="var(--gray-400)" />
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 500,
                          textDecoration: item.isCompleted ? 'line-through' : 'none',
                          color: item.isCompleted ? 'var(--text-secondary)' : 'inherit'
                        }}>
                          {index + 1}. {item.title}
                        </div>

                        {template?.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {template.description}
                          </div>
                        )}

                        {/* Requirements */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {template?.requirePhoto && (
                            <span className={`badge ${item.photoUrl ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                              <Camera size={10} style={{ marginRight: '0.25rem' }} />
                              {item.photoUrl ? 'Gambar OK' : 'Perlu gambar'}
                            </span>
                          )}
                          {template?.requireNotes && (
                            <span className={`badge ${item.notes ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                              <FileText size={10} style={{ marginRight: '0.25rem' }} />
                              {item.notes ? 'Ada nota' : 'Perlu nota'}
                            </span>
                          )}
                        </div>

                        {/* Completion info */}
                        {item.isCompleted && item.completedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} />
                            Selesai pada {new Date(item.completedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}

                        {item.notes && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: 'var(--gray-100)',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit Button */}
          {currentChecklist && currentChecklist.status === 'in_progress' && (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                className={`btn ${completedCount < totalCount ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={handleSubmitChecklist}
                disabled={isSubmitting || completedCount < totalCount}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Menghantar...
                  </>
                ) : completedCount < totalCount ? (
                  `Selesaikan ${totalCount - completedCount} item lagi`
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Hantar Checklist
                  </>
                )}
              </button>
            </div>
          )}

          {/* Completed State */}
          {currentChecklist?.status === 'completed' && (
            <div className="staff-message success" style={{ marginTop: '1.5rem' }}>
              <CheckCircle size={24} />
              <div>
                <div style={{ fontWeight: 600 }}>Checklist Selesai!</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Selesai pada {currentChecklist.completedAt && new Date(currentChecklist.completedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Photo Modal */}
        <Modal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          title="Upload Gambar"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <Camera size={36} color="#6366f1" />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Ambil gambar sebagai bukti
            </p>

            {/* In a real app, this would be a file upload */}
            <div style={{
              padding: '2rem',
              border: '2px dashed var(--gray-300)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}>
              <Camera size={24} color="var(--gray-400)" />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Klik untuk ambil gambar
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowPhotoModal(false)} style={{ flex: 1 }}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={handlePhotoSubmit} style={{ flex: 1 }}>
                Simpan
              </button>
            </div>
          </div>
        </Modal>

        {/* Notes Modal */}
        <Modal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          title="Tambah Catatan"
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Masukkan catatan..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setShowNotesModal(false)} style={{ flex: 1 }}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleNotesSubmit} style={{ flex: 1 }}>
              Simpan
            </button>
          </div>
        </Modal>

        {/* Bottom Navigation */}
        <StaffPortalNav currentPage="checklist" />
      </div>
    </MainLayout>
  );
}
