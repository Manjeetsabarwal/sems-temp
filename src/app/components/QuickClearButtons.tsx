import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

interface QuickClearButton {
  label: string;
  module: string;
  color: string;
}

const QUICK_CLEARS: QuickClearButton[] = [
  { label: 'Clear Students', module: 'students', color: 'bg-red-500 hover:bg-red-600' },
  { label: 'Clear Marks', module: 'marks', color: 'bg-orange-500 hover:bg-orange-600' },
  { label: 'Clear Exams', module: 'exams', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { label: 'Clear Subjects', module: 'subjects', color: 'bg-green-500 hover:bg-green-600' },
  { label: 'Clear Academic Years', module: 'academicyears', color: 'bg-blue-500 hover:bg-blue-600' },
  { label: 'Clear Teachers', module: 'teachers', color: 'bg-purple-500 hover:bg-purple-600' },
  { label: 'Clear Classes', module: 'classes', color: 'bg-pink-500 hover:bg-pink-600' },
  { label: 'Clear Sections', module: 'sections', color: 'bg-indigo-500 hover:bg-indigo-600' },
];

export function QuickClearButtons() {
  const [clearing, setClearing] = useState<string | null>(null);

  const handleClearModule = async (module: string, label: string) => {
    if (!confirm(`Are you sure you want to clear all ${label.replace('Clear ', '')}?`)) {
      return;
    }

    try {
      setClearing(module);
      const response = await fetch(`${API_BASE}/api/data/clear/${module}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear data');
      }

      const result = await response.json();
      console.log(`Cleared ${module}:`, result);
      toast.success(result.message || `${label} completed`);
    } catch (error: any) {
      console.error(`Error clearing ${module}:`, error);
      toast.error(error.message || `Failed to ${label.toLowerCase()}`);
    } finally {
      setClearing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-gray-600" />
          Quick Clear Individual Modules
        </CardTitle>
        <p className="text-sm text-gray-600">
          Clear specific modules for testing
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_CLEARS.map(({ label, module, color }) => (
            <Button
              key={module}
              onClick={() => handleClearModule(module, label)}
              disabled={clearing !== null}
              className={`${color} text-white ${clearing === module ? 'opacity-50' : ''}`}
              size="sm"
            >
              {clearing === module ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 mr-2" />
                  {label}
                </>
              )}
            </Button>
          ))}
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Note:</strong> These buttons clear individual modules only.
            Use the main "Clear All Data" button to clear everything at once.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
