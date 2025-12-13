'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface DocumentUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  hint?: string;
}

export default function DocumentUpload({
  label = 'Upload Dokumen',
  accept = 'image/*,.pdf',
  maxSize = 5,
  multiple = false,
  onUpload,
  hint
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File): UploadedFile | null => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Saiz fail melebihi ${maxSize}MB`);
      return null;
    }

    const uploadedFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Create preview for images
    if (file.type.startsWith('image/')) {
      uploadedFile.preview = URL.createObjectURL(file);
    }

    return uploadedFile;
  };

  const handleFiles = (fileList: FileList) => {
    setError(null);
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach(file => {
      const processed = processFile(file);
      if (processed) {
        newFiles.push(processed);
      }
    });

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
    if (type.startsWith('image/')) return <Image size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="document-upload">
      {label && <label className="form-label">{label}</label>}
      
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
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
        />
        
        <div className="upload-icon">
          <Upload size={28} />
        </div>
        <div className="upload-text">
          <span className="upload-primary">Klik atau seret fail ke sini</span>
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
                <div className="file-preview">
                  <img src={file.preview} alt={file.name} />
                </div>
              ) : (
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
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

