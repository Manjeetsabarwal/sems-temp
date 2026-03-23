import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Clock,
  BookOpen,
  ClipboardCheck,
  Save,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
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
import { lecturesService } from '../../services/lectures.service';
import { batchesService } from '../../services/batches.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import type { Lecture, CourseBatch } from '../../types';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type SortField = 'id' | 'topic' | 'teacherId' | 'subjectId' | 'dateTime' | 'durationMinutes';
type SortOrder = 'asc' | 'desc';

interface LectureFormData {
  batchId: number | '';
  teacherId: string;
  subjectId: string;
  dateTime: string;
  durationMinutes: number | '';
  topic: string;
}

const emptyForm: LectureFormData = {
  batchId: '',
  teacherId: '',
  subjectId: '',
  dateTime: '',
  durationMinutes: '',
  topic: '',
};

export default function LecturesAPI() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Data
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [batches, setBatches] = useState<Array<{ id: number; title: string; courseId: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form
  const [form, setForm] = useState<LectureFormData>(emptyForm);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    lecture?: Lecture;
    isBulk?: boolean;
  }>({ open: false });

  const {
    getPendingRecordId,
    clearPendingRecordId,
    currentView,
    pushNavigation,
    navigateToRecord,
    canGoBack,
    goBack,
  } = useApp();

  // Fetch lectures
  const fetchLectures = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lecturesService.getAll({
        batchId: batchFilter ? parseInt(batchFilter) : undefined,
        teacherId: teacherFilter || undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLectures(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches dropdown
  const fetchBatches = async () => {
    try {
      const data = await batchesService.getDropdown();
      setBatches(data);
    } catch (err: any) {
      console.error('Failed to fetch batches dropdown:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLectures();
    fetchBatches();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchLectures();
  }, [batchFilter, teacherFilter, dateFrom, dateTo, searchTerm]);

  // Check for pending record ID
  useEffect(() => {
    if (currentView === 'lectures' && viewMode === 'list' && lectures.length > 0) {
      const pendingId = getPendingRecordId('lectures');
      if (pendingId) {
        const id = parseInt(pendingId);
        const lecture = lectures.find((l) => l.id === id);
        if (lecture) {
          setSelectedLecture(lecture);
          setViewMode('view');
          clearPendingRecordId('lectures');
        } else {
          // Try fetching directly
          lecturesService
            .getById(id)
            .then((l) => {
              setSelectedLecture(l);
              setViewMode('view');
              clearPendingRecordId('lectures');
            })
            .catch(() => {
              clearPendingRecordId('lectures');
            });
        }
      }
    }
  }, [currentView, lectures, viewMode, getPendingRecordId, clearPendingRecordId]);

  // Sorting
  const sortedLectures = [...lectures].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  // Selection handlers
  const allSelected = lectures.length > 0 && selectedIds.size === lectures.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < lectures.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(lectures.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // CRUD handlers
  // Generate sample lecture data
  const fillSampleData = () => {
    const topics = [
      'Introduction to Algebra', 'Newton\'s Laws of Motion', 'Chemical Bonding',
      'Cell Structure and Function', 'Essay Writing Techniques', 'Trigonometry Basics',
      'Electromagnetic Waves', 'Organic Chemistry Fundamentals', 'Indian Independence Movement',
      'World Geography - Climate Zones', 'Data Structures & Algorithms', 'Probability & Statistics',
      'Shakespearean Literature', 'Vedic Mathematics', 'Environmental Science'
    ];
    const durations = [30, 40, 45, 50, 60, 90];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const duration = durations[Math.floor(Math.random() * durations.length)];
    // Generate a datetime in the next 7 days
    const futureDate = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    futureDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0); // 8am-4pm
    const dateTime = futureDate.toISOString().slice(0, 16);

    setForm({
      batchId: batches.length > 0 ? batches[Math.floor(Math.random() * batches.length)].id : '',
      teacherId: `TCH-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
      subjectId: `SUB-${String(Math.floor(Math.random() * 20)).padStart(3, '0')}`,
      dateTime,
      durationMinutes: duration,
      topic,
    });
    setViewMode('create');
    toast.success('Sample lecture data filled! Review and save.');
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setViewMode('create');
  };

  const handleView = async (lecture: Lecture) => {
    try {
      const full = await lecturesService.getById(lecture.id);
      setSelectedLecture(full);
      setViewMode('view');
    } catch {
      setSelectedLecture(lecture);
      setViewMode('view');
    }
  };

  const handleEdit = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setForm({
      batchId: lecture.batchId,
      teacherId: lecture.teacherId,
      subjectId: lecture.subjectId,
      dateTime: lecture.dateTime ? lecture.dateTime.slice(0, 16) : '',
      durationMinutes: lecture.durationMinutes,
      topic: lecture.topic,
    });
    setViewMode('edit');
  };

  const handleDeleteClick = (lecture: Lecture) => {
    setDeleteDialog({ open: true, lecture, isBulk: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.isBulk) {
        await lecturesService.bulkDelete(Array.from(selectedIds));
        toast.success(`Deleted ${selectedIds.size} lecture(s)`);
        setSelectedIds(new Set());
      } else if (deleteDialog.lecture) {
        await lecturesService.delete(deleteDialog.lecture.id);
        toast.success('Lecture deleted');
      }
      fetchLectures();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleteDialog({ open: false });
  };

  const handleSave = async () => {
    if (!form.batchId || !form.teacherId || !form.subjectId || !form.dateTime || !form.durationMinutes || !form.topic) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        batchId: Number(form.batchId),
        teacherId: form.teacherId,
        subjectId: form.subjectId,
        dateTime: new Date(form.dateTime).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        topic: form.topic,
      };

      if (viewMode === 'create') {
        await lecturesService.create(payload);
        toast.success('Lecture created successfully');
      } else if (viewMode === 'edit' && selectedLecture) {
        await lecturesService.update(selectedLecture.id, payload);
        toast.success('Lecture updated successfully');
      }

      setViewMode('list');
      setSelectedLecture(null);
      fetchLectures();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save lecture');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedLecture(null);
    setForm(emptyForm);
  };

  const handleTakeAttendance = (lectureId: number) => {
    pushNavigation('lectures', String(selectedLecture?.id || lectureId));
    navigateToRecord('attendance', String(lectureId));
  };

  const getBatchTitle = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.title || `Batch #${batchId}`;
  };

  const formatDateTime = (dt: string) => {
    try {
      return new Date(dt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dt;
    }
  };

  // ─── CREATE / EDIT FORM ─────────────────────────────────────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'create' ? 'Create Lecture' : 'Edit Lecture'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{viewMode === 'create' ? 'New Lecture Details' : `Edit Lecture #${selectedLecture?.id}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Batch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value ? parseInt(e.target.value) : '' })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher ID <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. TCH001"
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject ID <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. SUB001"
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="60"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value ? parseInt(e.target.value) : '' })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Lecture topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {viewMode === 'create' ? 'Create Lecture' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleBackToList} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── VIEW MODE ──────────────────────────────────────────────────────────────
  if (viewMode === 'view' && selectedLecture) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (canGoBack()) {
                goBack();
              } else {
                handleBackToList();
              }
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Lecture #{selectedLecture.id}</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => handleEdit(selectedLecture)} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              onClick={() => handleTakeAttendance(selectedLecture.id)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ClipboardCheck className="w-4 h-4" />
              Take Attendance
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {selectedLecture.topic}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Lecture ID</p>
                  <p className="text-sm font-mono mt-1">{selectedLecture.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Batch</p>
                  <p className="text-sm mt-1">
                    {selectedLecture.batch?.title || getBatchTitle(selectedLecture.batchId)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Teacher ID</p>
                  <p className="text-sm font-mono mt-1">{selectedLecture.teacherId}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Subject ID</p>
                  <p className="text-sm font-mono mt-1">{selectedLecture.subjectId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Date & Time</p>
                  <p className="text-sm mt-1">{formatDateTime(selectedLecture.dateTime)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {selectedLecture.durationMinutes} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance summary if available */}
            {selectedLecture.attendance && selectedLecture.attendance.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Attendance Summary</h3>
                <div className="flex gap-3">
                  <Badge className="bg-green-100 text-green-700">
                    Present: {selectedLecture.attendance.filter((a) => a.status === 'present').length}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700">
                    Absent: {selectedLecture.attendance.filter((a) => a.status === 'absent').length}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    Late: {selectedLecture.attendance.filter((a) => a.status === 'late').length}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700">
                    Excused: {selectedLecture.attendance.filter((a) => a.status === 'excused').length}
                  </Badge>
                </div>
              </div>
            )}

            {selectedLecture.createdAt && (
              <div className="mt-6 pt-4 border-t text-xs text-gray-400">
                Created: {formatDateTime(selectedLecture.createdAt)}
                {selectedLecture.updatedAt && <> | Updated: {formatDateTime(selectedLecture.updatedAt)}</>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Lectures Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                v4
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage lecture records ({lectures.length} lectures)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Lecture
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
            {/* Database group */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Database</span>
              <Button variant="outline" size="sm" onClick={fetchLectures} className="gap-2 h-8" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </Button>
              )}
            </div>

            {/* Filters group */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search lectures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
              <Input
                type="text"
                placeholder="Teacher ID"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="h-8 w-28"
              />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-36"
                title="Date from"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-36"
                title="Date to"
              />
              {(searchTerm || batchFilter || teacherFilter || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setBatchFilter('');
                    setTeacherFilter('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="h-8 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading lectures</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={fetchLectures} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && lectures.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No lectures found</p>
              <p className="text-sm mt-1">Get started by adding your first lecture</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Lecture
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && !error && sortedLectures.length > 0 && (
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
                    <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                      <div className="flex items-center gap-2">
                        ID
                        <SortIcon field="id" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('topic')}>
                      <div className="flex items-center gap-2">
                        Topic
                        <SortIcon field="topic" />
                      </div>
                    </TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('teacherId')}>
                      <div className="flex items-center gap-2">
                        Teacher
                        <SortIcon field="teacherId" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subjectId')}>
                      <div className="flex items-center gap-2">
                        Subject
                        <SortIcon field="subjectId" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateTime')}>
                      <div className="flex items-center gap-2">
                        Date/Time
                        <SortIcon field="dateTime" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('durationMinutes')}
                    >
                      <div className="flex items-center gap-2">
                        Duration
                        <SortIcon field="durationMinutes" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLectures.map((lecture) => (
                    <TableRow key={lecture.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(lecture.id)}
                          onCheckedChange={(checked) => handleSelectOne(lecture.id, checked as boolean)}
                          aria-label={`Select lecture ${lecture.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <button
                          onClick={() => handleView(lecture)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {lecture.id}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <button
                          onClick={() => handleView(lecture)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {lecture.topic}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {lecture.batch?.title || getBatchTitle(lecture.batchId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{lecture.teacherId}</TableCell>
                      <TableCell className="font-mono text-sm">{lecture.subjectId}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(lecture.dateTime)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {lecture.durationMinutes}m
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(lecture)} className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(lecture)} className="h-8 w-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(lecture)}
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

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'Delete Lectures' : 'Delete Lecture'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedIds.size} lecture(s)? This action cannot be undone.`
            : `Are you sure you want to delete lecture "${deleteDialog.lecture?.topic}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
