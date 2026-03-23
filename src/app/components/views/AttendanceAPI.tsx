import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Save,
  Users,
  BarChart3,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
import { attendanceService } from '../../services/attendance.service';
import { lecturesService } from '../../services/lectures.service';
import { batchesService } from '../../services/batches.service';
import { studentsService } from '../../services/students.service';
import type {
  AttendanceRecord,
  AttendanceReportEntry,
  AttendanceStatus,
  Lecture,
  Student,
  BatchStudent,
} from '../../types';
import { useApp } from '../../context/AppContext';

type TabMode = 'mark' | 'report';

interface StudentAttendanceRow {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  notes: string;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  present: {
    label: 'Present',
    color: 'text-green-700',
    bg: 'bg-green-100 hover:bg-green-200 border-green-300',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  absent: {
    label: 'Absent',
    color: 'text-red-700',
    bg: 'bg-red-100 hover:bg-red-200 border-red-300',
    icon: <XCircle className="w-4 h-4" />,
  },
  late: {
    label: 'Late',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
    icon: <Clock className="w-4 h-4" />,
  },
  excused: {
    label: 'Excused',
    color: 'text-blue-700',
    bg: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
};

const ALL_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export default function AttendanceAPI() {
  const [activeTab, setActiveTab] = useState<TabMode>('mark');

  // Shared data
  const [batches, setBatches] = useState<Array<{ id: number; title: string; courseId: number }>>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // ─── MARK ATTENDANCE STATE ────────────────────────────────────────────────
  const [markBatchId, setMarkBatchId] = useState<string>('');
  const [markLectureId, setMarkLectureId] = useState<string>('');
  const [batchLectures, setBatchLectures] = useState<Lecture[]>([]);
  const [batchStudents, setBatchStudents] = useState<StudentAttendanceRow[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // ─── REPORT STATE ─────────────────────────────────────────────────────────
  const [reportBatchId, setReportBatchId] = useState<string>('');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportData, setReportData] = useState<AttendanceReportEntry[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const {
    getPendingRecordId,
    clearPendingRecordId,
    currentView,
    canGoBack,
    goBack,
  } = useApp();

  // ─── FETCH BATCHES ────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await batchesService.getDropdown();
      setBatches(data);
    } catch (err: any) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // ─── PENDING RECORD (pre-select lecture from Lectures module) ─────────────
  useEffect(() => {
    if (currentView === 'attendance') {
      const pendingId = getPendingRecordId('attendance');
      if (pendingId) {
        // pendingId is the lectureId — fetch that lecture to get batchId
        const lectureId = parseInt(pendingId);
        if (!isNaN(lectureId)) {
          lecturesService
            .getById(lectureId)
            .then((lecture) => {
              setActiveTab('mark');
              setMarkBatchId(String(lecture.batchId));
              // We'll set the lectureId once lectures for the batch are loaded
              // Store it temporarily
              setTimeout(() => {
                setMarkLectureId(String(lectureId));
              }, 500);
            })
            .catch(() => {
              toast.error('Could not find the lecture');
            });
          clearPendingRecordId('attendance');
        }
      }
    }
  }, [currentView, getPendingRecordId, clearPendingRecordId]);

  // ─── FETCH LECTURES WHEN BATCH CHANGES ───────────────────────────────────
  useEffect(() => {
    if (!markBatchId) {
      setBatchLectures([]);
      setMarkLectureId('');
      setBatchStudents([]);
      setAttendanceLoaded(false);
      return;
    }
    const batchId = parseInt(markBatchId);
    if (isNaN(batchId)) return;

    setLoadingLectures(true);
    lecturesService
      .getByBatch(batchId)
      .then((data) => {
        setBatchLectures(data);
      })
      .catch((err) => {
        console.error('Failed to fetch lectures for batch:', err);
        setBatchLectures([]);
      })
      .finally(() => setLoadingLectures(false));
  }, [markBatchId]);

  // ─── FETCH STUDENTS + EXISTING ATTENDANCE WHEN LECTURE CHANGES ────────────
  useEffect(() => {
    if (!markLectureId || !markBatchId) {
      setBatchStudents([]);
      setAttendanceLoaded(false);
      return;
    }

    const batchId = parseInt(markBatchId);
    const lectureId = parseInt(markLectureId);
    if (isNaN(batchId) || isNaN(lectureId)) return;

    setLoadingStudents(true);
    setAttendanceLoaded(false);

    Promise.all([
      batchesService.getStudents(batchId),
      studentsService.getAll(),
      attendanceService.getByLecture(lectureId),
    ])
      .then(([batchStudentLinks, allStudents, existingAttendance]: [BatchStudent[], Student[], AttendanceRecord[]]) => {
        // Build a map of studentId -> student name
        const studentMap = new Map<string, string>();
        allStudents.forEach((s) => studentMap.set(s.studentId, s.name));

        // Build a map of existing attendance by studentId
        const attendanceMap = new Map<string, AttendanceRecord>();
        existingAttendance.forEach((a) => attendanceMap.set(a.studentId, a));

        // Build rows
        const rows: StudentAttendanceRow[] = batchStudentLinks.map((bs) => {
          const existing = attendanceMap.get(bs.studentId);
          return {
            studentId: bs.studentId,
            studentName: studentMap.get(bs.studentId) || bs.studentId,
            status: existing ? existing.status : 'present',
            notes: existing?.notes || '',
          };
        });

        setBatchStudents(rows);
        setAttendanceLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load students/attendance:', err);
        toast.error('Failed to load student data');
        setBatchStudents([]);
      })
      .finally(() => setLoadingStudents(false));
  }, [markLectureId, markBatchId]);

  // ─── MARK ATTENDANCE HANDLERS ─────────────────────────────────────────────
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setBatchStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const setStudentNotes = (studentId: string, notes: string) => {
    setBatchStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    );
  };

