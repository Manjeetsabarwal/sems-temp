import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Plus, Trash2, BarChart3, Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import type { Result, SubjectResult, Student, Exam, ClassExtended } from '../../types';
import { resultsService } from '../../services/results.service';
import { studentsService } from '../../services/students.service';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';
import { subjectsService } from '../../services/subjects.service';
import { marksService } from '../../services/marks.service';
import { useApp } from '../../context/AppContext';

interface ResultDetailsProps {
  mode: 'create' | 'edit' | 'view';
  resultId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ResultDetails({ mode, resultId, onBack, onSuccess }: ResultDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();

  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };

  const [formData, setFormData] = useState<Partial<Result>>({
    resultId: '',
    studentId: '',
    studentName: '',
    examId: '',
    examName: '',
    classId: '',
    subjects: [],
    status: 'Draft',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Dropdown data
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Auto-generate Result ID for new results
  const generateResultId = () => {
    return `RES${Date.now().toString().slice(-6)}`;
  };

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Load result data
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        // Auto-generate result ID
        const newId = generateResultId();
        setFormData(prev => ({ ...prev, resultId: newId }));
      } else if (resultId) {
        setLoading(true);
        try {
          const data = await resultsService.getById(resultId);
          setFormData(data);
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load result details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, resultId]);

  const fetchDropdownData = async () => {
    try {
      // Fetch students from NestJS
      const studentsData = await studentsService.getAll();
      setStudents(studentsData);
      console.log('Loaded students:', studentsData.length);

      // Fetch exams from NestJS
      const examsData = await examsService.getAll();
      setExams(examsData);
      console.log('Loaded exams:', examsData.length);

      // Fetch classes from NestJS
      const classesData = await classesService.getAll();
      setClasses(classesData);
      console.log('Loaded classes:', classesData.length);

      // Fetch subjects from NestJS
      const subjectsData = await subjectsService.getAll();
      setSubjects(subjectsData);
      console.log('Loaded subjects:', subjectsData.length);

      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.studentId || !formData.examId || !formData.classId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.subjects || formData.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    setSaving(true);

    try {
      // Calculate totals
      const totalMarksObtained = formData.subjects?.reduce((sum, s) => sum + (s.marksObtained || 0), 0) || 0;
      const totalMaxMarks = formData.subjects?.reduce((sum, s) => sum + (s.maxMarks || 0), 0) || 0;
      const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';
      const isPassed = percentage >= 40;

      const resultPayload = {
        ...formData,
        totalMarksObtained,
        totalMaxMarks,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        isPassed,
      } as any;

      if (mode === 'create') {
        await resultsService.create(resultPayload);
      } else {
        await resultsService.update(resultId!, resultPayload);
      }

      toast.success(`Result ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      if (mode === 'edit' || (mode === 'view' && isEditing)) {
        setIsEditing(false);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...(prev.subjects || []),
        {
          subjectId: '',
          subjectName: '',
          marksObtained: 0,
          maxMarks: 100,
          grade: '',
          isPassed: false,
        },
      ],
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubjectChange = (index: number, field: keyof SubjectResult, value: any) => {
    setFormData((prev) => {
      const subjects = [...(prev.subjects || [])];
      subjects[index] = { ...subjects[index], [field]: value };

      // Auto-fetch marks when subject is selected (if student and exam are already selected)
      if (field === 'subjectId' && value && prev.studentId && prev.examId) {
        fetchMarksForSubject(index, prev.studentId, prev.examId, value);
      }

      return { ...prev, subjects };
    });
  };

  // Fetch marks for a specific subject
  const fetchMarksForSubject = async (index: number, studentId: string, examId: string, subjectId: string) => {
    try {
      const marks = await marksService.getAll({
        studentId,
        examId,
        subjectId,
      });

      if (marks && marks.length > 0) {
        const mark = marks[0]; // Get the first matching mark
        setFormData((prev) => {
          const subjects = [...(prev.subjects || [])];
          subjects[index] = {
            ...subjects[index],
            marksObtained: mark.marksObtained || 0,
            maxMarks: mark.totalMarks || subjects[index].maxMarks || 100,
            grade: mark.grade || '',
            percentage: mark.percentage || 0,
            isPassed: (mark.percentage || 0) >= 40,
          };
          return { ...prev, subjects };
        });
        toast.success(`Marks fetched: ${mark.marksObtained}/${mark.totalMarks}`);
      } else {
        toast.info('No marks found for this student, exam, and subject combination');
      }
    } catch (error: any) {
      console.error('Error fetching marks:', error);
      toast.error('Failed to fetch marks: ' + (error.message || 'Unknown error'));
    }
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

    const newId = generateResultId();

    // Get random student, exam, and class
    const randomStudent = students.length > 0 ? students[Math.floor(Math.random() * students.length)] : null;
    const randomExam = exams.length > 0 ? exams[Math.floor(Math.random() * exams.length)] : null;
    const randomClass = classes.length > 0 ? classes[Math.floor(Math.random() * classes.length)] : null;

    if (!randomStudent || !randomExam || !randomClass) {
      toast.error('Please ensure students, exams, and classes are available');
      return;
    }

    // Get subjects for the selected class
    const classSubjects = subjects.filter(s =>
      (s.classId || s.class_id) === (randomClass.classId || randomClass.class_id)
    ).slice(0, 5);

    // Generate sample subject results
    const sampleSubjects: SubjectResult[] = classSubjects.map((subject, index) => {
      const marksObtained = [85, 92, 78, 88, 95][index] || 80;
      const maxMarks = 100;
      const percentage = (marksObtained / maxMarks) * 100;

      return {
        subjectId: subject.subjectId || subject.subject_id || '',
        subjectName: subject.subjectName || subject.subject_name || '',
        subjectCode: subject.subjectCode || subject.subject_code || '',
        marksObtained,
        maxMarks,
        percentage,
        grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D',
        isPassed: percentage >= 40,
      };
    });

    const totalMarks = sampleSubjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const totalMaxMarks = sampleSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const overallPercentage = (totalMarks / totalMaxMarks) * 100;

    setFormData({
      resultId: newId,
      studentId: randomStudent.studentId,
      studentName: randomStudent.name,
      examId: randomExam.examId,
      examName: randomExam.examName || '',
      classId: randomClass.classId || randomClass.class_id || '',
      subjects: sampleSubjects,
      status: 'Draft',
      remarks: 'Good performance overall. Keep up the excellent work!',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Result' : mode === 'edit' ? 'Edit Result' : 'Result Details';
  const pageSubtitle = mode === 'create'
    ? 'Enter the details of the new result.'
    : mode === 'edit'
      ? 'Modify the details of the existing result.'
      : 'View the details of the result.';

  // Calculate totals
  const totalMarksObtained = formData.subjects?.reduce((sum, s) => sum + (s.marksObtained || 0), 0) || 0;
  const totalMaxMarks = formData.subjects?.reduce((sum, s) => sum + (s.maxMarks || 0), 0) || 0;
  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result details...</p>
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
              Back to Results
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
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
                <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Result' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Result ID *</Label>
                  <Input
                    value={formData.resultId || ''}
                    onChange={(e) => setFormData({ ...formData, resultId: e.target.value })}
                    disabled={mode !== 'create' || isReadOnly}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'Draft' | 'Published') =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="status-draft" value="Draft">Draft</SelectItem>
                      <SelectItem key="status-published" value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Student ID *</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value: string) => {
                      const selectedStudent = students.find(s => s.studentId === value);
                      setFormData({
                        ...formData,
                        studentId: value,
                        studentName: selectedStudent?.name || ''
                      });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length === 0 ? (
                        <SelectItem key="no-students" value="no-students" disabled>
                          No students available
                        </SelectItem>
                      ) : (
                        students.map((student, idx) => (
                          <SelectItem key={student.studentId || `student-idx-${idx}`} value={student.studentId}>
                            {student.studentId} - {student.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Student Name *</Label>
                  <Input
                    value={formData.studentName || ''}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Auto-filled from selection"
                    className="mt-1"
                  />
                  {isReadOnly && formData.studentId && (
                    <button
                      onClick={() => {
                        pushNavigation('results', resultId);
                        navigateToRecord('students', formData.studentId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Student Details →
                    </button>
                  )}
                </div>

                <div>
                  <Label>Exam ID *</Label>
                  <Select
                    value={formData.examId}
                    onValueChange={(value: string) => {
                      const selectedExam = exams.find(e => e.examId === value);
                      setFormData({
                        ...formData,
                        examId: value,
                        examName: selectedExam?.examName || ''
                      });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.length === 0 ? (
                        <SelectItem key="no-exams" value="no-exams" disabled>
                          No exams available
                        </SelectItem>
                      ) : (
                        exams.map((exam, idx) => (
                          <SelectItem key={exam.examId || `exam-idx-${idx}`} value={exam.examId}>
                            {exam.examId} - {exam.examName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Exam Name *</Label>
                  <Input
                    value={formData.examName || ''}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Auto-filled from selection"
                    className="mt-1"
                  />
                  {isReadOnly && formData.examId && (
                    <button
                      onClick={() => {
                        pushNavigation('results', resultId);
                        navigateToRecord('exams', formData.examId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Exam Details →
                    </button>
                  )}
                </div>

                <div>
                  <Label>Class ID *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value: string) => {
                      setFormData({ ...formData, classId: value });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem key="no-classes" value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((cls, idx) => (
                          <SelectItem key={cls.classId || `class-idx-${idx}`} value={cls.classId}>
                            {cls.classId} - {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.classId && (
                    <button
                      onClick={() => {
                        pushNavigation('results', resultId);
                        navigateToRecord('classes', formData.classId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Class Details →
                    </button>
                  )}
                </div>

                <div>
                  <Label>Rank (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.rank || ''}
                    onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || undefined })}
                    disabled={isReadOnly}
                    placeholder="Leave empty for auto-calculation"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject-wise Marks Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Subject-wise Marks
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!isReadOnly && formData.studentId && formData.examId && formData.subjects && formData.subjects.length > 0 && (
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!formData.studentId || !formData.examId) {
                          toast.error('Please select Student and Exam first');
                          return;
                        }
                        for (let i = 0; i < formData.subjects!.length; i++) {
                          const subject = formData.subjects![i];
                          if (subject.subjectId) {
                            await fetchMarksForSubject(i, formData.studentId, formData.examId, subject.subjectId);
                            // Small delay to avoid overwhelming the API
                            await new Promise(resolve => setTimeout(resolve, 200));
                          }
                        }
                        toast.success('Finished fetching marks for all subjects');
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Fetch All Marks
                    </Button>
                  )}
                  {!isReadOnly && (
                    <Button type="button" onClick={handleAddSubject} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subject
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.subjects?.map((subject, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded border">
                    <div className="col-span-3">
                      <Label className="text-xs">Subject ID</Label>
                      <Select
                        value={subject.subjectId}
                        onValueChange={(value: string) => {
                          const selectedSubject = subjects.find(s => s.subjectId === value);
                          if (selectedSubject) {
                            handleSubjectChange(index, 'subjectId', selectedSubject.subjectId);
                            handleSubjectChange(index, 'subjectName', selectedSubject.subjectName);
                            handleSubjectChange(index, 'maxMarks', selectedSubject.maxMarks || 100);
                          } else {
                            handleSubjectChange(index, 'subjectId', value);
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select or type" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.length === 0 ? (
                            <SelectItem key="no-subjects" value="no-subjects" disabled>
                              No subjects available
                            </SelectItem>
                          ) : (
                            subjects.map((subj, idx) => (
                              <SelectItem key={subj.subjectId || `subject-idx-${idx}`} value={subj.subjectId}>
                                {subj.subjectId} - {subj.subjectName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Subject Name</Label>
                      <Input
                        value={subject.subjectName}
                        onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Auto-filled from selection"
                        className="mt-1"
                      />
                      {isReadOnly && subject.subjectId && (
                        <button
                          onClick={() => {
                            pushNavigation('results', resultId);
                            navigateToRecord('subjects', subject.subjectId);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                        >
                          View Subject →
                        </button>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Marks Obtained</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          value={subject.marksObtained}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Allow empty, numbers, and decimals (including partial like "85.")
                            if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                              const numValue = parseFloat(inputValue) || 0;
                              handleSubjectChange(index, 'marksObtained', numValue);
                            }
                          }}
                          onBlur={(e) => {
                            // Validate and format on blur
                            const value = parseFloat(e.target.value) || 0;
                            handleSubjectChange(index, 'marksObtained', value >= 0 ? value : 0);
                          }}
                          disabled={isReadOnly}
                          className="flex-1"
                          step="0.01"
                          min="0"
                        />
                        {!isReadOnly && formData.studentId && formData.examId && subject.subjectId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchMarksForSubject(index, formData.studentId!, formData.examId!, subject.subjectId)}
                            className="shrink-0"
                            title="Fetch marks from Marks module"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Max Marks</Label>
                      <Input
                        type="number"
                        value={subject.maxMarks}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty, numbers, and decimals (including partial like "100.")
                          if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                            const numValue = parseFloat(inputValue) || 0;
                            handleSubjectChange(index, 'maxMarks', numValue);
                          }
                        }}
                        onBlur={(e) => {
                          // Validate and format on blur
                          const value = parseFloat(e.target.value) || 0;
                          handleSubjectChange(index, 'maxMarks', value > 0 ? value : 100);
                        }}
                        disabled={isReadOnly}
                        className="mt-1"
                        step="0.01"
                        min="1"
                      />
                    </div>

                    <div className="col-span-2">
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubject(index)}
                          className="text-red-600 w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {(!formData.subjects || formData.subjects.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No subjects added yet</p>
                    {!isReadOnly && (
                      <Button type="button" onClick={handleAddSubject} size="sm" variant="outline" className="mt-3">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Subject
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calculated Summary Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Calculated Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-blue-700 mb-1">Total Marks</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-900 break-words">
                    {Number(totalMarksObtained).toFixed(2)}/{Number(totalMaxMarks).toFixed(2)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-blue-700 mb-1">Percentage</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-900">
                    {percentage.toFixed(2)}%
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-blue-700 mb-1">Grade (Auto)</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-900">
                    {percentage >= 90
                      ? 'A+'
                      : percentage >= 80
                        ? 'A'
                        : percentage >= 70
                          ? 'B+'
                          : percentage >= 60
                            ? 'B'
                            : percentage >= 50
                              ? 'C'
                              : percentage >= 40
                                ? 'D'
                                : 'F'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-blue-700 mb-1">Result</p>
                  <p
                    className={`text-xl md:text-2xl font-bold ${percentage >= 40 ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {percentage >= 40 ? 'Pass' : 'Fail'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks Card */}
          <Card>
            <CardHeader>
              <CardTitle>Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={isReadOnly}
                placeholder="Add any additional remarks or comments..."
                rows={3}
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
