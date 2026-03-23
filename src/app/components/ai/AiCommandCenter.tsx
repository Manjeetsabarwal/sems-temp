import React, { useState } from 'react';
import { Zap, FileText, Users, DollarSign, Calendar, Brain, Settings, ChevronRight } from 'lucide-react';
import { cn } from '../ui/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'report' | 'analysis' | 'prediction' | 'automation';
  color: string;
  onClick: () => void;
}

interface AutomationTask {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  lastRun: Date;
  nextRun?: Date;
}

export function AiCommandCenter() {
  const [activeTab, setActiveTab] = useState<'actions' | 'automations' | 'settings'>('actions');
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: '1',
      name: 'Daily Performance Report',
      status: 'completed',
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Fee Reminder Processing',
      status: 'running',
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Attendance Analysis',
      status: 'failed',
      lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Generate Class Performance Report',
      description: 'Create detailed performance analysis for any class',
      icon: FileText,
      category: 'report',
      color: 'bg-blue-500',
      onClick: () => handleGenerateReport('performance'),
    },
    {
      id: '2',
      title: 'Analyze Fee Collection',
      description: 'Get insights on fee payment patterns and pending amounts',
      icon: DollarSign,
      category: 'analysis',
      color: 'bg-green-500',
      onClick: () => handleAnalyze('fees'),
    },
    {
      id: '3',
      title: 'Identify At-Risk Students',
      description: 'Find students who may need extra support based on performance',
      icon: Users,
      category: 'prediction',
      color: 'bg-yellow-500',
      onClick: () => handlePredict('risk'),
    },
    {
      id: '4',
      title: 'Optimize Class Schedule',
      description: 'AI-powered timetable optimization for better learning',
      icon: Calendar,
      category: 'automation',
      color: 'bg-purple-500',
      onClick: () => handleOptimize('schedule'),
    },
    {
      id: '5',
      title: 'Predict Exam Results',
      description: 'Forecast student performance in upcoming exams',
      icon: Brain,
      category: 'prediction',
      color: 'bg-pink-500',
      onClick: () => handlePredict('results'),
    },
    {
      id: '6',
      title: 'Send Fee Reminders',
      description: 'Automated personalized fee payment reminders',
      icon: DollarSign,
      category: 'automation',
      color: 'bg-indigo-500',
      onClick: () => handleAutomate('reminders'),
    },
  ];

  const handleGenerateReport = (type: string) => {
    console.log(`Generating ${type} report...`);
    // Implementation would call the API
  };

  const handleAnalyze = (type: string) => {
    console.log(`Analyzing ${type}...`);
    // Implementation would call the API
  };

  const handlePredict = (type: string) => {
    console.log(`Predicting ${type}...`);
    // Implementation would call the API
  };

  const handleOptimize = (type: string) => {
    console.log(`Optimizing ${type}...`);
    // Implementation would call the API
  };

  const handleAutomate = (type: string) => {
    console.log(`Automating ${type}...`);
    // Implementation would call the API
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryActions = (category: string) => {
    return quickActions.filter(action => action.category === category);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">AI Command Center</h3>
          <p className="text-xs text-gray-500">Quick actions and automation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'actions', label: 'Quick Actions', icon: Zap },
          { id: 'automations', label: 'Automations', icon: Settings },
          { id: 'settings', label: 'AI Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'actions' && (
          <div className="space-y-6">
            {/* Report Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Reports</h4>
              <div className="grid grid-cols-1 gap-2">
                {getCategoryActions('report').map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Analysis</h4>
              <div className="grid grid-cols-1 gap-2">
                {getCategoryActions('analysis').map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Prediction Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Predictions</h4>
              <div className="grid grid-cols-1 gap-2">
                {getCategoryActions('prediction').map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Automation Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Automation</h4>
              <div className="grid grid-cols-1 gap-2">
                {getCategoryActions('automation').map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Scheduled Tasks</h4>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Add New Task
              </button>
            </div>

            {tasks.map((task) => (
              <div key={task.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{task.name}</h5>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(task.status))}>
                    {task.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Last run: {task.lastRun.toLocaleString()}</p>
                  {task.nextRun && (
                    <p>Next run: {task.nextRun.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Automation Statistics</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Tasks completed today</p>
                  <p className="text-2xl font-bold text-blue-900">12</p>
                </div>
                <div>
                  <p className="text-blue-700">Success rate</p>
                  <p className="text-2xl font-bold text-blue-900">94%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">AI Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable proactive suggestions</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-generate reports</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Learning mode</span>
                  <select className="rounded border-gray-300 text-sm">
                    <option>Active</option>
                    <option>Passive</option>
                    <option>Disabled</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Data Privacy</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Anonymize data before processing</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Retain interaction history</span>
                  <select className="rounded border-gray-300 text-sm">
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>1 year</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Model Configuration</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700">Response creativity</label>
                  <input type="range" min="0" max="100" defaultValue="30" className="w-full" />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Confidence threshold</label>
                  <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
