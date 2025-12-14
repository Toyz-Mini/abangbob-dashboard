'use client';

import { useState } from 'react';
import { exportLocalData, checkLocalDataExists } from '@/lib/supabase/migration';

export function DataBackupExport() {
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const dataInfo = typeof window !== 'undefined' ? checkLocalDataExists() : [];
  const hasData = dataInfo.length > 0;
  const totalRecords = dataInfo.reduce((sum, item) => sum + item.count, 0);

  const handleExport = () => {
    setExporting(true);
    setExportComplete(false);

    try {
      // Export all localStorage data
      const jsonData = exportLocalData();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `abangbob-backup-${timestamp}.json`;

      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">📦 Data Backup</h3>
      
      {hasData ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded">
            <p className="text-white mb-2">
              <strong>Found {totalRecords} records</strong> in localStorage
            </p>
            <div className="space-y-1 text-sm">
              {dataInfo.map((item) => (
                <div key={item.table} className="text-gray-300">
                  • {item.table}: {item.count} records
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <span className="animate-spin">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <span>💾</span>
                Export Backup (JSON)
              </>
            )}
          </button>

          {exportComplete && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded text-green-400 text-center">
              ✅ Backup exported successfully!
            </div>
          )}

          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm">
            ⚠️ <strong>Important:</strong> Keep this backup file safe! You can use it to restore data if needed.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-700 rounded text-gray-400 text-center">
          No data found in localStorage to backup.
        </div>
      )}
    </div>
  );
}


