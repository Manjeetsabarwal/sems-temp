import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Calendar, Clock, MapPin, User, BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import type { TimetableEntry, Exam, ClassExtended, Subject } from '../../types';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';
import { subjectsService } from '../../services/subjects.service';
import { useApp } from '../../context/AppContext';

// Local storage key for timetable entries (since backend module doesn't exist yet)
const TIMETABLE_STORAGE_KEY = 'school_exam_timetable_entries';

interface TimetableDetailsProps {
  mode: 'create' | 'edit' | 'view';
  timetableId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function TimetableDetails({ mode, timetableId, onBack, onSuccess }: TimetableDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    timetableId: '',
    examId: '',
    examName: '',
    classId: '',
    className: '',
    subjectId: '',
    subjectName: '',
    subjectCode: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 0,
    room: '',
    invigilator: '',
    maxMarks: 100,
    instructions: '',
    status: 'Scheduled',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Dropdown data
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Auto-generate Timetable ID for new entries
  const generateTimetableId = () => {
    return `TT${Date.now().toString().slice(-6)}`;
  };

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Helper functions for local storage timetable management
  const getTimetableEntries = (): TimetableEntry[] => {
    try {
      const stored = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveTimetableEntry = (entry: TimetableEntry) => {
    const entries = getTimetableEntries();
    const existingIndex = entries.findIndex(e => e.timetableId === entry.timetableId);
    if (existingIndex >= 0) {
      entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      entries.push({ ...entry, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(entries));
    return entry;
  };

  // Load timetable data - wait for dropdown data to be loaded first
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        const newId = generateTimetableId();
        setFormData((prev) => ({ ...prev, timetableId: newId }));
        setLoadingData(false);
      } else if (timetableId) {
        // Wait for dropdown data to be loaded first
        if (loadingData) {
          return; // Wait for dropdown data
        }
        
        setLoading(true);
        setError(null);
        try {
          const entries = getTimetableEntries();
          console.log('Loading timetable entry:', timetableId);
          console.log('Available entries:', entries.map(e => ({ id: e.timetableId, exam: e.examName, class: e.className, subject: e.subjectName })));
          const entry = entries.find(e => e.timetableId === timetableId);
          if (entry) {
            console.log('Found entry:', entry);
            
            // Ensure all fields are populated with proper defaults
            const loadedData: Partial<TimetableEntry> = {
              timetableId: entry.timetableId || '',
              examId: entry.examId || '',
              examName: entry.examName || '',
              classId: entry.classId || '',
              className: entry.className || '',
              subjectId: entry.subjectId || '',
              subjectName: entry.subjectName || '',
              subjectCode: entry.subjectCode || '',
              date: entry.date || '',
              startTime: entry.startTime || '',
              endTime: entry.endTime || '',
              duration: entry.duration || 0,
              room: entry.room || '',
              invigilator: entry.invigilator || '',
              maxMarks: entry.maxMarks || 100,
              instructions: entry.instructions || '',
              status: entry.status || 'Scheduled',
            };
            
            // If names are missing, try to populate them from dropdown data
            if (!loadedData.examName && loadedData.examId) {
              const exam = exams.find(e => e.examId === loadedData.examId);
              if (exam) {
                loadedData.examName = exam.examName || '';
              }
            }
            
            if (!loadedData.className && loadedData.classId) {
              const cls = classes.find(c => c.classId === loadedData.classId);
              if (cls) {
                loadedData.className = cls.name || '';
              }
            }
            
            if (!loadedData.subjectName && loadedData.subjectId) {
              const subj = subjects.find(s => s.subjectId === loadedData.subjectId);
              if (subj) {
                loadedData.subjectName = subj.subjectName || '';
                loadedData.subjectCode = subj.subjectCode || '';
              }
            }
            
            console.log('Setting form data:', loadedData);
            setFormData(loadedData);
          } else {
            const errorMsg = `Timetable entry with ID "${timetableId}" not found. Available IDs: ${entries.map(e => e.timetableId).join(', ') || 'none'}`;
            console.error(errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
          }
        } catch (err: any) {
          setError(err.message);
          toast.error(`Failed to load timetable entry: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, timetableId, loadingData, exams, classes, subjects]);

  const fetchDropdownData = async () => {
    try {
      const [examsData, classesData, subjectsData] = await Promise.all([
        examsService.getAll({}),
        classesService.getAll({ status: 'Active' }),
        subjectsService.getAll({ status: 'Active' }),
      ]);

      setExams(examsData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
      setLoadingData(false);
    }
  };

  // Calculate duration when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.split(':');
      const end = formData.endTime.split(':');
      const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
      const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
      const duration = endMinutes - startMinutes;

      if (duration > 0) {
        setFormData((prev) => ({ ...prev, duration }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !formData.examId ||
      !formData.classId ||
      !formData.subjectId ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Ensure all names are populated from dropdowns if missing
      const exam = exams.find(e => e.examId === formData.examId);
      const cls = classes.find(c => c.classId === formData.classId);
      const subj = subjects.find(s => s.subjectId === formData.subjectId);
      
      const entryToSave: TimetableEntry = {
        timetableId: formData.timetableId || generateTimetableId(),
        examId: formData.examId || '',
        examName: formData.examName || exam?.examName || '',
        classId: formData.classId || '',
        className: formData.className || cls?.name || '',
        subjectId: formData.subjectId || '',
        subjectName: formData.subjectName || subj?.subjectName || '',
        subjectCode: formData.subjectCode || subj?.subjectCode || '',
        date: formData.date || '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        duration: formData.duration || 0,
        room: formData.room || '',
        invigilator: formData.invigilator || '',
        maxMarks: formData.maxMarks || 100,
        instructions: formData.instructions || '',
        status: formData.status || 'Scheduled',
      };
      
      console.log('Saving timetable entry:', entryToSave);
      
      // Save to local storage (since backend timetable module doesn't exist yet)
      saveTimetableEntry(entryToSave);

      toast.success(`Timetable entry ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      if (mode === 'edit' || (mode === 'view' && isEditing)) {
        setIsEditing(false);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save timetable entry');
    } finally {
      setSaving(false);
    }
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

    // Reload data if not loaded yet
    if (exams.length === 0 || classes.length === 0 || subjects.length === 0) {
      toast.info('Loading data, please wait...');
      try {
        const [examsData, classesData, subjectsData] = await Promise.all([
          examsService.getAll({}),
          classesService.getAll({ status: 'Active' }),
          subjectsService.getAll({ status: 'Active' }),
        ]);
        setExams(examsData);
        setClasses(classesData);
        setSubjects(subjectsData);

        // Use freshly loaded data
        if (examsData.length === 0 || classesData.length === 0 || subjectsData.length === 0) {
          toast.error('Please ensure exams, classes, and subjects are available in the system');
          return;
        }

        // Continue with the freshly loaded data
        generateSampleWithData(examsData, classesData, subjectsData);
      } catch (error: any) {
        toast.error(`Failed to load data: ${error.message}`);
        return;
      }
    } else {
      generateSampleWithData(exams, classes, subjects);
    }
  };

  const generateSampleWithData = (
    examsData: Exam[],
    classesData: ClassExtended[],
    subjectsData: Subject[]
  ) => {
    const newId = generateTimetableId();
    
    // Get random exam, class, and subject
    const randomExam = examsData[Math.floor(Math.random() * examsData.length)];
    const randomClass = classesData[Math.floor(Math.random() * classesData.length)];
    
    // Try to find a subject with a valid subjectCode
    const validSubjects = subjectsData.filter(s => s.subjectCode && s.subjectCode.trim() !== '');
    const randomSubject = validSubjects.length > 0 
      ? validSubjects[Math.floor(Math.random() * validSubjects.length)]
      : subjectsData[Math.floor(Math.random() * subjectsData.length)];

    // Generate date (7 days from now)
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 7);
    
    // Generate random time slots
    const timeSlots = [
      { start: '09:00', end: '12:00', duration: 180 },
      { start: '10:00', end: '13:00', duration: 180 },
      { start: '14:00', end: '17:00', duration: 180 },
      { start: '09:30', end: '12:30', duration: 180 },
    ];
    const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    // Random room numbers
    const rooms = ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Room 301', 'Lab A', 'Lab B'];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];

    // Random invigilators
    const invigilators = ['Dr. Smith', 'Prof. Johnson', 'Ms. Williams', 'Mr. Brown', 'Dr. Davis'];
    const randomInvigilator = invigilators[Math.floor(Math.random() * invigilators.length)];

    setFormData({
      timetableId: newId,
      examId: randomExam.examId,
      examName: randomExam.examName || '',
      classId: randomClass.classId,
      className: randomClass.name || '',
      subjectId: randomSubject.subjectId,
      subjectName: randomSubject.subjectName || '',
      subjectCode: randomSubject.subjectCode || '',
      date: examDate.toISOString().split('T')[0],
      startTime: randomSlot.start,
      endTime: randomSlot.end,
      duration: randomSlot.duration,
      room: randomRoom,
      invigilator: randomInvigilator,
      maxMarks: 100,
      instructions: 'Please bring your own calculator and writing materials. Mobile phones are not allowed.',
      status: 'Scheduled',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const isReadOnly = !isEditing;
  const pageTitle =
    mode === 'create'
      ? 'Create Timetable Entry'
      : mode === 'edit'
      ? 'Edit Timetable Entry'
      : 'Timetable Entry Details';
  const pageSubtitle =
    mode === 'create'
      ? 'Schedule a new exam session'
      : mode === 'edit'
      ? 'Modify the timetable entry'
      : 'View timetable entry information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetable entry...</p>
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
              Back
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
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timetable ID *</Label>
                  <Input
                    value={formData.timetableId || ''}
                    onChange={(e) => setFormData({ ...formData, timetableId: e.target.value })}
                    disabled={mode !== 'create' || isReadOnly}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled') =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="status-scheduled" value="Scheduled">Scheduled</SelectItem>
                      <SelectItem key="status-ongoing" value="Ongoing">Ongoing</SelectItem>
                      <SelectItem key="status-completed" value="Completed">Completed</SelectItem>
                      <SelectItem key="status-cancelled" value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Exam *</Label>
                  <Select
                    value={formData.examId}
                    onValueChange={(value: string) => {
                      const selectedExam = exams.find((e) => e.examId === value);
                      setFormData({
                        ...formData,
                        examId: value,
                        examName: selectedExam?.examName || '',
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
                            {exam.examName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.examId && (
                    <button
                      onClick={() => {
                        pushNavigation('timetable', timetableId);
                        navigateToRecord('exams', formData.examId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Exam Details →
                    </button>
                  )}
                </div>

                <div>
                  <Label>Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value: string) => {
                      const selectedClass = classes.find((c) => c.classId === value);
                      setFormData({
                        ...formData,
                        classId: value,
                        className: selectedClass?.name || '',
                      });
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
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.classId && (
                    <button
                      onClick={() => {
                        pushNavigation('timetable', timetableId);
                        navigateToRecord('classes', formData.classId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Class Details →
                    </button>
                  )}
                </div>

                <div className="col-span-2">
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value: string) => {
                      const selectedSubject = subjects.find((s) => s.subjectId === value);
                      setFormData({
                        ...formData,
                        subjectId: value,
                        subjectName: selectedSubject?.subjectName || '',
                        subjectCode: selectedSubject?.subjectCode || '',
                      });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.length === 0 ? (
                        <SelectItem key="no-subjects" value="no-subjects" disabled>
                          No subjects available
                        </SelectItem>
                      ) : (
                        subjects.map((subject, idx) => (
                          <SelectItem
                            key={subject.subjectId || `subject-idx-${idx}`}
                            value={subject.subjectId}
                          >
                            {subject.subjectName} ({subject.subjectCode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.subjectId && (
                    <button
                      onClick={() => {
                        pushNavigation('timetable', timetableId);
                        navigateToRecord('subjects', formData.subjectId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Subject Details →
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Schedule Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={isReadOnly}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                    }
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>

                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    disabled={isReadOnly}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    disabled={isReadOnly}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Room/Venue</Label>
                  <Input
                    value={formData.room || ''}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="e.g., Room 101"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Invigilator</Label>
                  <Input
                    value={formData.invigilator || ''}
                    onChange={(e) => setFormData({ ...formData, invigilator: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Teacher name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Maximum Marks</Label>
                  <Input
                    type="number"
                    value={formData.maxMarks || 100}
                    onChange={(e) =>
                      setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 100 })
                    }
                    disabled={isReadOnly}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Enter exam instructions or special notes..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
