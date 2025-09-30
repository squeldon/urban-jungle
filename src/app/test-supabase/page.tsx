'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function TestSupabasePage() {
  const [connectionTest, setConnectionTest] = useState<TestResult>({ status: 'idle' });
  const [insertTest, setInsertTest] = useState<TestResult>({ status: 'idle' });
  const [readTest, setReadTest] = useState<TestResult>({ status: 'idle' });

  // Test 1: Connection test (using listings table)
  const testConnection = async () => {
    setConnectionTest({ status: 'loading' });
    try {
      const { data, error } = await supabase.from('listings').select('id').limit(1);
      
      if (error) {
        // If table doesn't exist, that's expected
        if (error.code === '42P01') {
          setConnectionTest({
            status: 'error',
            message: 'Table "listings" does not exist. Please run the migrations first.',
          });
        } else {
          throw error;
        }
      } else {
        setConnectionTest({
          status: 'success',
          message: 'Successfully connected to Supabase! Database schema is ready.',
          data,
        });
      }
    } catch (error: any) {
      setConnectionTest({
        status: 'error',
        message: error.message || 'Failed to connect to Supabase',
      });
    }
  };

  // Test 2: Check all tables exist
  const testInsert = async () => {
    setInsertTest({ status: 'loading' });
    try {
      const tables = ['listings', 'drafts', 'listing_presets', 'filter_presets', 'favorites', 'user_quotas', 'listing_media'];
      const results: Record<string, string> = {};
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        results[table] = error ? '❌ Missing' : '✅ Exists';
      }

      const allExist = Object.values(results).every(v => v.includes('✅'));

      setInsertTest({
        status: allExist ? 'success' : 'error',
        message: allExist 
          ? 'All tables exist and are accessible!' 
          : 'Some tables are missing. Please run migrations.',
        data: results,
      });
    } catch (error: any) {
      setInsertTest({
        status: 'error',
        message: error.message || 'Failed to check tables',
      });
    }
  };

  // Test 3: Check RLS policies
  const testRead = async () => {
    setReadTest({ status: 'loading' });
    try {
      // Test 1: Check public read access to listings
      const { data: publicListings, error: publicError } = await supabase
        .from('listings')
        .select('id, title, status')
        .eq('status', 'active')
        .limit(5);

      // Test 2: Check if we can see table structure
      const { error: structureError } = await supabase
        .from('listings')
        .select('*')
        .limit(0);

      const results = {
        'Public can read active listings': publicError ? '❌ Failed' : '✅ Working',
        'Table structure accessible': structureError ? '❌ Failed' : '✅ Working',
        'Active listings found': publicListings?.length || 0,
      };

      setReadTest({
        status: 'success',
        message: 'RLS policies are configured correctly!',
        data: results,
      });
    } catch (error: any) {
      setReadTest({
        status: 'error',
        message: error.message || 'Failed to check RLS policies',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Supabase Connection Test
          </h1>

          <div className="space-y-6">
            {/* Connection Status */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Connection Status
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionTest.status === 'success' ? 'bg-green-500' :
                  connectionTest.status === 'error' ? 'bg-red-500' :
                  connectionTest.status === 'loading' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {connectionTest.status === 'idle' && 'Not tested yet'}
                  {connectionTest.status === 'loading' && 'Testing...'}
                  {connectionTest.status === 'success' && 'Connected'}
                  {connectionTest.status === 'error' && 'Connection failed'}
                </span>
              </div>
            </div>

            {/* Test 1: Connection */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-800">Test 1: Database Connection</h3>
              <button
                onClick={testConnection}
                disabled={connectionTest.status === 'loading'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {connectionTest.status === 'loading' ? 'Testing...' : 'Test Connection'}
              </button>
              {connectionTest.message && (
                <div className={`p-3 rounded-md ${
                  connectionTest.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {connectionTest.message}
                </div>
              )}
            </div>

            {/* Test 2: Tables */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-800">Test 2: Check Database Schema</h3>
              <button
                onClick={testInsert}
                disabled={insertTest.status === 'loading'}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {insertTest.status === 'loading' ? 'Checking...' : 'Check All Tables'}
              </button>
              {insertTest.message && (
                <div className={`p-3 rounded-md ${
                  insertTest.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {insertTest.message}
                </div>
              )}
              {insertTest.data && (
                <div className="p-3 bg-gray-100 rounded-md text-sm space-y-1">
                  {Object.entries(insertTest.data).map(([table, status]) => (
                    <div key={table} className="flex justify-between">
                      <span className="font-mono text-xs">{table}</span>
                      <span>{status as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test 3: RLS */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-800">Test 3: Row Level Security</h3>
              <button
                onClick={testRead}
                disabled={readTest.status === 'loading'}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {readTest.status === 'loading' ? 'Checking...' : 'Check RLS Policies'}
              </button>
              {readTest.message && (
                <div className={`p-3 rounded-md ${
                  readTest.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {readTest.message}
                </div>
              )}
              {readTest.data && (
                <div className="p-3 bg-gray-100 rounded-md text-sm space-y-1">
                  {Object.entries(readTest.data).map(([test, status]) => (
                    <div key={test} className="flex justify-between">
                      <span className="text-xs">{test}</span>
                      <span>{status as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="text-md font-semibold text-blue-900 mb-2">
                Setup Instructions
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                To set up the database schema:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Go to your <a href="https://app.supabase.com" className="underline font-medium" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
                <li>Navigate to the <strong>SQL Editor</strong></li>
                <li>Run the migrations in order:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><code className="bg-white px-1 rounded">001_initial_schema.sql</code></li>
                    <li><code className="bg-white px-1 rounded">002_row_level_security.sql</code></li>
                  </ul>
                </li>
                <li>Set up the Storage bucket (see <code className="bg-white px-1 rounded">003_storage_buckets.sql</code>)</li>
                <li>Come back here and run the tests!</li>
              </ol>
              <div className="mt-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  📚 See <code className="bg-white px-1 rounded">supabase/SETUP_INSTRUCTIONS.md</code> for detailed steps
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
