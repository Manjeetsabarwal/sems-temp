import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Plus, Trash2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { examsService } from '../../services/exams.service';
import { subjectsService } from '../../services/subjects.service';
import { classesService } from '../../services/classes.service';
import { academicYearsService } from '../../services/academic-years.service';
import { toast } from 'sonner';
import type { Exam, ExamSubject, Subject } from '../../types';
import { useApp } from '../../context/AppContext';
import { FileAttachments } from '../FileAttachments';

interface ExamDetailsProps {
  mode: 'create' | 'edit' | 'view';
  examId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ExamDetails({ mode, examId, onBack, onSuccess }: ExamDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();

  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };

  const [formData, setFormData] = useState<Omit<Exam, 'createdAt' | 'updatedAt'>>(({
    examId: '',
    examName: '',
    examType: 'Mid-Term',
    academicYear: '2023-2024',
    classId: '',
    term: 'Term 1',
    startDate: '',
    endDate: '',
    totalMarks: 0,
    passingMarks: 0,
    subjects: [],
    status: 'Scheduled',
  }));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Array<{ classId: string; name: string; status: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [availableAcademicYears, setAvailableAcademicYears] = useState<string[]>([]);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);

  // Format date helper for HTML date inputs (yyyy-MM-dd format)
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      // If it's an ISO string, extract just the date part
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      // If it's already in yyyy-MM-dd format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
    }
    // If it's a Date object, format it
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    return '';
  };

  // Auto-generate Exam ID for new exams
  const generateExamId = async () => {
    try {
      const exams = await examsService.getAll({});
      const existingIds = exams.map(e => e.examId);

      // Find the highest number
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/EXM(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });

      const newNum = maxNum + 1;
      return `EXM${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      return 'EXM001';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        // Auto-generate exam ID and reset form to ensure clean state
        const newId = await generateExamId();
        setFormData({
          examId: newId,
          examName: '',
          examType: 'Mid-Term',
          academicYear: '2023-2024',
          classId: '', // Empty - user must select from dropdown
          term: 'Term 1',
          startDate: '',
          endDate: '',
          totalMarks: 0,
          passingMarks: 0,
          subjects: [],
          status: 'Scheduled',
        });
      } else if (examId) {
        setLoading(true);
        try {
          const exam = await examsService.getById(examId);

          console.log('📚 ExamDetails: Received exam from service:', exam);
          console.log('📚 ExamDetails: Exam subjects:', exam.subjects);
          console.log('📚 ExamDetails: Subjects type:', typeof exam.subjects);
          console.log('📚 ExamDetails: Subjects is array:', Array.isArray(exam.subjects));

          // The service should already normalize subjects, but double-check
          let normalizedSubjects: ExamSubject[] = [];
          if (exam.subjects && Array.isArray(exam.subjects)) {
            normalizedSubjects = exam.subjects.map((s: any) => ({
              subjectId: s.subjectId || s.subject_id || '',
              subjectName: s.subjectName || s.subject_name || '',
              subjectCode: s.subjectCode || s.subject_code || '',
              maxMarks: Number(s.maxMarks || s.max_marks || 0),
              passingMarks: Number(s.passingMarks || s.passing_marks || 0),
              examDate: formatDateForInput(s.examDate || s.exam_date || ''),
              duration: Number(s.duration || 180),
            }));
          } else if (exam.subjects) {
            console.warn('⚠️ ExamDetails: Subjects is not an array:', exam.subjects);
            // Try to parse if it's a string
            if (typeof exam.subjects === 'string') {
              try {
                const parsed = JSON.parse(exam.subjects);
                if (Array.isArray(parsed)) {
                  normalizedSubjects = parsed.map((s: any) => ({
                    subjectId: s.subjectId || s.subject_id || '',
                    subjectName: s.subjectName || s.subject_name || '',
                    subjectCode: s.subjectCode || s.subject_code || '',
                    maxMarks: Number(s.maxMarks || s.max_marks || 0),
                    passingMarks: Number(s.passingMarks || s.passing_marks || 0),
                    examDate: formatDateForInput(s.examDate || s.exam_date || ''),
                    duration: Number(s.duration || 180),
                  }));
                }
              } catch (e) {
                console.error('Failed to parse subjects:', e);
              }
            }
          }

          console.log('📚 ExamDetails: Final normalized subjects:', normalizedSubjects);
          console.log('📚 ExamDetails: Final subjects count:', normalizedSubjects.length);
          console.log('📚 ExamDetails: About to set formData with subjects:', normalizedSubjects);

          const newFormData = {
            examId: exam.examId,
            examName: exam.examName,
            examType: exam.examType,
            academicYear: exam.academicYear,
            classId: exam.classId,
            term: exam.term,
            startDate: formatDateForInput(exam.startDate),
            endDate: formatDateForInput(exam.endDate),
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            subjects: normalizedSubjects,
            status: exam.status,
          };

          console.log('📚 ExamDetails: New formData to be set:', newFormData);
          console.log('📚 ExamDetails: Subjects in newFormData:', newFormData.subjects);
          console.log('📚 ExamDetails: Subjects count in newFormData:', newFormData.subjects.length);

          setFormData(newFormData);

          // Log immediately after setting
          console.log('📚 ExamDetails: FormData set successfully');
          console.log('📚 ExamDetails: Subjects in formData after set:', newFormData.subjects);
          console.log('📚 ExamDetails: Subjects count after set:', newFormData.subjects.length);
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load exam details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, examId]);

  // Calculate total marks whenever subjects change
  useEffect(() => {
    console.log('📊 ExamDetails: Calculating total marks, current subjects:', formData.subjects);
    console.log('📊 ExamDetails: Subjects count:', formData.subjects.length);

    // Only calculate if we have subjects
    if (formData.subjects && formData.subjects.length > 0) {
      const total = formData.subjects.reduce((sum, subject) => sum + (subject.maxMarks || 0), 0);
      console.log('📊 ExamDetails: Calculated total:', total);
      // Update totalMarks without affecting subjects
      setFormData(prev => ({ ...prev, totalMarks: total }));
    } else {
      console.log('📊 ExamDetails: No subjects, setting totalMarks to 0');
      setFormData(prev => ({ ...prev, totalMarks: 0 }));
    }
  }, [formData.subjects.length, formData.subjects.map(s => `${s.subjectId}-${s.maxMarks}`).join(',')]); // More precise dependencies

  // Load available subjects
  useEffect(() => {
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const subjects = await subjectsService.getAll({});
        setAvailableSubjects(subjects);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, []);

  // Load available classes (for dropdown + sample data)
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const classes = await classesService.getAll({ status: 'Active' });
        // Ensure SelectItem values are never empty
        setAvailableClasses(classes.filter((c) => Boolean(c.classId)));
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  // Load available academic years from database
  useEffect(() => {
    const loadAcademicYears = async () => {
      setLoadingAcademicYears(true);
      try {
        const academicYears = await academicYearsService.getAll({});
        // Extract academicYearId values and sort them (newest first)
        const yearIds = academicYears
          .map(ay => ay.academicYearId)
          .filter(id => Boolean(id))
          .sort((a, b) => {
            // Sort by year (extract first year from "2024-2025" format)
            const yearA = parseInt(a.split('-')[0]);
            const yearB = parseInt(b.split('-')[0]);
            return yearB - yearA; // Descending order (newest first)
          });
        setAvailableAcademicYears(yearIds);
      } catch (err: any) {
        console.error('Failed to load academic years:', err);
        // Fallback to empty array or default years if needed
        setAvailableAcademicYears([]);
      } finally {
        setLoadingAcademicYears(false);
      }
    };

    loadAcademicYears();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.classId) {
        throw new Error('Please select a class');
      }

      // Validate that the class exists
      try {
        const dbClasses = await classesService.getAll({});
        const classExists = dbClasses.some(c => c.classId === formData.classId);
        if (!classExists) {
          throw new Error(`Class ID "${formData.classId}" does not exist. Please select a valid class from the dropdown.`);
        }
      } catch (classError: any) {
        throw new Error(`Failed to validate class: ${classError.message}`);
      }

      if (formData.subjects.length === 0) {
        throw new Error('Please add at least one subject to the exam');
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      // Validate subjects before submission
      const validSubjects = formData.subjects.filter(s =>
        s.subjectId &&
        s.subjectCode &&
        s.subjectName &&
        s.maxMarks > 0
      );

      if (validSubjects.length === 0) {
        throw new Error('Please add at least one valid subject with all required fields (Subject Code, Name, and Max Marks)');
      }

      console.log('📝 ExamDetails: Submitting exam with subjects:', JSON.stringify(formData.subjects, null, 2));
      console.log('📝 ExamDetails: Valid subjects count:', validSubjects.length);
      console.log('📝 ExamDetails: Full formData:', JSON.stringify(formData, null, 2));

      if (mode === 'create') {
        const createdExam = await examsService.create({
          ...formData,
          subjects: validSubjects, // Use validated subjects
        });
        console.log('✅ ExamDetails: Created exam:', createdExam);
        console.log('✅ ExamDetails: Created exam subjects:', createdExam.subjects);
        toast.success('Exam created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        const updatedExam = await examsService.update(formData.examId, {
          ...formData,
          subjects: validSubjects, // Use validated subjects
        });
        console.log('✅ ExamDetails: Updated exam:', updatedExam);
        console.log('✅ ExamDetails: Updated exam subjects:', updatedExam.subjects);
        toast.success('Exam updated successfully!');
        setIsEditing(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const addSubject = () => {
    const newSubject: ExamSubject = {
      subjectId: `SUB${formData.subjects.length + 1}`,
      subjectName: '',
      subjectCode: '',
      maxMarks: 100,
      passingMarks: 40,
      examDate: formData.startDate,
      duration: 180, // 3 hours in minutes
    };
    setFormData({
      ...formData,
      subjects: [...formData.subjects, newSubject],
    });
  };

  const removeSubject = (index: number) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const updateSubject = (index: number, field: keyof ExamSubject, value: any) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      subjects: updatedSubjects,
    });
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

    try {
      // Load actual classes from database (and sync dropdown options)
      const dbClasses = (await classesService.getAll({ status: 'Active' })).filter((c) => Boolean(c.classId));
      setAvailableClasses(dbClasses);

      if (dbClasses.length === 0) {
        toast.error('No classes available. Please create a class first.');
        return;
      }

      // Ensure we have subjects loaded (and avoid SelectItem empty values)
      const subjectsFromDb = availableSubjects.length > 0 ? availableSubjects : await subjectsService.getAll({});
      const activeSubjectsWithCode = (subjectsFromDb || []).filter(
        (s) => s.status === 'Active' && typeof s.subjectCode === 'string' && s.subjectCode.trim().length > 0,
      );
      if (activeSubjectsWithCode.length === 0) {
        toast.error('No active subjects with a valid Subject Code found. Please create subjects (with codes) first.');
        return;
      }

      const newId = await generateExamId();
      const examNames = [
        'Mid-Term Examination',
        'Final Examination',
        'Unit Test - Chapter 1-5',
        'Quarterly Assessment',
        'Periodic Test',
        'Pre-Board Examination',
        'Annual Examination',
      ];
      const examTypes: Array<'Mid-Term' | 'Final' | 'Unit Test' | 'Quarterly' | 'PT'> = ['Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'PT'];
      const terms: Array<'Term 1' | 'Term 2'> = ['Term 1', 'Term 2'];

      // Use available academic years from database, fallback to default if none loaded
      const academicYearsToUse = availableAcademicYears.length > 0
        ? availableAcademicYears
        : ['2023-2024', '2024-2025', '2025-2026'];

      const randomExamName = examNames[Math.floor(Math.random() * examNames.length)];
      const randomExamType = examTypes[Math.floor(Math.random() * examTypes.length)];
      const randomTerm = terms[Math.floor(Math.random() * terms.length)];
      const randomAcademicYear = academicYearsToUse[Math.floor(Math.random() * academicYearsToUse.length)];

      // Use actual class from database
      const randomClass = dbClasses[Math.floor(Math.random() * dbClasses.length)];
      const selectedClassId = randomClass.classId;

      // Generate dates (start date: today + 7 days, end date: start date + 5 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);

      // Get available subjects for the selected class
      const classSubjects = activeSubjectsWithCode.filter((s) => s.classId === selectedClassId);

      // If no subjects for this class, use any available subjects
      const subjectsToUse = classSubjects.length > 0 ? classSubjects : activeSubjectsWithCode;

      const iso = (d: Date) => d.toISOString().split('T')[0];
      const addDays = (d: Date, days: number) => {
        const copy = new Date(d);
        copy.setDate(copy.getDate() + days);
        return copy;
      };

      const sampleSubjects: ExamSubject[] = subjectsToUse
        .slice(0, Math.min(5, subjectsToUse.length))
        .map((subject, index) => {
          const examDay = addDays(startDate, index); // spread across days
          const safeExamDate = examDay > endDate ? endDate : examDay;
          return {
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode, // guaranteed non-empty
            maxMarks: [100, 80, 90, 100, 75][index] || 100,
            passingMarks: [40, 32, 36, 40, 30][index] || 40,
            examDate: iso(safeExamDate),
            duration: [180, 120, 150, 180, 90][index] || 180,
          };
        });

      const totalMarks = sampleSubjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);

      setFormData({
        examId: newId,
        examName: randomExamName,
        examType: randomExamType,
        academicYear: randomAcademicYear,
        classId: selectedClassId,
        term: randomTerm,
        startDate: iso(startDate),
        endDate: iso(endDate),
        totalMarks,
        // Keep this within 0..100 to match the current UI constraints
        passingMarks: 40,
        subjects: sampleSubjects,
        status: 'Scheduled',
      });

      toast.success('Sample data filled! Review and submit when ready.');
    } catch (error: any) {
      console.error('Error filling sample data:', error);
      toast.error(`Failed to fill sample data: ${error.message}`);
    }
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Exam' : mode === 'edit' ? 'Edit Exam' : 'Exam Details';
  const pageSubtitle = mode === 'create'
    ? 'Schedule a new exam with subjects'
    : mode === 'edit'
      ? 'Update exam information'
      : 'View exam information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  const examTypes: Array<'Mid-Term' | 'Final' | 'Unit Test' | 'Quarterly' | 'PT'> = ['Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'PT'];
  const terms: Array<'Term 1' | 'Term 2'> = ['Term 1', 'Term 2'];
  const statuses: Array<'Scheduled' | 'Ongoing' | 'Completed'> = ['Scheduled', 'Ongoing', 'Completed'];
  // Use academic years from database (fallback to empty array if not loaded yet)
  const academicYears = availableAcademicYears.length > 0 ? availableAcademicYears : [];

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
                Edit Exam
              </>
            )}
          </Button>
        )}
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-5xl">
          <CardHeader>
            <CardTitle>Exam Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                {/* Exam ID */}
                <div className="space-y-2">
                  <Label htmlFor="examId">
                    Exam ID <span className="text-red-500">*</span>
                  </Label>
                  {mode === 'create' ? (
                    <div className="flex gap-2">
                      <Input
                        id="examId"
                        value={formData.examId}
                        onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                        required
                        placeholder="Auto-generated"
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newId = await generateExamId();
                          setFormData({ ...formData, examId: newId });
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="examId"
                      value={formData.examId}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  )}
                </div>

                {/* Exam Name */}
                <div className="space-y-2">
                  <Label htmlFor="examName">
                    Exam Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="examName"
                    value={formData.examName}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    disabled={isReadOnly}
                    required
                    placeholder="e.g., Mid-Term Examination 2024"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Exam Type */}
                <div className="space-y-2">
                  <Label htmlFor="examType">
                    Exam Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.examType}
                    onValueChange={(value) => setFormData({ ...formData, examType: value as any })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'PT' ? 'PT (Periodic Test)' : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">
                    Academic Year <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAcademicYears ? (
                        <SelectItem value="loading" disabled>Loading academic years...</SelectItem>
                      ) : academicYears.length === 0 ? (
                        <SelectItem value="no-years" disabled>No academic years available</SelectItem>
                      ) : (
                        academicYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    Class <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingClasses ? (
                        <SelectItem value="__loading__" disabled>
                          Loading classes...
                        </SelectItem>
                      ) : availableClasses.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        availableClasses.map((cls) => (
                          <SelectItem key={cls.classId} value={cls.classId}>
                            {cls.name} ({cls.classId})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.classId && (
                    <button
                      onClick={() => {
                        pushNavigation('exams', examId);
                        navigateToRecord('classes', formData.classId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Class Details →
                    </button>
                  )}
                </div>

                {/* Term */}
                <div className="space-y-2">
                  <Label htmlFor="term">
                    Term <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) => setFormData({ ...formData, term: value as any })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {/* Passing Marks */}
                <div className="space-y-2">
                  <Label htmlFor="passingMarks">
                    Passing Marks (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="passingMarks"
                    type="number"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 0 })}
                    disabled={isReadOnly}
                    required
                    min="0"
                    max="100"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Total Marks (Calculated) */}
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">
                    Total Marks (Calculated)
                  </Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    disabled
                    className="bg-gray-100 font-semibold"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Section */}
        <Card className="max-w-5xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subjects ({formData.subjects.length})</CardTitle>
              {!isReadOnly && (
                <Button type="button" variant="outline" onClick={addSubject} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              console.log('🎨 ExamDetails: Rendering subjects section');
              console.log('🎨 ExamDetails: formData.subjects:', formData.subjects);
              console.log('🎨 ExamDetails: formData.subjects.length:', formData.subjects.length);
              console.log('🎨 ExamDetails: formData.subjects is array:', Array.isArray(formData.subjects));

              if (formData.subjects.length === 0) {
                console.log('🎨 ExamDetails: Rendering "No subjects" message');
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p>No subjects added yet</p>
                    {!isReadOnly && (
                      <p className="text-sm mt-1">Click "Add Subject" to add subjects to this exam</p>
                    )}
                  </div>
                );
              }

              console.log('🎨 ExamDetails: Rendering subjects list');
              return formData.subjects.map((subject, index) => {
                console.log(`🎨 ExamDetails: Rendering subject ${index + 1}:`, subject);
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Subject {index + 1}</h4>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Subject Code - Dropdown */}
                      <div className="space-y-2">
                        <Label>
                          Subject Code <span className="text-red-500">*</span>
                        </Label>
                        {isReadOnly ? (
                          <Input
                            value={subject.subjectCode}
                            disabled
                            className="bg-white"
                          />
                        ) : (
                          <Select
                            value={subject.subjectCode}
                            onValueChange={(value) => {
                              // Find the selected subject from available subjects
                              const selectedSubject = availableSubjects.find(s => s.subjectCode === value);
                              if (selectedSubject) {
                                // Update both subject code and name
                                const updatedSubjects = [...formData.subjects];
                                updatedSubjects[index] = {
                                  ...updatedSubjects[index],
                                  subjectCode: selectedSubject.subjectCode,
                                  subjectName: selectedSubject.subjectName,
                                  subjectId: selectedSubject.subjectId,
                                };
                                setFormData({
                                  ...formData,
                                  subjects: updatedSubjects,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject code" />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingSubjects ? (
                                <SelectItem value="loading" disabled>
                                  Loading subjects...
                                </SelectItem>
                              ) : availableSubjects.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No subjects available
                                </SelectItem>
                              ) : (
                                availableSubjects
                                  .filter((s) => s.status === 'Active' && typeof s.subjectCode === 'string' && s.subjectCode.trim().length > 0)
                                  .map((subj) => (
                                    <SelectItem key={subj.subjectId} value={subj.subjectCode}>
                                      {subj.subjectCode} - {subj.subjectName}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Subject Name - Auto-populated */}
                      <div className="space-y-2">
                        <Label>
                          Subject Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={subject.subjectName}
                          disabled
                          placeholder="Auto-populated"
                          className="bg-gray-100 text-gray-700"
                        />
                        {isReadOnly && subject.subjectId && (
                          <button
                            onClick={() => {
                              pushNavigation('exams', examId);
                              navigateToRecord('subjects', subject.subjectId);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                          >
                            View Subject →
                          </button>
                        )}
                      </div>

                      {/* Max Marks */}
                      <div className="space-y-2">
                        <Label>
                          Max Marks <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={subject.maxMarks}
                          onChange={(e) => updateSubject(index, 'maxMarks', parseInt(e.target.value) || 0)}
                          disabled={isReadOnly}
                          required
                          min="0"
                          className={isReadOnly ? 'bg-white' : ''}
                        />
                      </div>

                      {/* Passing Marks */}
                      <div className="space-y-2">
                        <Label>
                          Passing Marks <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={subject.passingMarks}
                          onChange={(e) => updateSubject(index, 'passingMarks', parseInt(e.target.value) || 0)}
                          disabled={isReadOnly}
                          required
                          min="0"
                          max={subject.maxMarks}
                          className={isReadOnly ? 'bg-white' : ''}
                        />
                      </div>

                      {/* Exam Date */}
                      <div className="space-y-2">
                        <Label>
                          Exam Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={subject.examDate}
                          onChange={(e) => updateSubject(index, 'examDate', e.target.value)}
                          disabled={isReadOnly}
                          required
                          className={isReadOnly ? 'bg-white' : ''}
                        />
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label>
                          Duration (minutes) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={subject.duration}
                          onChange={(e) => updateSubject(index, 'duration', parseInt(e.target.value) || 0)}
                          disabled={isReadOnly}
                          required
                          min="0"
                          placeholder="180"
                          className={isReadOnly ? 'bg-white' : ''}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex gap-3 max-w-5xl">
            {/* {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                onClick={fillSampleData}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Fill Sample Data
              </Button>
            )} */}
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {mode === 'create' ? 'Create Exam' : 'Save Changes'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
              Cancel
            </Button>
          </div>
        )}
      </form>

      {/* Attachments - only for existing exams (edit/view) */}
      {/* {mode !== 'create' && formData.examId && (
        <FileAttachments
          entityType="exam"
          entityId={formData.examId}
          readOnly={mode === 'view' && !isEditing}
          title="Exam Documents"
        />
      )} */}
    </div>
  );
}