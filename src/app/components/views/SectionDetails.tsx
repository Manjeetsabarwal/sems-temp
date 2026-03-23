import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { sectionsService } from '../../services/sections.service';
import { classesService } from '../../services/classes.service';
import { toast } from 'sonner';
import type { SectionExtended } from '../../types';
import { useApp } from '../../context/AppContext';

interface SectionDetailsProps {
  mode: 'create' | 'edit' | 'view';
  sectionId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function SectionDetails({ mode, sectionId, onBack, onSuccess }: SectionDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState({
    sectionId: '',
    classId: '',
    name: '',
    capacity: undefined as number | undefined,
    roomNumber: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [currentStrength, setCurrentStrength] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [classOptions, setClassOptions] = useState<Array<{ classId: string; name: string }>>([]);

  // Auto-generate Section ID for new sections
  const generateSectionId = async () => {
    try {
      const sections = await sectionsService.getAll();
      const existingIds = sections.map(s => s.sectionId);
      
      // Find the highest number
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/SEC-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const newNum = maxNum + 1;
      return `SEC-${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      return 'SEC-001';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadClasses();
      if (mode === 'create') {
        // Auto-generate section ID
        const newId = await generateSectionId();
        setFormData(prev => ({ ...prev, sectionId: newId }));
        // Set default class if available
        if (classOptions.length > 0) {
          setFormData(prev => ({ ...prev, classId: classOptions[0].classId }));
        }
      } else if (sectionId) {
        setLoading(true);
        try {
          const section = await sectionsService.getById(sectionId);
          setFormData({
            sectionId: section.sectionId,
            classId: section.classId || '',
            name: section.name,
            capacity: section.capacity,
            roomNumber: section.roomNumber || '',
            status: section.status as 'Active' | 'Inactive',
          });
          // Load current strength (auto-calculated from student count)
          setCurrentStrength(section.currentStrength || 0);
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load section details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, sectionId]);

  const loadClasses = async () => {
    try {
      const classes = await classesService.getForDropdown();
      setClassOptions(classes);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === 'create') {
        await sectionsService.create({
          sectionId: formData.sectionId,
          classId: formData.classId || undefined,
          name: formData.name,
          capacity: formData.capacity,
          roomNumber: formData.roomNumber || undefined,
          status: formData.status,
        } as Omit<SectionExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>);
        toast.success('Section created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        await sectionsService.update(formData.sectionId, {
          classId: formData.classId || undefined,
          name: formData.name,
          capacity: formData.capacity,
          roomNumber: formData.roomNumber || undefined,
          status: formData.status,
        });
        toast.success('Section updated successfully!');
        setIsEditing(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save section');
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

    // Section names
    const sectionNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const sectionPrefixes = ['Section', 'Sec', 'S'];

    // Generate unique section ID
    const newId = await generateSectionId();

    // Get random class
    let selectedClass = '';
    if (classOptions.length > 0) {
      selectedClass = classOptions[Math.floor(Math.random() * classOptions.length)].classId;
    }

    // Select random section name
    const prefix = sectionPrefixes[Math.floor(Math.random() * sectionPrefixes.length)];
    const letter = sectionNames[Math.floor(Math.random() * sectionNames.length)];
    const sectionName = `${prefix} ${letter}`;

    // Random capacity (20-50 students)
    const capacity = Math.floor(Math.random() * 31) + 20;

    // Random room number (100-500)
    const roomNumber = String(Math.floor(Math.random() * 401) + 100);

    // Mostly Active (80% chance)
    const status = Math.random() > 0.2 ? 'Active' : 'Inactive';

    // Update form data
    setFormData({
      sectionId: newId,
      classId: selectedClass,
      name: sectionName,
      capacity,
      roomNumber,
      status: status as 'Active' | 'Inactive',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Section' : mode === 'edit' ? 'Edit Section' : 'Section Details';
  const pageSubtitle = mode === 'create' 
    ? 'Add a new section to the system' 
    : mode === 'edit' 
    ? 'Update section information'
    : 'View section information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading section details...</p>
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
                Edit Section
              </>
            )}
          </Button>
        )}
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Section Information</CardTitle>
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
                {/* Section ID */}
                <div className="space-y-2">
                  <Label htmlFor="sectionId">
                    Section ID <span className="text-red-500">*</span>
                  </Label>
                  {mode === 'create' ? (
                    <div className="flex gap-2">
                      <Input
                        id="sectionId"
                        value={formData.sectionId}
                        onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                        required
                        placeholder="Auto-generated"
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newId = await generateSectionId();
                          setFormData({ ...formData, sectionId: newId });
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="sectionId"
                      value={formData.sectionId}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    {mode === 'create' ? 'Auto-generated unique identifier' : 'Cannot be changed'}
                  </p>
                </div>

                {/* Section Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Section Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isReadOnly}
                    required
                    placeholder="e.g., Section A"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    Class <span className="text-gray-400 text-xs">(optional)</span>
                  </Label>
                  <Select
                    value={formData.classId && classOptions.some(c => String(c.classId) === String(formData.classId)) 
                      ? String(formData.classId) 
                      : '__none__'}
                    onValueChange={(value) => {
                      const classId = value === '__none__' ? '' : value;
                      setFormData({ ...formData, classId });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="classId" className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue placeholder="Select class (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No specific class</SelectItem>
                      {classOptions.map((cls) => (
                        <SelectItem key={cls.classId} value={String(cls.classId)}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.classId && (
                    <button
                      onClick={() => {
                        pushNavigation('sections', sectionId);
                        navigateToRecord('classes', formData.classId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Class Details →
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    Sections can be independent or linked to a class
                  </p>
                </div>

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

                {/* Room Number */}
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">
                    Room Number
                  </Label>
                  <Input
                    id="roomNumber"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="e.g., 101"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
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
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Section' : 'Save Changes'}
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

      {/* Help Text */}
      {mode === 'create' && (
        <Card className="max-w-3xl bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Important Notes:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Section ID is auto-generated but you can edit it if needed</li>
              <li>• Section ID should be unique across all sections</li>
              <li>• Class assignment is optional - sections can be independent</li>
              <li>• Room number and capacity are optional but recommended</li>
              <li>• All required fields are marked with an asterisk (*)</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
