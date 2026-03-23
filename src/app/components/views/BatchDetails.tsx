import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Plus, Trash2, Users, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { batchesService } from '../../services/batches.service';
import { coursesService } from '../../services/courses.service';
import { teachersService } from '../../services/teachers.service';
import { studentsService } from '../../services/students.service';
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import { toast } from 'sonner';
import type { BatchTeacher, BatchStudent, Teacher, Student } from '../../types';
import { useApp } from '../../context/AppContext';
import { FileAttachments } from '../FileAttachments';

interface BatchDetailsProps {
  mode: 'create' | 'edit' | 'view';
  batchId?: number;
  onBack: () => void;
  onSuccess: () => void;
}

export function BatchDetails({ mode, batchId, onBack, onSuccess }: BatchDetailsProps) {
  const { goBack, canGoBack, pushNavigation, navigateToRecord } = useApp();

  const handleBack = () => {
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };

  const [formData, setFormData] = useState({
    courseId: 0,
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    durationDays: 0,
    startDate: '',
    endDate: '',
    totalRevenue: 0,
    teacherSharePercent: 0,
    institutionSharePercent: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [activeTab, setActiveTab] = useState<'details' | 'teachers' | 'students'>('details');

  // Dropdown data
  const [coursesDropdown, setCoursesDropdown] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [classesDropdown, setClassesDropdown] = useState<Array<{ classId: string; name: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [sectionsDropdown, setSectionsDropdown] = useState<Array<{ sectionId: string; name: string }>>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Teachers tab state
  const [batchTeachers, setBatchTeachers] = useState<BatchTeacher[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Students tab state
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Format date helper for HTML date inputs (yyyy-MM-dd format)
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    return '';
  };

  // Load batch data for edit/view mode
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        // Reset form for create mode
        setFormData({
          courseId: 0,
          title: '',
          description: '',
          classId: '',
          sectionId: '',
          durationDays: 0,
          startDate: '',
          endDate: '',
          totalRevenue: 0,
          teacherSharePercent: 0,
          institutionSharePercent: 0,
        });
      } else if (batchId) {
        setLoading(true);
        try {
          const batch = await batchesService.getById(batchId);
          setFormData({
            courseId: batch.courseId,
            title: batch.title,
            description: batch.description || '',
            classId: batch.classId || '',
            sectionId: batch.sectionId || '',
            durationDays: batch.durationDays,
            startDate: formatDateForInput(batch.startDate),
            endDate: formatDateForInput(batch.endDate),
            totalRevenue: batch.totalRevenue || 0,
            teacherSharePercent: batch.teacherSharePercent || 0,
            institutionSharePercent: batch.institutionSharePercent || 0,
          });
          setBatchTeachers(batch.batchTeachers || []);
          setBatchStudents(batch.batchStudents || []);
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load batch details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, batchId]);

  // Load courses & classes dropdown
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingCourses(true);
      setLoadingClasses(true);
      try {
        const [courses, classes] = await Promise.all([
          coursesService.getDropdown(),
          classesService.getForDropdown()
        ]);
        setCoursesDropdown(courses);
        setClassesDropdown(classes);
      } catch (err: any) {
        console.error('Failed to load dropdowns:', err);
      } finally {
        setLoadingCourses(false);
        setLoadingClasses(false);
      }
    };
    loadDropdowns();
  }, []);

  // Load sections based on classId
  useEffect(() => {
    const loadSections = async () => {
      if (!formData.classId) {
        setSectionsDropdown([]);
        return;
      }
      setLoadingSections(true);
      try {
        const sections = await sectionsService.getForDropdown(formData.classId);
        setSectionsDropdown(sections);
      } catch (err: any) {
        console.error('Failed to load sections:', err);
      } finally {
        setLoadingSections(false);
      }
    };
    loadSections();
  }, [formData.classId]);

  // Load all teachers (for the "Add Teacher" dropdown)
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await teachersService.getAll();
        setAllTeachers(teachers);
      } catch (err: any) {
        console.error('Failed to load teachers:', err);
      }
    };
    loadTeachers();
  }, []);

  // Load all students (for the "Add Student" dropdown)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const students = await studentsService.getAll();
        setAllStudents(students);
      } catch (err: any) {
        console.error('Failed to load students:', err);
      }
    };
    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!formData.courseId) {
        throw new Error('Please select a course');
      }
      if (!formData.title.trim()) {
        throw new Error('Please enter a batch title');
      }
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Please provide start and end dates');
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      const payload = {
        courseId: formData.courseId,
        title: formData.title,
        description: formData.description || null,
        classId: formData.classId || null,
        sectionId: formData.sectionId || null,
        durationDays: formData.durationDays,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalRevenue: formData.totalRevenue,
        teacherSharePercent: formData.teacherSharePercent,
        institutionSharePercent: formData.institutionSharePercent,
      };

      if (mode === 'create') {
        await batchesService.create(payload);
        toast.success('Batch created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        await batchesService.update(batchId!, payload);
        toast.success('Batch updated successfully!');
        setIsEditing(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // --- Teacher Management ---
  const handleAddTeacher = async () => {
    if (!selectedTeacherId || !batchId) return;
    setLoadingTeachers(true);
    try {
      const newBt = await batchesService.addTeacher(batchId, selectedTeacherId);
      setBatchTeachers((prev) => [...prev, newBt]);
      setSelectedTeacherId('');
      toast.success('Teacher added to batch');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add teacher');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!batchId) return;
    setLoadingTeachers(true);
    try {
      await batchesService.removeTeacher(batchId, teacherId);
      setBatchTeachers((prev) => prev.filter((bt) => bt.teacherId !== teacherId));
      toast.success('Teacher removed from batch');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove teacher');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // --- Student Management ---
  const handleAddStudent = async () => {
    if (!selectedStudentId || !batchId) return;
    setLoadingStudents(true);
    try {
      const newBs = await batchesService.addStudent(batchId, selectedStudentId);
      setBatchStudents((prev) => [...prev, newBs]);
      setSelectedStudentId('');
      toast.success('Student added to batch');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add student');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!batchId) return;
    setLoadingStudents(true);
    try {
      await batchesService.removeStudent(batchId, studentId);
      setBatchStudents((prev) => prev.filter((bs) => bs.studentId !== studentId));
      toast.success('Student removed from batch');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove student');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Helpers to resolve names
  const getTeacherName = (teacherId: string): string => {
    const teacher = allTeachers.find((t) => t.teacherId === teacherId);
    return teacher?.name || teacherId;
  };

  const getStudentName = (studentId: string): string => {
    const student = allStudents.find((s) => s.studentId === studentId);
    return student?.name || studentId;
  };

  // Filter out already-assigned teachers/students for the "Add" dropdown
  const availableTeachers = allTeachers.filter(
    (t) => !batchTeachers.some((bt) => bt.teacherId === t.teacherId)
  );
  const availableStudents = allStudents.filter(
    (s) => !batchStudents.some((bs) => bs.studentId === s.studentId)
  );

  // Generate sample batch data
  const fillSampleData = () => {
    const batchTitles = [
      'Batch A - Morning', 'Batch B - Afternoon', 'Batch C - Evening',
      'Weekend Special Batch', 'Summer Intensive', 'Foundation Batch',
      'Advanced Batch', 'Crash Course Batch', 'Regular Batch 2025'
    ];
    const descriptions = [
      'Regular weekday batch for students', 'Intensive coaching sessions',
      'Weekend classes for working students', 'Special focus on board preparation',
      'Comprehensive course coverage', 'Foundation building program'
    ];
    const startDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (60 + Math.floor(Math.random() * 120)) * 24 * 60 * 60 * 1000);
    const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const revenue = [50000, 75000, 100000, 150000, 200000][Math.floor(Math.random() * 5)];
    const teacherShare = [40, 50, 60][Math.floor(Math.random() * 3)];

    setFormData({
      courseId: coursesDropdown.length > 0 ? coursesDropdown[Math.floor(Math.random() * coursesDropdown.length)].id : 0,
      title: batchTitles[Math.floor(Math.random() * batchTitles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      classId: '',
      sectionId: '',
      durationDays,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalRevenue: revenue,
      teacherSharePercent: teacherShare,
      institutionSharePercent: 100 - teacherShare,
    });
    toast.success('Sample batch data filled! Review and save.');
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Batch' : mode === 'edit' ? 'Edit Batch' : 'Batch Details';
  const pageSubtitle = mode === 'create'
    ? 'Set up a new course batch'
    : mode === 'edit'
      ? 'Update batch information'
      : 'View batch information';

  // Only show tabs in view/edit modes (not create)
  const showTabs = mode !== 'create';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch details...</p>
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
                <Badge variant="secondary" className={isEditing ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                  {isEditing ? 'Editing' : 'View Only'}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{pageSubtitle}</p>
          </div>
        </div>

        {/* Fill Sample Data for Create Mode */}
        {mode === 'create' && (
          <Button variant="outline" className="gap-2" onClick={fillSampleData}>
            <Sparkles className="w-4 h-4" />
            Fill Sample Data
          </Button>
        )}

        {/* Edit/View Toggle for View Mode */}
        {mode === 'view' && (
          <Button
            variant={isEditing ? 'default' : 'outline'}
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
                Edit Batch
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Teachers ({batchTeachers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Students ({batchStudents.length})
          </button>
        </div>
      )}

      {/* Details Tab / Create Form */}
      {(activeTab === 'details' || mode === 'create') && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="max-w-5xl">
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course */}
                  <div className="space-y-2">
                    <Label htmlFor="courseId">
                      Course <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.courseId ? formData.courseId.toString() : ''}
                      onValueChange={(value) => setFormData({ ...formData, courseId: parseInt(value) })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCourses ? (
                          <SelectItem value="__loading__" disabled>Loading courses...</SelectItem>
                        ) : coursesDropdown.length === 0 ? (
                          <SelectItem value="__none__" disabled>No courses available</SelectItem>
                        ) : (
                          coursesDropdown.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={isReadOnly}
                      required
                      placeholder="e.g., Morning Batch - Jan 2026"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Optional batch description"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* Class ID */}
                  <div className="space-y-2">
                    <Label htmlFor="classId">Class</Label>
                    <Select
                      value={formData.classId || ''}
                      onValueChange={(value) => setFormData({ ...formData, classId: value, sectionId: '' })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingClasses ? (
                          <SelectItem value="__loading__" disabled>Loading classes...</SelectItem>
                        ) : classesDropdown.length === 0 ? (
                          <SelectItem value="__none__" disabled>No classes available</SelectItem>
                        ) : (
                          classesDropdown.map((cls) => (
                            <SelectItem key={cls.classId} value={cls.classId}>
                              {cls.name} ({cls.classId})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section ID */}
                  <div className="space-y-2">
                    <Label htmlFor="sectionId">Section</Label>
                    <Select
                      value={formData.sectionId || ''}
                      onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                      disabled={isReadOnly || !formData.classId}
                    >
                      <SelectTrigger className={isReadOnly || !formData.classId ? 'bg-gray-50' : ''}>
                        <SelectValue placeholder={!formData.classId ? 'Select a class first' : 'Select a section'} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSections ? (
                          <SelectItem value="__loading__" disabled>Loading sections...</SelectItem>
                        ) : sectionsDropdown.length === 0 ? (
                          <SelectItem value="__none__" disabled>No sections available</SelectItem>
                        ) : (
                          sectionsDropdown.map((sec) => (
                            <SelectItem key={sec.sectionId} value={sec.sectionId}>
                              {sec.name} ({sec.sectionId})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Days */}
                  <div className="space-y-2">
                    <Label htmlFor="durationDays">Duration (Days)</Label>
                    <Input
                      id="durationDays"
                      type="number"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      min="0"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={isReadOnly}
                      required
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={isReadOnly}
                      required
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Revenue & Share Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Revenue &amp; Share
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Revenue */}
                  <div className="space-y-2">
                    <Label htmlFor="totalRevenue">Total Revenue</Label>
                    <Input
                      id="totalRevenue"
                      type="number"
                      value={formData.totalRevenue}
                      onChange={(e) => setFormData({ ...formData, totalRevenue: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* Teacher Share Percent */}
                  <div className="space-y-2">
                    <Label htmlFor="teacherSharePercent">Teacher Share (%)</Label>
                    <Input
                      id="teacherSharePercent"
                      type="number"
                      value={formData.teacherSharePercent}
                      onChange={(e) => setFormData({ ...formData, teacherSharePercent: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      min="0"
                      max="100"
                      step="0.01"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>

                  {/* Institution Share Percent */}
                  <div className="space-y-2">
                    <Label htmlFor="institutionSharePercent">Institution Share (%)</Label>
                    <Input
                      id="institutionSharePercent"
                      type="number"
                      value={formData.institutionSharePercent}
                      onChange={(e) => setFormData({ ...formData, institutionSharePercent: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      min="0"
                      max="100"
                      step="0.01"
                      className={isReadOnly ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex gap-3 max-w-5xl">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === 'create' ? 'Create Batch' : 'Save Changes'}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Teachers Tab */}
      {showTabs && activeTab === 'teachers' && (
        <Card className="max-w-5xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assigned Teachers ({batchTeachers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Teacher */}
            <div className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="flex-1 space-y-2">
                <Label>Add Teacher</Label>
                <Select
                  value={selectedTeacherId}
                  onValueChange={setSelectedTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.length === 0 ? (
                      <SelectItem value="__none__" disabled>No available teachers</SelectItem>
                    ) : (
                      availableTeachers.map((t) => (
                        <SelectItem key={t.teacherId} value={t.teacherId}>
                          {t.name} ({t.teacherId})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddTeacher}
                disabled={!selectedTeacherId || loadingTeachers}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {/* Teachers List */}
            {batchTeachers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No teachers assigned yet</p>
                <p className="text-sm mt-1">Use the dropdown above to add teachers to this batch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {batchTeachers.map((bt) => (
                  <div
                    key={bt.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                        {getTeacherName(bt.teacherId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (batchId) {
                              pushNavigation('batches', batchId.toString());
                              navigateToRecord('teachers', bt.teacherId);
                            }
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {getTeacherName(bt.teacherId)}
                        </button>
                        <p className="text-xs text-gray-500">{bt.teacherId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bt.shareAmount != null && (
                        <Badge variant="secondary" className="text-xs">
                          Share: {bt.shareAmount}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTeacher(bt.teacherId)}
                        disabled={loadingTeachers}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students Tab */}
      {showTabs && activeTab === 'students' && (
        <Card className="max-w-5xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Enrolled Students ({batchStudents.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Student */}
            <div className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="flex-1 space-y-2">
                <Label>Add Student</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.length === 0 ? (
                      <SelectItem value="__none__" disabled>No available students</SelectItem>
                    ) : (
                      availableStudents.map((s) => (
                        <SelectItem key={s.studentId} value={s.studentId}>
                          {s.name} ({s.studentId})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddStudent}
                disabled={!selectedStudentId || loadingStudents}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {/* Students List */}
            {batchStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No students enrolled yet</p>
                <p className="text-sm mt-1">Use the dropdown above to add students to this batch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {batchStudents.map((bs) => (
                  <div
                    key={bs.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                        {getStudentName(bs.studentId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (batchId) {
                              pushNavigation('batches', batchId.toString());
                              navigateToRecord('students', bs.studentId);
                            }
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {getStudentName(bs.studentId)}
                        </button>
                        <p className="text-xs text-gray-500">{bs.studentId}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStudent(bs.studentId)}
                      disabled={loadingStudents}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments - only for existing batches (edit/view) */}
      {mode !== 'create' && batchId && (
        <FileAttachments
          entityType="batch"
          entityId={String(batchId)}
          readOnly={!isEditing}
          title="Batch Documents"
        />
      )}
    </div>
  );
}
