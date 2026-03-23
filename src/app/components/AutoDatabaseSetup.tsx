import React, { useState } from 'react';
import { Database, PlayCircle, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { databaseSetupService, SetupProgress } from '../services/database-setup.service';

interface AutoDatabaseSetupProps {
  onComplete: () => void;
}

export function AutoDatabaseSetup({ onComplete }: AutoDatabaseSetupProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState<SetupProgress[]>([]);

  const handleAutoSetup = async () => {
    setIsRunning(true);
    setHasError(false);
    setProgress([]);

    try {
      await databaseSetupService.setupDatabase((progressUpdate) => {
        setProgress((prev) => {
          const existing = prev.find(p => p.step === progressUpdate.step);
          if (existing) {
            return prev.map(p => p.step === progressUpdate.step ? progressUpdate : p);
          }
          return [...prev, progressUpdate];
        });
      });

      setIsComplete(true);
      toast.success('Database setup completed successfully!');
      
      // Auto-continue after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      console.error('Database setup error:', err);
      setHasError(true);
      toast.error(err.message || 'Database setup failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {isComplete ? 'Setup Complete!' : 'Automatic Database Setup'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {isComplete 
              ? 'Your database is ready to use'
              : 'Click the button below to automatically create all required tables'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">What will be created:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Sample classes data in KV store (Class 10, 11, 12)</li>
                  <li>✅ Sample sections data in KV store (10-A, 10-B, 11-A, 12-A)</li>
                  <li>✅ Sample teachers data in KV store (5 teachers)</li>
                  <li>✅ All data stored in existing <code>kv_store_2fbe5237</code> table</li>
                </ul>
                <p className="text-xs text-blue-700 mt-3 italic">
                  Note: Uses the existing KV store table - no new database tables will be created.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          {progress.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Setup Progress:</h4>
              {progress.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.message}</p>
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Setup failed</p>
              <p className="text-sm mt-1">
                Please check your Supabase connection and try again. 
                Make sure you have the correct permissions.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4">
            {!isComplete ? (
              <>
                <Button
                  onClick={handleAutoSetup}
                  disabled={isRunning}
                  size="lg"
                  className="gap-2 px-8"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5" />
                      Start Automatic Setup
                    </>
                  )}
                </Button>
                {hasError && (
                  <Button
                    onClick={handleAutoSetup}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={onComplete}
                size="lg"
                className="gap-2 px-8"
              >
                <CheckCircle className="w-5 h-5" />
                Continue to Application
              </Button>
            )}
          </div>

          {/* Migration Note */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                🚀 Future-Ready Architecture
              </h4>
              <p className="text-xs text-gray-600">
                This setup is designed to work with Supabase now and can be easily migrated to 
                PostgreSQL + NestJS later. All table structures follow standard PostgreSQL conventions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}