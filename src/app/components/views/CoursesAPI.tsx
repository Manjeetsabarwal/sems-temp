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
  Copy,
  RefreshCw,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Clock,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Course, CourseBatch } from '../../types';
import { coursesService } from '../../services/courses.service';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type SortField = 'id' | 'title' | 'class' | 'stream' | 'durationDays';
type SortOrder = 'asc' | 'desc';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const STREAMS = ['Science', 'Commerce', 'Arts', 'General'];

export default function CoursesAPI() {
  const { goBack, navigateToRecord, canGoBack, pushNavigation, getPendingRecordId, clearPendingRecordId } = useApp();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [streamFilter, setStreamFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Handle pending record navigation (cross-module)
  useEffect(() => {
    const pendingId = getPendingRecordId('courses');
    if (pendingId) {
      clearPendingRecordId('courses');
      loadAndViewCourse(parseInt(pendingId, 10));
    }
  }, []);

  const loadAndViewCourse = async (id: number) => {
    try {
      setIsLoading(true);
      const course = await coursesService.getById(id);
      setSelectedCourse(course);
      setViewMode('view');
    } catch (error: any) {
      toast.error('Failed to load course: ' + error.message);
      setViewMode('list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await coursesService.getAll({
        search: searchQuery || undefined,
        class: classFilter || undefined,
        stream: streamFilter || undefined,
      });
      setCourses(data);
      setFilteredCourses(data);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses: ' + error.message);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.education && c.education.toLowerCase().includes(q))
      );
    }

    // Class filter
    if (classFilter) {
      result = result.filter((c) => c.class === classFilter);
    }

    // Stream filter
    if (streamFilter) {
      result = result.filter((c) => c.stream === streamFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    setFilteredCourses(result);
  }, [courses, searchQuery, classFilter, streamFilter, sortField, sortOrder]);

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

  // Generate sample course data
  const fillSampleData = () => {
    setSelectedCourse(null);
    setViewMode('create');
    toast.success('Opening create form with sample data hints.');
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setViewMode('create');
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setViewMode('edit');
  };

  const handleView = async (course: Course) => {
    try {
      const full = await coursesService.getById(course.id);
      setSelectedCourse(full);
      setViewMode('view');
    } catch {
      setSelectedCourse(course);
      setViewMode('view');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await coursesService.delete(id);
      toast.success('Course deleted successfully');
      loadCourses();
    } catch (error: any) {
      toast.error('Failed to delete course: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No courses selected');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} course(s)?`
      )
    )
      return;

    try {
      await coursesService.bulkDelete(Array.from(selectedIds));
      toast.success(`${selectedIds.size} course(s) deleted successfully`);
      setSelectedIds(new Set());
      loadCourses();
    } catch (error: any) {
      toast.error('Failed to delete courses: ' + error.message);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCourses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCourses.map((c) => c.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const refresh = () => {
    loadCourses();
    toast.success('Courses refreshed');
  };

  const handleBack = () => {
    if (canGoBack()) {
      goBack();
    } else {
      setViewMode('list');
    }
  };

  // CREATE VIEW
  if (viewMode === 'create') {
    return (
      <CourseForm
        mode="create"
        onSave={async (courseData) => {
          try {
            await coursesService.create(courseData);
            toast.success('Course created successfully');
            setViewMode('list');
            loadCourses();
          } catch (error: any) {
            toast.error('Failed to create course: ' + error.message);
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // EDIT VIEW
  if (viewMode === 'edit' && selectedCourse) {
    return (
      <CourseForm
        mode="edit"
        course={selectedCourse}
        onSave={async (courseData) => {
          try {
            await coursesService.update(selectedCourse.id, courseData);
            toast.success('Course updated successfully');
            setViewMode('list');
            loadCourses();
          } catch (error: any) {
            toast.error('Failed to update course: ' + error.message);
          }
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // VIEW DETAILS
  if (viewMode === 'view' && selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onEdit={() => setViewMode('edit')}
        onClose={handleBack}
        onDelete={async () => {
          await handleDelete(selectedCourse.id);
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
              <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                v4
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage courses with live database ({courses.length} courses)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              New Course
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
                onClick={refresh}
                className="gap-2 h-8"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Group 2: Filter Actions */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="">All Classes</option>
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="">All Streams</option>
                {STREAMS.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar - Sticky */}
      {selectedIds.size > 0 && (
        <div className="sticky top-[190px] z-10 bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredCourses.length && filteredCourses.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-indigo-900">
                {selectedIds.size} course(s) selected
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
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses found</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Course
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
                        selectedIds.size === filteredCourses.length &&
                        filteredCourses.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      <SortIcon field="id" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('class')}
                  >
                    <div className="flex items-center gap-2">
                      Class
                      <SortIcon field="class" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('stream')}
                  >
                    <div className="flex items-center gap-2">
                      Stream
                      <SortIcon field="stream" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('durationDays')}
                  >
                    <div className="flex items-center gap-2">
                      Duration
                      <SortIcon field="durationDays" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(course.id)}
                        onChange={() => toggleSelection(course.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(course)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline font-mono"
                        >
                          #{course.id}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(String(course.id));
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(course)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {course.title}
                      </button>
                      {course.description && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                          {course.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {course.class ? `Class ${course.class}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.stream ? (
                        <Badge
                          variant="outline"
                          className={
                            course.stream === 'Science'
                              ? 'border-blue-300 text-blue-700'
                              : course.stream === 'Commerce'
                              ? 'border-green-300 text-green-700'
                              : course.stream === 'Arts'
                              ? 'border-purple-300 text-purple-700'
                              : 'border-gray-300 text-gray-700'
                          }
                        >
                          {course.stream}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {course.durationDays ? `${course.durationDays} days` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {course.courseSubjects?.length || 0}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(course)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(course)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
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
        Showing {filteredCourses.length} of {courses.length} courses
      </div>
    </div>
  );
}

// =============================================
// COURSE FORM COMPONENT
// =============================================
interface CourseFormProps {
  mode: 'create' | 'edit';
  course?: Course;
  onSave: (data: Partial<Course>) => void;
  onCancel: () => void;
}

function CourseForm({ mode, course, onSave, onCancel }: CourseFormProps) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    durationDays: course?.durationDays ? String(course.durationDays) : '',
    class: course?.class || '',
    stream: course?.stream || '',
    year: course?.year || '',
    semester: course?.semester || '',
    education: course?.education || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    setIsSaving(true);
    try {
      const courseData: Partial<Course> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        durationDays: formData.durationDays ? parseInt(formData.durationDays, 10) : null,
        class: formData.class || null,
        stream: formData.stream || null,
        year: formData.year.trim() || null,
        semester: formData.semester.trim() || null,
        education: formData.education.trim() || null,
      };

      await onSave(courseData);
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Course' : 'Edit Course'}
              </h2>
            </div>
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const titles = [
                    'Mathematics Foundation', 'Physics Advanced', 'Chemistry Lab Course',
                    'Biology Practical', 'English Communication', 'Computer Science Basics',
                    'Economics for Beginners', 'Accountancy Masterclass', 'History & Civics',
                    'Environmental Studies', 'Hindi Literature', 'Sanskrit Grammar'
                  ];
                  const streams = ['Science', 'Commerce', 'Arts', 'General'];
                  const educations = ['CBSE', 'ICSE', 'State Board', 'IB'];
                  const classes = ['8', '9', '10', '11', '12'];
                  setFormData({
                    title: titles[Math.floor(Math.random() * titles.length)],
                    description: 'Comprehensive course designed for thorough understanding and exam preparation.',
                    durationDays: String([30, 45, 60, 90, 120, 180][Math.floor(Math.random() * 6)]),
                    class: classes[Math.floor(Math.random() * classes.length)],
                    stream: streams[Math.floor(Math.random() * streams.length)],
                    year: '2025',
                    semester: ['1', '2'][Math.floor(Math.random() * 2)],
                    education: educations[Math.floor(Math.random() * educations.length)],
                  });
                  toast.success('Sample course data filled! Review and save.');
                }}
              >
                <Sparkles className="w-4 h-4" />
                Fill Sample Data
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., JEE Advanced Preparation"
                required
              />
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Brief description of the course"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, durationDays: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  placeholder="e.g., 90"
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Class</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Stream */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream
                </label>
                <select
                  value={formData.stream}
                  onChange={(e) =>
                    setFormData({ ...formData, stream: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Stream</option>
                  {STREAMS.map((stream) => (
                    <option key={stream} value={stream}>
                      {stream}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 2025-26"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Sem 1"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) =>
                    setFormData({ ...formData, education: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., CBSE / ICSE / State Board"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'create' ? 'Create Course' : 'Update Course'}
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

// =============================================
// COURSE DETAILS COMPONENT
// =============================================
interface CourseDetailsProps {
  course: Course;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}

function CourseDetails({ course, onEdit, onClose, onDelete }: CourseDetailsProps) {
  const { navigateToRecord, pushNavigation } = useApp();

  const handleBatchClick = (batchId: number) => {
    pushNavigation('courses', String(course.id));
    navigateToRecord('batches', String(batchId));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {course.title}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Course ID: #{course.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {course.stream && (
                  <Badge
                    variant="outline"
                    className={
                      course.stream === 'Science'
                        ? 'border-blue-300 text-blue-700 bg-blue-50'
                        : course.stream === 'Commerce'
                        ? 'border-green-300 text-green-700 bg-green-50'
                        : course.stream === 'Arts'
                        ? 'border-purple-300 text-purple-700 bg-purple-50'
                        : 'border-gray-300 text-gray-700 bg-gray-50'
                    }
                  >
                    {course.stream}
                  </Badge>
                )}
                {course.isDeleted && (
                  <Badge variant="destructive">Deleted</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Primary Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Class
                </label>
                <p className="mt-1 text-gray-900">
                  {course.class ? `Class ${course.class}` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Stream
                </label>
                <p className="mt-1 text-gray-900">
                  {course.stream || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Duration
                </label>
                <p className="mt-1 text-gray-900">
                  {course.durationDays ? `${course.durationDays} days` : 'Not specified'}
                </p>
              </div>
              {course.year && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Year
                  </label>
                  <p className="mt-1 text-gray-900">{course.year}</p>
                </div>
              )}
              {course.semester && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Semester
                  </label>
                  <p className="mt-1 text-gray-900">{course.semester}</p>
                </div>
              )}
              {course.education && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Education
                  </label>
                  <p className="mt-1 text-gray-900">{course.education}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {course.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            )}

            {/* Course Subjects */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Subjects ({course.courseSubjects?.length || 0})
              </label>
              {course.courseSubjects && course.courseSubjects.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {course.courseSubjects.map((cs) => (
                    <Badge key={cs.id} variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">
                      {cs.subjectId}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-gray-500">No subjects linked</p>
              )}
            </div>

            {/* Batches */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Batches ({course.batches?.length || 0})
              </label>
              {course.batches && course.batches.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {course.batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-indigo-300 transition-colors"
                    >
                      <div>
                        <button
                          onClick={() => handleBatchClick(batch.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {batch.title}
                        </button>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(batch.startDate)} — {formatDate(batch.endDate)}
                          {batch.durationDays ? ` • ${batch.durationDays} days` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {batch.isCompleted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            Completed
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBatchClick(batch.id)}
                          title="View Batch"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-gray-500">No batches created yet</p>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDate(course.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Updated At
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDate(course.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t p-6 flex gap-3">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
            <Button variant="outline" onClick={onClose}>
              Back
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
