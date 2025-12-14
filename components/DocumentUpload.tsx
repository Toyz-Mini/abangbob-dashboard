'use client';

import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Trash2, 
  Eye, 
  Download,
  X,
  Check,
  AlertCircle,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { StaffDocument } from '@/lib/types';
import Modal from './Modal';
import { uploadFile } from '@/lib/supabase/storage-utils';

type DocumentType = StaffDocument['type'];

interface DocumentUploadProps {
  documents: StaffDocument[];
  onUpload: (document: Omit<StaffDocument, 'id' | 'uploadedAt'>) => void;
  onDelete: (documentId: string) => void;
  readonly?: boolean;
}

interface DocumentCardProps {
  document: StaffDocument;
  onView: () => void;
  onDelete?: () => void;
  readonly?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ic_front: 'IC Depan',
  ic_back: 'IC Belakang',
  contract: 'Surat Kontrak',
  resume: 'Resume / CV',
  offer_letter: 'Surat Tawaran',
  medical_report: 'Laporan Perubatan',
  work_permit: 'Permit Kerja',
  certificate: 'Sijil',
  other: 'Lain-lain',
};

const DOCUMENT_TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  ic_front: <Image size={24} />,
  ic_back: <Image size={24} />,
  contract: <FileText size={24} />,
  resume: <FileText size={24} />,
  offer_letter: <FileText size={24} />,
  medical_report: <FileText size={24} />,
  work_permit: <FileText size={24} />,
  certificate: <FileText size={24} />,
  other: <FileText size={24} />,
};

