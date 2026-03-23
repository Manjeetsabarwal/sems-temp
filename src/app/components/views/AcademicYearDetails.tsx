import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { academicYearsService, type AcademicYear } from '../../services/academic-years.service';
import { useApp } from '../../context/AppContext';

interface AcademicYearDetailsProps {
  mode: 'create' | 'edit' | 'view';
  yearId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function AcademicYearDetails({ mode, yearId, onBack, onSuccess }: AcademicYearDetailsProps) {
  const { goBack, canGoBack } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState<AcademicYear>({
    academicYearId: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Auto-generate Academic Year ID
  const generateYearId = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        // Auto-generate year ID
        const newId = generateYearId();
        setFormData(prev => ({ ...prev, academicYearId: newId }));
      } else if (yearId) {
        setLoading(true);
        try {
          const data = await academicYearsService.getById(yearId);
          setFormData({
            academicYearId: data.academicYearId,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status as 'Active' | 'Inactive' | 'Upcoming',
          });
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load academic year details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, yearId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.academicYearId || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);

    try {
      if (mode === 'create') {
        await academicYearsService.create(formData);
        toast.success('Academic year created successfully!');
      } else if (yearId) {
        await academicYearsService.update(yearId, formData);
        toast.success('Academic year updated successfully!');
      }

      if (mode === 'edit' || (mode === 'view' && isEditing)) {
        setIsEditing(false);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save academic year');
    } finally {
      setSaving(false);
    }
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearId = `${currentYear}-${nextYear}`;

    // Start date: June 1st of current year
    const startDate = new Date(currentYear, 5, 1); // Month is 0-indexed, so 5 = June
    // End date: May 31st of next year
    const endDate = new Date(nextYear, 4, 31); // Month is 0-indexed, so 4 = May

    setFormData({
      academicYearId: yearId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'Upcoming',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const isReadOnly = !isEditing;
  const pageTitle =
    mode === 'create' ? 'Create Academic Year' : mode === 'edit' ? 'Edit Academic Year' : 'Academic Year Details';
  const pageSubtitle =
    mode === 'create'
      ? 'Set up a new academic year for the school.'
      : mode === 'edit'
      ? 'Modify the academic year details.'
      : 'View the academic year information.';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading academic year details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Academic Years
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {pageTitle}
              </h2>
              <p className="text-sm text-gray-500">{pageSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'view' && !isEditing && (
              <Button onClick={toggleEditMode} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {mode === 'view' && isEditing && (
              <Button onClick={toggleEditMode} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Only
              </Button>
            )}
            {!isReadOnly && (
              <>
                {mode === 'create' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fillSampleData}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Fill Sample Data
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Academic Year' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Year Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Academic Year ID *</Label>
                  <Input
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                    disabled={mode !== 'create' || isReadOnly}
                    placeholder="e.g., 2025-2026"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2025-2026)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'Active' | 'Inactive' | 'Upcoming') =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Active: Currently running | Upcoming: Not yet started | Inactive: Completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          {formData.startDate && formData.endDate && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Duration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Duration</p>
                    <p className="text-lg font-bold text-blue-900">
                      {(() => {
                        const start = new Date(formData.startDate);
                        const end = new Date(formData.endDate);
                        // Set to noon to avoid timezone issues
                        start.setHours(12, 0, 0, 0);
                        end.setHours(12, 0, 0, 0);
                        // Calculate difference in days and add 1 to include both start and end dates
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return diffDays;
                      })()}{' '}
                      days
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Approximately</p>
                    <p className="text-lg font-bold text-blue-900">
                      {(() => {
                        const start = new Date(formData.startDate);
                        const end = new Date(formData.endDate);
                        start.setHours(12, 0, 0, 0);
                        end.setHours(12, 0, 0, 0);
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        // Calculate months more accurately
                        const months = Math.round((diffDays / 30.44) * 10) / 10; // Average days per month
                        return months;
                      })()}{' '}
                      months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}
