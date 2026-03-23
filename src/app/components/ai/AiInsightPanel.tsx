import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Users, Calendar, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../ui/utils';

interface Insight {
  id: string;
  type: 'performance' | 'financial' | 'attendance' | 'prediction';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
  lastUpdated: Date;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

export function AiInsightPanel() {
  const { currentUser } = useApp();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadInsights();
    loadMetrics();
  }, [selectedCategory]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/insights/performance?timeframe=7d`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Mock metrics - would come from API
    setMetrics([
      {
        title: 'Student Performance',
        value: '82%',
        change: 5.2,
        icon: TrendingUp,
        color: 'text-green-600',
      },
      {
        title: 'Fee Collection',
        value: '₹2.4L',
        change: -2.1,
        icon: DollarSign,
        color: 'text-red-600',
      },
      {
        title: 'Attendance Rate',
        value: '91%',
        change: 1.8,
        icon: Users,
        color: 'text-green-600',
      },
      {
        title: 'At-Risk Students',
        value: '12',
        change: -3,
        icon: AlertTriangle,
        color: 'text-green-600',
      },
    ]);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return Target;
      case 'financial':
        return DollarSign;
      case 'attendance':
        return Calendar;
      case 'prediction':
        return Brain;
      default:
        return Brain;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend || trend === 'stable') return null;
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <metric.icon className={cn('w-4 h-4', metric.color)} />
                  <span className={cn('text-sm', metric.color)}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {['all', 'performance', 'financial', 'attendance', 'prediction'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No insights available for the selected period</p>
          </div>
        ) : (
          insights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(insight.trend)}
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          getImpactColor(insight.impact)
                        )}>
                          {insight.impact} impact
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    
                    {insight.value && (
                      <div className="text-lg font-semibold text-gray-900 mb-3">
                        {insight.value}
                      </div>
                    )}
                    
                    {insight.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {insight.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Updated {new Date(insight.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">AI Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Generate Performance Report</span>
          </button>
          <button className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Identify At-Risk Students</span>
          </button>
          <button className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Optimize Timetable</span>
          </button>
        </div>
      </div>
    </div>
  );
}