function DocumentCard({ document, onView, onDelete, readonly }: DocumentCardProps) {
  const isImage = document.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = document.url.match(/\.pdf$/i);
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="document-card">
      <div className="document-icon">
        {isImage ? <Image size={24} /> : <FileText size={24} />}
      </div>
      <div className="document-info">
        <div className="document-name">{document.name}</div>
        <div className="document-meta">
          <span className="document-type">{DOCUMENT_TYPE_LABELS[document.type]}</span>
          <span className="document-date">{formatDate(document.uploadedAt)}</span>
        </div>
        {document.expiryDate && (
          <div className="document-expiry">
            <AlertCircle size={12} />
            Tamat: {formatDate(document.expiryDate)}
          </div>
        )}
      </div>
      <div className="document-actions">
        <button 
          type="button"
          className="document-action-btn"
          onClick={onView}
          title="Lihat"
        >
          <Eye size={16} />
        </button>
        {!readonly && onDelete && (
          <button 
            type="button"
            className="document-action-btn delete"
            onClick={onDelete}
            title="Padam"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <style jsx>{`
        .document-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .document-card:hover {
          border-color: var(--primary);
          background: var(--white);
        }

        .document-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .document-info {
          flex: 1;
          min-width: 0;
        }

        .document-name {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .document-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .document-type {
          background: var(--gray-200);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .document-expiry {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--warning);
          margin-top: 0.25rem;
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
        }

        .document-action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--white);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .document-action-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .document-action-btn.delete:hover {
          border-color: var(--danger);
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}

interface UploadPlaceholderProps {
  type: DocumentType;
  onClick: () => void;
  hasDocument: boolean;
}

function UploadPlaceholder({ type, onClick, hasDocument }: UploadPlaceholderProps) {
  return (
    <button type="button" className="upload-placeholder" onClick={onClick}>
      <div className="upload-placeholder-icon">
        {hasDocument ? <Check size={24} /> : <Upload size={24} />}
      </div>
      <div className="upload-placeholder-label">{DOCUMENT_TYPE_LABELS[type]}</div>
      <div className="upload-placeholder-status">
        {hasDocument ? 'Sudah dimuat naik' : 'Klik untuk muat naik'}
      </div>

      <style jsx>{`
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: ${hasDocument ? 'var(--success-light)' : 'var(--gray-50)'};
          border: 2px dashed ${hasDocument ? 'var(--success)' : 'var(--gray-300)'};
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }

        .upload-placeholder:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .upload-placeholder-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${hasDocument ? 'var(--success)' : 'var(--gray-200)'};
          color: ${hasDocument ? 'white' : 'var(--text-secondary)'};
          border-radius: 50%;
          margin-bottom: 0.75rem;
        }

        .upload-placeholder-label {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .upload-placeholder-status {
          font-size: 0.75rem;
          color: ${hasDocument ? 'var(--success)' : 'var(--text-secondary)'};
        }
      `}</style>
    </button>
  );
}

export default function DocumentUpload({ documents, onUpload, onDelete, readonly = false }: DocumentUploadProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<StaffDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>('ic_front');
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'supabase' | 'local' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredDocTypes: DocumentType[] = ['ic_front', 'ic_back', 'contract', 'resume'];
  const optionalDocTypes: DocumentType[] = ['offer_letter', 'medical_report', 'work_permit', 'certificate', 'other'];

  const hasDocumentOfType = (type: DocumentType) => {
    return documents.some(d => d.type === type);
  };

  const getDocumentOfType = (type: DocumentType) => {
    return documents.find(d => d.type === type);
  };

  const handleUploadClick = (type: DocumentType) => {
    setSelectedType(type);
    setUploadName(DOCUMENT_TYPE_LABELS[type]);
    setUploadUrl('');
    setUploadExpiry('');
    setSelectedFile(null);
    setPreviewFileUrl(null);
    setUploadError(null);
    setStorageMode(null);
    setShowUploadModal(true);
  };

  const handleViewDocument = (document: StaffDocument) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    setSelectedFile(file);
    setUploadError(null);
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewFileUrl(preview);
  };

  const handleSubmitUpload = async () => {
    if (!uploadName.trim() || !selectedFile) {
      setUploadError('Sila pilih fail dan masukkan nama dokumen');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload file using storage utils
      const result = await uploadFile(selectedFile, {
        bucket: 'staff-documents',
        folder: 'documents',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ],
      });

      if (!result.success) {
        setUploadError(result.error || 'Gagal memuat naik fail');
        setIsUploading(false);
        return;
      }

      setStorageMode(result.isLocal ? 'local' : 'supabase');

      // Create document object
      onUpload({
        name: uploadName.trim(),
        type: selectedType,
        url: result.url!,
        expiryDate: uploadExpiry || undefined,
      });

      // Clean up and close
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
      }
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewFileUrl(null);
      setUploadName('');
      setUploadExpiry('');
    } catch (error: any) {
      setUploadError(error.message || 'Ralat tidak dijangka');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="document-upload">
      {/* Required Documents */}
      <div className="document-section">
        <h4 className="document-section-title">Dokumen Wajib</h4>
        <div className="document-grid">
          {requiredDocTypes.map(type => {
            const existingDoc = getDocumentOfType(type);
            
            if (existingDoc) {
              return (
                <DocumentCard
                  key={type}
                  document={existingDoc}
                  onView={() => handleViewDocument(existingDoc)}
                  onDelete={readonly ? undefined : () => onDelete(existingDoc.id)}
                  readonly={readonly}
                />
              );
            }
            
            if (readonly) {
              return (
                <div key={type} className="document-missing">
                  <AlertCircle size={16} />
                  <span>{DOCUMENT_TYPE_LABELS[type]} - Tidak dimuat naik</span>
                </div>
              );
            }
            
            return (
              <UploadPlaceholder
                key={type}
                type={type}
                onClick={() => handleUploadClick(type)}
                hasDocument={false}
              />
            );
          })}
        </div>
      </div>

      {/* Optional Documents */}
      <div className="document-section">
        <div className="document-section-header">
          <h4 className="document-section-title">Dokumen Tambahan</h4>
          {!readonly && (
            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleUploadClick('other')}
            >
              <Upload size={14} />
              Tambah Dokumen
            </button>
          )}
        </div>
        
        {documents.filter(d => optionalDocTypes.includes(d.type)).length > 0 ? (
          <div className="document-list">
            {documents
              .filter(d => optionalDocTypes.includes(d.type))
              .map(doc => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={() => handleViewDocument(doc)}
                  onDelete={readonly ? undefined : () => onDelete(doc.id)}
                  readonly={readonly}
                />
              ))}
          </div>
        ) : (
          <div className="document-empty">
            <FileText size={32} color="var(--text-light)" />
            <p>Tiada dokumen tambahan</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Muat Naik Dokumen"
        maxWidth="450px"
      >
        <div className="form-group">
          <label className="form-label">Jenis Dokumen</label>
          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as DocumentType);
              setUploadName(DOCUMENT_TYPE_LABELS[e.target.value as DocumentType]);
            }}
          >
            {[...requiredDocTypes, ...optionalDocTypes].map(type => (
              <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Dokumen</label>
          <input
            type="text"
            className="form-input"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="Contoh: IC Depan - Ahmad"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Muat Naik Fail</label>
          <div 
            className="file-upload-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewFileUrl ? (
              <div className="file-preview">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={previewFileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <>
                    <FileText size={48} color="var(--primary)" />
                    <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>{selectedFile?.name}</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewFileUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Buang
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} color="var(--text-light)" />
                <p>Klik atau seret fail ke sini</p>
                <span>JPG, PNG, atau PDF (maksimum 5MB)</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
          
          {storageMode && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem',
              color: 'var(--text-secondary)'
            }}>
              {storageMode === 'supabase' ? (
                <>
                  <Cloud size={12} />
                  <span>Disimpan di cloud</span>
                </>
              ) : (
                <>
                  <HardDrive size={12} />
                  <span>Disimpan secara local</span>
                </>
              )}
            </div>
          )}

          {uploadError && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              <AlertCircle size={14} />
              {uploadError}
            </div>
          )}
        </div>

        {(selectedType === 'work_permit' || selectedType === 'certificate') && (
          <div className="form-group">
            <label className="form-label">Tarikh Tamat (jika ada)</label>
            <input
              type="date"
              className="form-input"
              value={uploadExpiry}
              onChange={(e) => setUploadExpiry(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowUploadModal(false)}
            style={{ flex: 1 }}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitUpload}
            style={{ flex: 1 }}
            disabled={!uploadName.trim() || !selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <div className="upload-spinner" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Memuat naik...
              </>
            ) : (
              <>
                <Upload size={16} />
                Muat Naik
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={previewDocument?.name || 'Pratonton Dokumen'}
        maxWidth="600px"
      >
        {previewDocument && (
          <div className="document-preview">
            {previewDocument.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <div className="document-preview-image">
                <img src={previewDocument.url} alt={previewDocument.name} />
              </div>
            ) : (
              <div className="document-preview-file">
                <FileText size={64} color="var(--text-light)" />
                <p>{previewDocument.name}</p>
                <a 
                  href={previewDocument.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <Download size={14} />
                  Muat Turun
                </a>
              </div>
            )}
            
            <div className="document-preview-info">
              <div className="document-preview-row">
                <span>Jenis:</span>
                <span>{DOCUMENT_TYPE_LABELS[previewDocument.type]}</span>
              </div>
              <div className="document-preview-row">
                <span>Dimuat naik:</span>
                <span>{new Date(previewDocument.uploadedAt).toLocaleDateString('ms-MY')}</span>
              </div>
              {previewDocument.expiryDate && (
                <div className="document-preview-row">
                  <span>Tamat:</span>
                  <span>{new Date(previewDocument.expiryDate).toLocaleDateString('ms-MY')}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setShowPreviewModal(false)}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          Tutup
        </button>
      </Modal>

      <style jsx>{`
        .document-upload {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .document-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .document-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .document-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primary);
          margin: 0;
        }

        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .document-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-missing {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--gray-50);
          border: 1px dashed var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .document-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--gray-50);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-align: center;
        }

        .document-empty p {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
        }

        .file-upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          border: 2px dashed var(--gray-300);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          min-height: 200px;
        }

        .file-upload-zone:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .file-upload-zone p {
          margin: 0.5rem 0 0.25rem;
          font-weight: 500;
        }

        .file-upload-zone span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .document-preview {
          text-align: center;
        }

        .document-preview-image {
          margin-bottom: 1rem;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--gray-100);
        }

        .document-preview-image img {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
        }

        .document-preview-file {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background: var(--gray-50);
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }

        .document-preview-file p {
          margin: 1rem 0;
          font-weight: 500;
        }

        .document-preview-info {
          background: var(--gray-50);
          padding: 1rem;
          border-radius: var(--radius-md);
        }

        .document-preview-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.875rem;
        }

        .document-preview-row:not(:last-child) {
          border-bottom: 1px solid var(--gray-200);
        }

        .document-preview-row span:first-child {
          color: var(--text-secondary);
        }

        .document-preview-row span:last-child {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}


