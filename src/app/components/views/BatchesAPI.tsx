import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Database,
  X,
  Users,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { toast } from 'sonner';
import { batchesService } from '../../services/batches.service';
import { coursesService } from '../../services/courses.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { BatchDetails } from './BatchDetails';
import type { CourseBatch } from '../../types';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type SortField = 'id' | 'title' | 'startDate' | 'endDate' | 'isCompleted';
type SortOrder = 'asc' | 'desc';

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BatchesAPI() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>();

  // Data state
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [completionFilter, setCompletionFilter] = useState<string>('');

  // Dropdown data
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; title: string }>>([]);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedBatches, setSelectedBatches] = useState<Set<number>>(new Set());

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    batch?: CourseBatch;
    isBulk?: boolean;
  }>({ open: false });

  // App context for cross-module navigation
  const {
    goBack,
    canGoBack,
    pushNavigation,
    navigateToRecord,
    getPendingRecordId,
    clearPendingRecordId,
  } = useApp();

  // Load batches
  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: {
        courseId?: number;
        classId?: string;
        isCompleted?: boolean;
        search?: string;
      } = {};

      if (searchTerm) filters.search = searchTerm;
      if (courseFilter) filters.courseId = Number(courseFilter);
      if (classFilter) filters.classId = classFilter;
      if (completionFilter === 'completed') filters.isCompleted = true;
      if (completionFilter === 'active') filters.isCompleted = false;

      const data = await batchesService.getAll(filters);
      setBatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load batches');
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, courseFilter, classFilter, completionFilter]);

  // Load course dropdown options
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await coursesService.getDropdown();
        setCourseOptions(data);
      } catch {
        // silently fail for dropdown
      }
    };
    loadCourses();
  }, []);

  // Fetch batches on mount and filter changes
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Check for pending record ID on mount
  useEffect(() => {
    if (viewMode === 'list' && batches.length > 0) {
      const pendingId = getPendingRecordId('batches');
      if (pendingId) {
        const numericId = Number(pendingId);
        const timer = setTimeout(() => {
          const batchExists = batches.find((b) => b.id === numericId);
          if (batchExists) {
            setViewMode('view');
            setSelectedBatchId(numericId);
            clearPendingRecordId('batches');
          } else {
            // Retry after a short delay
            setTimeout(() => {
              const retryBatch = batches.find((b) => b.id === numericId);
              if (retryBatch) {
                setViewMode('view');
                setSelectedBatchId(numericId);
                clearPendingRecordId('batches');
              }
            }, 500);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [viewMode, batches, getPendingRecordId, clearPendingRecordId]);

  // Sort batches
  const sortedBatches = [...batches].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'id':
        aVal = a.id;
        bVal = b.id;
        break;
      case 'title':
        aVal = a.title?.toLowerCase() || '';
        bVal = b.title?.toLowerCase() || '';
        break;
      case 'startDate':
        aVal = a.startDate || '';
        bVal = b.startDate || '';
        break;
      case 'endDate':
        aVal = a.endDate || '';
        bVal = b.endDate || '';
        break;
      case 'isCompleted':
        aVal = a.isCompleted ? 1 : 0;
        bVal = b.isCompleted ? 1 : 0;
        break;
      default:
        aVal = a.id;
        bVal = b.id;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Handlers
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedBatchId(undefined);
  };

  // Generate sample batch data
  const fillSampleData = () => {
    setViewMode('create');
    setSelectedBatchId(undefined);
    toast.success('Opening create form — fill in sample data from the batch details page.');
  };

  const handleCreate = () => {
    setViewMode('create');
    setSelectedBatchId(undefined);
  };

  const handleView = (id: number) => {
    setViewMode('view');
    setSelectedBatchId(id);
  };

  const handleEdit = (id: number) => {
    setViewMode('edit');
    setSelectedBatchId(id);
  };

  const handleDeleteClick = (batch: CourseBatch) => {
    setDeleteDialog({ open: true, batch, isBulk: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.isBulk) {
        await batchesService.bulkDelete(Array.from(selectedBatches));
        toast.success(`Deleted ${selectedBatches.size} batch(es) successfully`);
        setSelectedBatches(new Set());
      } else if (deleteDialog.batch) {
        await batchesService.delete(deleteDialog.batch.id);
        toast.success(`Deleted batch "${deleteDialog.batch.title}" successfully`);
      }
      loadBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleteDialog({ open: false });
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
      setSelectedBatches(new Set(sortedBatches.map((b) => b.id)));
    } else {
      setSelectedBatches(new Set());
    }
  };

  const handleSelectBatch = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedBatches);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedBatches(newSelected);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCourseFilter('');
    setClassFilter('');
    setCompletionFilter('');
  };

  const hasFilters = searchTerm || courseFilter || classFilter || completionFilter;

  const allSelected = sortedBatches.length > 0 && selectedBatches.size === sortedBatches.length;
  const someSelected = selectedBatches.size > 0 && selectedBatches.size < sortedBatches.length;

  // Unique class values from batches for filter dropdown
  const classOptions = Array.from(new Set(batches.map((b) => b.classId).filter(Boolean))) as string[];

  // Show detail views
  if (viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') {
    return (
      <BatchDetails
        mode={viewMode}
        batchId={selectedBatchId}
        onBack={handleBackToList}
        onSuccess={() => {
          handleBackToList();
          loadBatches();
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
              <h1 className="text-2xl font-bold text-gray-900">Batches Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                β
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage course batches with live database ({batches.length} batches)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Batch
            </Button>
            <Button variant="outline" className="gap-2" onClick={fillSampleData}>
              <Sparkles className="w-4 h-4" />
              Fill Sample Data
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Group 1: Database Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Database</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBatches}
                className="gap-2 h-8"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {selectedBatches.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedBatches.size})
                </Button>
              )}
            </div>

            {/* Group 2: Filters */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Courses</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Classes</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
              <select
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
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
              <p className="font-medium">Error loading batches</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={loadBatches} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && batches.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No batches found</p>
              <p className="text-sm mt-1">Get started by adding your first batch</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches Table */}
      {!loading && !error && sortedBatches.length > 0 && (
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
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-2">
                        ID
                        <SortIcon field="id" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <SortIcon field="title" />
                      </div>
                    </TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center gap-2">
                        Start Date
                        <SortIcon field="startDate" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('endDate')}
                    >
                      <div className="flex items-center gap-2">
                        End Date
                        <SortIcon field="endDate" />
                      </div>
                    </TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('isCompleted')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="isCompleted" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBatches.map((batch) => (
                    <TableRow key={batch.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedBatches.has(batch.id)}
                          onCheckedChange={(checked) =>
                            handleSelectBatch(batch.id, checked as boolean)
                          }
                          aria-label={`Select ${batch.title}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <button
                          onClick={() => handleView(batch.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          #{batch.id}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleView(batch.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {batch.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {batch.course?.title || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {batch.classId ? (
                          <Badge variant="secondary" className="text-xs">
                            Class {batch.classId}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(batch.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(batch.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{batch.batchTeachers?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Users className="w-3.5 h-3.5" />
                          <span>{batch.batchStudents?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={batch.isCompleted ? 'secondary' : 'default'}
                          className={
                            batch.isCompleted
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }
                        >
                          {batch.isCompleted ? 'Completed' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(batch.id)}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(batch.id)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(batch)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
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
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'Delete Batches' : 'Delete Batch'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedBatches.size} batch(es)? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteDialog.batch?.title}"? This action cannot be undone.`
        }
        count={deleteDialog.isBulk ? selectedBatches.size : undefined}
      />
    </div>
  );
}
