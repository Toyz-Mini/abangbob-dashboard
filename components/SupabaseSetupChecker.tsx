'use client';

import { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Database,
  Key,
  HardDrive
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface CheckResult {
  status: 'success' | 'warning' | 'error' | 'checking';
  message: string;
  details?: string;
}

interface SetupStatus {
  envVars: CheckResult;
  connection: CheckResult;
  bucket: CheckResult;
  permissions: CheckResult;
}

export default function SupabaseSetupChecker() {
  const [status, setStatus] = useState<SetupStatus>({
    envVars: { status: 'checking', message: 'Memeriksa...' },
    connection: { status: 'checking', message: 'Memeriksa...' },
    bucket: { status: 'checking', message: 'Memeriksa...' },
    permissions: { status: 'checking', message: 'Memeriksa...' },
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  const SQL_COMMANDS = {
    createBucket: `-- Run in Supabase Dashboard > Storage > Create New Bucket
-- Name: outlet-logos
-- Public: Yes (checked)
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif`,

    policies: `-- Run in Supabase Dashboard > SQL Editor

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'outlet-logos');

-- Policy: Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'outlet-logos');

-- Policy: Allow authenticated users to update
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'outlet-logos');

-- Policy: Allow authenticated users to delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'outlet-logos');`,

    bucketSQL: `-- Alternative: Create bucket via SQL (if manual creation doesn't work)
INSERT INTO storage.buckets (id, name, public)
VALUES ('outlet-logos', 'outlet-logos', true);`
  };

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    setIsTesting(true);

    // 1. Check environment variables
    const envCheck = checkEnvironmentVars();
    setStatus(prev => ({ ...prev, envVars: envCheck }));

    if (envCheck.status === 'error') {
      setStatus(prev => ({
        ...prev,
        connection: { status: 'error', message: 'Tidak boleh sambung tanpa env variables' },
        bucket: { status: 'error', message: 'Tidak boleh check tanpa sambungan' },
        permissions: { status: 'error', message: 'Tidak boleh check tanpa sambungan' },
      }));
      setIsTesting(false);
      return;
    }

    // 2. Check connection
    const connectionCheck = await checkConnection();
    setStatus(prev => ({ ...prev, connection: connectionCheck }));

    if (connectionCheck.status === 'error') {
      setStatus(prev => ({
        ...prev,
        bucket: { status: 'error', message: 'Tidak boleh check tanpa sambungan' },
        permissions: { status: 'error', message: 'Tidak boleh check tanpa sambungan' },
      }));
      setIsTesting(false);
      return;
    }

    // 3. Check bucket exists
    const bucketCheck = await checkBucket();
    setStatus(prev => ({ ...prev, bucket: bucketCheck }));

    // 4. Check permissions
    const permCheck = await checkPermissions();
    setStatus(prev => ({ ...prev, permissions: permCheck }));

    setIsTesting(false);
  };

  const checkEnvironmentVars = (): CheckResult => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: 'error',
        message: 'Environment variables tidak dijumpai',
        details: 'Sila tambah NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY dalam .env.local'
      };
    }

    if (!supabaseUrl.includes('supabase.co')) {
      return {
        status: 'warning',
        message: 'URL Supabase mungkin tidak betul',
        details: 'Pastikan URL mengandungi .supabase.co'
      };
    }

    return {
      status: 'success',
      message: 'Environment variables OK',
      details: `URL: ${supabaseUrl.substring(0, 30)}...`
    };
  };

  const checkConnection = async (): Promise<CheckResult> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return {
          status: 'error',
          message: "Database is not accessible. Please check your Supabase credentials in your .env.local file. If you haven't set them up yet, check the console for instructions.",
          details: 'Check environment variables dan network'
        };
      }

      // Try a simple query to test connection
      const { error } = await supabase.from('staff').select('count', { count: 'exact', head: true });

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        return {
          status: 'error',
          message: 'Tidak boleh sambung ke Supabase',
          details: error.message
        };
      }

      return {
        status: 'success',
        message: 'Sambungan berjaya',
        details: 'Connected to Supabase'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Network error',
        details: error.message || 'Cannot reach Supabase servers'
      };
    }
  };

  const checkBucket = async (): Promise<CheckResult> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return {
          status: 'error',
          message: 'Tiada client'
        };
      }

      // Instead of listBuckets (which requires elevated permissions),
      // try to list files in the bucket - this works with anon key
      const { data, error } = await supabase.storage
        .from('outlet-logos')
        .list('', { limit: 1 });

      if (error) {
        // Check if it's a "bucket not found" error
        if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
          return {
            status: 'error',
            message: 'Bucket "outlet-logos" tidak wujud',
            details: 'Sila buat bucket menggunakan SQL commands di bawah'
          };
        }
        // Other errors might be permission-related but bucket exists
        return {
          status: 'warning',
          message: 'Bucket mungkin wujud tetapi tidak dapat verify',
          details: error.message
        };
      }

      // If we can list files (even if empty), bucket exists
      return {
        status: 'success',
        message: 'Bucket outlet-logos wujud',
        details: 'Bucket configured'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Error checking bucket',
        details: error.message
      };
    }
  };

  const checkPermissions = async (): Promise<CheckResult> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return {
          status: 'error',
          message: 'Tiada client'
        };
      }

      // Create a minimal valid PNG image for testing
      // This is a 1x1 transparent PNG (smallest valid PNG file)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
      const testFile = new Blob([pngBytes], { type: 'image/png' });
      const testFileName = `test_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('outlet-logos')
        .upload(testFileName, testFile);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          return {
            status: 'error',
            message: 'Bucket tidak dijumpai',
            details: 'Create bucket terlebih dahulu'
          };
        }

        if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
          return {
            status: 'error',
            message: 'Tiada permission untuk upload',
            details: 'Sila setup storage policies (lihat SQL commands di bawah)'
          };
        }

        if (uploadError.message.includes('mime') || uploadError.message.includes('type')) {
          return {
            status: 'error',
            message: 'MIME type tidak dibenarkan',
            details: 'Bucket hanya menerima file image (jpeg, png, webp, gif)'
          };
        }

        return {
          status: 'warning',
          message: 'Upload test gagal',
          details: uploadError.message
        };
      }

      // Clean up test file
      await supabase.storage
        .from('outlet-logos')
        .remove([testFileName]);

      return {
        status: 'success',
        message: 'Upload permissions OK',
        details: 'Policies configured correctly'
      };
    } catch (error: any) {
      return {
        status: 'warning',
        message: 'Tidak dapat test permissions',
        details: error.message
      };
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const getOverallStatus = () => {
    if (status.envVars.status === 'error' || status.connection.status === 'error') {
      return 'error';
    }
    if (status.bucket.status === 'error' || status.permissions.status === 'error') {
      return 'warning';
    }
    if (Object.values(status).every(s => s.status === 'success')) {
      return 'success';
    }
    return 'checking';
  };

  const overallStatus = getOverallStatus();

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} color="#059669" />;
      case 'warning':
        return <AlertTriangle size={16} color="#d97706" />;
      case 'error':
        return <XCircle size={16} color="#dc2626" />;
      default:
        return <RefreshCw size={16} className="animate-spin" />;
    }
  };

  return (
    <div className="supabase-setup-checker">
      {/* Header Status */}
      <div className={`status-header ${overallStatus}`}>
        <div className="status-content">
          <div className="status-icon">
            {overallStatus === 'success' ? (
              <CheckCircle size={24} />
            ) : overallStatus === 'error' ? (
              <XCircle size={24} />
            ) : overallStatus === 'warning' ? (
              <AlertTriangle size={24} />
            ) : (
              <Cloud size={24} />
            )}
          </div>
          <div className="status-info">
            <div className="status-title">
              {overallStatus === 'success' && 'Supabase Storage Berjaya Dikonfigurasi'}
              {overallStatus === 'error' && 'Supabase Storage Belum Dikonfigurasi'}
              {overallStatus === 'warning' && 'Supabase Storage Perlu Dikonfigurasikan'}
              {overallStatus === 'checking' && 'Memeriksa Supabase Storage...'}
            </div>
            <div className="status-subtitle">
              {overallStatus === 'success' && 'Upload logo akan disimpan di cloud'}
              {overallStatus === 'error' && 'Upload logo akan disimpan secara local'}
              {overallStatus === 'warning' && 'Selesaikan setup untuk cloud storage'}
              {overallStatus === 'checking' && 'Sila tunggu...'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-btn"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Detailed Checks */}
      {isExpanded && (
        <div className="setup-details">
          <div className="checks-list">
            <div className="check-item">
              <StatusIcon status={status.envVars.status} />
              <div className="check-content">
                <div className="check-title">
                  <Key size={14} />
                  Environment Variables
                </div>
                <div className="check-message">{status.envVars.message}</div>
                {status.envVars.details && (
                  <div className="check-details">{status.envVars.details}</div>
                )}
              </div>
            </div>

            <div className="check-item">
              <StatusIcon status={status.connection.status} />
              <div className="check-content">
                <div className="check-title">
                  <Cloud size={14} />
                  Sambungan Supabase
                </div>
                <div className="check-message">{status.connection.message}</div>
                {status.connection.details && (
                  <div className="check-details">{status.connection.details}</div>
                )}
              </div>
            </div>

            <div className="check-item">
              <StatusIcon status={status.bucket.status} />
              <div className="check-content">
                <div className="check-title">
                  <HardDrive size={14} />
                  Storage Bucket
                </div>
                <div className="check-message">{status.bucket.message}</div>
                {status.bucket.details && (
                  <div className="check-details">{status.bucket.details}</div>
                )}
              </div>
            </div>

            <div className="check-item">
              <StatusIcon status={status.permissions.status} />
              <div className="check-content">
                <div className="check-title">
                  <Database size={14} />
                  Storage Policies
                </div>
                <div className="check-message">{status.permissions.message}</div>
                {status.permissions.details && (
                  <div className="check-details">{status.permissions.details}</div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={runChecks}
            disabled={isTesting}
            className="test-again-btn"
          >
            <RefreshCw size={16} className={isTesting ? 'animate-spin' : ''} />
            Test Semula
          </button>

          {/* Setup Guide */}
          {(status.bucket.status === 'error' || status.permissions.status === 'error') && (
            <div className="setup-guide">
              <div className="guide-header">
                <AlertTriangle size={18} />
                <h4>Panduan Setup Supabase Storage</h4>
              </div>

              <div className="guide-section">
                <h5>Langkah 1: Buat Bucket</h5>
                <p>Pergi ke Supabase Dashboard &gt; Storage &gt; Create New Bucket</p>
                <ul>
                  <li>Name: <code>outlet-logos</code></li>
                  <li>Public: <strong>Yes</strong> (checked)</li>
                  <li>File size limit: <strong>2MB</strong></li>
                  <li>Allowed MIME types: image/jpeg, image/png, image/webp, image/gif</li>
                </ul>

                <div className="sql-block">
                  <div className="sql-header">
                    <span>Atau gunakan SQL (alternative):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(SQL_COMMANDS.bucketSQL, 'bucket')}
                      className="copy-btn"
                    >
                      {copiedSql === 'bucket' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre>{SQL_COMMANDS.bucketSQL}</pre>
                </div>
              </div>

              <div className="guide-section">
                <h5>Langkah 2: Setup Storage Policies</h5>
                <p>Pergi ke Supabase Dashboard &gt; SQL Editor, kemudian run:</p>
                <div className="sql-block">
                  <div className="sql-header">
                    <span>Storage Policies SQL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(SQL_COMMANDS.policies, 'policies')}
                      className="copy-btn"
                    >
                      {copiedSql === 'policies' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre>{SQL_COMMANDS.policies}</pre>
                </div>
              </div>

              <div className="guide-note">
                <AlertTriangle size={16} />
                <span>
                  Selepas setup, klik &quot;Test Semula&quot; untuk verify configuration.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .supabase-setup-checker {
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .status-header {
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .status-header:hover {
          background: var(--gray-50);
        }

        .status-header.success {
          background: #d1fae5;
          border-left: 4px solid #059669;
        }

        .status-header.error {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
        }

        .status-header.warning {
          background: #fef3c7;
          border-left: 4px solid #d97706;
        }

        .status-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-header.success .status-icon {
          color: #059669;
        }

        .status-header.error .status-icon {
          color: #dc2626;
        }

        .status-header.warning .status-icon {
          color: #d97706;
        }

        .status-info {
          flex: 1;
        }

        .status-title {
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.125rem;
        }

        .status-subtitle {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .expand-btn {
          padding: 0.5rem;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          transition: background 0.2s ease;
        }

        .expand-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .setup-details {
          padding: 1.5rem;
          background: var(--card-bg);
          border-top: 1px solid var(--gray-200);
        }

        .checks-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .check-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }

        .check-content {
          flex: 1;
        }

        .check-title {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .check-message {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .check-details {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .test-again-btn {
          width: 100%;
          padding: 0.625rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .test-again-btn:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        .test-again-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .setup-guide {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: var(--radius-md);
        }

        .guide-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #92400e;
          margin-bottom: 1rem;
        }

        .guide-header h4 {
          margin: 0;
          font-size: 1rem;
        }

        .guide-section {
          margin-bottom: 1.5rem;
        }

        .guide-section:last-of-type {
          margin-bottom: 1rem;
        }

        .guide-section h5 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .guide-section p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .guide-section ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .guide-section ul li {
          margin-bottom: 0.25rem;
        }

        .guide-section code {
          padding: 0.125rem 0.375rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-family: 'Courier New', monospace;
        }

        .sql-block {
          margin: 0.75rem 0;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .sql-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--gray-100);
          border-bottom: 1px solid var(--gray-300);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .copy-btn {
          padding: 0.25rem 0.5rem;
          background: white;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          background: var(--gray-50);
        }

        .sql-block pre {
          margin: 0;
          padding: 1rem;
          background: #1e293b;
          color: #e2e8f0;
          font-size: 0.75rem;
          line-height: 1.5;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }

        .guide-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: #92400e;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}


