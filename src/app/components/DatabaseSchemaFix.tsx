import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, Copy, Check, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { databaseCheckerService, DatabaseStatus } from '../services/database-checker.service';

interface DatabaseSchemaFixProps {
  onComplete: () => void;
  onShowFullSetup?: () => void;
}

export function DatabaseSchemaFix({ onComplete, onShowFullSetup }: DatabaseSchemaFixProps) {
  const [checking, setChecking] = useState(true);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [migrationSQL, setMigrationSQL] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    setChecking(true);
    try {
      const status = await databaseCheckerService.checkDatabase();
      setDbStatus(status);
      
      if (!status.allTablesReady) {
        const sql = databaseCheckerService.getMigrationSQL(status);
        setMigrationSQL(sql);
      }
    } catch (err) {
      console.error('Error checking database:', err);
      toast.error('Failed to check database schema');
    } finally {
      setChecking(false);
    }
  };

  const handleCopy = async () => {
    if (!migrationSQL) return;
    
    try {
      await navigator.clipboard.writeText(migrationSQL);
      setCopied(true);
      toast.success('Migration script copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 p-6">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Checking database schema...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dbStatus || dbStatus.allTablesReady) {
    // All good, continue
    React.useEffect(() => {
      onComplete();
    }, [onComplete]);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <Card className="max-w-4xl w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Database Schema Mismatch Detected
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your database tables have incorrect column names. Let's fix this!
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Problem Explanation */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-2">What's wrong?</h4>
                <div className="text-sm text-orange-800 space-y-2">
                  {!dbStatus.students.hasCorrectSchema && (
                    <p>
                      ❌ <strong>Students Table:</strong> Has wrong column names. 
                      {dbStatus.students.missingColumns.length > 0 && (
                        <span className="block ml-6 mt-1">
                          Missing: <code className="text-xs">{dbStatus.students.missingColumns.join(', ')}</code>
                        </span>
                      )}
                    </p>
                  )}
                  {!dbStatus.exams.hasCorrectSchema && (
                    <p>
                      ❌ <strong>Exams Table:</strong> Has wrong column names.
                      {dbStatus.exams.missingColumns.length > 0 && (
                        <span className="block ml-6 mt-1">
                          Missing: <code className="text-xs">{dbStatus.exams.missingColumns.join(', ')}</code>
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">How to Fix:</h3>
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Copy Migration Script
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  This script will drop the old tables and recreate them with correct column names.
                </p>
                <Button 
                  onClick={handleCopy} 
                  className="gap-2"
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Migration Script
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Run in Supabase SQL Editor
                </h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Open Supabase Dashboard</li>
                  <li>Go to <strong>SQL Editor</strong> in the left sidebar</li>
                  <li>Click <strong>New query</strong></li>
                  <li>Paste the migration script</li>
                  <li>Click <strong>Run</strong></li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Verify the Fix
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  After running the script, click the button below to verify everything works.
                </p>
                <Button 
                  onClick={() => {
                    checkDatabase();
                    toast.success('Re-checking database schema...');
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-check Database
                </Button>
              </div>
            </div>
          </div>

          {/* Migration SQL Preview */}
          {migrationSQL && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Migration Script:</h4>
                {onShowFullSetup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowFullSetup}
                    className="gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Database Setup
                  </Button>
                )}
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {migrationSQL}
                </pre>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Warning:</p>
                <p>
                  This script will <strong>DROP (delete) existing tables</strong> and recreate them.
                  All existing data will be lost. The script includes sample data to help you get started.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="text-center pt-4">
            <Button 
              onClick={onComplete}
              size="lg"
              className="gap-2 px-8"
              variant="outline"
            >
              Skip for Now (Not Recommended)
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              The application won't work properly until the schema is fixed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}