// Supabase Storage Utilities
// Helper functions for file uploads, local storage fallback, and migration

import { getSupabaseClient } from './client';

export type StorageResult = {
  success: boolean;
  url?: string;
  error?: string;
  errorType?: 'bucket_not_found' | 'permission_denied' | 'network_error' | 'file_too_large' | 'invalid_format' | 'unknown';
  isLocal?: boolean;
};

export type FileUploadOptions = {
  bucket: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  folder?: string;
};

const DEFAULT_OPTIONS: Partial<FileUploadOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB default
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
};

/**
 * Convert file to base64 for localStorage
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Save file to localStorage as fallback
 */
export const saveToLocalStorage = async (
  file: File,
  storageKey: string
): Promise<StorageResult> => {
  try {
    const base64 = await fileToBase64(file);
    
    // Check localStorage space
    const estimatedSize = base64.length * 2; // rough estimate in bytes
    if (estimatedSize > 5 * 1024 * 1024) { // 5MB limit for localStorage
      return {
        success: false,
        error: 'File terlalu besar untuk local storage. Maksimum 5MB.',
        errorType: 'file_too_large',
      };
    }

    localStorage.setItem(storageKey, base64);
    
    // Store metadata
    const metadata = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      storageKey,
    };
    localStorage.setItem(`${storageKey}_meta`, JSON.stringify(metadata));

    console.log('✅ File saved to localStorage:', storageKey);
    return {
      success: true,
      url: base64,
      isLocal: true,
    };
  } catch (error: any) {
    console.error('❌ Failed to save to localStorage:', error);
    return {
      success: false,
      error: 'Gagal menyimpan file ke local storage',
      errorType: 'unknown',
    };
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  options: Partial<FileUploadOptions> = {}
): { valid: boolean; error?: string; errorType?: StorageResult['errorType'] } => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Format fail tidak disokong. Sila gunakan: ${opts.allowedTypes.join(', ')}`,
      errorType: 'invalid_format',
    };
  }

  if (opts.maxSize && file.size > opts.maxSize) {
    const maxSizeMB = (opts.maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Saiz fail terlalu besar. Maksimum ${maxSizeMB}MB.`,
      errorType: 'file_too_large',
    };
  }

  return { valid: true };
};

/**
 * Get detailed error information from Supabase error
 */
export const getDetailedError = (error: any): { message: string; type: StorageResult['errorType'] } => {
  if (error?.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes('bucket') && (msg.includes('not found') || msg.includes('does not exist'))) {
      console.error('❌ Bucket Error: Bucket does not exist');
      return {
        message: 'Bucket storage belum dibuat. File akan disimpan secara local.',
        type: 'bucket_not_found',
      };
    }

    if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden') || error?.statusCode === 403) {
      console.error('❌ Permission Error: No access to upload files');
      return {
        message: 'Tiada kebenaran untuk upload. File akan disimpan secara local.',
        type: 'permission_denied',
      };
    }

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      console.error('❌ Network Error: Cannot connect to Supabase');
      return {
        message: 'Ralat sambungan. File akan disimpan secara local.',
        type: 'network_error',
      };
    }
  }

  console.error('❌ Unknown Upload Error:', error);
  return {
    message: 'Gagal memuat naik file. File akan disimpan secara local.',
    type: 'unknown',
  };
};

/**
 * Upload file to Supabase Storage with automatic fallback to localStorage
 */
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<StorageResult> => {
  // Validate file first
  const validation = validateFile(file, options);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      errorType: validation.errorType,
    };
  }

  const supabase = getSupabaseClient();

  // If no Supabase, use local storage
  if (!supabase) {
    console.log('⚠️ Supabase not configured, using local storage');
    const storageKey = `${options.bucket}_${Date.now()}_${file.name}`;
    return await saveToLocalStorage(file, storageKey);
  }

  // Try Supabase upload
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

    console.log('📤 Uploading to Supabase Storage:', filePath);

    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase Upload Error:', error);
      const detailedError = getDetailedError(error);

      // Fallback to local storage for certain errors
      if (detailedError.type === 'bucket_not_found' || detailedError.type === 'network_error' || detailedError.type === 'permission_denied') {
        console.log('⚠️ Falling back to local storage...');
        const storageKey = `${options.bucket}_${Date.now()}_${file.name}`;
        const localResult = await saveToLocalStorage(file, storageKey);
        
        if (localResult.success) {
          return {
            ...localResult,
            error: detailedError.message, // Include warning message
          };
        }
      }

      return {
        success: false,
        error: detailedError.message,
        errorType: detailedError.type,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);

    console.log('✅ Upload successful:', urlData.publicUrl);
    return {
      success: true,
      url: urlData.publicUrl,
      isLocal: false,
    };
  } catch (error) {
    console.error('❌ Upload exception:', error);
    
    // Final fallback to local storage
    console.log('⚠️ Final fallback to local storage');
    const storageKey = `${options.bucket}_${Date.now()}_${file.name}`;
    return await saveToLocalStorage(file, storageKey);
  }
};

/**
 * Delete file from Supabase or localStorage
 */
export const deleteFile = async (
  url: string,
  bucket: string
): Promise<{ success: boolean; error?: string }> => {
  // Check if it's a local storage URL (base64)
  if (url.startsWith('data:')) {
    // Find and remove from localStorage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(bucket) && localStorage.getItem(key) === url) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_meta`);
        console.log('✅ Deleted from localStorage:', key);
        return { success: true };
      }
    }
    return { success: true }; // Already deleted or not found
  }

  // Try to delete from Supabase
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const filePath = urlParts[1];
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Deleted from Supabase:', filePath);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Delete exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all locally stored files for a bucket
 */
export const getLocalFiles = (bucket: string): Array<{ key: string; url: string; metadata: any }> => {
  const files: Array<{ key: string; url: string; metadata: any }> = [];
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (key.startsWith(bucket) && !key.endsWith('_meta')) {
      const url = localStorage.getItem(key);
      const metaJson = localStorage.getItem(`${key}_meta`);
      const metadata = metaJson ? JSON.parse(metaJson) : null;

      if (url) {
        files.push({ key, url, metadata });
      }
    }
  }

  return files;
};

/**
 * Migrate local files to Supabase Storage
 */
export const migrateLocalFilesToSupabase = async (
  bucket: string,
  folder?: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return {
      success: 0,
      failed: 0,
      errors: ['Supabase not configured'],
    };
  }

  const localFiles = getLocalFiles(bucket);
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const fileData of localFiles) {
    try {
      // Convert base64 to blob
      const response = await fetch(fileData.url);
      const blob = await response.blob();
      
      const fileName = fileData.metadata?.fileName || `migrated_${Date.now()}.bin`;
      const fileType = fileData.metadata?.fileType || blob.type;
      const file = new File([blob], fileName, { type: fileType });

      // Upload to Supabase
      const result = await uploadFile(file, { bucket, folder });

      if (result.success && !result.isLocal) {
        // Remove from localStorage
        localStorage.removeItem(fileData.key);
        localStorage.removeItem(`${fileData.key}_meta`);
        success++;
        console.log(`✅ Migrated: ${fileName}`);
      } else {
        failed++;
        errors.push(`${fileName}: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      failed++;
      errors.push(`${fileData.key}: ${error.message}`);
    }
  }

  console.log(`✅ Migration complete: ${success} success, ${failed} failed`);
  return { success, failed, errors };
};


