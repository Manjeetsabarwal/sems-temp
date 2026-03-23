import React from 'react';
import { DataPopulator } from './DataPopulator';
import { DataDiagnostic } from './DataDiagnostic';
import { QuickClearButtons } from './QuickClearButtons';

export function DatabaseTools() {
  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Tools</h1>
        <p className="text-gray-600">
          Manage, diagnose, and populate your database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataDiagnostic />
        <DataPopulator />
      </div>

      <QuickClearButtons />
    </div>
  );
}