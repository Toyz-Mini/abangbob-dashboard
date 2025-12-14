'use client';

import { useState } from 'react';
import { testSupabaseConnection, ConnectionTestResult } from '@/lib/supabase/test-connection';

export function DatabaseSchemaChecker() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const checkSchema = async () => {
    setChecking(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (err) {
      setResult({
        success: false,
        message: `Schema check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setChecking(false);
    }
  };

  const allTablesExist = result?.tables?.every(t => t.exists) || false;

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">🗄️ Database Schema Verification</h3>
      
      <button
        onClick={checkSchema}
        disabled={checking}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {checking ? 'Checking...' : 'Check Schema'}
      </button>

      {result && (
        <div className="mt-4 space-y-4">
          {allTablesExist ? (
            <div className="p-4 bg-green-900/50 border border-green-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-white">All tables exist!</span>
              </div>
              <p className="text-green-400 text-sm">Your database is ready for migration.</p>
            </div>
          ) : (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">❌</span>
                <span className="font-semibold text-white">Some tables are missing!</span>
              </div>
              <p className="text-red-400 text-sm mb-4">
                You need to run the schema.sql file in Supabase Dashboard.
              </p>
              
              <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 space-y-2">
                <p className="font-semibold text-white">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Supabase Dashboard</a></li>
                  <li>Navigate to <strong>SQL Editor</strong></li>
                  <li>Click <strong>"New Query"</strong></li>
                  <li>Copy contents from <code className="bg-gray-800 px-1">lib/supabase/schema.sql</code></li>
                  <li>Paste and click <strong>"Run"</strong></li>
                </ol>
              </div>
            </div>
          )}

          {result.tables && (
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Table Status:</h4>
              <div className="grid grid-cols-2 gap-2">
                {result.tables.map((table) => (
                  <div
                    key={table.name}
                    className={`p-3 rounded ${
                      table.exists 
                        ? 'bg-green-900/30 border border-green-700/50' 
                        : 'bg-red-900/30 border border-red-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{table.name}</span>
                      {table.exists ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-red-400 text-xs">✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


