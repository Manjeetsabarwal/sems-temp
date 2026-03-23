import React, { useState, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Copy, Download, Upload, FileSpreadsheet, File, RefreshCw, Calendar, Database, FileJson, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useExams } from '../../hooks/useExams';
import { examsService } from '../../services/exams.service';
import { ExamDetails } from './ExamDetails';
import { DatabaseSetupGuide } from '../DatabaseSetupGuide';
import { AutoDatabaseSetup } from '../AutoDatabaseSetup';
import { DatabaseSchemaFix } from '../DatabaseSchemaFix';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { databaseCheckerService } from '../../services/database-checker.service';
import type { Exam } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

type SortField = 'examId' | 'examName' | 'examType' | 'classId' | 'startDate';
type SortOrder = 'asc' | 'desc';

export function ExamsAPI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>();
  const [sortField, setSortField] = useState<SortField>('examId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showSchemaFix, setShowSchemaFix] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    exam?: Exam;
    isBulk?: boolean;
  }>({ open: false });

  const {
    exams,
    loading,
    error,
    deleteExam,
    createExam,
    updateExam,
    refresh,
  } = useExams({
    classId: selectedClass || undefined,
    status: selectedStatus || undefined,
    search: searchTerm,
  });

  // Check if error is database-related
  const isDatabaseError = error && (
    error.includes('Could not find the table') ||
    error.includes('PGRST') ||
    error.includes('schema cache')
  );

  // Check if error is schema-related (wrong column names)
  const isSchemaError = error && (
    error.includes('column') &&
    error.includes('does not exist')
  );

  // Show schema fix if schema error detected
  if (isSchemaError && !showSchemaFix) {
    setShowSchemaFix(true);
  }

  // Show setup guide if database error detected
  if (isDatabaseError && !showSetupGuide && !isSchemaError) {
    setShowSetupGuide(true);
  }

  // Show schema fix screen
  if (showSchemaFix) {
    return (
      <DatabaseSchemaFix
        onComplete={() => {
          setShowSchemaFix(false);
          refresh();
        }}
        onShowFullSetup={() => {
          setShowSchemaFix(false);
          setShowSetupGuide(true);
        }}
      />
    );
  }

  // Show setup guide
  if (showSetupGuide) {
    return (
      <AutoDatabaseSetup
        onComplete={() => {
          setShowSetupGuide(false);
          refresh();
        }}
      />
    );
  }

  // Sort exams
  const sortedExams = [...exams].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'startDate') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Show details page
  if (detailsMode) {
    return (
      <ExamDetails
        mode={detailsMode}
        examId={selectedExamId}
        onBack={() => {
          setDetailsMode(null);
          setSelectedExamId(undefined);
        }}
        onSuccess={() => {
          setDetailsMode(null);
          setSelectedExamId(undefined);
          refresh();
        }}
      />
    );
  }

  // Generate sample data for quick exam creation
  const fillSampleData = async () => {
    // Sample exam data
    const sampleExams = [
      { name: 'Mid Term Examination', type: 'Mid Term', duration: 3 },
      { name: 'Final Examination', type: 'Final', duration: 3 },
      { name: 'Unit Test 1', type: 'Unit Test', duration: 2 },
      { name: 'Unit Test 2', type: 'Unit Test', duration: 2 },
      { name: 'Practical Examination', type: 'Practical', duration: 2 },
      { name: 'Pre-Board Examination', type: 'Pre-Board', duration: 3 },
      { name: 'Annual Examination', type: 'Annual', duration: 3 },
      { name: 'Quiz Competition', type: 'Quiz', duration: 1 },
    ];

    const selectedExam = sampleExams[Math.floor(Math.random() * sampleExams.length)];

    // Generate dates
    const today = new Date();
    const startDate = new Date(today.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000); // 7-37 days from now
    const endDate = new Date(startDate.getTime() + selectedExam.duration * 24 * 60 * 60 * 1000);

    // Generate exam ID
    const examId = `EXAM-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Select random class
    const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const selectedClass = classes[Math.floor(Math.random() * classes.length)];

    const examData = {
      examId,
      examName: selectedExam.name,
      examType: selectedExam.type,
      classId: selectedClass,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'Scheduled' as const,
    };

    try {
      await createExam(examData);
      toast.success(`Sample exam "${selectedExam.name}" created successfully!`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sample exam');
    }
  };

  const handleCreate = () => {
    setDetailsMode('create');
    setSelectedExamId(undefined);
  };

  const handleView = (examId: string) => {
    setDetailsMode('view');
    setSelectedExamId(examId);
  };

  const handleEdit = (examId: string) => {
    setDetailsMode('edit');
    setSelectedExamId(examId);
  };

  const handleDeleteClick = (exam: Exam) => {
    setDeleteDialog({ open: true, exam, isBulk: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      try {
        const deletePromises = Array.from(selectedExams).map(id => deleteExam(id));
        await Promise.all(deletePromises);
        toast.success(`Successfully deleted ${selectedExams.size} exams`);
        setSelectedExams(new Set());
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete some exams');
      }
    } else if (deleteDialog.exam) {
      // Single delete
      try {
        await deleteExam(deleteDialog.exam.examId);
        toast.success(`Exam ${deleteDialog.exam.examName} deleted successfully`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete exam');
      }
    }
    setDeleteDialog({ open: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleDuplicate = async (exam: Exam) => {
    try {
      // Fetch full exam details to ensure we have all subject data
      const fullExam = await examsService.getById(exam.examId);

      console.log('📋 Original exam:', fullExam);
      console.log('📋 Original exam subjects:', fullExam.subjects);
      console.log('📋 Original exam subjects type:', typeof fullExam.subjects);
      console.log('📋 Original exam subjects is array:', Array.isArray(fullExam.subjects));

      // Find the highest exam ID number
      const examNumbers = exams
        .map(e => parseInt(e.examId.replace('EXM', '')))
        .filter(n => !isNaN(n));
      const maxNumber = Math.max(...examNumbers, 0);
      const newExamId = `EXM${String(maxNumber + 1).padStart(3, '0')}`;

      // Parse subjects if they're a string, or use as-is if array
      let subjectsArray: any[] = [];
      if (fullExam.subjects) {
        if (typeof fullExam.subjects === 'string') {
          try {
            subjectsArray = JSON.parse(fullExam.subjects);
          } catch (e) {
            console.error('Failed to parse subjects string:', e);
            subjectsArray = [];
          }
        } else if (Array.isArray(fullExam.subjects)) {
          subjectsArray = fullExam.subjects;
        }
      }

      console.log('📋 Parsed subjects array:', subjectsArray);
      console.log('📋 Subjects array length:', subjectsArray.length);
      console.log('📋 First subject example:', subjectsArray[0]);

      // Deep copy subjects array to ensure all subject data is copied
      // Handle both camelCase and snake_case property names
      const copiedSubjects = subjectsArray.length > 0
        ? subjectsArray.map((subject, idx) => {
          const copied = {
            subjectId: subject.subjectId || subject.subject_id || '',
            subjectName: subject.subjectName || subject.subject_name || '',
            subjectCode: subject.subjectCode || subject.subject_code || '',
            maxMarks: Number(subject.maxMarks || subject.max_marks || 0),
            passingMarks: Number(subject.passingMarks || subject.passing_marks || 0),
            examDate: subject.examDate || subject.exam_date || '',
            duration: Number(subject.duration || 180),
          };
          console.log(`📝 Copied subject ${idx + 1}:`, copied);
          return copied;
        }).filter(s => s.subjectId && s.subjectCode) // Filter out invalid subjects
        : [];

      console.log('✅ Final copied subjects:', copiedSubjects);
      console.log('✅ Copied subjects count:', copiedSubjects.length);

      if (copiedSubjects.length === 0 && subjectsArray.length > 0) {
        console.warn('⚠️ Warning: Subjects were found but none were valid after copying');
        console.warn('⚠️ Original subjects:', subjectsArray);
      }

      // Create duplicate with new ID and copied subjects
      const duplicateData = {
        examId: newExamId,
        examName: `${fullExam.examName} (Copy)`,
        examType: fullExam.examType,
        academicYear: fullExam.academicYear,
        classId: fullExam.classId,
        term: fullExam.term,
        startDate: fullExam.startDate,
        endDate: fullExam.endDate,
        totalMarks: fullExam.totalMarks || 0,
        passingMarks: fullExam.passingMarks || 0,
        subjects: copiedSubjects, // Use deep-copied subjects
        description: fullExam.description || undefined,
        status: 'Scheduled' as const,
      };

      console.log('📤 Sending duplicate data:', JSON.stringify(duplicateData, null, 2));
      console.log('📤 Subjects in duplicate data:', duplicateData.subjects);
      console.log('📤 Subjects count:', duplicateData.subjects.length);

      const createdExam = await createExam(duplicateData);
      console.log('✅ Created exam response:', createdExam);
      console.log('✅ Created exam subjects:', createdExam.subjects);
      console.log('✅ Created exam subjects count:', createdExam.subjects?.length || 0);

      if (!createdExam.subjects || createdExam.subjects.length === 0) {
        console.error('❌ ERROR: Created exam has no subjects!');
        toast.warning(`Exam duplicated as ${newExamId}, but subjects may not have been copied. Please check.`);
      } else {
        toast.success(`Exam duplicated as ${newExamId} with ${copiedSubjects.length} subject${copiedSubjects.length !== 1 ? 's' : ''}`);
      }
      refresh();
    } catch (err: any) {
      console.error('❌ Duplication error:', err);
      toast.error(err.message || 'Failed to duplicate exam');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const classes = ['9', '10', '11', '12'];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExams(new Set(exams.map(e => e.examId)));
    } else {
      setSelectedExams(new Set());
    }
  };

  const handleSelectExam = (examId: string, checked: boolean) => {
    const newSelected = new Set(selectedExams);
    if (checked) {
      newSelected.add(examId);
    } else {
      newSelected.delete(examId);
    }
    setSelectedExams(newSelected);
  };

  const handleExportExcel = () => {
    const dataToExport = selectedExams.size > 0
      ? sortedExams.filter(e => selectedExams.has(e.examId))
      : sortedExams;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(e => ({
      examId: e.examId,
      examName: e.examName,
      examType: e.examType,
      academicYear: e.academicYear,
      classId: e.classId,
      term: e.term,
      startDate: e.startDate,
      endDate: e.endDate,
      totalMarks: e.totalMarks,
      passingMarks: e.passingMarks,
      status: e.status,
      subjectsCount: e.subjects.length,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exams');
    XLSX.writeFile(workbook, `exams_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success(`Exported ${dataToExport.length} exams to Excel`);
  };

  const handleExportCSV = () => {
    const dataToExport = selectedExams.size > 0
      ? sortedExams.filter(e => selectedExams.has(e.examId))
      : sortedExams;

    const csv = Papa.unparse(dataToExport.map(e => ({
      examId: e.examId,
      examName: e.examName,
      examType: e.examType,
      academicYear: e.academicYear,
      classId: e.classId,
      term: e.term,
      startDate: e.startDate,
      endDate: e.endDate,
      totalMarks: e.totalMarks,
      passingMarks: e.passingMarks,
      status: e.status,
      subjectsCount: e.subjects.length,
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `exams_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(`Exported ${dataToExport.length} exams to CSV`);
  };

  const handleExportJSON = () => {
    const dataToExport = selectedExams.size > 0
      ? sortedExams.filter(e => selectedExams.has(e.examId))
      : sortedExams;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `exams_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast.success(`Exported ${dataToExport.length} exams to JSON`);
  };

  const allSelected = exams.length > 0 && selectedExams.size === exams.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case 'Ongoing':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Ongoing</Badge>;
      case 'Completed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Exams Management</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Manage exams and schedules with live database ({exams.length} exams)
            </p>
          </div>
          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowSetupGuide(true)}
            >
              <Database className="w-4 h-4" />
              Database Setup
            </Button> */}
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Exam
            </Button>
            {/* <Button
              variant="outline"
              className="gap-2"
              onClick={fillSampleData}
            >
              <Sparkles className="w-4 h-4" />
              Fill Sample Data
            </Button> */}
          </div>
        </div>

        {/* Exams Management Action Bar - Excel-like grouped partitions */}
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
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Group 2: Import/Export Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</span>
              {exams.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="gap-2 h-8"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="gap-2 h-8"
                  >
                    <File className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="gap-2 h-8"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </Button>
                </>
              )}
            </div>

            {/* Group 3: Filter Actions */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && !isDatabaseError && !isSchemaError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading exams</p>
          <p className="text-sm mt-1">{error}</p>
          <Button size="sm" variant="outline" onClick={refresh} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar - Sticky */}
      {selectedExams.size > 0 && (
        <div className="sticky top-[113px] z-10 -mt-6">
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-purple-900">
                    {selectedExams.size} exam{selectedExams.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportExcel}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCSV}
                    className="gap-2"
                  >
                    <File className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportJSON}
                    className="gap-2"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDeleteClick}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              All Exams ({exams.length})
              {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {loading && exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
              <p>Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No exams found</p>
              <p className="text-sm mt-1">
                {searchTerm || selectedClass || selectedStatus
                  ? 'Try adjusting your filters'
                  : 'Click "Add Exam" to create the first exam'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => {
                          handleSelectAll(checked as boolean);
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <button
                        onClick={() => handleSort('examId')}
                        className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                      >
                        Exam ID
                        <SortIcon field="examId" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('examName')}
                        className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                      >
                        Exam Name
                        <SortIcon field="examName" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <button
                        onClick={() => handleSort('examType')}
                        className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                      >
                        Type
                        <SortIcon field="examType" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort('classId')}
                        className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                      >
                        Class
                        <SortIcon field="classId" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <button
                        onClick={() => handleSort('startDate')}
                        className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                      >
                        Start Date
                        <SortIcon field="startDate" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">Subjects</TableHead>
                    <TableHead className="w-[100px]">Total Marks</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExams.map((exam) => (
                    <TableRow key={exam.examId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedExams.has(exam.examId)}
                          onCheckedChange={(checked) =>
                            handleSelectExam(exam.examId, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleView(exam.examId)}
                          className="font-medium font-mono text-xs text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          {exam.examId}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleView(exam.examId)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {exam.examName}
                        </button>
                        <div className="text-sm text-gray-500">{exam.academicYear} • {exam.term}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.examType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Class {exam.classId}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(exam.startDate)}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {exam.subjects.length}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {exam.totalMarks}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(exam.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(exam.examId)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(exam.examId)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(exam)}
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(exam)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sorting Info */}
      {exams.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Sorted by{' '}
          {sortField === 'examId'
            ? 'Exam ID'
            : sortField === 'examName'
              ? 'Exam Name'
              : sortField === 'examType'
                ? 'Type'
                : sortField === 'classId'
                  ? 'Class'
                  : 'Start Date'}{' '}
          ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'}) • Click column headers to sort
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
        onConfirm={handleDeleteConfirm}
        title={
          deleteDialog.isBulk
            ? 'Delete Multiple Exams?'
            : 'Delete Exam?'
        }
        description={
          deleteDialog.isBulk
            ? 'Are you sure you want to delete the selected exams? This will permanently remove all exam records and associated data from the database.'
            : `Are you sure you want to delete this exam? This will permanently remove the exam record and all associated data from the database.`
        }
        studentName={deleteDialog.exam?.examName}
        count={deleteDialog.isBulk ? selectedExams.size : undefined}
      />
    </div>
  );
}