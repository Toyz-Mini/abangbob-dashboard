'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal } from '@/lib/store';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Settings,
  Plus,
  Edit2,
  Trash2,
  Sun,
  Moon,
  Camera,
  FileText,
  GripVertical,
  CheckCircle
} from 'lucide-react';

export default function ChecklistConfigPage() {
  const { 
    checklistTemplates,
    addChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    isInitialized 
  } = useStaffPortal();

  const [activeTab, setActiveTab] = useState<'opening' | 'closing'>('opening');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirePhoto: false,
    requireNotes: false,
    order: 1,
  });

  const filteredTemplates = checklistTemplates
    .filter(t => t.type === activeTab)
    .sort((a, b) => a.order - b.order);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      title: '',
      description: '',
      requirePhoto: false,
      requireNotes: false,
      order: filteredTemplates.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = checklistTemplates.find(t => t.id === id);
    if (!item) return;
    
    setEditingItem(id);
    setForm({
      title: item.title,
      description: item.description || '',
      requirePhoto: item.requirePhoto,
      requireNotes: item.requireNotes,
      order: item.order,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Sila masukkan tajuk item');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (editingItem) {
      updateChecklistTemplate(editingItem, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        requirePhoto: form.requirePhoto,
        requireNotes: form.requireNotes,
        order: form.order,
      });
    } else {
      addChecklistTemplate({
        type: activeTab,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        requirePhoto: form.requirePhoto,
        requireNotes: form.requireNotes,
        order: form.order,
        isActive: true,
      });
    }

    setIsProcessing(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Padam item ini?')) return;
    deleteChecklistTemplate(id);
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    updateChecklistTemplate(id, { isActive: !currentActive });
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
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Konfigurasi Checklist
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Urus item checklist Opening & Closing
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Tambah Item
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            className={`btn ${activeTab === 'opening' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('opening')}
          >
            <Sun size={18} />
            Opening ({checklistTemplates.filter(t => t.type === 'opening').length})
          </button>
          <button
            className={`btn ${activeTab === 'closing' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('closing')}
          >
            <Moon size={18} />
            Closing ({checklistTemplates.filter(t => t.type === 'closing').length})
          </button>
        </div>

        {/* Checklist Items */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} />
              {activeTab === 'opening' ? 'Opening' : 'Closing'} Checklist Items
            </div>
            <div className="card-subtitle">{filteredTemplates.length} items</div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredTemplates.map((item, index) => (
                <div 
                  key={item.id}
                  style={{ 
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: item.isActive ? 'var(--gray-50)' : 'var(--gray-100)',
                    border: '1px solid var(--gray-200)',
                    opacity: item.isActive ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <GripVertical size={20} color="var(--gray-400)" style={{ cursor: 'grab', marginTop: '0.125rem' }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem', 
                        background: 'var(--gray-200)', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)' 
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontWeight: 500 }}>{item.title}</span>
                    </div>
                    
                    {item.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {item.description}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {item.requirePhoto && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          <Camera size={10} style={{ marginRight: '0.25rem' }} />
                          Gambar
                        </span>
                      )}
                      {item.requireNotes && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          <FileText size={10} style={{ marginRight: '0.25rem' }} />
                          Catatan
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                          Tidak Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => toggleActive(item.id, item.isActive)}
                      title={item.isActive ? 'Nyahaktif' : 'Aktifkan'}
                    >
                      <CheckCircle size={14} color={item.isActive ? 'var(--success)' : 'var(--gray-400)'} />
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(item.id)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDelete(item.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Tiada item. Klik "Tambah Item" untuk mula.
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => !isProcessing && setShowModal(false)}
          title={editingItem ? 'Edit Item' : 'Tambah Item'}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Tajuk Item *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Contoh: Cek suhu fridge"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Penerangan (optional)</label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Contoh: Suhu mesti 0-4°C"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Urutan</label>
              <input
                type="number"
                className="form-input"
                value={form.order}
                onChange={(e) => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="form-label">Keperluan</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.requirePhoto}
                  onChange={(e) => setForm(prev => ({ ...prev, requirePhoto: e.target.checked }))}
                />
                <Camera size={18} />
                <span>Wajib upload gambar</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.requireNotes}
                  onChange={(e) => setForm(prev => ({ ...prev, requireNotes: e.target.checked }))}
                />
                <FileText size={18} />
                <span>Wajib tambah catatan</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}




