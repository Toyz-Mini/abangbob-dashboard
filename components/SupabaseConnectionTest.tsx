'use client';

import { useState } from 'react';
import { testSupabaseConnection, ConnectionTestResult } from '@/lib/supabase/test-connection';

export function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (err) {
      setResult({
        success: false,
        message: `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">Supabase Connection Test</h3>
      
      <button
        onClick={runTest}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </button>

      {result && (
        <div className="mt-4">
          <div className={`p-4 rounded ${result.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{result.success ? '✅' : '❌'}</span>
              <span className="font-semibold text-white">{result.message}</span>
            </div>
          </div>

          {result.tables && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-white">Database Tables:</h4>
              {result.tables.map((table) => (
                <div
                  key={table.name}
                  className={`p-3 rounded ${table.exists ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{table.name}</span>
                    <div className="flex items-center gap-2">
                      {table.exists ? (
                        <>
                          <span className="text-green-400">✓ {table.count} records</span>
                        </>
                      ) : (
                        <span className="text-red-400">✗ Missing</span>
                      )}
                    </div>
                  </div>
                  {table.error && (
                    <div className="mt-1 text-sm text-red-400">{table.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
