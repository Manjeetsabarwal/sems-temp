import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Search, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

export function DataDiagnostic() {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostic = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/data/diagnostic`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        throw new Error('Failed to run diagnostic');
      }

      const data = await response.json();
      console.log('Diagnostic data:', data);
      setDiagnosticData(data);
      toast.success('Diagnostic complete!');
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast.error(error.message || 'Failed to run diagnostic');
    } finally {
      setIsLoading(false);
    }
  };

  const getCountColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-600" />
          Database Diagnostic Tool
        </CardTitle>
        <p className="text-sm text-gray-600">
          Check exactly what data exists in the system
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostic}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Run Diagnostic
            </>
          )}
        </Button>

        {diagnosticData && (
          <div className="space-y-4 mt-6">
            {/* KV Store Section */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                KV Store Data
              </h3>
              <div className="space-y-2">
                {Object.entries(diagnosticData.kvStore).map(([prefix, info]: [string, any]) => (
                  <div
                    key={prefix}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <code className="text-xs font-mono text-gray-700">{prefix}</code>
                      {info.count > 0 && info.sampleEntry && (
                        <div className="mt-1 text-xs text-gray-500">
                          <details>
                            <summary className="cursor-pointer hover:text-gray-700 font-semibold text-blue-600">
                              ⚠️ Click to view entry structure (IMPORTANT for debugging!)
                            </summary>
                            <div className="mt-2 space-y-2">
                              <div>
                                <strong className="text-gray-900">Sample Entry (actual data):</strong>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(info.sampleEntry, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <strong className="text-gray-900">All Entries ID Analysis:</strong>
                                <pre className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(info.allEntries, null, 2)}
                                </pre>
                                <p className="mt-1 text-xs text-gray-600">
                                  <strong>hasKey:</strong> Does entry have a 'key' property?<br />
                                  <strong>keys:</strong> All property names in the entry<br />
                                  <strong>idFields:</strong> Values of ID fields (for key construction)
                                </p>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {info.error ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">Error</span>
                        </>
                      ) : (
                        <>
                          {info.count === 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                          )}
                          <span className={`text-sm font-semibold ${getCountColor(info.count)}`}>
                            {info.count} entries
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Postgres Section */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Storage Information
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm text-gray-700">
                    <strong>Database:</strong> {diagnosticData.storage?.type || 'Postgres KV Store'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Table:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{diagnosticData.storage?.table || 'kv_store_2fbe5237'}</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {diagnosticData.storage?.note || 'All application data uses key-value storage in Postgres'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>✅ Green (0):</strong> No data - Clean!<br />
                <strong>🔵 Blue (X):</strong> X entries found - needs clearing<br />
                <strong>❌ Red:</strong> Error accessing data
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Expand "View sample entry" to see the actual structure of stored data.
                This helps debug why the clear function might not be working.
              </p>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Last checked: {new Date(diagnosticData.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {!diagnosticData && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-sm mb-2 text-purple-900">
              What this tool does:
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Shows exactly how many records exist in each module</li>
              <li>• Displays the actual structure of stored data</li>
              <li>• Helps identify why clear operations might fail</li>
              <li>• Shows which ID fields are present in each entry</li>
              <li>• Verifies if the 'key' property exists on entries</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}