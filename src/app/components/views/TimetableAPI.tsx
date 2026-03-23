import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Grid,
  List,
  Eye,
  Edit,
  Trash2,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import type { TimetableEntry, Exam, ClassExtended } from '../../types';
import { TimetableDetails } from './TimetableDetails';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';

// Local storage key for timetable entries (since backend module doesn't exist yet)
const TIMETABLE_STORAGE_KEY = 'school_exam_timetable_entries';

type ViewMode = 'grid' | 'list' | 'calendar';
type DetailMode = 'create' | 'edit' | 'view' | null;

export function TimetableAPI() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [detailMode, setDetailMode] = useState<DetailMode>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [filteredTimetable, setFilteredTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);

  useEffect(() => {
    fetchTimetable();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [timetable, searchQuery, filterExam, filterClass]);

  // Helper function to get timetable entries from local storage
  const getTimetableEntries = (): TimetableEntry[] => {
    try {
      const stored = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper function to delete a timetable entry from local storage
  const deleteTimetableEntry = (timetableId: string) => {
    const entries = getTimetableEntries();
    const filtered = entries.filter(e => e.timetableId !== timetableId);
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(filtered));
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      // Load from local storage (since backend timetable module doesn't exist yet)
      const data = getTimetableEntries();
      setTimetable(data);
      console.log('Fetched timetable entries:', data.length);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [examsData, classesData] = await Promise.all([
        examsService.getAll({}),
        classesService.getAll({ status: 'Active' }),
      ]);

      setExams(examsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...timetable];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.room?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Exam filter
    if (filterExam && filterExam !== 'all') {
      filtered = filtered.filter((entry) => entry.examId === filterExam);
    }

    // Class filter
    if (filterClass && filterClass !== 'all') {
      filtered = filtered.filter((entry) => entry.classId === filterClass);
    }

    setFilteredTimetable(filtered);
  };

  const handleDelete = async (timetableId: string) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      // Delete from local storage (since backend timetable module doesn't exist yet)
      deleteTimetableEntry(timetableId);
      toast.success('Timetable entry deleted successfully');
      fetchTimetable();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleView = (entry: TimetableEntry) => {
    console.log('Viewing timetable entry:', entry);
    setSelectedEntry(entry);
    setDetailMode('view');
  };

  const handleEdit = (entry: TimetableEntry) => {
    console.log('Editing timetable entry:', entry);
    setSelectedEntry(entry);
    setDetailMode('edit');
  };

  // Generate sample timetable data
  const fillSampleData = () => {
    setSelectedEntry(null);
    setDetailMode('create');
    toast.success('Opening create form — use Fill Sample Data on the details page.');
  };

  const handleCreate = () => {
    setSelectedEntry(null);
    setDetailMode('create');
  };

  const handleBack = () => {
    setDetailMode(null);
    setSelectedEntry(null);
  };

  const handleSuccess = () => {
    fetchTimetable();
    handleBack();
  };

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  // Format date in local timezone (YYYY-MM-DD) to avoid timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return filteredTimetable.filter((entry) => entry.date === dateStr);
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  if (detailMode) {
    return (
      <TimetableDetails
        mode={detailMode}
        timetableId={selectedEntry?.timetableId}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sticky Header with Actions */}
      <div className="bg-white border-b sticky top-0 z-10">
        {/* Title Row */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Exam Timetable
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Schedule and manage exam timetable entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button> */}
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
              {/* <Button variant="outline" onClick={fillSampleData}>
                <Sparkles className="w-4 h-4 mr-2" />
                Fill Sample Data
              </Button> */}
            </div>
          </div>
        </div>

        {/* Action Groups Row */}
        <div className="px-6 py-3 flex items-center justify-between bg-gray-50 border-b">
          {/* Left: Filters Group */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>

            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-exams" value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.examId || `exam-${exam.examName}`} value={exam.examId}>
                    {exam.examName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-classes" value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.classId || `class-${cls.name}`} value={cls.classId}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search timetable..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[250px] bg-white"
              />
            </div>
          </div>

          {/* Right: View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 py-3 bg-white flex items-center gap-6 text-sm text-gray-600">
          <div>
            Total Entries: <span className="font-semibold text-gray-900">{filteredTimetable.length}</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div>
            Scheduled: <span className="font-semibold text-blue-600">
              {filteredTimetable.filter((e) => e.status === 'Scheduled').length}
            </span>
          </div>
          <div>
            Ongoing: <span className="font-semibold text-green-600">
              {filteredTimetable.filter((e) => e.status === 'Ongoing').length}
            </span>
          </div>
          <div>
            Completed: <span className="font-semibold text-gray-600">
              {filteredTimetable.filter((e) => e.status === 'Completed').length}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Loading timetable...</p>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            currentDate={currentDate}
            monthName={monthName}
            daysInMonth={daysInMonth}
            startingDayOfWeek={startingDayOfWeek}
            getEntriesForDate={getEntriesForDate}
            onChangeMonth={changeMonth}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : viewMode === 'grid' ? (
          <GridView
            timetable={filteredTimetable}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ListView
            timetable={filteredTimetable}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

// Calendar View Component
function CalendarView({
  currentDate,
  monthName,
  daysInMonth,
  startingDayOfWeek,
  getEntriesForDate,
  onChangeMonth,
  onView,
  onEdit,
  onDelete,
}: any) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const emptySlots = Array(startingDayOfWeek).fill(null);
  const daySlots = Array(daysInMonth)
    .fill(null)
    .map((_, i) => i + 1);

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onChangeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChangeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty slots for days before month start */}
          {emptySlots.map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b bg-gray-50 min-h-[120px]" />
          ))}

          {/* Actual days */}
          {daySlots.map((day) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            // Set time to noon to avoid timezone issues when comparing dates
            date.setHours(12, 0, 0, 0);
            const entries = getEntriesForDate(date);
            const today = new Date();
            today.setHours(12, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();

            return (
              <div
                key={day}
                className={`border-r border-b last:border-r-0 min-h-[120px] p-2 ${isToday ? 'bg-blue-50' : ''
                  }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {entries.slice(0, 3).map((entry: TimetableEntry) => (
                    <div
                      key={entry.timetableId}
                      onClick={() => onView(entry)}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${entry.status === 'Scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : entry.status === 'Ongoing'
                          ? 'bg-green-100 text-green-700'
                          : entry.status === 'Completed'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                    >
                      <div className="font-medium truncate">{entry.subjectName}</div>
                      <div className="truncate">{entry.startTime}</div>
                    </div>
                  ))}
                  {entries.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{entries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Grid View Component
function GridView({ timetable, onView, onEdit, onDelete }: any) {
  if (timetable.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No timetable entries found</h3>
        <p className="text-gray-500">Create your first timetable entry to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {timetable.map((entry: TimetableEntry) => (
        <Card key={entry.timetableId} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{entry.subjectName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{entry.examName}</p>
              </div>
              <Badge
                variant={
                  entry.status === 'Scheduled'
                    ? 'default'
                    : entry.status === 'Ongoing'
                      ? 'default'
                      : 'secondary'
                }
                className={
                  entry.status === 'Scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : entry.status === 'Ongoing'
                      ? 'bg-green-100 text-green-700'
                      : entry.status === 'Completed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                }
              >
                {entry.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{entry.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {entry.startTime} - {entry.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{entry.className}</span>
              </div>
              {entry.room && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{entry.room}</span>
                </div>
              )}
              {entry.invigilator && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{entry.invigilator}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(entry)}
                className="flex-1 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(entry.timetableId)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// List View Component
function ListView({ timetable, onView, onEdit, onDelete }: any) {
  if (timetable.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No timetable entries found</h3>
        <p className="text-gray-500">Create your first timetable entry to get started</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invigilator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timetable.map((entry: TimetableEntry) => (
              <tr key={entry.timetableId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.date}</div>
                  <div className="text-sm text-gray-500">
                    {entry.startTime} - {entry.endTime}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.examName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.subjectName}</div>
                  {entry.subjectCode && (
                    <div className="text-sm text-gray-500">{entry.subjectCode}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.className}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.room || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.invigilator || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={entry.status === 'Scheduled' ? 'default' : 'secondary'}
                    className={
                      entry.status === 'Scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : entry.status === 'Ongoing'
                          ? 'bg-green-100 text-green-700'
                          : entry.status === 'Completed'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                    }
                  >
                    {entry.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(entry)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(entry.timetableId)}
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
    </Card>
  );
}