  const markAllAs = (status: AttendanceStatus) => {
    setBatchStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  // Generate sample attendance data
  const fillSampleData = () => {
    if (batchStudents.length === 0) {
      toast.error('Please select a batch and lecture first to fill sample attendance');
      return;
    }
    const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    const weights = [70, 15, 10, 5]; // 70% present, 15% absent, 10% late, 5% excused
    setBatchStudents((prev) =>
      prev.map((s) => {
        const rand = Math.random() * 100;
        let cumulative = 0;
        let status: AttendanceStatus = 'present';
        for (let i = 0; i < statuses.length; i++) {
          cumulative += weights[i];
          if (rand < cumulative) {
            status = statuses[i];
            break;
          }
        }
        return { ...s, status };
      })
    );
    toast.success('Sample attendance filled! Review and save.');
  };

  const handleSaveAttendance = async () => {
    if (!markLectureId) {
      toast.error('Please select a lecture');
      return;
    }
    if (batchStudents.length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }

    setSavingAttendance(true);
    try {
      const records = batchStudents.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        notes: s.notes || undefined,
      }));

      await attendanceService.bulkMark(parseInt(markLectureId), records);
      toast.success(`Attendance saved for ${batchStudents.length} student(s)`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  // ─── REPORT HANDLERS ─────────────────────────────────────────────────────
  const fetchReport = async () => {
    if (!reportBatchId) {
      toast.error('Please select a batch');
      return;
    }

    setLoadingReport(true);
    try {
      const result = await attendanceService.getReport({
        batchId: parseInt(reportBatchId),
        dateFrom: reportDateFrom || undefined,
        dateTo: reportDateTo || undefined,
      });
      setReportData(result.summary || []);
      if ((result.summary || []).length === 0) {
        toast.info('No attendance data found for the selected criteria');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch report');
      setReportData([]);
    } finally {
      setLoadingReport(false);
    }
  };

  // ─── ATTENDANCE STATUS COUNTS ─────────────────────────────────────────────
  const statusCounts = {
    present: batchStudents.filter((s) => s.status === 'present').length,
    absent: batchStudents.filter((s) => s.status === 'absent').length,
    late: batchStudents.filter((s) => s.status === 'late').length,
    excused: batchStudents.filter((s) => s.status === 'excused').length,
  };

  // ─── SELECTED LECTURE INFO ────────────────────────────────────────────────
  const selectedLecture = batchLectures.find((l) => String(l.id) === markLectureId);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white pb-4 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center gap-4">
          {canGoBack() && (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                v4
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">Mark and report student attendance for lectures</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-4 flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('mark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mark'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Attendance Report
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MARK ATTENDANCE TAB
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {/* Batch & Lecture selectors */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={markBatchId}
                    onChange={(e) => {
                      setMarkBatchId(e.target.value);
                      setMarkLectureId('');
                    }}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingBatches}
                  >
                    <option value="">Choose a batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Lecture <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={markLectureId}
                    onChange={(e) => setMarkLectureId(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!markBatchId || loadingLectures}
                  >
                    <option value="">
                      {loadingLectures
                        ? 'Loading lectures...'
                        : !markBatchId
                        ? 'Select a batch first'
                        : batchLectures.length === 0
                        ? 'No lectures found'
                        : 'Choose a lecture...'}
                    </option>
                    {batchLectures.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} — {l.topic} ({new Date(l.dateTime).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected lecture info */}
              {selectedLecture && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <span className="font-medium text-blue-800">
                    Lecture #{selectedLecture.id}:
                  </span>{' '}
                  <span className="text-blue-700">{selectedLecture.topic}</span>
                  <span className="text-blue-500 ml-2">
                    — {new Date(selectedLecture.dateTime).toLocaleString()} ({selectedLecture.durationMinutes}min)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading students */}
          {loadingStudents && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading students...</span>
            </div>
          )}

          {/* Attendance table */}
          {!loadingStudents && attendanceLoaded && batchStudents.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Students ({batchStudents.length})
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status summary badges */}
                    <Badge className="bg-green-100 text-green-700 border border-green-300">
                      {statusCounts.present} Present
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 border border-red-300">
                      {statusCounts.absent} Absent
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">
                      {statusCounts.late} Late
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-300">
                      {statusCounts.excused} Excused
                    </Badge>
                  </div>
                </div>
                {/* Bulk actions */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Quick:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAs('present')}
                    className="h-7 text-xs gap-1 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAs('absent')}
                    className="h-7 text-xs gap-1 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-3 h-3" />
                    Mark All Absent
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchStudents.map((student, idx) => (
                        <TableRow key={student.studentId} className="hover:bg-gray-50">
                          <TableCell className="text-gray-500 text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.studentName}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {ALL_STATUSES.map((status) => {
                                const cfg = STATUS_CONFIG[status];
                                const isActive = student.status === status;
                                return (
                                  <button
                                    key={status}
                                    onClick={() => setStudentStatus(student.studentId, status)}
                                    className={`
                                      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all
                                      ${isActive ? `${cfg.bg} ${cfg.color} border-current ring-1 ring-offset-1` : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}
                                    `}
                                    title={cfg.label}
                                  >
                                    {cfg.icon}
                                    <span className="hidden sm:inline">{cfg.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Optional notes..."
                              value={student.notes}
                              onChange={(e) => setStudentNotes(student.studentId, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Save button */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {batchStudents.length} student(s) — review and save attendance
                  </p>
                  <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fillSampleData}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Fill Sample Data
                  </Button>
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {savingAttendance ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Attendance
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No students message */}
          {!loadingStudents && attendanceLoaded && batchStudents.length === 0 && markLectureId && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No students found in this batch</p>
                  <p className="text-sm mt-1">Add students to the batch before marking attendance</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          REPORT TAB
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportBatchId}
                    onChange={(e) => setReportBatchId(e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <Input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <Input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={fetchReport}
                    disabled={loadingReport || !reportBatchId}
                    className="gap-2 w-full"
                  >
                    {loadingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loadingReport && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Generating report...</span>
            </div>
          )}

          {/* Report table */}
          {!loadingReport && reportData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Attendance Summary ({reportData.length} students)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Student ID</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>
                          <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Present
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="flex items-center gap-1 text-red-700">
                            <XCircle className="w-3 h-3" />
                            Absent
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="flex items-center gap-1 text-yellow-700">
                            <Clock className="w-3 h-3" />
                            Late
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="flex items-center gap-1 text-blue-700">
                            <ShieldCheck className="w-3 h-3" />
                            Excused
                          </span>
                        </TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((entry) => {
                        const pct = parseFloat(entry.percentage);
                        let pctColor = 'text-green-700 bg-green-50';
                        if (pct < 50) pctColor = 'text-red-700 bg-red-50';
                        else if (pct < 75) pctColor = 'text-yellow-700 bg-yellow-50';

                        return (
                          <TableRow key={entry.studentId} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-sm font-medium">
                              {entry.studentId}
                            </TableCell>
                            <TableCell className="font-medium">{entry.total}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-700">{entry.present}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-red-100 text-red-700">{entry.absent}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-700">{entry.late}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-700">{entry.excused}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${pctColor}`}>
                                {entry.percentage}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty report state */}
          {!loadingReport && reportData.length === 0 && reportBatchId && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No report data</p>
                  <p className="text-sm mt-1">Select a batch and click &quot;Generate Report&quot;</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
