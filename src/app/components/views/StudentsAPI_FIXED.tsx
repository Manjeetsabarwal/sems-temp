import React, { useState, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Copy, Download, Upload, FileSpreadsheet, File, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useStudents } from '../../hooks/useStudents';
import { StudentDetails } from './StudentDetails';
import { DatabaseSetupGuide } from '../DatabaseSetupGuide';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import type { Student } from '../../types';
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

type SortField = 'studentId' | 'name' | 'classId' | 'sectionId' | 'rollNo';
type SortOrder = 'asc' | 'desc';

export function StudentsAPI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const [sortField, setSortField] = useState<SortField>('studentId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    student?: Student;
    isBulk?: boolean;
  }>({ open: false });

  const {
    students,
    loading,
    error,
    deleteStudent,
    createStudent,
    updateStudent,
    refresh,
  } = useStudents({
    classId: selectedClass || undefined,
    search: searchTerm,
  });

  // Check if error is database-related
  const isDatabaseError = error && (
    error.includes('Could not find the table') ||
    error.includes('PGRST') ||
    error.includes('schema cache')
  );

  // Show setup guide if database error detected
  if (isDatabaseError && !showSetupGuide) {
    setShowSetupGuide(true);
  }

  // Show setup guide
  if (showSetupGuide) {
    return (
      <DatabaseSetupGuide 
        onComplete={() => {
          setShowSetupGuide(false);
          refresh();
        }}
      />
    );
  }

  // Sort students
  const sortedStudents = [...students].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'rollNo') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Show details page
  if (detailsMode) {
    return (
      <StudentDetails
        mode={detailsMode}
        studentId={selectedStudentId}
        onBack={() => {
          setDetailsMode(null);
          setSelectedStudentId(undefined);
        }}
        onSuccess={() => {
          setDetailsMode(null);
          setSelectedStudentId(undefined);
          refresh();
        }}
      />
    );
  }

  const handleCreate = () => {
    setDetailsMode('create');
    setSelectedStudentId(undefined);
  };

  const handleView = (studentId: string) => {
    setDetailsMode('view');
    setSelectedStudentId(studentId);
  };

  const handleEdit = (studentId: string) => {
    setDetailsMode('edit');
    setSelectedStudentId(studentId);
  };

  const handleDeleteClick = (student: Student) => {
    setDeleteDialog({ open: true, student, isBulk: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      try {
        const deletePromises = Array.from(selectedStudents).map(id => deleteStudent(id));
        await Promise.all(deletePromises);
        toast.success(`Successfully deleted ${selectedStudents.size} students`);
        setSelectedStudents(new Set());
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete some students');
      }
    } else if (deleteDialog.student) {
      // Single delete
      try {
        await deleteStudent(deleteDialog.student.studentId);
        toast.success(`Student ${deleteDialog.student.name} deleted successfully`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete student');
      }
    }
    setDeleteDialog({ open: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleDuplicate = async (student: Student) => {
    try {
      // Find the highest student ID number
      const studentNumbers = students
        .map(s => parseInt(s.studentId.replace('STU', '')))
        .filter(n => !isNaN(n));
      const maxNumber = Math.max(...studentNumbers, 0);
      const newStudentId = `STU${String(maxNumber + 1).padStart(3, '0')}`;

      // Create duplicate with new ID
      const duplicateData = {
        ...student,
        studentId: newStudentId,
        name: `${student.name} (Copy)`,
      };

      await createStudent(duplicateData);
      toast.success(`Student duplicated as ${newStudentId}`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate student');
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
      setSelectedStudents(new Set(students.map(s => s.studentId)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // FIXED: Handle file upload with proper validation and duplicate detection
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let parsedData: any[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsedData = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet);
      } else {
        toast.error('Unsupported file format. Please use CSV or Excel files.');
        return;
      }

      if (parsedData.length === 0) {
        toast.error('No data found in file');
        return;
      }

      // Validate and import students
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of parsedData) {
        try {
          // Map CSV/Excel columns to student object
          const studentData: any = {
            studentId: row.studentId || row.studentid || row.StudentID,
            name: row.name || row.Name,
            classId: String(row.classId || row.classid || row.ClassID),
            sectionId: row.sectionId || row.sectionid || row.SectionID,
            rollNo: Number(row.rollNo || row.rollno || row.RollNo),
            parentContact: row.parentContact || row.parentcontact || row.ParentContact || '',
            parentEmail: row.parentEmail || row.parentemail || row.ParentEmail || '',
          };

          // Validate required fields
          if (!studentData.studentId || !studentData.name || !studentData.classId || 
              !studentData.sectionId || !studentData.rollNo) {
            errors.push(`Row with student "${studentData.name || 'Unknown'}": Missing required fields`);
            errorCount++;
            continue;
          }

          // Check for duplicates in existing students
          const exists = students.find(s => s.studentId === studentData.studentId);
          if (exists) {
            errors.push(`Student ID ${studentData.studentId} already exists`);
            errorCount++;
            continue;
          }

          // Create student
          await createStudent(studentData);
          successCount++;
        } catch (err: any) {
          errors.push(`Error importing ${row.name || 'Unknown'}: ${err.message}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} student(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} student(s)`, {
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
        });
      }

      // Refresh the list
      refresh();
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(`Failed to process file: ${err.message}`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = selectedStudents.size > 0
      ? students.filter(s => selectedStudents.has(s.studentId))
      : students;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(s => ({
      studentId: s.studentId,
      name: s.name,
      classId: s.classId,
      sectionId: s.sectionId,
      rollNo: s.rollNo,
      parentContact: s.parentContact || '',
      parentEmail: s.parentEmail || '',
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `students_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Exported ${dataToExport.length} students to Excel`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedStudents.size > 0
      ? students.filter(s => selectedStudents.has(s.studentId))
      : students;

    const csv = Papa.unparse(dataToExport.map(s => ({
      studentId: s.studentId,
      name: s.name,
      classId: s.classId,
      sectionId: s.sectionId,
      rollNo: s.rollNo,
      parentContact: s.parentContact || '',
      parentEmail: s.parentEmail || '',
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} students to CSV`);
  };

  const allSelected = students.length > 0 && selectedStudents.size === students.length;
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < students.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              β
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            Manage student records with live database ({students.length} students)
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Error Display */}
      {error && !isDatabaseError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading students</p>
          <p className="text-sm mt-1">{error}</p>
          <Button size="sm" variant="outline" onClick={refresh} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedStudents.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium text-blue-900">
                  {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
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
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              All Students
              {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </CardTitle>
            <div className="flex gap-3">
              {/* Import Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
              </div>

              {/* Export Dropdown */}
              {students.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">
                {searchTerm || selectedClass
                  ? 'Try adjusting your filters'
                  : 'Click "Add Student" to create the first student'}
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
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someSelected;
                          }
                        }}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <button
                        onClick={() => handleSort('studentId')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Student ID
                        <SortIcon field="studentId" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Name
                        <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort('classId')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Class
                        <SortIcon field="classId" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort('sectionId')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Section
                        <SortIcon field="sectionId" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort('rollNo')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Roll No
                        <SortIcon field="rollNo" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[150px]">Parent Contact</TableHead>
                    <TableHead className="w-[200px]">Parent Email</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.studentId)}
                          onCheckedChange={(checked) => 
                            handleSelectStudent(student.studentId, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleView(student.studentId)}
                          className="font-medium font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {student.studentId}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Class {student.classId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {student.sectionId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {student.rollNo}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.parentContact || (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.parentEmail || (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(student.studentId)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student.studentId)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(student)}
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(student)}
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
      {students.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Sorted by{' '}
          {sortField === 'studentId'
            ? 'Student ID'
            : sortField === 'name'
            ? 'Name'
            : sortField === 'classId'
            ? 'Class'
            : sortField === 'sectionId'
            ? 'Section'
            : 'Roll Number'}{' '}
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
            ? 'Delete Multiple Students?'
            : 'Delete Student?'
        }
        description={
          deleteDialog.isBulk
            ? 'Are you sure you want to delete the selected students? This will permanently remove all their records from the database.'
            : `Are you sure you want to delete this student? This will permanently remove their record from the database.`
        }
        studentName={deleteDialog.student?.name}
        count={deleteDialog.isBulk ? selectedStudents.size : undefined}
      />
    </div>
  );
}
