import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Copy, Download, Upload, FileSpreadsheet, File, RefreshCw, BookOpen, Database, FileJson, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Subject } from '../../types';
import { subjectsService } from '../../services/subjects.service';
import { classesService } from '../../services/classes.service';
import { toast } from 'sonner';
import { AutoDatabaseSetup } from '../AutoDatabaseSetup';
import { DatabaseSchemaFix } from '../DatabaseSchemaFix';
import { databaseCheckerService } from '../../services/database-checker.service';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type SortField = 'subjectId' | 'subjectName' | 'subjectCode' | 'classId' | 'status';
type SortOrder = 'asc' | 'desc';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const STATUSES = ['Active', 'Inactive'] as const;

export default function SubjectsAPI() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showSchemaFix, setShowSchemaFix] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('subjectId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load subjects on mount
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

      loadSubjects();
    } catch (error) {
      console.error('Error checking database:', error);
      loadSubjects(); // Try to load anyway
    }
  };

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await subjectsService.getAll();
      setSubjects(data);
      setFilteredSubjects(data);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects: ' + error.message);
      setSubjects([]);
      setFilteredSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and search
  React.useEffect(() => {
    let result = [...subjects];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Class filter
    if (classFilter) {
      result = result.filter((s) => s.classId === classFilter);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
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

    setFilteredSubjects(result);
  }, [subjects, searchQuery, classFilter, statusFilter, sortField, sortOrder]);

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
    setSelectedSubject(null);
    setViewMode('create');
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('edit');
  };

  const handleView = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('view');
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await subjectsService.delete(subjectId);
      toast.success('Subject deleted successfully');
      loadSubjects();
    } catch (error: any) {
      toast.error('Failed to delete subject: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No subjects selected');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} subject(s)?`
      )
    )
      return;

    try {
      await subjectsService.bulkDelete(Array.from(selectedIds));
      toast.success(`${selectedIds.size} subject(s) deleted successfully`);
      setSelectedIds(new Set());
      loadSubjects();
    } catch (error: any) {
      toast.error('Failed to delete subjects: ' + error.message);
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
    if (selectedIds.size === filteredSubjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubjects.map((s) => s.subjectId)));
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Subject ID',
      'Subject Name',
      'Subject Code',
      'Class',
      'Description',
      'Credits',
      'Hours/Week',
      'Teacher',
      'Status',
    ];
    const rows = filteredSubjects.map((s) => [
      s.subjectId,
      s.subjectName,
      s.subjectCode,
      s.classId,
      s.description || '',
      s.credits || '',
      s.hoursPerWeek || '',
      s.teacherName || '',
      s.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported ' + filteredSubjects.length + ' subjects to CSV');
  };

  const exportToJSON = () => {
    const json = JSON.stringify(filteredSubjects, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Exported ' + filteredSubjects.length + ' subjects to JSON');
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
          const subject: Omit<Subject, 'createdAt' | 'updatedAt'> = {
            subjectId: values[0] || `SUB${Date.now()}_${i}`,
            subjectName: values[1] || '',
            subjectCode: values[2] || '',
            classId: values[3] || '',
            description: values[4] || undefined,
            credits: values[5] ? parseInt(values[5]) : undefined,
            hoursPerWeek: values[6] ? parseInt(values[6]) : undefined,
            teacherName: values[7] || undefined,
            status: (values[8] as 'Active' | 'Inactive') || 'Active',
          };

          try {
            await subjectsService.create(subject);
            imported++;
          } catch (error) {
            console.error('Error importing subject:', error);
            errors++;
          }
        }

        toast.success(
          `Imported ${imported} subjects` +
            (errors > 0 ? `, ${errors} errors` : '')
        );
        loadSubjects();
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
    loadSubjects();
    toast.success('Subjects refreshed');
  };

  // Show database setup guide
  if (showSetupGuide) {
    return (
      <AutoDatabaseSetup onComplete={() => {
        setShowSetupGuide(false);
        loadSubjects();
      }} />
    );
  }

  // Show schema fix screen
  if (showSchemaFix) {
    return (
      <DatabaseSchemaFix 
        onComplete={() => {
          setShowSchemaFix(false);
          loadSubjects();
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
    return (
      <SubjectForm
        mode="create"
        existingSubjects={subjects}
        onSave={async (subject) => {
          try {
            await subjectsService.create(subject);
            toast.success('Subject created successfully');
            setViewMode('list');
            loadSubjects();
          } catch (error: any) {
            toast.error('Failed to create subject: ' + error.message);
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // EDIT VIEW
  if (viewMode === 'edit' && selectedSubject) {
    return (
      <SubjectForm
        mode="edit"
        subject={selectedSubject}
        onSave={async (updates) => {
          try {
            await subjectsService.update(selectedSubject.subjectId, updates);
            toast.success('Subject updated successfully');
            setViewMode('list');
            loadSubjects();
          } catch (error: any) {
            toast.error('Failed to update subject: ' + error.message);
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // VIEW DETAILS
  if (viewMode === 'view' && selectedSubject) {
    return (
      <SubjectDetails
        subject={selectedSubject}
        onEdit={() => setViewMode('edit')}
        onClose={() => setViewMode('list')}
        onDelete={async () => {
          await handleDelete(selectedSubject.subjectId);
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
              <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                β
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage subjects with live database ({subjects.length} subjects)
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
              Add Subject
            </Button>
          </div>
        </div>

        {/* Subjects Management Action Bar - Excel-like grouped partitions */}
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
              {subjects.length > 0 && (
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
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
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
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
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
        <div className="sticky top-[190px] z-10 bg-green-50 border border-green-200 rounded-lg p-3 mb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredSubjects.length && filteredSubjects.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-green-900">
                {selectedIds.size} subject(s) selected
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subjects found</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Subject
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
                        selectedIds.size === filteredSubjects.length &&
                        filteredSubjects.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subjectId')}
                  >
                    <div className="flex items-center gap-2">
                      Subject ID
                      <SortIcon field="subjectId" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subjectName')}
                  >
                    <div className="flex items-center gap-2">
                      Subject Name
                      <SortIcon field="subjectName" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subjectCode')}
                  >
                    <div className="flex items-center gap-2">
                      Code
                      <SortIcon field="subjectCode" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('classId')}
                  >
                    <div className="flex items-center gap-2">
                      Class
                      <SortIcon field="classId" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
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
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.subjectId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(subject.subjectId)}
                        onChange={() => toggleSelection(subject.subjectId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(subject)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {subject.subjectId}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(subject.subjectId);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(subject)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {subject.subjectName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{subject.subjectCode}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {subject.classId ? `Class ${subject.classId}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">
                          {subject.teacherName || '-'}
                        </span>
                        {subject.teachers && subject.teachers.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            +{subject.teachers.length - 1}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={subject.status === 'Active' ? 'default' : 'secondary'}
                        className={
                          subject.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {subject.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(subject)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subject.subjectId)}
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
        Showing {filteredSubjects.length} of {subjects.length} subjects
      </div>
    </div>
  );
}

