import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Stethoscope, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

export function DiagnosticPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Running diagnostic...');
      const response = await fetch(`${API_BASE}/api/data/diagnostic`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to run diagnostic: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Diagnostic data:', data);
      setDiagnosticData(data);
      toast.success('Diagnostic complete!');
    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error(error.message || 'Failed to run diagnostic');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-purple-600" />
          System Diagnostic
        </CardTitle>
        <p className="text-sm text-gray-600">
          Check what data exists in the system
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Diagnostic
            </>
          )}
        </Button>

        {diagnosticData && (
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-sm mb-3">KV Store Data:</h3>
              <div className="space-y-2">
                <DataRow label="Teachers" count={diagnosticData.kvStore['teacher:']?.count || 0} />
                <DataRow label="Classes" count={diagnosticData.kvStore['class:']?.count || 0} />
                <DataRow label="Sections" count={diagnosticData.kvStore['section:']?.count || 0} />
                <DataRow 
                  label="Subjects" 
                  count={diagnosticData.kvStore['sems:subject:']?.count || 0} 
                  highlight={diagnosticData.kvStore['sems:subject:']?.count > 0}
                />
                <DataRow 
                  label="Exams" 
                  count={diagnosticData.kvStore['sems:exam:']?.count || 0}
                  highlight={diagnosticData.kvStore['sems:exam:']?.count > 0}
                />
                <DataRow label="Timetable" count={diagnosticData.kvStore['sems:timetable:']?.count || 0} />
                <DataRow 
                  label="Academic Years" 
                  count={diagnosticData.kvStore['sems:academicyear:']?.count || 0}
                  highlight={diagnosticData.kvStore['sems:academicyear:']?.count > 0}
                />
                <DataRow label="Marks (KV)" count={diagnosticData.kvStore['sems:mark:']?.count || 0} />
                <DataRow label="Results" count={diagnosticData.kvStore['sems:result:']?.count || 0} />
                <DataRow label="Report Cards" count={diagnosticData.kvStore['sems:reportcard:']?.count || 0} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm mb-3">Postgres Tables:</h3>
              <div className="space-y-2">
                <DataRow label="Students" count={diagnosticData.postgres.students?.count || 0} />
                <DataRow label="Marks" count={diagnosticData.postgres.marks?.count || 0} />
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>💡 Tip:</strong> If you see non-zero counts for Subjects, Exams, or Academic Years after clearing,
                the server might still be deploying. Wait 30-60 seconds and run the diagnostic again.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataRow({ label, count, highlight }: { label: string; count: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 ${highlight && count > 0 ? 'bg-red-100 px-2 rounded' : ''}`}>
      <span className="text-sm font-medium">{label}:</span>
      <span className={`text-sm font-semibold ${count > 0 ? (highlight ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>
        {count}
      </span>
    </div>
  );
}
