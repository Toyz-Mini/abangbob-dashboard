'use client';

import { useState } from 'react';
import { testSupabaseConnection } from '@/lib/supabase/test-connection';
import { testRealtimeConnection } from '@/lib/supabase/realtime-hooks';

export function DataPersistenceTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    connection?: boolean;
    realtime?: boolean;
    localStorage?: boolean;
  }>({});

  const runTests = async () => {
    setTesting(true);
    setResults({});

    try {
      // Test 1: Supabase Connection
      console.log('Testing Supabase connection...');
      const connectionResult = await testSupabaseConnection();
      setResults(prev => ({ ...prev, connection: connectionResult.success }));

      // Test 2: Realtime
      console.log('Testing Realtime...');
      const realtimeResult = await testRealtimeConnection();
      setResults(prev => ({ ...prev, realtime: realtimeResult }));

      // Test 3: localStorage
      console.log('Testing localStorage...');
      try {
        const testKey = 'supabase_test_key';
        const testValue = { test: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testValue));
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        const localStorageWorks = retrieved === JSON.stringify(testValue);
        setResults(prev => ({ ...prev, localStorage: localStorageWorks }));
      } catch {
        setResults(prev => ({ ...prev, localStorage: false }));
      }
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const allTestsPassed = results.connection && results.realtime && results.localStorage;

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">🧪 Data Persistence Tests</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-700 rounded text-sm text-gray-300">
          <p className="mb-2"><strong>This test verifies:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Supabase database connection</li>
            <li>Realtime subscriptions</li>
            <li>localStorage backup system</li>
          </ul>
        </div>

        <button
          onClick={runTests}
          disabled={testing}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold"
        >
          {testing ? '🔍 Testing...' : '🧪 Run Tests'}
        </button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {allTestsPassed && (
              <div className="p-4 bg-green-900/50 border border-green-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold text-white">All tests passed!</span>
                </div>
                <p className="text-green-400 text-sm mt-2">
                  Your data is safe and will persist across sessions.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold text-white">Test Results:</h4>
              
              {/* Connection Test */}
              <div className={`p-3 rounded flex items-center justify-between ${
                results.connection === undefined
                  ? 'bg-gray-700'
                  : results.connection
                    ? 'bg-green-900/30 border border-green-700/50'
                    : 'bg-red-900/30 border border-red-700/50'
              }`}>
                <div>
                  <div className="text-white font-medium">Supabase Connection</div>
                  <div className="text-xs text-gray-400">Database connectivity</div>
                </div>
                <div className="text-2xl">
                  {results.connection === undefined ? '⏳' : results.connection ? '✅' : '❌'}
                </div>
              </div>

              {/* Realtime Test */}
              <div className={`p-3 rounded flex items-center justify-between ${
                results.realtime === undefined
                  ? 'bg-gray-700'
                  : results.realtime
                    ? 'bg-green-900/30 border border-green-700/50'
                    : 'bg-red-900/30 border border-red-700/50'
              }`}>
                <div>
                  <div className="text-white font-medium">Realtime Sync</div>
                  <div className="text-xs text-gray-400">Multi-device synchronization</div>
                </div>
                <div className="text-2xl">
                  {results.realtime === undefined ? '⏳' : results.realtime ? '✅' : '❌'}
                </div>
              </div>

              {/* localStorage Test */}
              <div className={`p-3 rounded flex items-center justify-between ${
                results.localStorage === undefined
                  ? 'bg-gray-700'
                  : results.localStorage
                    ? 'bg-green-900/30 border border-green-700/50'
                    : 'bg-red-900/30 border border-red-700/50'
              }`}>
                <div>
                  <div className="text-white font-medium">localStorage Backup</div>
                  <div className="text-xs text-gray-400">Offline data persistence</div>
                </div>
                <div className="text-2xl">
                  {results.localStorage === undefined ? '⏳' : results.localStorage ? '✅' : '❌'}
                </div>
              </div>
            </div>

            {!allTestsPassed && Object.keys(results).length === 3 && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm">
                ⚠️ Some tests failed. Please check your Supabase configuration.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