// SUBJECT FORM COMPONENT
interface SubjectFormProps {
  mode: 'create' | 'edit';
  subject?: Subject;
  existingSubjects?: Subject[];
  onSave: (subject: Omit<Subject, 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function SubjectForm({ mode, subject, existingSubjects, onSave, onCancel }: SubjectFormProps) {
  // Generate the next sequential subject ID
  const generateSubjectId = (): string => {
    if (!existingSubjects || existingSubjects.length === 0) {
      return 'SUB001';
    }

    // Extract numeric parts from existing IDs
    const existingNumbers = existingSubjects
      .map(s => {
        const match = s.subjectId.match(/^SUB(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    // Find the maximum number
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    // Generate next ID with zero padding
    return `SUB${String(maxNum + 1).padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState({
    subjectId: subject?.subjectId || (mode === 'create' ? generateSubjectId() : ''),
    subjectName: subject?.subjectName || '',
    subjectCode: subject?.subjectCode || '',
    classId: subject?.classId || '',
    description: subject?.description || '',
    credits: subject?.credits || '',
    hoursPerWeek: subject?.hoursPerWeek || '',
    status: subject?.status || 'Active',
  });

  // Class options
  const [classOptions, setClassOptions] = useState<Array<{ classId: string; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load options on mount
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      console.log('🔄 Loading class options...');
      const classes = await classesService.getForDropdown();
      console.log('✅ Loaded classes:', classes.length, classes);
      setClassOptions(classes);
      
      if (classes.length === 0) {
        console.warn('⚠️ No classes found. Please create classes first.');
        toast.warning('No classes found. Please create classes first to assign subjects to classes.');
      }
    } catch (error: any) {
      console.error('❌ Error loading options:', error);
      toast.error(`Failed to load options: ${error.message}`);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Generate sample data
  const fillSampleData = async () => {
    // Subject names and codes
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Study of numbers, quantities, and shapes', credits: 4, hours: 6 },
      { name: 'Physics', code: 'PHYS', description: 'Study of matter, motion, and energy', credits: 4, hours: 5 },
      { name: 'Chemistry', code: 'CHEM', description: 'Study of substances and their properties', credits: 4, hours: 5 },
      { name: 'Biology', code: 'BIO', description: 'Study of living organisms', credits: 3, hours: 4 },
      { name: 'English', code: 'ENG', description: 'Language and literature studies', credits: 3, hours: 5 },
      { name: 'Hindi', code: 'HIN', description: 'Hindi language and literature', credits: 3, hours: 4 },
      { name: 'History', code: 'HIST', description: 'Study of past events', credits: 3, hours: 4 },
      { name: 'Geography', code: 'GEO', description: 'Study of Earth and its features', credits: 3, hours: 4 },
      { name: 'Economics', code: 'ECO', description: 'Study of production and consumption', credits: 3, hours: 4 },
      { name: 'Computer Science', code: 'CS', description: 'Study of computers and programming', credits: 4, hours: 5 },
      { name: 'Physical Education', code: 'PE', description: 'Physical fitness and sports', credits: 2, hours: 2 },
      { name: 'Art', code: 'ART', description: 'Creative and visual arts', credits: 2, hours: 2 },
      { name: 'Music', code: 'MUS', description: 'Musical theory and practice', credits: 2, hours: 2 },
      { name: 'Social Studies', code: 'SOC', description: 'Integrated study of social sciences', credits: 3, hours: 4 },
      { name: 'Sanskrit', code: 'SAN', description: 'Classical language studies', credits: 2, hours: 3 },
      { name: 'French', code: 'FRE', description: 'French language and culture', credits: 2, hours: 3 },
    ];

    // Generate unique subject ID
    const newSubjectId = generateSubjectId();

    // Select random subject (avoid duplicates)
    const usedCodes = existingSubjects?.map(s => s.subjectCode) || [];
    const availableSubjects = subjects.filter(s => !usedCodes.includes(s.code));
    const selectedSubject = availableSubjects.length > 0
      ? availableSubjects[Math.floor(Math.random() * availableSubjects.length)]
      : subjects[Math.floor(Math.random() * subjects.length)];

    // Generate subject code (no class suffix since subjects are independent)
    const subjectCode = `${selectedSubject.code}${String(Math.floor(Math.random() * 900) + 100)}`;

    // Random class (optional - subjects are now independent)
    const classId = classOptions.length > 0
      ? (Math.random() > 0.3 ? classOptions[Math.floor(Math.random() * classOptions.length)].classId : '')
      : '';

    // Random credits (2-4)
    const credits = selectedSubject.credits || Math.floor(Math.random() * 3) + 2;

    // Random hours per week (2-6)
    const hoursPerWeek = selectedSubject.hours || Math.floor(Math.random() * 5) + 2;

    // Mostly Active (80% chance)
    const status = Math.random() > 0.2 ? 'Active' : 'Inactive';

    // Update form data
    setFormData({
      subjectId: newSubjectId,
      subjectName: selectedSubject.name,
      subjectCode: subjectCode,
      classId: classId,
      description: selectedSubject.description,
      credits: String(credits),
      hoursPerWeek: String(hoursPerWeek),
      status: status as 'Active' | 'Inactive',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.subjectName.trim()) {
      toast.error('Subject name is required');
      return;
    }
    if (!formData.subjectCode.trim()) {
      toast.error('Subject code is required');
      return;
    }
    // Note: classId is now optional in the normalized schema

    const subjectData: any = {
      subjectId: formData.subjectId || generateSubjectId(),
      subjectName: formData.subjectName.trim(),
      subjectCode: formData.subjectCode.trim(),
      classId: formData.classId || null, // Optional now
      description: formData.description.trim() || undefined,
      credits: formData.credits ? parseInt(formData.credits as any) : undefined,
      hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek as any) : undefined,
      status: formData.status as 'Active' | 'Inactive',
    };

    // Check for duplicate subject code
    if (mode === 'create' && existingSubjects?.some(s => s.subjectCode === subjectData.subjectCode)) {
      toast.error('Subject code already exists');
      return;
    }

    onSave(subjectData);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Subject' : 'Edit Subject'}
            </h2>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Subject ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject ID {mode === 'create' && '(auto-generated)'}
                </label>
                <input
                  type="text"
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  disabled={mode === 'edit'}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Auto-generated"
                />
              </div>

              {/* Subject Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={formData.subjectCode}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectCode: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
            </div>

            {/* Subject Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name *
              </label>
              <input
                type="text"
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData({ ...formData, subjectName: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Class (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                {loadingOptions ? (
                  <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading classes...
                  </div>
                ) : classOptions.length === 0 ? (
                  <div className="w-full px-4 py-2 border rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                    No classes available. Create classes first.
                  </div>
                ) : (
                  <select
                    value={formData.classId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value || '' })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">No specific class</option>
                    {classOptions.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.name || cls.classId}
                      </option>
                    ))}
                  </select>
                )}
                {classOptions.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ No classes found. Please create classes first.
                  </p>
                )}
                {classOptions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Subjects can be independent or linked to a class ({classOptions.length} classes available)
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the subject"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits
                </label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) =>
                    setFormData({ ...formData, credits: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="e.g., 4"
                />
              </div>

              {/* Hours Per Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours/Week
                </label>
                <input
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, hoursPerWeek: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {mode === 'create' ? 'Create Subject' : 'Update Subject'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// SUBJECT DETAILS COMPONENT
interface SubjectDetailsProps {
  subject: Subject;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}

function SubjectDetails({
  subject,
  onEdit,
  onClose,
  onDelete,
}: SubjectDetailsProps) {
  const { navigateToRecord, pushNavigation } = useApp();

  const handleClassClick = (classId: string) => {
    pushNavigation('subjects', subject.subjectId);
    navigateToRecord('classes', classId);
  };

  const handleTeacherClick = (teacherId: string) => {
    pushNavigation('subjects', subject.subjectId);
    navigateToRecord('teachers', teacherId);
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
                  {subject.subjectName}
                </h2>
                <p className="text-gray-500 mt-1">
                  Subject ID: {subject.subjectId}
                </p>
              </div>
              <Badge
                variant={subject.status === 'Active' ? 'default' : 'secondary'}
                className={
                  subject.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {subject.status}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Subject Code
                </label>
                <p className="mt-1 text-gray-900">{subject.subjectCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Class
                </label>
                {subject.classId ? (
                  <button
                    onClick={() => handleClassClick(subject.classId!)}
                    className="mt-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Class {subject.classId}
                  </button>
                ) : (
                  <p className="mt-1 text-gray-900">Not assigned to a specific class</p>
                )}
              </div>
              {subject.credits && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Credits
                  </label>
                  <p className="mt-1 text-gray-900">{subject.credits}</p>
                </div>
              )}
              {subject.hoursPerWeek && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Hours per Week
                  </label>
                  <p className="mt-1 text-gray-900">{subject.hoursPerWeek}</p>
                </div>
              )}
            </div>

            {/* Teachers */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Teachers
              </label>
              {subject.teachers && subject.teachers.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {subject.teachers.map((teacher) => (
                    <button
                      key={teacher.teacherId}
                      onClick={() => handleTeacherClick(teacher.teacherId)}
                      className="inline-flex items-center"
                    >
                      <Badge
                        variant={teacher.isPrimary ? 'default' : 'outline'}
                        className={`${teacher.isPrimary ? 'bg-blue-600' : ''} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        {teacher.name}
                        {teacher.isPrimary && ' (Primary)'}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : subject.teacherName ? (
                <p className="mt-1 text-gray-900">{subject.teacherName}</p>
              ) : (
                <p className="mt-1 text-gray-500">No teachers assigned</p>
              )}
            </div>

            {subject.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="mt-1 text-gray-900">{subject.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-6 flex gap-3">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Subject
            </Button>
            <Button variant="outline" onClick={onClose}>
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