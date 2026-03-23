import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileSpreadsheet, File, RefreshCw, Database, FileJson, X, LayoutGrid, List as ListIcon, GraduationCap, Mail, Phone, Copy, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useTeachers } from '../../hooks/useTeachers';
import { teachersService } from '../../services/teachers.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { TeacherDetails } from './TeacherDetails';
import type { TeacherExtended } from '../../types';
import { useApp } from '../../context/AppContext';
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

type SortField = 'teacherId' | 'name' | 'email' | 'phone';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export function TeachersAPI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>();
  const [sortField, setSortField] = useState<SortField>('teacherId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import loading state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    teacher?: TeacherExtended;
    isBulk?: boolean;
  }>({ open: false });

  const {
    teachers,
    loading,
    error,
    deleteTeacher,
    createTeacher,
    updateTeacher,
    bulkDeleteTeachers,
    refresh,
  } = useTeachers({
    status: statusFilter || undefined,
    search: searchTerm,
  });

  const { getPendingRecordId, clearPendingRecordId, currentView } = useApp();

  // Check for pending record ID when component mounts or view changes to teachers
  useEffect(() => {
    if (currentView === 'teachers' && !detailsMode && teachers.length > 0) {
      const pendingId = getPendingRecordId('teachers');
      if (pendingId) {
        // Wait a bit for teachers to load
        const timer = setTimeout(() => {
          const teacherExists = teachers.find(t => t.teacherId === pendingId);
          if (teacherExists) {
            setDetailsMode('view');
            setSelectedTeacherId(pendingId);
            clearPendingRecordId('teachers');
          } else {
            // If teacher not found yet, wait a bit more
            setTimeout(() => {
              const teacherExistsRetry = teachers.find(t => t.teacherId === pendingId);
              if (teacherExistsRetry) {
                setDetailsMode('view');
                setSelectedTeacherId(pendingId);
                clearPendingRecordId('teachers');
              }
            }, 500);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView, teachers, detailsMode, getPendingRecordId, clearPendingRecordId]);

  // Sort teachers
  const sortedTeachers = [...teachers].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Show details page
  if (detailsMode) {
    return (
      <TeacherDetails
        mode={detailsMode}
        teacherId={selectedTeacherId}
        onBack={() => {
          setDetailsMode(null);
          setSelectedTeacherId(undefined);
        }}
        onSuccess={() => {
          setDetailsMode(null);
          setSelectedTeacherId(undefined);
          refresh();
        }}
      />
    );
  }

  // Generate sample data for quick teacher creation
  const fillSampleData = async () => {
    // Sample teacher names
    const teacherNames = [
      'Dr. Rajesh Kumar Sharma', 'Ms. Priya Nair', 'Mr. Amit Patel', 'Mrs. Sneha Reddy',
      'Dr. Arjun Singh', 'Ms. Kavya Iyer', 'Mr. Vikram Desai', 'Mrs. Divya Shah',
      'Dr. Rohan Mehta', 'Ms. Anjali Joshi', 'Mr. Karan Gupta', 'Mrs. Isha Rao',
      'Dr. Aditya Verma', 'Ms. Meera Malhotra', 'Mr. Siddharth Chopra', 'Mrs. Neha Agarwal'
    ];

    // Sample subjects
    const subjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
      'History', 'Geography', 'Civics', 'Computer Science', 'Physical Education',
      'Economics', 'Accountancy', 'Business Studies', 'Psychology', 'Sociology'
    ];

    // Sample qualifications
    const qualifications = [
      'M.Sc. Mathematics', 'M.A. English', 'M.Sc. Physics', 'M.Com',
      'B.Ed.', 'M.Ed.', 'Ph.D. Chemistry', 'M.Tech Computer Science',
      'M.A. History', 'M.Sc. Biology', 'MBA', 'M.Phil Economics'
    ];

    // Generate random teacher data
    const name = teacherNames[Math.floor(Math.random() * teacherNames.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
    const experience = Math.floor(Math.random() * 20) + 1; // 1-20 years

    // Generate email
    const nameParts = name.split(' ');
    const firstName = nameParts[nameParts.length - 2]?.toLowerCase() || 'teacher';
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || 'school';
    const email = `${firstName}.${lastName}@school.edu`;

    // Generate phone number
    const phonePrefixes = ['98765', '98766', '98767', '98768', '98769', '98770', '98771', '98772'];
    const phoneSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const phone = `+91-${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${phoneSuffix}`;

    // Generate teacher ID
    const teacherId = `TCH-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Create teacher with sample data
    const teacherData = {
      teacherId,
      name,
      email,
      phone,
      subjects: [subject],
      classes: ['10', '9', '8'], // Can teach multiple classes
      qualification,
      experience,
      status: 'Active' as const,
    };

    try {
      await createTeacher(teacherData);
      toast.success(`Sample teacher "${name}" created successfully!`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sample teacher');
    }
  };

  // Show details dialog
  const handleCreate = () => {
    setDetailsMode('create');
    setSelectedTeacherId(undefined);
  };

  const handleView = (teacherId: string) => {
    setDetailsMode('view');
    setSelectedTeacherId(teacherId);
  };

  const handleEdit = (teacherId: string) => {
    setDetailsMode('edit');
    setSelectedTeacherId(teacherId);
  };

  const handleDeleteClick = (teacher: TeacherExtended) => {
    setDeleteDialog({ open: true, teacher, isBulk: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      try {
        await bulkDeleteTeachers(Array.from(selectedTeachers));
        setSelectedTeachers(new Set());
      } catch (err: any) {
        // Error already handled in hook
      }
    } else if (deleteDialog.teacher) {
      // Single delete
      try {
        await deleteTeacher(deleteDialog.teacher.teacherId);
      } catch (err: any) {
        // Error already handled in hook
      }
    }
    setDeleteDialog({ open: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(new Set(teachers.map(t => t.teacherId)));
    } else {
      setSelectedTeachers(new Set());
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    const newSelected = new Set(selectedTeachers);
    if (checked) {
      newSelected.add(teacherId);
    } else {
      newSelected.delete(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  // Handle file upload
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      let rows: any[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else if (fileExtension === 'json') {
        // Parse JSON
        const text = await file.text();
        rows = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format');
      }

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Get all existing teacher IDs to auto-generate new ones
      const existingTeachers = await teachersService.getAll();
      const teacherNumbers = existingTeachers
        .map(t => parseInt(t.teacherId.replace('TCH', '')))
        .filter(n => !isNaN(n));
      let maxNumber = Math.max(...teacherNumbers, 0);

      for (const row of rows) {
        try {
          // Map column names (case-insensitive)
          let teacherId = row.teacherId || row.TeacherID || row.teacher_id;
          const name = row.name || row.Name;
          const email = row.email || row.Email || '';
          const phone = row.phone || row.Phone || '';
          const subjects = row.subjects || row.Subjects || [];
          const classes = row.classes || row.Classes || [];
          const qualification = row.qualification || row.Qualification || '';
          const experience = row.experience || row.Experience || 0;
          const status = row.status || row.Status || 'Active';

          // Validate required fields
          if (!name) {
            throw new Error('Name is required');
          }

          // Auto-generate teacher ID if not provided
          if (!teacherId) {
            maxNumber++;
            teacherId = `TCH${String(maxNumber).padStart(3, '0')}`;
          }

          // Parse subjects and classes if they're strings
          const subjectsArray = typeof subjects === 'string' 
            ? subjects.split(',').map(s => s.trim()).filter(s => s)
            : Array.isArray(subjects) ? subjects : [];

          const classesArray = typeof classes === 'string'
            ? classes.split(',').map(c => c.trim()).filter(c => c)
            : Array.isArray(classes) ? classes : [];

          // Create teacher data
          const teacherData: any = {
            teacherId,
            name,
            email,
            phone,
            subjects: subjectsArray,
            classes: classesArray,
            qualification,
            experience: Number(experience) || 0,
            status: status as 'Active' | 'Inactive',
          };

          // Create teacher
          await createTeacher(teacherData);
          successCount++;
        } catch (err: any) {
          errors.push(`Error importing ${row.name || 'Unknown'}: ${err.message}`);
          errorCount++;
        }
        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setIsImporting(false);

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} teacher(s)`, {
          duration: 5000,
        });
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} teacher(s)`, {
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
      setIsImporting(false);
      toast.error(`Failed to process file: ${err.message}`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = selectedTeachers.size > 0
      ? sortedTeachers.filter(t => selectedTeachers.has(t.teacherId))
      : sortedTeachers;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(t => ({
      teacherId: t.teacherId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      subjects: t.subjects.join(', '),
      classes: t.classes.join(', '),
      qualification: t.qualification || '',
      experience: t.experience || 0,
      status: t.status,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    XLSX.writeFile(workbook, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Exported ${dataToExport.length} teachers to Excel`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedTeachers.size > 0
      ? sortedTeachers.filter(t => selectedTeachers.has(t.teacherId))
      : sortedTeachers;

    const csv = Papa.unparse(dataToExport.map(t => ({
      teacherId: t.teacherId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      subjects: t.subjects.join(', '),
      classes: t.classes.join(', '),
      qualification: t.qualification || '',
      experience: t.experience || 0,
      status: t.status,
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} teachers to CSV`);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataToExport = selectedTeachers.size > 0
      ? sortedTeachers.filter(t => selectedTeachers.has(t.teacherId))
      : sortedTeachers;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} teachers to JSON`);
  };

  const allSelected = teachers.length > 0 && selectedTeachers.size === teachers.length;
  const someSelected = selectedTeachers.size > 0 && selectedTeachers.size < teachers.length;

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                β
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage teacher records with live database ({teachers.length} teachers)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={fillSampleData}
            >
              <Sparkles className="w-4 h-4" />
              Fill Sample Data
            </Button>
          </div>
        </div>

        {/* Teacher Management Action Bar - Excel-like grouped partitions */}
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
              {selectedTeachers.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedTeachers.size})
                </Button>
              )}
            </div>

            {/* Group 2: Import/Export Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</span>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 h-8"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              {teachers.length > 0 && (
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
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {(searchTerm || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                  className="h-8 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Group 4: View Mode Toggle */}
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View</span>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 rounded-none border-r ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 rounded-none ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading teachers</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={refresh} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && teachers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No teachers found</p>
              <p className="text-sm mt-1">Get started by adding your first teacher</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Teacher
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers Table */}
      {!loading && !error && sortedTeachers.length > 0 && (
        <>
          {viewMode === 'list' ? (
            // List View (Table)
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                            className={someSelected ? 'opacity-50' : ''}
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('teacherId')}
                        >
                          <div className="flex items-center gap-2">
                            Teacher ID
                            <SortIcon field="teacherId" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            <SortIcon field="name" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <SortIcon field="email" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('phone')}
                        >
                          <div className="flex items-center gap-2">
                            Phone
                            <SortIcon field="phone" />
                          </div>
                        </TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTeachers.map((teacher) => (
                        <TableRow key={teacher.teacherId} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedTeachers.has(teacher.teacherId)}
                              onCheckedChange={(checked) => 
                                handleSelectTeacher(teacher.teacherId, checked as boolean)
                              }
                              aria-label={`Select ${teacher.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            <button
                              onClick={() => handleView(teacher.teacherId)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              {teacher.teacherId}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => handleView(teacher.teacherId)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {teacher.name}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {teacher.email || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {teacher.phone || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects.length > 0 ? (
                                teacher.subjects.slice(0, 2).map((subject, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                              {teacher.subjects.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{teacher.subjects.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.classes.length > 0 ? (
                                teacher.classes.slice(0, 2).map((cls, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {cls}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                              {teacher.classes.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{teacher.classes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={teacher.status === 'Active' ? 'default' : 'secondary'}
                              className={
                                teacher.status === 'Active' 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-600'
                              }
                            >
                              {teacher.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(teacher.teacherId)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(teacher.teacherId)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(teacher)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Grid View (Cards)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTeachers.map((teacher) => (
                <Card key={teacher.teacherId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTeachers.has(teacher.teacherId)}
                          onCheckedChange={(checked) => 
                            handleSelectTeacher(teacher.teacherId, checked as boolean)
                          }
                          aria-label={`Select ${teacher.name}`}
                        />
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{teacher.name}</h3>
                          <Badge variant="outline" className="text-xs font-mono mt-1">
                            {teacher.teacherId}
                          </Badge>
                        </div>
                      </div>
                      <Badge 
                        variant={teacher.status === 'Active' ? 'default' : 'secondary'}
                        className={
                          teacher.status === 'Active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {teacher.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Contact Information */}
                    <div className="space-y-2 text-sm">
                      {teacher.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Subjects */}
                    {teacher.subjects.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Subjects</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.slice(0, 3).map((subject, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {teacher.subjects.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Classes */}
                    {teacher.classes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Classes</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.slice(0, 4).map((cls, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              Class {cls}
                            </Badge>
                          ))}
                          {teacher.classes.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.classes.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {teacher.experience && teacher.experience > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{teacher.experience}</span> years of experience
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(teacher.teacherId)}
                        className="flex-1 gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(teacher.teacherId)}
                        className="flex-1 gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(teacher)}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'Delete Teachers' : 'Delete Teacher'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedTeachers.size} teacher(s)? This action cannot be undone.`
            : `Are you sure you want to delete ${deleteDialog.teacher?.name}? This action cannot be undone.`
        }
      />
    </div>
  );
}