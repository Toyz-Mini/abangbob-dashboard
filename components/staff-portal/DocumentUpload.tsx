'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, CheckCircle, AlertCircle, Cloud, HardDrive } from 'lucide-react';
import NextImage from 'next/image';
import { uploadFile } from '@/lib/supabase/storage-utils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  url?: string;
  isLocal?: boolean;
}

interface DocumentUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  hint?: string;
  bucket?: string;
  folder?: string;
}

export default function DocumentUpload({
  label = 'Upload Dokumen',
  accept = 'image/*,.pdf',
  maxSize = 5,
  multiple = false,
  onUpload,
  hint,
  bucket = 'staff-documents',
  folder = 'portal'
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File): Promise<UploadedFile | null> => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Saiz fail melebihi ${maxSize}MB`);
      return null;
    }

    setIsUploading(true);

    try {
      // Upload file using storage utils
      const result = await uploadFile(file, {
        bucket,
        folder,
        maxSize: maxSize * 1024 * 1024,
        allowedTypes: accept.split(',').map(t => t.trim()),
      });

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url,
        isLocal: result.isLocal,
      };

      // Create preview for images
      if (file.type.startsWith('image/') && result.url) {
        uploadedFile.preview = result.url;
      }

      return uploadedFile;
    } catch (error: any) {
      setError(error.message || 'Gagal memuat naik fail');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      const processed = await processFile(file);
      if (processed) {
        newFiles.push(processed);
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onUpload?.(updatedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onUpload?.(updatedFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="document-upload">
      {label && <label className="form-label">{label}</label>}

      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''} ${isUploading ? 'uploading' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          hidden
          disabled={isUploading}
        />

        <div className="upload-icon">
          {isUploading ? (
            <div className="upload-spinner" />
          ) : (
            <Upload size={28} />
          )}
        </div>
        <div className="upload-text">
          <span className="upload-primary">
            {isUploading ? 'Memuat naik...' : 'Klik atau seret fail ke sini'}
          </span>
          <span className="upload-secondary">
            {accept.includes('image') && accept.includes('pdf')
              ? 'Gambar atau PDF'
              : accept.includes('image')
                ? 'Gambar sahaja'
                : 'PDF sahaja'
            } (max {maxSize}MB)
          </span>
        </div>
      </div>

      {hint && <p className="upload-hint">{hint}</p>}

      {error && (
        <div className="upload-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="uploaded-files">
          {files.map(file => (
            <div key={file.id} className="uploaded-file">
              {file.preview ? (
                <div className="file-preview" style={{ position: 'relative', width: '40px', height: '40px' }}>
                  <NextImage src={file.preview} alt={file.name} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
              ) : (
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  {file.isLocal !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {file.isLocal ? (
                        <>
                          <HardDrive size={10} />
                          <span>Local</span>
                        </>
                      ) : (
                        <>
                          <Cloud size={10} />
                          <span>Cloud</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
              >
                <X size={16} />
              </button>
              <div className="file-status">
                <CheckCircle size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




