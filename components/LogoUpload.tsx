'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Trash2, Image, AlertCircle, Check, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/contexts/LanguageContext';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (url: string | null) => void;
  disabled?: boolean;
}

type StorageMode = 'supabase' | 'local' | 'checking';
type ErrorType = 'bucket_not_found' | 'permission_denied' | 'network_error' | 'file_too_large' | 'invalid_format' | 'unknown';

export default function LogoUpload({ currentLogoUrl, onLogoChange, disabled = false }: LogoUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode>('checking');
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const LOCAL_STORAGE_KEY = 'abangbob_logo_';

  // Check Supabase availability on mount
  useEffect(() => {
    const checkSupabase = () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        setStorageMode('supabase');
        console.log('✅ Supabase client initialized - using cloud storage');
      } else {
        setStorageMode('local');
        console.log('⚠️ Supabase not available - using local storage');
      }
    };
    checkSupabase();
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string; errorType?: ErrorType } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Format fail tidak disokong. Sila gunakan JPG, PNG, WebP, atau GIF.',
        errorType: 'invalid_format'
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: 'Saiz fail terlalu besar. Maksimum 2MB.',
        errorType: 'file_too_large'
      };
    }
    return { valid: true };
  };

  // Convert file to base64 for localStorage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Save to localStorage as fallback
  const saveToLocalStorage = async (file: File): Promise<string> => {
    try {
      const base64 = await fileToBase64(file);
      const storageKey = `${LOCAL_STORAGE_KEY}${Date.now()}`;
      localStorage.setItem(storageKey, base64);
      console.log('✅ Logo saved to localStorage:', storageKey);
      return base64;
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      throw new Error('Gagal menyimpan logo ke local storage');
    }
  };

  const getDetailedError = (error: any): { message: string; type: ErrorType } => {
    // Check for specific Supabase errors
    if (error?.message) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('bucket') && (msg.includes('not found') || msg.includes('does not exist'))) {
        console.error('❌ Bucket Error: outlet-logos bucket does not exist');
        return {
          message: 'Bucket storage belum dibuat. Sila setup Supabase Storage terlebih dahulu atau logo akan disimpan secara local.',
          type: 'bucket_not_found'
        };
      }
      
      if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden') || error?.statusCode === 403) {
        console.error('❌ Permission Error: No access to upload files');
        return {
          message: 'Tiada kebenaran untuk upload. Sila login atau semak storage policies.',
          type: 'permission_denied'
        };
      }
      
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        console.error('❌ Network Error: Cannot connect to Supabase');
        return {
          message: 'Ralat sambungan. Logo akan disimpan secara local.',
          type: 'network_error'
        };
      }
    }
    
    console.error('❌ Unknown Upload Error:', error);
    return {
      message: 'Gagal memuat naik logo. Logo akan disimpan secara local.',
      type: 'unknown'
    };
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.log('⚠️ Supabase not configured, using local storage');
      return await saveToLocalStorage(file);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;
    const filePath = `outlet-logos/${fileName}`;

    try {
      console.log('📤 Uploading to Supabase Storage:', filePath);
      
      const { data, error } = await supabase.storage
        .from('outlet-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Supabase Upload Error:', error);
        const detailedError = getDetailedError(error);
        
        // For certain errors, fallback to local storage
        if (detailedError.type === 'bucket_not_found' || detailedError.type === 'network_error') {
          console.log('⚠️ Falling back to local storage...');
          setStorageMode('local');
          const localUrl = await saveToLocalStorage(file);
          setUploadError(detailedError.message);
          setErrorType(detailedError.type);
          return localUrl;
        }
        
        throw new Error(detailedError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('outlet-logos')
        .getPublicUrl(filePath);

      console.log('✅ Upload successful:', urlData.publicUrl);
      setStorageMode('supabase');
      return urlData.publicUrl;
    } catch (error) {
      // Final fallback to local storage
      console.log('⚠️ Final fallback to local storage');
      setStorageMode('local');
      return await saveToLocalStorage(file);
    }
  };

  const handleRetry = () => {
    if (lastFile) {
      handleFileSelect(lastFile);
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setErrorType(null);
    setUploadSuccess(false);
    setLastFile(file);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      setErrorType(validation.errorType || 'unknown');
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
      const detailedError = getDetailedError(error);
      setUploadError(detailedError.message);
      setErrorType(detailedError.type);
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

      {/* Storage Mode Indicator */}
      {storageMode !== 'checking' && (
        <div className="storage-indicator">
          {storageMode === 'supabase' ? (
            <>
              <Cloud size={14} />
              <span>Cloud Storage</span>
            </>
          ) : (
            <>
              <HardDrive size={14} />
              <span>Local Storage</span>
            </>
          )}
        </div>
      )}

      {uploadError && (
        <div className="upload-message error">
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>
            {uploadError}
            {errorType === 'bucket_not_found' && (
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.8 }}>
                Lihat Settings &gt; Supabase untuk setup panduan.
              </div>
            )}
          </div>
          {lastFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="retry-btn"
              title="Cuba lagi"
            >
              <RefreshCw size={14} />
            </button>
          )}
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
          max-width: 300px;
        }

        .upload-message.success {
          background: #d1fae5;
          color: #059669;
        }

        .retry-btn {
          padding: 0.25rem;
          background: transparent;
          border: none;
          color: #dc2626;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .retry-btn:hover {
          background: rgba(220, 38, 38, 0.1);
        }

        .storage-indicator {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          background: var(--gray-100);
          border-radius: var(--radius-md);
          font-size: 0.7rem;
          color: var(--text-secondary);
          max-width: fit-content;
        }
      `}</style>
    </div>
  );
}

