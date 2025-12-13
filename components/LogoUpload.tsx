'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Image, AlertCircle, Check } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/contexts/LanguageContext';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function LogoUpload({ currentLogoUrl, onLogoChange, disabled = false }: LogoUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format fail tidak disokong. Sila gunakan JPG, PNG, WebP, atau GIF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Saiz fail terlalu besar. Maksimum 2MB.';
    }
    return null;
  };

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      // Fallback to local storage/blob URL for offline mode
      const localUrl = URL.createObjectURL(file);
      return localUrl;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;
    const filePath = `outlet-logos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('outlet-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Gagal memuat naik logo. Sila cuba lagi.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('outlet-logos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);

    try {
      const url = await uploadToSupabase(file);
      if (url) {
        onLogoChange(url);
        setPreviewUrl(url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ralat tidak diketahui');
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled]);

  const handleRemoveLogo = async () => {
    const supabase = getSupabaseClient();

    // If there's a current logo URL and it's from Supabase, try to delete it
    if (currentLogoUrl && supabase && currentLogoUrl.includes('supabase')) {
      try {
        const path = currentLogoUrl.split('/outlet-logos/')[1];
        if (path) {
          await supabase.storage.from('outlet-logos').remove([`outlet-logos/${path}`]);
        }
      } catch (error) {
        console.error('Failed to delete logo from storage:', error);
      }
    }

    setPreviewUrl(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="logo-upload">
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !previewUrl && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="preview-container">
            <img src={previewUrl} alt="Logo" className="logo-preview" />
            <div className="preview-overlay">
              {!disabled && (
                <div className="preview-actions">
                  <button 
                    type="button"
                    className="action-btn change"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={16} />
                    Tukar
                  </button>
                  <button 
                    type="button"
                    className="action-btn remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                  >
                    <Trash2 size={16} />
                    Padam
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            {isUploading ? (
              <>
                <div className="upload-spinner" />
                <span>Memuat naik...</span>
              </>
            ) : (
              <>
                <div className="upload-icon">
                  <Image size={32} />
                </div>
                <span className="upload-text">Seret & lepas logo di sini</span>
                <span className="upload-hint">atau klik untuk pilih fail</span>
                <span className="upload-formats">JPG, PNG, WebP, GIF (Maks 2MB)</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />

      {uploadError && (
        <div className="upload-message error">
          <AlertCircle size={16} />
          {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div className="upload-message success">
          <Check size={16} />
          Logo berjaya dimuat naik!
        </div>
      )}

      <style jsx>{`
        .logo-upload {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upload-zone {
          position: relative;
          width: 100%;
          max-width: 200px;
          aspect-ratio: 1;
          border: 2px dashed var(--gray-300);
          border-radius: var(--radius-lg);
          background: var(--gray-50);
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .upload-zone:hover:not(.disabled) {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .upload-zone.dragging {
          border-color: var(--primary);
          background: var(--primary-light);
          transform: scale(1.02);
        }

        .upload-zone.has-preview {
          border-style: solid;
          cursor: default;
        }

        .upload-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 1rem;
          text-align: center;
        }

        .upload-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-200);
          color: var(--text-secondary);
          border-radius: 50%;
          margin-bottom: 0.75rem;
        }

        .upload-text {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .upload-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .upload-formats {
          font-size: 0.7rem;
          color: var(--text-light);
          margin-top: 0.5rem;
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 0.75rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .preview-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .logo-preview {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 0.5rem;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .preview-container:hover .preview-overlay {
          background: rgba(0, 0, 0, 0.6);
        }

        .preview-actions {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .preview-container:hover .preview-actions {
          opacity: 1;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.change {
          background: var(--primary);
          color: white;
        }

        .action-btn.change:hover {
          background: var(--primary-dark);
        }

        .action-btn.remove {
          background: var(--danger);
          color: white;
        }

        .action-btn.remove:hover {
          background: #dc2626;
        }

        .upload-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          max-width: 200px;
        }

        .upload-message.error {
          background: #fee2e2;
          color: #dc2626;
        }

        .upload-message.success {
          background: #d1fae5;
          color: #059669;
        }
      `}</style>
    </div>
  );
}

