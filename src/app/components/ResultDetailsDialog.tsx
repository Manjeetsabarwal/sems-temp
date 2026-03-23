import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Plus, Trash2, Award, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import type { Result, SubjectResult, Student, Exam, ClassExtended } from '../types';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

interface Props {
  mode: 'create' | 'edit' | 'view';
  resultId?: string;
  onClose: () => void;
  onSave: () => void;
}

export function ResultDetailsDialog({ mode, resultId, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);

  // Form data
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

  const isViewMode = mode === 'view';

  // Fetch students, exams, and classes on mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch result if editing or viewing
  useEffect(() => {
    if (resultId && (mode === 'edit' || mode === 'view')) {
      fetchResult();
    } else if (mode === 'create') {
      // Generate new result ID
      const newId = `RES${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ ...prev, resultId: newId }));
    }
  }, [resultId, mode]);

  const fetchDropdownData = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch(`${API_BASE}/api/students`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch exams
      const examsRes = await fetch(`${API_BASE}/api/exams`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
      }

      // Fetch classes
      const classesRes = await fetch(`${API_BASE}/api/classes`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/kv/results/${resultId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) throw new Error('Failed to fetch result');

      const data = await response.json();
      setFormData(data);
    } catch (error: any) {
      console.error('Error fetching result:', error);
      toast.error(error.message || 'Failed to load result');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
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

      const url =
        mode === 'create'
          ? `${API_BASE}/api/kv/results`
          : `${API_BASE}/api/kv/results/${resultId}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save result');
      }

      toast.success(`Result ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onSave();
    } catch (error: any) {
      console.error('Error saving result:', error);
      toast.error(error.message || 'Failed to save result');
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
      return { ...prev, subjects };
    });
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate totals
  const totalMarksObtained = formData.subjects?.reduce((sum, s) => sum + (s.marksObtained || 0), 0) || 0;
  const totalMaxMarks = formData.subjects?.reduce((sum, s) => sum + (s.maxMarks || 0), 0) || 0;
  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Award className="w-6 h-6 text-blue-600" />
            {mode === 'create' ? 'Create New Result' : mode === 'edit' ? 'Edit Result' : 'View Result'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Enter the details of the new result.'
              : mode === 'edit'
              ? 'Modify the details of the existing result.'
              : 'View the details of the result.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Result ID *</Label>
              <Input
                value={formData.resultId || ''}
                onChange={(e) => setFormData({ ...formData, resultId: e.target.value })}
                disabled={mode !== 'create' || isViewMode}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Draft' | 'Published') =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
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
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.studentId} value={student.studentId}>
                      {student.studentId} - {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Student Name *</Label>
              <Input
                value={formData.studentName || ''}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                disabled={isViewMode}
                placeholder="Auto-filled from selection"
              />
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
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.examId} value={exam.examId}>
                      {exam.examId} - {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exam Name *</Label>
              <Input
                value={formData.examName || ''}
                onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                disabled={isViewMode}
                placeholder="Auto-filled from selection"
              />
            </div>

            <div>
              <Label>Class ID *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value: string) => {
                  setFormData({ ...formData, classId: value });
                }}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.classId} value={cls.classId}>
                      {cls.classId} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rank (Optional)</Label>
              <Input
                type="number"
                value={formData.rank || ''}
                onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || null })}
                disabled={isViewMode}
                placeholder="Leave empty for auto-calculation"
              />
            </div>
          </div>

          {/* Subjects Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Subject-wise Marks
              </h3>
              {!isViewMode && (
                <Button onClick={handleAddSubject} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {formData.subjects?.map((subject, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded border">
                  <div className="col-span-3">
                    <Label className="text-xs">Subject ID</Label>
                    <Input
                      value={subject.subjectId}
                      onChange={(e) => handleSubjectChange(index, 'subjectId', e.target.value)}
                      disabled={isViewMode}
                      placeholder="e.g., MATH"
                      size="sm"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs">Subject Name</Label>
                    <Input
                      value={subject.subjectName}
                      onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                      disabled={isViewMode}
                      placeholder="e.g., Mathematics"
                      size="sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Marks Obtained</Label>
                    <Input
                      type="number"
                      value={subject.marksObtained}
                      onChange={(e) =>
                        handleSubjectChange(index, 'marksObtained', parseInt(e.target.value) || 0)
                      }
                      disabled={isViewMode}
                      size="sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Max Marks</Label>
                    <Input
                      type="number"
                      value={subject.maxMarks}
                      onChange={(e) =>
                        handleSubjectChange(index, 'maxMarks', parseInt(e.target.value) || 0)
                      }
                      disabled={isViewMode}
                      size="sm"
                    />
                  </div>

                  <div className="col-span-1">
                    {!isViewMode && (
                      <Button
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
                  {!isViewMode && (
                    <Button onClick={handleAddSubject} size="sm" variant="outline" className="mt-3">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subject
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calculated Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-900">Calculated Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total Marks</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalMarksObtained}/{totalMaxMarks}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Percentage</p>
                <p className="text-2xl font-bold text-blue-900">{percentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Grade (Auto)</p>
                <p className="text-2xl font-bold text-blue-900">
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
              <div>
                <p className="text-sm text-blue-700">Result</p>
                <p
                  className={`text-2xl font-bold ${
                    percentage >= 40 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {percentage >= 40 ? 'Pass' : 'Fail'}
                </p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label>Remarks (Optional)</Label>
            <Textarea
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              disabled={isViewMode}
              placeholder="Add any additional remarks or comments..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                `${mode === 'create' ? 'Create' : 'Update'} Result`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}