import React, { useState, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Copy, Download, Upload, FileSpreadsheet, RefreshCw, Award, Database, TrendingUp, File, FileJson } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Mark, Student, Exam, Subject } from '../../types';
import { marksService, calculateGrade } from '../../services/marks.service';
import { studentsService } from '../../services/students.service';
import { examsService } from '../../services/exams.service';
import { subjectsService } from '../../services/subjects.service';
import { validationService } from '../../services/validation.service';
import { toast } from 'sonner';
import { AutoDatabaseSetup } from '../AutoDatabaseSetup';
import { DatabaseSchemaFix } from '../DatabaseSchemaFix';
import { SyncProgressDialog } from '../SyncProgressDialog';
import { databaseCheckerService } from '../../services/database-checker.service';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type SortField = 'markId' | 'studentName' | 'examName' | 'subjectName' | 'percentage' | 'grade' | 'status';
type SortOrder = 'asc' | 'desc';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const STATUSES = ['Draft', 'Published'] as const;

export default function MarksAPI() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [filteredMarks, setFilteredMarks] = useState<Mark[]>([]);
  const [selectedMark, setSelectedMark] = useState<Mark | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showSchemaFix, setShowSchemaFix] = useState(false);

  // Sync Progress Dialog
  const [syncProgress, setSyncProgress] = useState({
    isOpen: false,
    progress: 0,
    current: 0,
    total: 0,
    currentStudent: '',
    isComplete: false,
    success: false,
    syncedCount: 0,
    errorCount: 0,
  });

  // Reference data
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('markId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  React.useEffect(() => {
    checkDatabaseAndLoad();
  }, []);

  const checkDatabaseAndLoad = async () => {
    try {
      const dbStatus = await databaseCheckerService.checkDatabase();
      
      if (!dbStatus.allTablesReady) {
        setShowSchemaFix(true);
        return;
      }

      loadAllData();
    } catch (error) {
      console.error('Error checking database:', error);
      loadAllData(); // Try to load anyway
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load reference data FIRST (needed to enrich marks)
      const [studentsData, examsData, subjectsData] = await Promise.all([
        studentsService.getAll(), // Direct database read
        examsService.getAll(),
        subjectsService.getAll(),
      ]);
      
      console.log('📚 Loaded Students from Database (Direct):', studentsData.length, 'students');
      console.log('📋 Student IDs:', studentsData.map(s => s.studentId));
      console.log('📝 Sample student:', studentsData[0]);
      
      setStudents(studentsData);
      setExams(examsData);
      setSubjects(subjectsData);
      
      // Then load marks (which will be enriched with names)
      const marksData = await marksService.getAll();
      
      // Enrich marks with names from reference data (since DB doesn't store them)
      const enrichedMarks = marksData.map(mark => {
        const student = studentsData.find(s => s.studentId === mark.studentId);
        const exam = examsData.find(e => e.examId === mark.examId);
        const subject = subjectsData.find(s => s.subjectId === mark.subjectId);
        
        return {
          ...mark,
          studentName: student?.name || mark.studentName,
          examName: exam?.examName || mark.examName,
          subjectName: subject?.subjectName || mark.subjectName,
          subjectCode: subject?.subjectCode || mark.subjectCode,
          classId: student?.classId || mark.classId,
        };
      });
      
      setMarks(enrichedMarks);
      setFilteredMarks(enrichedMarks);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarks = async () => {
    try {
      const data = await marksService.getAll();
      
      // Enrich marks with names from reference data (since DB doesn't store them)
      // Only enrich if reference data is already loaded
      const enrichedData = students.length > 0 || exams.length > 0 || subjects.length > 0
        ? data.map(mark => {
            const student = students.find(s => s.studentId === mark.studentId);
            const exam = exams.find(e => e.examId === mark.examId);
            const subject = subjects.find(s => s.subjectId === mark.subjectId);
            
            return {
              ...mark,
              studentName: student?.name || mark.studentName,
              examName: exam?.examName || mark.examName,
              subjectName: subject?.subjectName || mark.subjectName,
              subjectCode: subject?.subjectCode || mark.subjectCode,
              classId: student?.classId || mark.classId,
            };
          })
        : data;
      
      setMarks(enrichedData);
      setFilteredMarks(enrichedData);
    } catch (error: any) {
      console.error('Error loading marks:', error);
      toast.error('Failed to load marks: ' + error.message);
      setMarks([]);
      setFilteredMarks([]);
    }
  };

  // Apply filters and search
  React.useEffect(() => {
    let result = [...marks];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (m) =>
          m.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.markId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Student filter
    if (studentFilter) {
      result = result.filter((m) => m.studentId === studentFilter);
    }

    // Exam filter
    if (examFilter) {
      result = result.filter((m) => m.examId === examFilter);
    }

    // Subject filter
    if (subjectFilter) {
      result = result.filter((m) => m.subjectId === subjectFilter);
    }

    // Class filter
    if (classFilter) {
      result = result.filter((m) => m.classId === classFilter);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    setFilteredMarks(result);
  }, [marks, searchQuery, studentFilter, examFilter, subjectFilter, classFilter, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const handleCreate = () => {
    setSelectedMark(null);
    setViewMode('create');
  };

  const handleEdit = (mark: Mark) => {
    setSelectedMark(mark);
    setViewMode('edit');
  };

  const handleView = (mark: Mark) => {
    setSelectedMark(mark);
    setViewMode('view');
  };

  const handleDelete = async (markId: string) => {
    if (!confirm('Are you sure you want to delete this mark entry?')) return;

    try {
      await marksService.delete(markId);
      toast.success('Mark deleted successfully');
      loadMarks();
    } catch (error: any) {
      toast.error('Failed to delete mark: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No marks selected');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} mark(s)?`
      )
    )
      return;

    try {
      await marksService.bulkDelete(Array.from(selectedIds));
      toast.success(`${selectedIds.size} mark(s) deleted successfully`);
      setSelectedIds(new Set());
      loadMarks();
    } catch (error: any) {
      toast.error('Failed to delete marks: ' + error.message);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMarks.map((m) => m.markId)));
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Mark ID',
      'Student ID',
      'Student Name',
      'Exam ID',
      'Exam Name',
      'Subject ID',
      'Subject Name',
      'Class',
      'Marks Obtained',
      'Total Marks',
      'Percentage',
      'Grade',
      'Remarks',
      'Status',
    ];
    const rows = filteredMarks.map((m) => [
      m.markId,
      m.studentId,
      m.studentName || '',
      m.examId,
      m.examName || '',
      m.subjectId,
      m.subjectName || '',
      m.classId,
      m.marksObtained,
      m.totalMarks,
      m.percentage || '',
      m.grade || '',
      m.remarks || '',
      m.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported ' + filteredMarks.length + ' marks to CSV');
  };

  const exportToJSON = () => {
    const json = JSON.stringify(filteredMarks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Exported ' + filteredMarks.length + ' marks to JSON');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());

        let imported = 0;
        let errors = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map((v) => v.trim());
          const mark: Omit<Mark, 'createdAt' | 'updatedAt'> = {
            markId: values[0] || `MRK${Date.now()}_${i}`,
            studentId: values[1] || '',
            studentName: values[2] || undefined,
            examId: values[3] || '',
            examName: values[4] || undefined,
            subjectId: values[5] || '',
            subjectName: values[6] || undefined,
            subjectCode: values[7] || undefined,
            classId: values[8] || '',
            marksObtained: parseFloat(values[9]) || 0,
            totalMarks: parseFloat(values[10]) || 100,
            remarks: values[13] || undefined,
            status: (values[14] as 'Draft' | 'Published') || 'Draft',
          };

          try {
            await marksService.create(mark);
            imported++;
          } catch (error) {
            console.error('Error importing mark:', error);
            errors++;
          }
        }

        toast.success(
          `Imported ${imported} marks` +
            (errors > 0 ? `, ${errors} errors` : '')
        );
        loadMarks();
      } catch (error: any) {
        toast.error('Failed to import CSV: ' + error.message);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const refresh = () => {
    loadAllData();
    toast.success('Data refreshed');
  };

  // Get grade badge color
  const getGradeBadgeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Show database setup guide
  if (showSetupGuide) {
    return (
      <AutoDatabaseSetup onComplete={() => {
        setShowSetupGuide(false);
        loadAllData();
      }} />
    );
  }

  // Show schema fix screen
  if (showSchemaFix) {
    return (
      <DatabaseSchemaFix 
        onComplete={() => {
          setShowSchemaFix(false);
          loadAllData();
        }}
        onShowFullSetup={() => {
          setShowSchemaFix(false);
          setShowSetupGuide(true);
        }}
      />
    );
  }

  // CREATE VIEW
  if (viewMode === 'create') {
    // Check if we have required data to create marks
    if (students.length === 0 || exams.length === 0 || subjects.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto py-8 px-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add New Marks
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Missing Required Data
                    </h3>
                    <p className="text-sm text-yellow-800 mb-4">
                      Before you can add marks, you need to have the following data in the system:
                    </p>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      {students.length === 0 && (
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                          <span><strong>Students:</strong> Please add at least one student</span>
                        </li>
                      )}
                      {exams.length === 0 && (
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                          <span><strong>Exams:</strong> Please add at least one exam</span>
                        </li>
                      )}
                      {subjects.length === 0 && (
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                          <span><strong>Subjects:</strong> Please add at least one subject</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setViewMode('list')} className="flex-1">
                  Back to List
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <MarkForm
        mode="create"
        existingMarks={marks}
        students={students}
        exams={exams}
        subjects={subjects}
        onSave={async (mark) => {
          try {
            console.log('📝 onSave called with mark:', mark);
            console.log('📊 Available students in form:', students.map(s => s.studentId));
            console.log('🎯 Selected student ID:', mark.studentId);
            console.log('✅ Student exists in form data?', students.find(s => s.studentId === mark.studentId) ? 'YES' : 'NO');
            
            const result = await marksService.create(mark);
            console.log('✅ Mark created successfully:', result);
            toast.success('Mark created successfully');
            setViewMode('list');
            await loadMarks();
          } catch (error: any) {
            console.error('❌ Error in onSave:', error);
            toast.error('Failed to create mark: ' + error.message);
            throw error; // Re-throw to be caught by the form's error handler
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // EDIT VIEW
  if (viewMode === 'edit' && selectedMark) {
    return (
      <MarkForm
        mode="edit"
        mark={selectedMark}
        students={students}
        exams={exams}
        subjects={subjects}
        onSave={async (updates) => {
          try {
            await marksService.update(selectedMark.markId, updates);
            toast.success('Mark updated successfully');
            setViewMode('list');
            loadMarks();
          } catch (error: any) {
            toast.error('Failed to update mark: ' + error.message);
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // VIEW DETAILS
  if (viewMode === 'view' && selectedMark) {
    return (
      <MarkDetails
        mark={selectedMark}
        onEdit={() => setViewMode('edit')}
        onClose={() => setViewMode('list')}
        onDelete={async () => {
          await handleDelete(selectedMark.markId);
          setViewMode('list');
        }}
      />
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Marks & Evaluation</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                α
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage marks with live database ({marks.length} entries)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => setShowSetupGuide(true)}
            >
              <Database className="w-4 h-4" />
              Database Setup
            </Button>
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Marks
            </Button>
          </div>
        </div>

        {/* Marks Management Action Bar - Excel-like grouped partitions */}
        <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Group 1: Database Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Database</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-2 h-8"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Group 2: Import/Export Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</span>
              {marks.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="gap-2 h-8"
                  >
                    <File className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToJSON}
                    className="gap-2 h-8"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 h-8"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </div>

            {/* Group 3: Filter Actions */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search marks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.name}
                  </option>
                ))}
              </select>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.examName}
                  </option>
                ))}
              </select>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Classes</option>
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar - Sticky */}
      {selectedIds.size > 0 && (
        <div className="sticky top-[190px] z-10 bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredMarks.length && filteredMarks.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-purple-900">
                {selectedIds.size} mark(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredMarks.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No marks found</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Mark Entry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredMarks.length &&
                        filteredMarks.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('markId')}
                  >
                    <div className="flex items-center gap-2">
                      Mark ID
                      <SortIcon field="markId" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('studentName')}
                  >
                    <div className="flex items-center gap-2">
                      Student
                      <SortIcon field="studentName" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('examName')}
                  >
                    <div className="flex items-center gap-2">
                      Exam
                      <SortIcon field="examName" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subjectName')}
                  >
                    <div className="flex items-center gap-2">
                      Subject
                      <SortIcon field="subjectName" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('percentage')}
                  >
                    <div className="flex items-center gap-2">
                      %
                      <SortIcon field="percentage" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('grade')}
                  >
                    <div className="flex items-center gap-2">
                      Grade
                      <SortIcon field="grade" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMarks.map((mark) => (
                  <tr
                    key={mark.markId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(mark.markId)}
                        onChange={() => toggleSelection(mark.markId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(mark)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          {mark.markId}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(mark.markId);
                          }}
                          className="text-gray-400 hover:text-gray-600 bg-transparent border-none p-0 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleView(mark)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {mark.studentName || mark.studentId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleView(mark)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {mark.examName || mark.examId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleView(mark)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {mark.subjectName || mark.subjectId}
                        {mark.subjectCode && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({mark.subjectCode})
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {mark.marksObtained}/{mark.totalMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {mark.percentage?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={getGradeBadgeColor(mark.grade)}
                      >
                        {mark.grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={mark.status === 'Published' ? 'default' : 'secondary'}
                        className={
                          mark.status === 'Published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {mark.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(mark)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mark)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mark.markId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {filteredMarks.length} of {marks.length} marks
      </div>

      {/* Sync Progress Dialog */}
      <SyncProgressDialog
        isOpen={syncProgress.isOpen}
        progress={syncProgress.progress}
        current={syncProgress.current}
        total={syncProgress.total}
        currentStudent={syncProgress.currentStudent}
        isComplete={syncProgress.isComplete}
        success={syncProgress.success}
        syncedCount={syncProgress.syncedCount}
        errorCount={syncProgress.errorCount}
        onClose={() => setSyncProgress({ ...syncProgress, isOpen: false })}
      />
    </div>
  );
}

// MARK FORM COMPONENT
interface MarkFormProps {
  mode: 'create' | 'edit';
  mark?: Mark;
  existingMarks?: Mark[];
  students: Student[];
  exams: Exam[];
  subjects: Subject[];
  onSave: (mark: Omit<Mark, 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function MarkForm({ mode, mark, existingMarks, students, exams, subjects, onSave, onCancel }: MarkFormProps) {
  // Debug: Log mark data when editing
  if (mode === 'edit' && mark) {
    console.log('mark data on edit:', mark);
    console.log('internalMarks:', mark.internalMarks, 'externalMarks:', mark.externalMarks);
  }
  
  // Helper function to determine initial template mode
  const getInitialTemplateMode = (): 'template1' | 'template2' | 'template3' => {
    if (!mark || mode === 'create') return 'template1';
    const exam = exams.find(e => e.examId === mark.examId);
    if (!exam || (exam.examType !== 'Final' && exam.examType !== 'Mid-Term')) return 'template1';
    const hasBreakdown =
      Number(mark.unitTestMarks || 0) > 0 ||
      Number(mark.assignmentMarks || 0) > 0 ||
      Number(mark.attendanceMarks || 0) > 0;
    const hasTemplate3 = mark.internalMarks != null && mark.externalMarks != null && !hasBreakdown;
    return hasTemplate3 ? 'template3' : hasBreakdown ? 'template2' : 'template1';
  };

  // Generate the next sequential mark ID
  const generateMarkId = (): string => {
    if (!existingMarks || existingMarks.length === 0) {
      return 'MRK001';
    }

    const existingNumbers = existingMarks
      .map(m => {
        const match = m.markId.match(/^MRK(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `MRK${String(maxNum + 1).padStart(3, '0')}`;
  };

  console.log('📥 MarksAPI Form Init - mark prop:', {
    markId: mark?.markId,
    internalMarks: mark?.internalMarks,
    externalMarks: mark?.externalMarks,
    marksObtained: mark?.marksObtained,
    mode,
  });

  const [formData, setFormData] = useState({
    markId: mark?.markId || (mode === 'create' ? generateMarkId() : ''),
    studentId: mark?.studentId || '',
    examId: mark?.examId || '',
    subjectId: mark?.subjectId || '',
    marksObtained: mark?.marksObtained?.toString() || '',
    totalMarks: mark?.totalMarks?.toString() || '100',
    remarks: mark?.remarks || '',
    status: mark?.status || 'Draft',
    // V2: Internal/External Marks Breakdown
    marksType: mark?.marksType || 'Final',
    unitTestMarks: mark?.unitTestMarks?.toString() || '',
    assignmentMarks: mark?.assignmentMarks?.toString() || '',
    attendanceMarks: mark?.attendanceMarks?.toString() || '',
    externalMarks: mark?.externalMarks?.toString() || '',
    internalMarks: mark?.internalMarks?.toString() || '',
  });

  // Auto-populate student/exam/subject details
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Detect exam type for V2 breakdown
  const isUnitTest = selectedExam?.examType === 'Unit Test';
  const isFinalExam = selectedExam?.examType === 'Final' || selectedExam?.examType === 'Mid-Term';

  React.useEffect(() => {
    if (formData.studentId) {
      const student = students.find(s => s.studentId === formData.studentId);
      setSelectedStudent(student || null);
    }
  }, [formData.studentId, students]);

  React.useEffect(() => {
    if (formData.examId) {
      const exam = exams.find(e => e.examId === formData.examId);
      setSelectedExam(exam || null);
      
      // If editing and exam type is Final, populate V2 fields if they exist
      if (mark && exam && (exam.examType === 'Final' || exam.examType === 'Mid-Term')) {
        // Detect template mode: if internalMarks and externalMarks are set but no breakdown, it's Template 3
        const hasBreakdown =
          Number(mark.unitTestMarks || 0) > 0 ||
          Number(mark.assignmentMarks || 0) > 0 ||
          Number(mark.attendanceMarks || 0) > 0;
        const hasTemplate3 = mark.internalMarks !== undefined && mark.externalMarks !== undefined && !hasBreakdown;
        
        if (hasTemplate3) {
          setTemplateMode('template3');
        } else if (hasBreakdown) {
          setTemplateMode('template2');
        }
        
        if (hasBreakdown || hasTemplate3) {
          setFormData(prev => ({
            ...prev,
            unitTestMarks: mark.unitTestMarks?.toString() || prev.unitTestMarks,
            assignmentMarks: mark.assignmentMarks?.toString() || prev.assignmentMarks,
            attendanceMarks: mark.attendanceMarks?.toString() || prev.attendanceMarks,
            externalMarks: mark.externalMarks?.toString() || prev.externalMarks,
            internalMarks: mark.internalMarks?.toString() || prev.internalMarks,
            marksType: mark.marksType || 'Final',
          }));
        }
      }
    }
  }, [formData.examId, exams, mark]);

  React.useEffect(() => {
    if (formData.subjectId) {
      const subject = subjects.find(s => s.subjectId === formData.subjectId);
      setSelectedSubject(subject || null);
    }
  }, [formData.subjectId, subjects]);

  // Calculate percentage and grade in real-time
  const [calculatedPercentage, setCalculatedPercentage] = useState<number>(0);
  const [calculatedGrade, setCalculatedGrade] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalEntryMode, setExternalEntryMode] = useState<'scaled' | 'direct'>('scaled');
  const [templateMode, setTemplateMode] = useState<'template1' | 'template2' | 'template3'>(getInitialTemplateMode());

  // Calculate totals for V2 (Final Exam with breakdown or when V2 fields are used)
  React.useEffect(() => {
    // Check if V2 breakdown fields have values
    const unitTest = parseFloat(formData.unitTestMarks) || 0;
    const assignment = parseFloat(formData.assignmentMarks) || 0;
    const attendance = parseFloat(formData.attendanceMarks) || 0;
    const external = parseFloat(formData.externalMarks) || 0;
    const internal = parseFloat(formData.internalMarks) || 0; // For Template 3 Assessment
    const hasTemplate2Breakdown = unitTest > 0 || assignment > 0 || attendance > 0;
    
    if (isUnitTest) {
      // For unit tests, use original calculation
      const obtained = parseFloat(formData.marksObtained);
      const total = parseFloat(formData.totalMarks);
      
      if (!isNaN(obtained) && !isNaN(total) && total > 0) {
        const percentage = (obtained / total) * 100;
        const grade = calculateGrade(percentage);
        setCalculatedPercentage(percentage);
        setCalculatedGrade(grade);
      } else {
        setCalculatedPercentage(0);
        setCalculatedGrade('');
      }
    } else if (isFinalExam) {
      // Handle different templates for final exams
      if (templateMode === 'template3') {
        // Template 3: Assessment (internal) + Written (external)
        const assessment = internal;
        const written = external;
        const totalMarks = assessment + written;
        
        // Update form data with calculated totals
        setFormData(prev => ({
          ...prev,
          marksObtained: totalMarks.toFixed(2),
          totalMarks: '100',
        }));
        
        // Update calculated percentage and grade
        const percentage = totalMarks; // Already out of 100
        setCalculatedPercentage(percentage);
        setCalculatedGrade(calculateGrade(percentage));
      } else if (templateMode === 'template2' || hasTemplate2Breakdown) {
        // Template 2: PT/NB/SE/External breakdown
        const internalTotal = unitTest + assignment + attendance;
        const totalMarks = internalTotal + external;
        
        // Update form data with calculated totals
        if (totalMarks > 0 || hasTemplate2Breakdown || external > 0) {
          setFormData(prev => ({
            ...prev,
            internalMarks: internalTotal.toFixed(2),
            marksObtained: totalMarks.toFixed(2),
            totalMarks: '100',
          }));
          
          // Update calculated percentage and grade
          const percentage = totalMarks; // Already out of 100
          setCalculatedPercentage(percentage);
          setCalculatedGrade(calculateGrade(percentage));
        }
      } else {
        // Template 1: Simple marks entry
        const obtained = parseFloat(formData.marksObtained);
        const total = parseFloat(formData.totalMarks);
        
        if (!isNaN(obtained) && !isNaN(total) && total > 0) {
          const percentage = (obtained / total) * 100;
          const grade = calculateGrade(percentage);
          setCalculatedPercentage(percentage);
          setCalculatedGrade(grade);
        } else {
          setCalculatedPercentage(0);
          setCalculatedGrade('');
        }
      }
    } else {
      // For simple marks entry (when V2 fields are not used)
      const obtained = parseFloat(formData.marksObtained);
      const total = parseFloat(formData.totalMarks);
      
      if (!isNaN(obtained) && !isNaN(total) && total > 0) {
        const percentage = (obtained / total) * 100;
        const grade = calculateGrade(percentage);
        setCalculatedPercentage(percentage);
        setCalculatedGrade(grade);
      } else {
        setCalculatedPercentage(0);
        setCalculatedGrade('');
      }
    }
  }, [formData.marksObtained, formData.totalMarks, formData.unitTestMarks, formData.assignmentMarks, formData.attendanceMarks, formData.externalMarks, formData.internalMarks, isFinalExam, isUnitTest, templateMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submission
    
    console.log('Form submission started');
    console.log('Form data:', formData);

    // Validate
    if (!formData.studentId) {
      toast.error('Student is required');
      return;
    }
    if (!formData.examId) {
      toast.error('Exam is required');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Subject is required');
      return;
    }

    // Validation based on exam type
    let marksObtained: number;
    let totalMarks: number;

    if (isUnitTest) {
      // Unit Test: Simple entry (Template 1 & 3) - marks obtained out of 100
      // This maps to internalMarks field
      if (!formData.marksObtained.trim()) {
        toast.error('Marks obtained is required');
        return;
      }
      if (!formData.totalMarks.trim()) {
        toast.error('Total marks is required');
        return;
      }

      marksObtained = parseFloat(formData.marksObtained);
      totalMarks = parseFloat(formData.totalMarks);

      if (isNaN(marksObtained) || marksObtained < 0) {
        toast.error('Invalid marks obtained');
        return;
      }
      if (isNaN(totalMarks) || totalMarks <= 0) {
        toast.error('Invalid total marks');
        return;
      }
      if (marksObtained > totalMarks) {
        toast.error('Marks obtained cannot exceed total marks');
        return;
      }
      
      // For unit tests, ensure totalMarks is 100 (standard)
      if (totalMarks !== 100) {
        totalMarks = 100; // Standardize to 100
      }
    } else if (isFinalExam) {
      // Final Exam validation based on template mode
      if (templateMode === 'template1') {
        // Template 1: Simple marks entry
        if (!formData.marksObtained.trim()) {
          toast.error('Marks obtained is required');
          return;
        }
        if (!formData.totalMarks.trim()) {
          toast.error('Total marks is required');
          return;
        }

        marksObtained = parseFloat(formData.marksObtained);
        totalMarks = parseFloat(formData.totalMarks);

        if (isNaN(marksObtained) || marksObtained < 0) {
          toast.error('Invalid marks obtained');
          return;
        }
        if (isNaN(totalMarks) || totalMarks <= 0) {
          toast.error('Invalid total marks');
          return;
        }
        if (marksObtained > totalMarks) {
          toast.error('Marks obtained cannot exceed total marks');
          return;
        }
      } else if (templateMode === 'template3') {
        // Template 3: Assessment (20) + Written (80)
        const assessment = parseFloat(formData.internalMarks) || 0;
        const written = parseFloat(formData.externalMarks) || 0;

        if (assessment === 0 && written === 0) {
          toast.error('Please enter Assessment and Written marks');
          return;
        }

        if (assessment < 0 || assessment > 20) {
          toast.error('Assessment marks must be between 0 and 20');
          return;
        }
        if (written < 0 || written > 80) {
          toast.error('Written marks must be between 0 and 80');
          return;
        }

        marksObtained = assessment + written;
        totalMarks = 100;
      } else {
        // Template 2: PT/NB/SE/External breakdown
        const unitTest = parseFloat(formData.unitTestMarks) || 0;
        const assignment = parseFloat(formData.assignmentMarks) || 0;
        const attendance = parseFloat(formData.attendanceMarks) || 0;
        const external = parseFloat(formData.externalMarks) || 0;

        // Check if at least one V2 field is filled
        const hasV2Data = unitTest > 0 || assignment > 0 || attendance > 0 || external > 0;
        if (!hasV2Data) {
          toast.error('Please enter at least one mark in the breakdown (Unit Test, Assignment, Attendance, or External Marks)');
          return;
        }

        if (unitTest < 0 || unitTest > 10) {
          toast.error('Unit Test marks must be between 0 and 10');
          return;
        }
        if (assignment < 0 || assignment > 5) {
          toast.error('Assignment marks must be between 0 and 5');
          return;
        }
        if (attendance < 0 || attendance > 5) {
          toast.error('Attendance marks must be between 0 and 5');
          return;
        }
        if (external < 0 || external > 80) {
          toast.error('External marks must be between 0 and 80');
          return;
        }

        const internalTotal = unitTest + assignment + attendance;
        if (internalTotal > 20) {
          toast.error('Total internal marks cannot exceed 20');
          return;
        }

        marksObtained = internalTotal + external;
        totalMarks = 100;
      }
    } else {
      // No exam selected or other exam type - use V2 breakdown if fields are filled, otherwise allow simple entry
      const unitTest = parseFloat(formData.unitTestMarks) || 0;
      const assignment = parseFloat(formData.assignmentMarks) || 0;
      const attendance = parseFloat(formData.attendanceMarks) || 0;
      const external = parseFloat(formData.externalMarks) || 0;
      
      // Check if V2 breakdown fields have been filled
      const hasV2Data = unitTest > 0 || assignment > 0 || attendance > 0 || external > 0;
      
      if (hasV2Data) {
        // Validate V2 breakdown
        if (unitTest < 0 || unitTest > 10) {
          toast.error('Unit Test marks must be between 0 and 10');
          return;
        }
        if (assignment < 0 || assignment > 5) {
          toast.error('Assignment marks must be between 0 and 5');
          return;
        }
        if (attendance < 0 || attendance > 5) {
          toast.error('Attendance marks must be between 0 and 5');
          return;
        }
        if (external < 0 || external > 80) {
          toast.error('External marks must be between 0 and 80');
          return;
        }
        
        const internalTotal = unitTest + assignment + attendance;
        if (internalTotal > 20) {
          toast.error('Total internal marks cannot exceed 20');
          return;
        }
        
        marksObtained = internalTotal + external;
        totalMarks = 100;
      } else {
        // Fallback to simple marks entry if V2 fields are not used
        // Check if marksObtained was calculated from V2 fields (it should be auto-populated)
        const calculatedMarks = parseFloat(formData.marksObtained) || 0;
        if (calculatedMarks === 0 && !formData.marksObtained.trim()) {
          // If marksObtained is empty, check if V2 fields have any values
          const hasAnyV2Value = (parseFloat(formData.unitTestMarks) || 0) > 0 ||
                                (parseFloat(formData.assignmentMarks) || 0) > 0 ||
                                (parseFloat(formData.attendanceMarks) || 0) > 0 ||
                                (parseFloat(formData.externalMarks) || 0) > 0;
          
          if (hasAnyV2Value) {
            // V2 fields are filled but marksObtained wasn't calculated - calculate it now
            const unitTest = parseFloat(formData.unitTestMarks) || 0;
            const assignment = parseFloat(formData.assignmentMarks) || 0;
            const attendance = parseFloat(formData.attendanceMarks) || 0;
            const external = parseFloat(formData.externalMarks) || 0;
            const internalTotal = unitTest + assignment + attendance;
            marksObtained = internalTotal + external;
            totalMarks = 100;
          } else {
            toast.error('Please enter marks using the breakdown fields above (Unit Test, Assignment, Attendance, External Marks)');
            return;
          }
        } else {
          marksObtained = calculatedMarks;
          totalMarks = parseFloat(formData.totalMarks) || 100;
        }
        
        if (isNaN(marksObtained) || marksObtained < 0) {
          toast.error('Invalid marks obtained');
          return;
        }
      }
    }

    // Validate that selected IDs exist in the reference data
    if (!students.find(s => s.studentId === formData.studentId)) {
      toast.error(`Invalid student ID: ${formData.studentId}. Please select a valid student from the dropdown.`);
      return;
    }
    if (!exams.find(e => e.examId === formData.examId)) {
      toast.error(`Invalid exam ID: ${formData.examId}. Please select a valid exam from the dropdown.`);
      return;
    }
    if (!subjects.find(s => s.subjectId === formData.subjectId)) {
      toast.error(`Invalid subject ID: ${formData.subjectId}. Please select a valid subject from the dropdown.`);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Validation passed, checking database references...');

      // Validate that IDs actually exist in the database
      const dbValidation = await validationService.validateMarkReferences(
        formData.studentId,
        formData.examId,
        formData.subjectId
      );

      if (!dbValidation.valid) {
        console.error('❌ Database validation failed:', dbValidation.errors);
        
        // Get all IDs from database for debugging
        const [dbStudentIds, dbSubjectIds, dbExamIds] = await Promise.all([
          validationService.getAllStudentIds(),
          validationService.getAllSubjectIds(),
          validationService.getAllExamIds(),
        ]);
        
        console.log('📋 Student IDs in database:', dbStudentIds);
        console.log('📚 Subject IDs in database:', dbSubjectIds);
        console.log('📝 Exam IDs in database:', dbExamIds);
        console.log('🎯 Trying to use:', {
          studentId: formData.studentId,
          examId: formData.examId,
          subjectId: formData.subjectId,
        });
        console.log('🔍 Subject exists in list?', dbSubjectIds.includes(formData.subjectId));
        console.log('🔍 Subject exists in form subjects?', subjects.find(s => s.subjectId === formData.subjectId));
        
        toast.error(
          <div>
            <strong>Database Validation Failed:</strong>
            <ul className="list-disc pl-4 mt-2">
              {dbValidation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">Check console (F12) for debugging info.</p>
          </div>,
          { duration: 10000 }
        );
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Database validation passed, checking for duplicates...');

      // Check for duplicate (same student, exam, subject)
      if (mode === 'create') {
        const duplicate = await marksService.checkDuplicate(
          formData.studentId,
          formData.examId,
          formData.subjectId
        );
        console.log('Duplicate check result:', duplicate);
        if (duplicate) {
          toast.error('Mark entry already exists for this student, exam, and subject');
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate marks based on exam type
      let finalMarksObtained = marksObtained;
      let finalTotalMarks = totalMarks;

      // Use V2 breakdown if it's a Final exam or if V2 fields are filled
      const unitTest = parseFloat(formData.unitTestMarks) || 0;
      const assignment = parseFloat(formData.assignmentMarks) || 0;
      const attendance = parseFloat(formData.attendanceMarks) || 0;
      const external = parseFloat(formData.externalMarks) || 0;
      const hasV2Data = unitTest > 0 || assignment > 0 || attendance > 0 || external > 0;
      
      if (templateMode !== 'template3' && ((isFinalExam && !isUnitTest) || (!isUnitTest && hasV2Data))) {
        const internalTotal = unitTest + assignment + attendance;
        finalMarksObtained = internalTotal + external;
        finalTotalMarks = 100;
      } else if (templateMode === 'template3') {
        const assessment = parseFloat(formData.internalMarks) || 0;
        const written = parseFloat(formData.externalMarks) || 0;
        finalMarksObtained = assessment + written;
        finalTotalMarks = 100;
      }

      // Calculate percentage and grade (after template-specific calculations)
      const calculatedPercentage = finalTotalMarks > 0 ? (finalMarksObtained / finalTotalMarks) * 100 : 0;
      const calculatedGrade = calculateGrade(calculatedPercentage);

      // Prepare mark data with proper mapping based on exam type
      let finalInternalMarks: number | undefined;
      let finalExternalMarks: number | undefined;
      let finalUnitTestMarks: number | undefined;
      let finalAssignmentMarks: number | undefined;
      let finalAttendanceMarks: number | undefined;
      let finalMarksType: string = 'Final';

      if (isUnitTest) {
        // Unit Test (Template 1 & 3): Simple entry
        // Map marksObtained to internalMarks
        finalInternalMarks = finalMarksObtained; // Unit test marks go to internalMarks
        finalMarksType = 'Unit Test';
        // No breakdown fields for simple unit test entry
      } else if (isFinalExam) {
        if (templateMode === 'template1') {
          // Template 1: Simple marks entry (original format)
          finalMarksObtained = marksObtained;
          finalTotalMarks = totalMarks;
          finalMarksType = 'Final';
          // No breakdown fields for Template 1
        } else if (templateMode === 'template3') {
          // Template 3: Assessment (20) + Written (80)
          const assessment = parseFloat(formData.internalMarks) || 0;
          const written = parseFloat(formData.externalMarks) || 0;
          finalInternalMarks = assessment; // Assessment = internalMarks (20)
          finalExternalMarks = written; // Written = externalMarks (80)
          finalMarksType = 'Final';
        } else if (templateMode === 'template2') {
          // Template 2: PT/NB/SE/External breakdown
          finalUnitTestMarks = unitTest; // PT (10 marks) - will be calculated from unit test average
          finalAssignmentMarks = assignment; // NB (5 marks)
          finalAttendanceMarks = attendance; // SE (5 marks)
          finalExternalMarks = external; // Half Yearly/Annual (80 marks)
          finalInternalMarks = unitTest + assignment + attendance; // Total internal (20 marks)
          finalMarksType = 'Final';
        } else {
          // Template 1: Simple marks (fallback)
          finalMarksType = 'Final';
        }
      } else if (hasV2Data) {
        // Other exam types with V2 breakdown (fallback to Template 2)
        finalUnitTestMarks = unitTest;
        finalAssignmentMarks = assignment;
        finalAttendanceMarks = attendance;
        finalExternalMarks = external;
        finalInternalMarks = unitTest + assignment + attendance;
        finalMarksType = 'Final';
      }

      const markData: Omit<Mark, 'createdAt' | 'updatedAt'> = {
        markId: formData.markId || generateMarkId(),
        studentId: formData.studentId,
        studentName: selectedStudent?.name,
        examId: formData.examId,
        examName: selectedExam?.examName,
        subjectId: formData.subjectId,
        subjectName: selectedSubject?.subjectName,
        subjectCode: selectedSubject?.subjectCode,
        classId: selectedStudent?.classId || '',
        marksObtained: finalMarksObtained,
        totalMarks: finalTotalMarks,
        percentage: calculatedPercentage,
        grade: calculatedGrade,
        remarks: formData.remarks.trim() || undefined,
        status: formData.status as 'Draft' | 'Published',
        // Mapping based on exam type
        marksType: finalMarksType as any,
        unitTestMarks: finalUnitTestMarks,
        assignmentMarks: finalAssignmentMarks,
        attendanceMarks: finalAttendanceMarks,
        externalMarks: finalExternalMarks,
        internalMarks: finalInternalMarks, // Unit test marks map here for Template 1 & 3
      };
      console.log('📤 Template 3 Debug - Calling onSave with data:', {
        templateMode,
        internalMarks: markData.internalMarks,
        externalMarks: markData.externalMarks,
        marksObtained: markData.marksObtained,
        formDataInternalMarks: formData.internalMarks,
        formDataExternalMarks: formData.externalMarks,
      });
      await onSave(markData);
      console.log('✅ onSave completed successfully');
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      
      // Better error messages for common database errors
      if (error.message && error.message.includes('foreign key constraint')) {
        if (error.message.includes('studentid')) {
          toast.error(`Student ID "${formData.studentId}" does not exist in the database. Please select a valid student.`);
        } else if (error.message.includes('examid')) {
          toast.error(`Exam ID "${formData.examId}" does not exist in the database. Please select a valid exam.`);
        } else if (error.message.includes('subjectid')) {
          toast.error(`Subject ID "${formData.subjectId}" does not exist in the database. Please select a valid subject.`);
        } else {
          toast.error('Foreign key constraint violation. Please ensure all selected values exist in the database.');
        }
      } else {
        toast.error('Failed to save mark: ' + error.message);
      }
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'create' ? 'Add New Marks' : 'Edit Marks'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mark ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mark ID {mode === 'create' && '(auto-generated)'}
              </label>
              <input
                type="text"
                value={formData.markId}
                readOnly
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                placeholder="Auto-generated"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Student */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Student</option>
                  {(() => {
                    const filtered = students.filter(student => {
                      // Filter out invalid entries
                      if (!student.studentId || !student.name) return false;
                      // Filter out inactive/deleted students if status field exists
                      if (student.status && student.status !== 'Active') return false;
                      return true;
                    });
                    
                    console.log('🔍 Dropdown Filter Debug:');
                    console.log('  - Total students in state:', students.length);
                    console.log('  - Filtered students:', filtered.length);
                    console.log('  - First 3 filtered:', filtered.slice(0, 3));
                    console.log('  - All student IDs in state:', students.map(s => s.studentId));
                    
                    return filtered.map((student) => (
                      <option key={student.studentId} value={student.studentId}>
                        {student.name} | Class {student.classId} | Roll {student.rollNo} | ID: {student.studentId}
                      </option>
                    ));
                  })()}
                </select>
                {selectedStudent && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Class: {selectedStudent.classId} | Section: {selectedStudent.sectionId}</div>
                    <div>Roll No: {selectedStudent.rollNo}</div>
                  </div>
                )}
              </div>

              {/* Exam */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam *
                </label>
                <select
                  value={formData.examId}
                  onChange={(e) =>
                    setFormData({ ...formData, examId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Exam</option>
                  {exams
                    .filter(exam => {
                      // Filter out invalid entries
                      if (!exam.examId || !exam.examName) return false;
                      // Only show exams for the selected student's class
                      if (selectedStudent && exam.classId !== selectedStudent.classId) return false;
                      return true;
                    })
                    .map((exam) => (
                      <option key={exam.examId} value={exam.examId}>
                        {exam.examName} | {exam.examType} | Class {exam.classId} | ID: {exam.examId}
                      </option>
                    ))}
                </select>
                {selectedExam && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Type: {selectedExam.examType} | Status: {selectedExam.status}</div>
                    <div>Date: {selectedExam.startDate} to {selectedExam.endDate}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) =>
                  setFormData({ ...formData, subjectId: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects
                  .filter(subject => {
                    // Filter out invalid entries
                    if (!subject.subjectId || !subject.subjectName) return false;
                    // Only show active subjects
                    if (subject.status && subject.status !== 'Active') return false;
                    // Only show subjects for the selected student's class
                    if (selectedStudent && subject.classId !== selectedStudent.classId) return false;
                    return true;
                  })
                  .map((subject) => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName} | {subject.subjectCode} | Class {subject.classId} | ID: {subject.subjectId}
                    </option>
                  ))}
              </select>
              {selectedSubject && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>Code: {selectedSubject.subjectCode} | Class: {selectedSubject.classId}</div>
                  {selectedSubject.teacherName && <div>Teacher: {selectedSubject.teacherName}</div>}
                </div>
              )}
            </div>

            {/* Template Selection (only for Final/Mid-Term exams) */}
            {!isUnitTest && selectedExam && (
              <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Card Template Mode *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateMode('template1')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      templateMode === 'template1'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    Template 1 (Original - Simple)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateMode('template2')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      templateMode === 'template2'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    Template 2 (CBSE - PT/NB/SE/External)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateMode('template3')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      templateMode === 'template3'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    Template 3 (Assessment/Written)
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  {templateMode === 'template1'
                    ? 'Template 1: Enter simple marks (out of 100) - Original format'
                    : templateMode === 'template2' 
                    ? 'Template 2: Enter PT (10), NB (5), SE (5), and External (80) marks separately'
                    : 'Template 3: Enter Assessment (20) and Written (80) marks directly'}
                </p>
              </div>
            )}

            {/* Marks Entry Section */}
            <div className="space-y-6">
                {/* Simple Marks Entry for Unit Tests */}
                {isUnitTest && (
                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Unit Test Marks Entry
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks Obtained *
                        </label>
                        <input
                          type="number"
                          value={formData.marksObtained}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Allow empty, numbers, and decimals (including partial like "85.")
                            if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                              setFormData({ ...formData, marksObtained: inputValue });
                            }
                          }}
                          onBlur={(e) => {
                            // Validate and format on blur
                            const value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, marksObtained: value >= 0 ? value.toString() : '0' });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Marks *
                        </label>
                        <input
                          type="number"
                          value={formData.totalMarks}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Allow empty, numbers, and decimals (including partial like "100.")
                            if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                              setFormData({ ...formData, totalMarks: inputValue });
                            }
                          }}
                          onBlur={(e) => {
                            // Validate and format on blur
                            const value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, totalMarks: value > 0 ? value.toString() : '1' });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="100"
                          min="1"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-300">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-purple-900">Percentage:</span>
                        <span className="text-xl font-bold text-purple-700">
                          {formData.marksObtained && formData.totalMarks
                            ? ((parseFloat(formData.marksObtained) / parseFloat(formData.totalMarks)) * 100).toFixed(2)
                            : '0.00'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template 1 Entry Mode (Original - Simple Marks) */}
                {!isUnitTest && templateMode === 'template1' && (
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      Simple Marks Entry - Template 1 (Original)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks Obtained *
                        </label>
                        <input
                          type="number"
                          value={formData.marksObtained}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                              setFormData({ ...formData, marksObtained: inputValue });
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, marksObtained: value >= 0 ? value.toString() : '0' });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Marks *
                        </label>
                        <input
                          type="number"
                          value={formData.totalMarks}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                              setFormData({ ...formData, totalMarks: inputValue });
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, totalMarks: value > 0 ? value.toString() : '100' });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="100"
                          min="1"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Percentage:</span>
                        <span className="text-xl font-bold text-gray-700">
                          {formData.marksObtained && formData.totalMarks
                            ? ((parseFloat(formData.marksObtained) / parseFloat(formData.totalMarks)) * 100).toFixed(2)
                            : '0.00'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template 3 Entry Mode (Assessment/Written) */}
                {!isUnitTest && templateMode === 'template3' && (
                  <div className="space-y-4">
                    {/* Assessment (20 marks) */}
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Assessment (20 marks) - Template 3
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assessment Marks (out of 20) *
                        </label>
                        <input
                          type="number"
                          value={formData.internalMarks}
                          onChange={(e) => {
                            const value = Math.min(20, Math.max(0, parseFloat(e.target.value) || 0));
                            setFormData({ ...formData, internalMarks: value.toString() });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          min="0"
                          max="20"
                          step="0.01"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Internal assessment marks (out of 20)
                        </p>
                      </div>
                    </div>

                    {/* Written (80 marks) */}
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                      <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        Written (80 marks) - Template 3
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Written Exam Marks (out of 80) *
                        </label>
                        <input
                          type="number"
                          value={formData.externalMarks}
                          onChange={(e) => {
                            const value = Math.min(80, Math.max(0, parseFloat(e.target.value) || 0));
                            setFormData({ ...formData, externalMarks: value.toString() });
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                          min="0"
                          max="80"
                          step="0.01"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          External written exam marks (out of 80)
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-green-300">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-900">Total Marks:</span>
                          <span className="text-xl font-bold text-green-700">
                            {((parseFloat(formData.internalMarks) || 0) + (parseFloat(formData.externalMarks) || 0)).toFixed(2)} / 100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template 2 Entry Mode (PT/NB/SE/External) */}
                {!isUnitTest && templateMode === 'template2' && (
                  <>
                  {/* Internal Marks Section (20 marks) - Disabled for Unit Tests */}
                  <div className={`border-2 border-blue-200 rounded-lg p-4 ${isUnitTest ? 'bg-gray-100 opacity-60' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Internal Marks (20 marks / 20%) - Template 2
                      </h3>
                      {isUnitTest && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          Disabled for Unit Tests
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                    {/* Unit Test Marks (10 marks) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Test (10 marks) *
                      </label>
                      <input
                        type="number"
                        value={formData.unitTestMarks}
                        onChange={(e) => {
                          if (!isUnitTest) {
                            const value = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                            setFormData({ ...formData, unitTestMarks: value.toString() });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isUnitTest ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                        min="0"
                        max="10"
                        step="0.01"
                        required={!isUnitTest && !!selectedExam}
                        disabled={isUnitTest}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Average/highest of all unit tests
                      </p>
                    </div>

                    {/* Assignment Marks (5 marks) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment (5 marks) *
                      </label>
                      <input
                        type="number"
                        value={formData.assignmentMarks}
                        onChange={(e) => {
                          if (!isUnitTest) {
                            const value = Math.min(5, Math.max(0, parseFloat(e.target.value) || 0));
                            setFormData({ ...formData, assignmentMarks: value.toString() });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isUnitTest ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                        min="0"
                        max="5"
                        step="0.01"
                        required={!isUnitTest && !!selectedExam}
                        disabled={isUnitTest}
                      />
                    </div>

                    {/* Attendance Marks (5 marks) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attendance (5 marks) *
                      </label>
                      <input
                        type="number"
                        value={formData.attendanceMarks}
                        onChange={(e) => {
                          if (!isUnitTest) {
                            const value = Math.min(5, Math.max(0, parseFloat(e.target.value) || 0));
                            setFormData({ ...formData, attendanceMarks: value.toString() });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isUnitTest ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                        min="0"
                        max="5"
                        step="0.01"
                        required={!isUnitTest && !!selectedExam}
                        disabled={isUnitTest}
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-900">Total Internal Marks:</span>
                      <span className="text-xl font-bold text-blue-700">
                        {(
                          (parseFloat(formData.unitTestMarks) || 0) +
                          (parseFloat(formData.assignmentMarks) || 0) +
                          (parseFloat(formData.attendanceMarks) || 0)
                        ).toFixed(2)} / 20
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* External Marks Section (80 marks) - Template 2 */}
                  <div className={`border-2 border-green-200 rounded-lg p-4 ${isUnitTest ? 'bg-gray-100 opacity-60' : 'bg-green-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-green-900 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        External Marks (80 marks / 80%) - Template 2
                      </h3>
                      {isUnitTest && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          Disabled for Unit Tests
                        </span>
                      )}
                    </div>
                  
                  {/* Entry Mode Toggle */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Mode
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isUnitTest) {
                            setExternalEntryMode('scaled');
                            // Reset external marks when switching modes
                            setFormData({ ...formData, externalMarks: '' });
                          }
                        }}
                        disabled={isUnitTest}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isUnitTest
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : externalEntryMode === 'scaled'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        Scaled (out of 100)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isUnitTest) {
                            setExternalEntryMode('direct');
                            // Reset external marks when switching modes
                            setFormData({ ...formData, externalMarks: '' });
                          }
                        }}
                        disabled={isUnitTest}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isUnitTest
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : externalEntryMode === 'direct'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        Direct (out of 80)
                      </button>
                    </div>
                  </div>

                  {/* Scaled Mode: Enter out of 100, scales to 80 */}
                  {externalEntryMode === 'scaled' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Exam Marks (out of 100) *
                      </label>
                      <input
                        type="number"
                        value={formData.externalMarks ? (parseFloat(formData.externalMarks) * 100 / 80).toFixed(2) : ''}
                        onChange={(e) => {
                          if (!isUnitTest) {
                            const rawMarks = parseFloat(e.target.value) || 0;
                            const scaledMarks = Math.min(80, (rawMarks / 100) * 80); // Scale to 80 marks, max 80
                            setFormData({ ...formData, externalMarks: scaledMarks.toString() });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${isUnitTest ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                        placeholder="e.g., 85 (will be scaled to 68 marks)"
                        min="0"
                        max="100"
                        step="0.01"
                        required={!isUnitTest && !!selectedExam}
                        disabled={isUnitTest}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter marks out of 100. Will be automatically scaled to 80 marks (80%).
                      </p>
                      <div className="mt-2 text-sm text-green-700">
                        <strong>Scaled External Marks:</strong>{' '}
                        <span className="font-bold">
                          {(parseFloat(formData.externalMarks) || 0).toFixed(2)} / 80
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Direct Mode: Enter directly out of 80 */
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Exam Marks (out of 80) *
                      </label>
                      <input
                        type="number"
                        value={formData.externalMarks || ''}
                        onChange={(e) => {
                          if (!isUnitTest) {
                            const marks = Math.min(80, parseFloat(e.target.value) || 0);
                            setFormData({ ...formData, externalMarks: marks.toString() });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${isUnitTest ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                        placeholder="e.g., 68 (directly out of 80 marks)"
                        min="0"
                        max="80"
                        step="0.01"
                        required={!isUnitTest && !!selectedExam}
                        disabled={isUnitTest}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter marks directly out of 80. No scaling applied.
                      </p>
                      <div className="mt-2 text-sm text-green-700">
                        <strong>External Marks:</strong>{' '}
                        <span className="font-bold">
                          {(parseFloat(formData.externalMarks) || 0).toFixed(2)} / 80
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                  </>
                )}

                {/* Total Marks Display with Breakdown */}
                {!isUnitTest && (
                <div className={`border-2 border-gray-300 rounded-lg p-4 ${isUnitTest ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Marks Breakdown Summary</h3>
                      {isUnitTest && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          Disabled for Unit Tests
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Internal Marks Breakdown */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">Internal Marks (20 marks)</p>
                        <div className="space-y-1 text-sm">
                          {templateMode === 'template3' ? (
                            // Template 3: Show Assessment marks only
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Assessment:</span>
                                <span className="font-medium">{(parseFloat(formData.internalMarks) || 0).toFixed(2)} / 20</span>
                              </div>
                              <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                                <span className="text-blue-900">Total Internal:</span>
                                <span className="text-blue-900">
                                  {(parseFloat(formData.internalMarks) || 0).toFixed(2)} / 20
                                </span>
                              </div>
                            </>
                          ) : (
                            // Template 2: Show breakdown
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Unit Test:</span>
                                <span className="font-medium">{(parseFloat(formData.unitTestMarks) || 0).toFixed(2)} / 10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Assignment:</span>
                                <span className="font-medium">{(parseFloat(formData.assignmentMarks) || 0).toFixed(2)} / 5</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Attendance:</span>
                                <span className="font-medium">{(parseFloat(formData.attendanceMarks) || 0).toFixed(2)} / 5</span>
                              </div>
                              <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                                <span className="text-blue-900">Total Internal:</span>
                                <span className="text-blue-900">
                                  {(
                                    (parseFloat(formData.unitTestMarks) || 0) +
                                    (parseFloat(formData.assignmentMarks) || 0) +
                                    (parseFloat(formData.attendanceMarks) || 0)
                                  ).toFixed(2)} / 20
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* External Marks */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">External Marks (80 marks)</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Final Exam:</span>
                            <span className="font-medium">{(parseFloat(formData.externalMarks) || 0).toFixed(2)} / 80</span>
                          </div>
                          {templateMode === 'template2' && externalEntryMode === 'scaled' && formData.externalMarks && (
                            <div className="text-xs text-gray-500 mt-2">
                              (Entered: {((parseFloat(formData.externalMarks) || 0) * 100 / 80).toFixed(2)} / 100, scaled to 80)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grand Total */}
                  <div className="border-t-2 border-gray-400 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Grand Total</h3>
                        <p className="text-sm text-gray-600">
                          Internal (20) + External (80) = Total (100)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          {templateMode === 'template3' ? (
                            // Template 3: Assessment + Written
                            (
                              (parseFloat(formData.internalMarks) || 0) +
                              (parseFloat(formData.externalMarks) || 0)
                            ).toFixed(2)
                          ) : (
                            // Template 2: Breakdown + External
                            (
                              (parseFloat(formData.unitTestMarks) || 0) +
                              (parseFloat(formData.assignmentMarks) || 0) +
                              (parseFloat(formData.attendanceMarks) || 0) +
                              (parseFloat(formData.externalMarks) || 0)
                            ).toFixed(2)
                          )}
                        </div>
                        <div className="text-sm text-gray-600">out of 100</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Percentage: {templateMode === 'template3' ? (
                            (
                              (parseFloat(formData.internalMarks) || 0) +
                              (parseFloat(formData.externalMarks) || 0)
                            ).toFixed(2)
                          ) : (
                            (
                              (parseFloat(formData.unitTestMarks) || 0) +
                              (parseFloat(formData.assignmentMarks) || 0) +
                              (parseFloat(formData.attendanceMarks) || 0) +
                              (parseFloat(formData.externalMarks) || 0)
                            ).toFixed(2)
                          )}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

            {/* Live Calculation Display */}
            {calculatedPercentage > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Calculated Results
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <div>
                        <span className="text-xs text-blue-600">Percentage:</span>
                        <p className="text-lg font-bold text-blue-900">
                          {calculatedPercentage.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-blue-600">Grade:</span>
                        <p className="text-lg font-bold text-blue-900">
                          {calculatedGrade}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional remarks or comments"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as (typeof STATUSES)[number] })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Published marks are visible to students and parents
              </p>
            </div>

            {/* Fill Sample Data Button (only for create mode) */}
            {mode === 'create' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Quick Fill</p>
                    <p className="text-xs text-blue-700 mt-1">Fill form with sample data to test</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Filter to only active students with a classId
                      const validStudents = students.filter(s => 
                        s.studentId && s.name && s.classId && (!s.status || s.status === 'Active')
                      );

                      if (validStudents.length === 0) {
                        toast.error('No valid students available. Please add students with class assignments first.');
                        return;
                      }

                      // Select a random student
                      const randomStudent = validStudents[Math.floor(Math.random() * validStudents.length)];
                      const studentClassId = randomStudent.classId;

                      // Find exams for the student's class
                      const classExams = exams.filter(e => 
                        e.examId && e.examName && e.classId === studentClassId
                      );

                      if (classExams.length === 0) {
                        toast.error(`No exams found for Class ${studentClassId}. Please create an exam for this class first.`);
                        return;
                      }

                      // Find subjects for the student's class
                      const classSubjects = subjects.filter(s => 
                        s.subjectId && s.subjectName && s.classId === studentClassId && (!s.status || s.status === 'Active')
                      );

                      if (classSubjects.length === 0) {
                        toast.error(`No subjects found for Class ${studentClassId}. Please create subjects for this class first.`);
                        return;
                      }

                      // Select random exam and subject from the filtered lists
                      const randomExam = classExams[Math.floor(Math.random() * classExams.length)];
                      const randomSubject = classSubjects[Math.floor(Math.random() * classSubjects.length)];

                      const marksObtained = Math.floor(Math.random() * 40) + 60; // 60-100
                      const totalMarks = 100;

                      // Set the form data
                      setFormData({
                        markId: generateMarkId(),
                        studentId: randomStudent.studentId,
                        examId: randomExam.examId,
                        subjectId: randomSubject.subjectId,
                        marksObtained: marksObtained.toString(),
                        totalMarks: totalMarks.toString(),
                        remarks: 'Good performance. Keep it up!',
                        status: 'Draft',
                        // V2: Internal/External Marks Breakdown
                        marksType: 'Final',
                        unitTestMarks: '',
                        assignmentMarks: '',
                        attendanceMarks: '',
                        externalMarks: '',
                        internalMarks: '',
                      });

                      // Also update the selected state for display info
                      setSelectedStudent(randomStudent);
                      setSelectedExam(randomExam);
                      setSelectedSubject(randomSubject);

                      toast.success(`Sample data filled for ${randomStudent.name} (Class ${studentClassId})! Review and submit when ready.`);
                    }}
                    className="gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Fill Sample Data
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Add Marks' : 'Update Marks')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// MARK DETAILS COMPONENT
interface MarkDetailsProps {
  mark: Mark;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}

function MarkDetails({
  mark,
  onEdit,
  onClose,
  onDelete,
}: MarkDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();
  
  const handleClose = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onClose();
  };
  
  const getGradeBadgeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mark Details
                </h2>
                <p className="text-gray-500 mt-1">
                  Mark ID: {mark.markId}
                </p>
              </div>
              <Badge
                variant={mark.status === 'Published' ? 'default' : 'secondary'}
                className={
                  mark.status === 'Published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {mark.status}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Student & Exam Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Student
                </label>
                <p className="mt-1">
                  {mark.studentId ? (
                    <button
                      onClick={() => {
                        pushNavigation('marks', mark.markId);
                        navigateToRecord('students', mark.studentId);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {mark.studentName || mark.studentId}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{mark.studentName || mark.studentId}</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Class
                </label>
                <p className="mt-1">
                  {mark.classId ? (
                    <button
                      onClick={() => {
                        pushNavigation('marks', mark.markId);
                        navigateToRecord('classes', mark.classId);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Class {mark.classId}
                    </button>
                  ) : (
                    <span className="text-gray-900">Class {mark.classId}</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Exam
                </label>
                <p className="mt-1">
                  {mark.examId ? (
                    <button
                      onClick={() => {
                        pushNavigation('marks', mark.markId);
                        navigateToRecord('exams', mark.examId);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {mark.examName || mark.examId}
                    </button>
                  ) : (
                    <span className="text-gray-900">{mark.examName || mark.examId}</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Subject
                </label>
                <p className="mt-1">
                  {mark.subjectId ? (
                    <button
                      onClick={() => {
                        pushNavigation('marks', mark.markId);
                        navigateToRecord('subjects', mark.subjectId);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {mark.subjectName || mark.subjectId}
                      {mark.subjectCode && (
                        <span className="text-sm text-gray-500 ml-1">
                          ({mark.subjectCode})
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-gray-900">
                      {mark.subjectName || mark.subjectId}
                      {mark.subjectCode && (
                        <span className="text-sm text-gray-500 ml-1">
                          ({mark.subjectCode})
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Marks & Performance */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Performance Summary
              </h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Marks Obtained</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {mark.marksObtained}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Marks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {mark.totalMarks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {mark.percentage?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Grade</p>
                  <Badge
                    className={`${getGradeBadgeColor(mark.grade)} text-xl font-bold px-4 py-2 mt-1`}
                  >
                    {mark.grade}
                  </Badge>
                </div>
              </div>
              
              {/* Internal/External Breakdown (if available) */}
              {(mark.internalMarks !== undefined || mark.externalMarks !== undefined || mark.unitTestMarks !== undefined) && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="text-xs font-semibold text-gray-700 mb-3">Marks Breakdown (V2 System)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Internal Marks */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-2">Internal Marks (20 marks)</p>
                      <div className="space-y-1 text-xs">
                        {/* Template 2: Show breakdown */}
                        {mark.unitTestMarks !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Unit Test:</span>
                            <span className="font-medium">{mark.unitTestMarks.toFixed(2)} / 10</span>
                          </div>
                        )}
                        {mark.assignmentMarks !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assignment:</span>
                            <span className="font-medium">{mark.assignmentMarks.toFixed(2)} / 5</span>
                          </div>
                        )}
                        {mark.attendanceMarks !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attendance:</span>
                            <span className="font-medium">{mark.attendanceMarks.toFixed(2)} / 5</span>
                          </div>
                        )}
                        {/* Template 3: Show Assessment if no breakdown */}
                        {mark.internalMarks !== undefined && mark.unitTestMarks === undefined && mark.assignmentMarks === undefined && mark.attendanceMarks === undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assessment:</span>
                            <span className="font-medium">{mark.internalMarks.toFixed(2)} / 20</span>
                          </div>
                        )}
                        {mark.internalMarks !== undefined && (
                          <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                            <span className="text-blue-900">Total Internal:</span>
                            <span className="text-blue-900">{mark.internalMarks.toFixed(2)} / 20</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* External Marks */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">External Marks (80 marks)</p>
                      <div className="space-y-1 text-xs">
                        {mark.externalMarks !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Final Exam:</span>
                            <span className="font-medium">{mark.externalMarks.toFixed(2)} / 80</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Calculation Formula */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-600">
                      <strong>Calculation:</strong> Internal ({mark.internalMarks?.toFixed(2) || '0.00'}) + External ({mark.externalMarks?.toFixed(2) || '0.00'}) = Total ({mark.marksObtained}) / 100 = {mark.percentage?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            {mark.remarks && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Remarks
                </label>
                <p className="mt-1 text-gray-900">{mark.remarks}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              {mark.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created At
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(mark.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {mark.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(mark.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t p-6 flex gap-3">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Marks
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}