'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Download,
  Trash2,
  Cloud,
  HardDrive
} from 'lucide-react';
import { 
  migrateAllData, 
  checkLocalDataExists, 
  clearLocalData, 
  exportLocalData,
  MigrationProgress,
  MigrationResult 
} from '@/lib/supabase/migration';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function DataMigration() {
  const [localData, setLocalData] = useState<{ table: string; count: number }[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    // Check if Supabase is connected
    const supabase = getSupabaseClient();
    setIsSupabaseConnected(supabase !== null);
    
    // Check local data
    setLocalData(checkLocalDataExists());
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setShowResults(false);
    setProgress(null);
    setResults([]);

    try {
      const migrationResults = await migrateAllData((p) => {
        setProgress(p);
      });
      
      setResults(migrationResults);
      setShowResults(true);
      
      // Refresh local data count
      setLocalData(checkLocalDataExists());
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExport = () => {
    const data = exportLocalData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abangbob-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLocal = () => {
    if (confirm('Adakah anda pasti mahu padam semua data localStorage? Pastikan data sudah dimigrasikan ke Supabase.')) {
      clearLocalData();
      setLocalData([]);
      alert('Data localStorage telah dipadam.');
    }
  };

  const totalLocalRecords = localData.reduce((sum, d) => sum + d.count, 0);
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const migratedCount = results.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="data-migration">
      <div className="migration-header">
        <div className="migration-title">
          <Database size={24} />
          <div>
            <h3>Data Migration</h3>
            <p>Pindahkan data dari localStorage ke Supabase</p>
          </div>
        </div>
        <div className={`connection-status ${isSupabaseConnected ? 'connected' : 'disconnected'}`}>
          <Cloud size={16} />
          <span>{isSupabaseConnected ? 'Supabase Connected' : 'Supabase Offline'}</span>
        </div>
      </div>

      {/* Local Data Summary */}
      <div className="migration-section">
        <div className="section-header">
          <HardDrive size={18} />
          <span>Data dalam localStorage</span>
        </div>
        
        {localData.length > 0 ? (
          <div className="local-data-grid">
            {localData.map(d => (
              <div key={d.table} className="local-data-item">
                <span className="table-name">{d.table}</span>
                <span className="record-count">{d.count} rekod</span>
              </div>
            ))}
            <div className="local-data-item total">
              <span className="table-name">Jumlah</span>
              <span className="record-count">{totalLocalRecords} rekod</span>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <CheckCircle size={20} />
            <span>Tiada data dalam localStorage</span>
          </div>
        )}
      </div>

      {/* Migration Progress */}
      {isMigrating && progress && (
        <div className="migration-progress">
          <div className="progress-header">
            <Loader2 size={18} className="spin" />
            <span>Memigrasikan {progress.current}...</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.completed} / {progress.total} tables
          </div>
        </div>
      )}

      {/* Migration Results */}
      {showResults && (
        <div className="migration-results">
          <div className="results-header">
            {failCount === 0 ? (
              <>
                <CheckCircle size={20} className="success" />
                <span>Migrasi Berjaya!</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="warning" />
                <span>Migrasi Selesai dengan Ralat</span>
              </>
            )}
          </div>
          
          <div className="results-summary">
            <div className="result-stat success">
              <CheckCircle size={16} />
              <span>{successCount} tables berjaya</span>
            </div>
            {failCount > 0 && (
              <div className="result-stat error">
                <XCircle size={16} />
                <span>{failCount} tables gagal</span>
              </div>
            )}
            <div className="result-stat">
              <Database size={16} />
              <span>{migratedCount} rekod dimigrasikan</span>
            </div>
          </div>

          <div className="results-list">
            {results.map(r => (
              <div key={r.table} className={`result-item ${r.success ? 'success' : 'error'}`}>
                {r.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span className="table-name">{r.table}</span>
                <span className="count">{r.count} rekod</span>
                {r.error && <span className="error-msg">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="migration-actions">
        <button 
          className="btn btn-primary"
          onClick={handleMigrate}
          disabled={isMigrating || !isSupabaseConnected || totalLocalRecords === 0}
        >
          {isMigrating ? (
            <>
              <Loader2 size={18} className="spin" />
              Memigrasikan...
            </>
          ) : (
            <>
              <Upload size={18} />
              Migrate ke Supabase
            </>
          )}
        </button>

        <button 
          className="btn btn-outline"
          onClick={handleExport}
          disabled={totalLocalRecords === 0}
        >
          <Download size={18} />
          Export Backup
        </button>

        <button 
          className="btn btn-danger"
          onClick={handleClearLocal}
          disabled={totalLocalRecords === 0}
        >
          <Trash2 size={18} />
          Padam localStorage
        </button>
      </div>

      {/* Warning */}
      {!isSupabaseConnected && (
        <div className="migration-warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Supabase tidak dikonfigurasi</strong>
            <p>Sila setup Supabase dalam .env.local untuk menggunakan ciri migrasi.</p>
          </div>
        </div>
      )}
    </div>
  );
}




