import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileSpreadsheet, File, RefreshCw, Database, FileJson, X, LayoutGrid, List as ListIcon, Users, BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useClasses } from '../../hooks/useClasses';
import { classesService } from '../../services/classes.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { AutoDatabaseSetup } from '../AutoDatabaseSetup';
import { ClassDetails } from './ClassDetails';
import type { ClassExtended } from '../../types';
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

type SortField = 'classId' | 'name' | 'capacity' | 'currentStrength';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export function ClassesAPI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [sortField, setSortField] = useState<SortField>('classId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import loading state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    classData?: ClassExtended;
    isBulk?: boolean;
  }>({ open: false });

  const {
    classes,
    loading,
    error,
    deleteClass,
    createClass,
    updateClass,
    bulkDeleteClasses,
    refresh,
  } = useClasses({
    status: statusFilter || undefined,
    search: searchTerm,
  });

  const { getPendingRecordId, clearPendingRecordId, currentView } = useApp();

  // Check for pending record ID when component mounts or view changes to classes
  useEffect(() => {
    if (currentView === 'classes' && !detailsMode && classes.length > 0) {
      const pendingId = getPendingRecordId('classes');
      if (pendingId) {
        // Wait a bit for classes to load
        const timer = setTimeout(() => {
          const classExists = classes.find(c => c.classId === pendingId);
          if (classExists) {
            setDetailsMode('view');
            setSelectedClassId(pendingId);
            clearPendingRecordId('classes');
          } else {
            // If class not found yet, wait a bit more
            setTimeout(() => {
              const classExistsRetry = classes.find(c => c.classId === pendingId);
              if (classExistsRetry) {
                setDetailsMode('view');
                setSelectedClassId(pendingId);
                clearPendingRecordId('classes');
              }
            }, 500);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView, classes, detailsMode, getPendingRecordId, clearPendingRecordId]);

  // Sort classes
  const sortedClasses = [...classes].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Generate sample data for quick class creation
  const fillSampleData = async () => {
    // Sample class data
    const sampleClasses = [
      { name: '1', capacity: 40, description: 'First Grade - Primary' },
      { name: '2', capacity: 40, description: 'Second Grade - Primary' },
      { name: '3', capacity: 40, description: 'Third Grade - Primary' },
      { name: '4', capacity: 40, description: 'Fourth Grade - Primary' },
      { name: '5', capacity: 40, description: 'Fifth Grade - Primary' },
      { name: '6', capacity: 45, description: 'Sixth Grade - Middle School' },
      { name: '7', capacity: 45, description: 'Seventh Grade - Middle School' },
      { name: '8', capacity: 45, description: 'Eighth Grade - Middle School' },
      { name: '9', capacity: 50, description: 'Ninth Grade - High School' },
      { name: '10', capacity: 50, description: 'Tenth Grade - High School' },
      { name: '11', capacity: 40, description: 'Eleventh Grade - Senior Secondary' },
      { name: '12', capacity: 40, description: 'Twelfth Grade - Senior Secondary' },
    ];

    // Pick a random class that doesn't already exist
    const existingClassNames = classes.map(c => c.name);
    const availableClasses = sampleClasses.filter(c => !existingClassNames.includes(c.name));
    
    if (availableClasses.length === 0) {
      toast.error('All sample classes already exist!');
      return;
    }

    const selectedClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
    const classId = `CLASS-${selectedClass.name}`;

    const classData = {
      classId,
      name: selectedClass.name,
      capacity: selectedClass.capacity,
      description: selectedClass.description,
      status: 'Active' as const,
    };

    try {
      await createClass(classData);
      toast.success(`Sample class "${selectedClass.name}" created successfully!`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sample class');
    }
  };

  // Open page handlers
  const handleCreate = () => {
    setDetailsMode('create');
    setSelectedClassId(undefined);
  };

  const handleView = (classId: string) => {
    setDetailsMode('view');
    setSelectedClassId(classId);
  };

  const handleEdit = (classId: string) => {
    setDetailsMode('edit');
    setSelectedClassId(classId);
  };

  const handleDeleteClick = (classData: ClassExtended) => {
    setDeleteDialog({ open: true, classData, isBulk: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      try {
        await bulkDeleteClasses(Array.from(selectedClasses));
        setSelectedClasses(new Set());
      } catch (err: any) {
        // Error already handled in hook
      }
    } else if (deleteDialog.classData) {
      // Single delete
      try {
        await deleteClass(deleteDialog.classData.classId);
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
      setSelectedClasses(new Set(classes.map(c => c.classId)));
    } else {
      setSelectedClasses(new Set());
    }
  };

  const handleSelectClass = (classId: string, checked: boolean) => {
    const newSelected = new Set(selectedClasses);
    if (checked) {
      newSelected.add(classId);
    } else {
      newSelected.delete(classId);
    }
    setSelectedClasses(newSelected);
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
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else if (fileExtension === 'json') {
        const text = await file.text();
        rows = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format');
      }

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          const classId = row.classId || row.ClassID || row.class_id;
          const name = row.name || row.Name;
          const description = row.description || row.Description || '';
          const capacity = row.capacity || row.Capacity;
          const status = row.status || row.Status || 'Active';

          if (!classId || !name) {
            throw new Error('ClassID and Name are required');
          }

          await createClass({
            classId,
            name,
            description,
            capacity: capacity ? Number(capacity) : undefined,
            status: status as 'Active' | 'Inactive',
          });
          successCount++;
        } catch (err: any) {
          errors.push(`Error importing ${row.name || 'Unknown'}: ${err.message}`);
          errorCount++;
        }
        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setIsImporting(false);

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} class(es)`, {
          duration: 5000,
        });
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} class(es)`, {
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
        });
      }

      refresh();
      
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
    const dataToExport = selectedClasses.size > 0
      ? sortedClasses.filter(c => selectedClasses.has(c.classId))
      : sortedClasses;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(c => ({
      classId: c.classId,
      name: c.name,
      description: c.description || '',
      capacity: c.capacity || 0,
      currentStrength: c.currentStrength || 0,
      status: c.status,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Classes');
    XLSX.writeFile(workbook, `classes_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Exported ${dataToExport.length} classes to Excel`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedClasses.size > 0
      ? sortedClasses.filter(c => selectedClasses.has(c.classId))
      : sortedClasses;

    const csv = Papa.unparse(dataToExport.map(c => ({
      classId: c.classId,
      name: c.name,
      description: c.description || '',
      capacity: c.capacity || 0,
      currentStrength: c.currentStrength || 0,
      status: c.status,
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `classes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} classes to CSV`);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataToExport = selectedClasses.size > 0
      ? sortedClasses.filter(c => selectedClasses.has(c.classId))
      : sortedClasses;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `classes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} classes to JSON`);
  };

  const allSelected = classes.length > 0 && selectedClasses.size === classes.length;
  const someSelected = selectedClasses.size > 0 && selectedClasses.size < classes.length;

  // Show details page
  if (detailsMode) {
    return (
      <ClassDetails
        mode={detailsMode}
        classId={selectedClassId}
        onBack={() => {
          setDetailsMode(null);
          setSelectedClassId(undefined);
        }}
        onSuccess={() => {
          setDetailsMode(null);
          setSelectedClassId(undefined);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                β
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage class records with live database ({classes.length} classes)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Class
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

        {/* Class Management Action Bar - Excel-like grouped partitions */}
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
              {selectedClasses.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedClasses.size})
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
              {classes.length > 0 && (
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
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search classes..."
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

            {/* Group 4: View Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View</span>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 rounded-none border-r border-gray-300"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 rounded-none"
                >
                  <ListIcon className="w-4 h-4" />
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
              <p className="font-medium">Error loading classes</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={refresh} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No classes found</p>
              <p className="text-sm mt-1">Get started by adding your first class</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!loading && !error && sortedClasses.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClasses.map((classData) => (
            <Card key={classData.classId} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{classData.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {classData.classId}
                      </Badge>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedClasses.has(classData.classId)}
                    onCheckedChange={(checked) => 
                      handleSelectClass(classData.classId, checked as boolean)
                    }
                  />
                </div>

                {classData.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {classData.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Students
                    </span>
                    <span className="font-semibold">
                      {classData.currentStrength || 0}
                      {classData.capacity ? ` / ${classData.capacity}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge 
                    variant={classData.status === 'Active' ? 'default' : 'secondary'}
                    className={
                      classData.status === 'Active' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600'
                    }
                  >
                    {classData.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(classData.classId)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(classData.classId)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(classData)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && !error && sortedClasses.length > 0 && viewMode === 'list' && (
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
                      onClick={() => handleSort('classId')}
                    >
                      <div className="flex items-center gap-2">
                        Class ID
                        <SortIcon field="classId" />
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
                    <TableHead>Description</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('capacity')}
                    >
                      <div className="flex items-center gap-2">
                        Capacity
                        <SortIcon field="capacity" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('currentStrength')}
                    >
                      <div className="flex items-center gap-2">
                        Current Strength
                        <SortIcon field="currentStrength" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClasses.map((classData) => (
                    <TableRow key={classData.classId} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedClasses.has(classData.classId)}
                          onCheckedChange={(checked) => 
                            handleSelectClass(classData.classId, checked as boolean)
                          }
                          aria-label={`Select ${classData.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <button
                          onClick={() => handleView(classData.classId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {classData.classId}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleView(classData.classId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {classData.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {classData.description || '—'}
                      </TableCell>
                      <TableCell>{classData.capacity || '—'}</TableCell>
                      <TableCell>{classData.currentStrength || 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={classData.status === 'Active' ? 'default' : 'secondary'}
                          className={
                            classData.status === 'Active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {classData.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(classData.classId)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(classData.classId)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(classData)}
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
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'Delete Classes' : 'Delete Class'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedClasses.size} class(es)? This action cannot be undone.`
            : `Are you sure you want to delete class "${deleteDialog.classData?.name}"? This action cannot be undone.`
        }
      />
    </div>
  );
}