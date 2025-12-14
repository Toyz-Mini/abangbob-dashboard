'use client';

import { useState } from 'react';
import { migrateAllData, checkLocalDataExists, clearLocalData, MigrationProgress, MigrationResult } from '@/lib/supabase/migration';

export function DataMigrationComponent() {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [results, setResults] = useState<MigrationResult[] | null>(null);
  const [showClearOption, setShowClearOption] = useState(false);

  const dataInfo = typeof window !== 'undefined' ? checkLocalDataExists() : [];
  const hasData = dataInfo.length > 0;
  const totalRecords = dataInfo.reduce((sum, item) => sum + item.count, 0);

  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to migrate data to Supabase? This will copy all localStorage data to the cloud database.')) {
      return;
    }

    setMigrating(true);
    setProgress(null);
    setResults(null);
    setShowClearOption(false);

    try {
      const migrationResults = await migrateAllData((prog) => {
        setProgress(prog);
      });
      
      setResults(migrationResults);
      
      // Check if all migrations were successful
      const allSuccessful = migrationResults.every(r => r.success);
      if (allSuccessful) {
        setShowClearOption(true);
      }
    } catch (err) {
      console.error('Migration failed:', err);
      alert(`Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleClearLocalStorage = () => {
    if (!confirm('⚠️ WARNING: This will delete all data from localStorage. Make sure you have exported a backup first! Continue?')) {
      return;
    }

    clearLocalData();
    alert('✅ localStorage cleared successfully!');
    setShowClearOption(false);
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">🚀 Data Migration</h3>
      
      {hasData ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded">
            <p className="text-white mb-2">
              <strong>Ready to migrate {totalRecords} records</strong>
            </p>
            <div className="space-y-1 text-sm">
              {dataInfo.map((item) => (
                <div key={item.table} className="text-gray-300">
                  • {item.table}: {item.count} records
                </div>
              ))}
            </div>
          </div>

          {!migrating && !results && (
            <div className="space-y-3">
              <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm">
                ⚠️ <strong>Before migration:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Make sure you have exported a backup</li>
                  <li>Verify database schema is ready</li>
                  <li>Ensure you have a stable internet connection</li>
                </ul>
              </div>

              <button
                onClick={handleMigrate}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                🚀 Start Migration
              </button>
            </div>
          )}

          {migrating && progress && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-700 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">Migrating...</span>
                  <span className="text-gray-400">{progress.completed} / {progress.total}</span>
                </div>
                
                <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
                
                <p className="text-gray-400 text-sm">
                  Current: <span className="text-white">{progress.current}</span>
                </p>
              </div>

              {progress.results.length > 0 && (
                <div className="space-y-2">
                  {progress.results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded flex items-center justify-between ${
                        result.success
                          ? 'bg-green-900/30 border border-green-700/50'
                          : 'bg-red-900/30 border border-red-700/50'
                      }`}
                    >
                      <span className="text-white">{result.table}</span>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <>
                            <span className="text-green-400">{result.count} records</span>
                            <span className="text-green-400">✓</span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-400 text-sm">{result.error}</span>
                            <span className="text-red-400">✗</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {results && !migrating && (
            <div className="space-y-4">
              <div className={`p-4 rounded ${
                results.every(r => r.success)
                  ? 'bg-green-900/50 border border-green-700'
                  : 'bg-yellow-900/50 border border-yellow-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {results.every(r => r.success) ? '✅' : '⚠️'}
                  </span>
                  <span className="font-semibold text-white">
                    {results.every(r => r.success)
                      ? 'Migration Complete!'
                      : 'Migration Completed with Warnings'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {results.filter(r => r.success).length} / {results.length} tables migrated successfully
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white">Migration Results:</h4>
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded ${
                      result.success
                        ? 'bg-green-900/30 border border-green-700/50'
                        : 'bg-red-900/30 border border-red-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{result.table}</span>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <>
                            <span className="text-green-400">{result.count} records migrated</span>
                            <span className="text-green-400">✓</span>
                          </>
                        ) : (
                          <span className="text-red-400 text-sm">✗ {result.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showClearOption && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm mb-3">
                    ⚠️ <strong>Optional:</strong> You can now clear localStorage data since it's safely stored in Supabase. However, keeping it provides offline backup.
                  </div>
                  <button
                    onClick={handleClearLocalStorage}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    🗑️ Clear localStorage (Advanced)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-700 rounded text-gray-400 text-center">
          No data found in localStorage to migrate.
        </div>
      )}
    </div>
  );
}
