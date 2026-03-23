import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { classesService } from '../../services/classes.service';
import { toast } from 'sonner';
import type { ClassExtended } from '../../types';
import { useApp } from '../../context/AppContext';
import { FileAttachments } from '../FileAttachments';

interface ClassDetailsProps {
  mode: 'create' | 'edit' | 'view';
  classId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ClassDetails({ mode, classId, onBack, onSuccess }: ClassDetailsProps) {
  const { goBack, canGoBack } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState({
    classId: '',
    name: '',
    description: '',
    capacity: undefined as number | undefined,
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [currentStrength, setCurrentStrength] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Auto-generate Class ID for new classes
  const generateClassId = async () => {
    try {
      const classes = await classesService.getAll();
      const existingIds = classes.map(c => c.classId);
      
      // Find the highest number
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/CLASS-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const newNum = maxNum + 1;
      return `CLASS-${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      return 'CLASS-001';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        // Auto-generate class ID
        const newId = await generateClassId();
        setFormData(prev => ({ ...prev, classId: newId }));
      } else if (classId) {
        setLoading(true);
        try {
          const classData = await classesService.getById(classId);
          setFormData({
            classId: classData.classId,
            name: classData.name,
            description: classData.description || '',
            capacity: classData.capacity,
            status: classData.status as 'Active' | 'Inactive',
          });
          // Load current strength (auto-calculated from student count)
          setCurrentStrength(classData.currentStrength || 0);
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load class details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === 'create') {
        await classesService.create(formData as Omit<ClassExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>);
        toast.success('Class created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        await classesService.update(formData.classId, formData);
        toast.success('Class updated successfully!');
        setIsEditing(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

    // Class names
    const classNames = [
      'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
      'Class 9', 'Class 10', 'Class 11', 'Class 12',
      'Year 9', 'Year 10', 'Year 11', 'Year 12',
      'Standard 9', 'Standard 10', 'Standard 11', 'Standard 12'
    ];

    // Class descriptions
    const descriptions = [
      'Secondary education class focusing on foundational subjects',
      'High school class preparing students for board examinations',
      'Advanced level class with specialized subject streams',
      'Senior secondary class with career-oriented curriculum',
      'Intermediate level class with comprehensive syllabus',
      'Higher secondary class with optional subjects',
      'Pre-university class with academic and vocational tracks',
      'Final year class preparing for higher education'
    ];

    // Generate unique class ID
    const newId = await generateClassId();

    // Select random class name
    const selectedName = classNames[Math.floor(Math.random() * classNames.length)];

    // Random description
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Random capacity (30-60 students)
    const capacity = Math.floor(Math.random() * 31) + 30;

    // Mostly Active (80% chance)
    const status = Math.random() > 0.2 ? 'Active' : 'Inactive';

    // Update form data
    setFormData({
      classId: newId,
      name: selectedName,
      description,
      capacity,
      status: status as 'Active' | 'Inactive',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Class' : mode === 'edit' ? 'Edit Class' : 'Class Details';
  const pageSubtitle = mode === 'create' 
    ? 'Add a new class to the system' 
    : mode === 'edit' 
    ? 'Update class information'
    : 'View class information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              {mode === 'view' && (
                <Badge variant="secondary" className={isEditing ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                  {isEditing ? 'Editing' : 'View Only'}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{pageSubtitle}</p>
          </div>
        </div>
        
        {/* Edit/View Toggle for View Mode */}
        {mode === 'view' && (
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={toggleEditMode}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4" />
                Switch to View
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit Class
              </>
            )}
          </Button>
        )}
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class Information</CardTitle>
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillSampleData}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Fill Sample Data
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class ID */}
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    Class ID <span className="text-red-500">*</span>
                  </Label>
                  {mode === 'create' ? (
                    <div className="flex gap-2">
                      <Input
                        id="classId"
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        required
                        placeholder="Auto-generated"
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newId = await generateClassId();
                          setFormData({ ...formData, classId: newId });
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="classId"
                      value={formData.classId}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    {mode === 'create' ? 'Auto-generated unique identifier' : 'Cannot be changed'}
                  </p>
                </div>

                {/* Class Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Class Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isReadOnly}
                    required
                    placeholder="e.g., Class 10"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Brief description of the class"
                  rows={3}
                  className={isReadOnly ? 'bg-gray-50' : ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                    disabled={isReadOnly}
                    placeholder="e.g., 40"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                  <p className="text-xs text-gray-500">Maximum number of students</p>
                </div>

                {/* Current Strength - Read Only */}
                {mode !== 'create' && currentStrength !== undefined && (
                  <div className="space-y-2">
                    <Label htmlFor="currentStrength">
                      Current Strength
                    </Label>
                    <Input
                      id="currentStrength"
                      type="number"
                      value={currentStrength}
                      disabled
                      className="bg-gray-50 font-semibold"
                    />
                    <p className="text-xs text-gray-500">
                      Auto-calculated from active students
                      {formData.capacity && (
                        <span className="ml-1">
                          ({currentStrength} / {formData.capacity})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'Active' | 'Inactive' })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="status" className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Class' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* View Mode Actions */}
            {isReadOnly && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back to List
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Attachments - only for existing classes (edit/view) */}
      {mode !== 'create' && formData.classId && (
        <div className="max-w-3xl">
          <FileAttachments
            entityType="class"
            entityId={formData.classId}
            readOnly={mode === 'view' && !isEditing}
            title="Class Documents"
          />
        </div>
      )}

      {/* Help Text */}
      {mode === 'create' && (
        <Card className="max-w-3xl bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Important Notes:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Class ID is auto-generated but you can edit it if needed</li>
              <li>• Class ID should be unique across all classes</li>
              <li>• Capacity is optional but recommended for planning</li>
              <li>• All required fields are marked with an asterisk (*)</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
