'use client';

import { SupabaseConnectionTest } from '@/components/SupabaseConnectionTest';
import { DataBackupExport } from '@/components/DataBackupExport';
import { DatabaseSchemaChecker } from '@/components/DatabaseSchemaChecker';
import { DataMigrationComponent } from '@/components/DataMigrationComponent';
import { DataPersistenceTest } from '@/components/DataPersistenceTest';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛠️ Supabase Setup & Data Migration
          </h1>
          <p className="text-gray-400">
            Setup your Supabase connection and migrate data safely
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Test Connection */}
          <div className="relative">
            <div className="absolute -left-8 top-6 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              1
            </div>
            <SupabaseConnectionTest />
          </div>

          {/* Step 2: Backup Data */}
          <div className="relative">
            <div className="absolute -left-8 top-6 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              2
            </div>
            <DataBackupExport />
          </div>

          {/* Step 3: Verify Schema */}
          <div className="relative">
            <div className="absolute -left-8 top-6 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <DatabaseSchemaChecker />
          </div>

          {/* Step 4: Migrate Data */}
          <div className="relative">
            <div className="absolute -left-8 top-6 bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              4
            </div>
            <DataMigrationComponent />
          </div>

          {/* Step 5: Test Persistence */}
          <div className="relative">
            <div className="absolute -left-8 top-6 bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              5
            </div>
            <DataPersistenceTest />
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-2">📚 Documentation</h3>
          <p className="text-gray-400 text-sm">
            For detailed setup instructions, see{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">docs/SUPABASE_SETUP.md</code>
          </p>
        </div>
      </div>
    </div>
  );
}
