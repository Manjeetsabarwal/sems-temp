import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserCog,
  BookOpen,
  TrendingUp,
  Trophy,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Info,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Student, Exam, Result, Teacher, ClassExtended } from '../../types';
import { studentsService } from '../../services/students.service';
import { teachersService } from '../../services/teachers.service';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';
import { subjectsService } from '../../services/subjects.service';
import { resultsService } from '../../services/results.service';
import { StudentPortal } from '../portals/StudentPortal';
import { ParentPortal } from '../portals/ParentPortal';
import { TeacherPortal } from '../portals/TeacherPortal';

export function Dashboard() {
  const { currentUser } = useApp();
  
  // Fallback to admin for backward compatibility
  const user = currentUser || {
    id: 'demo-admin',
    name: 'Demo Admin',
    role: 'admin' as const,
    email: 'admin@school.edu',
  };

  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'teacher') {
    return <TeacherPortal />;
  } else if (user.role === 'student') {
    return <StudentPortal />;
  } else {
    return <ParentPortal />;
  }
}

function AdminDashboard() {
  const { setCurrentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    totalClasses: 0,
    totalSubjects: 0,
    publishedResults: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel using NestJS API
      const [studentsData, examsData, teachersData, classesData, subjectsData, resultsData] = await Promise.all([
        studentsService.getAll().catch(() => []),
        examsService.getAll().catch(() => []),
        teachersService.getAll().catch(() => []),
        classesService.getAll().catch(() => []),
        subjectsService.getAll().catch(() => []),
        resultsService.getAll({ status: 'Published' }).catch(() => []),
      ]);

      setStudents(studentsData);
      setExams(examsData);
      setResults(resultsData);
      setTeachers(teachersData);
      setClasses(classesData);

      const publishedResultsCount = resultsData.filter((r: Result) => r.status === 'Published').length;

      setStats({
        totalStudents: studentsData.length,
        totalTeachers: teachersData.length,
        totalExams: examsData.length,
        totalClasses: classesData.length,
        totalSubjects: subjectsData.length,
        publishedResults: publishedResultsCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate subject-wise performance from results
  const getSubjectPerformance = () => {
    const subjectMap: Record<string, { total: number; count: number }> = {};

    results.forEach((result) => {
      result.subjects?.forEach((subject) => {
        if (!subjectMap[subject.subjectName]) {
          subjectMap[subject.subjectName] = { total: 0, count: 0 };
        }
        const percentage = subject.maxMarks > 0 ? (subject.marksObtained / subject.maxMarks) * 100 : 0;
        subjectMap[subject.subjectName].total += percentage;
        subjectMap[subject.subjectName].count += 1;
      });
    });

    return Object.entries(subjectMap)
      .map(([subject, data]) => ({
        subject,
        average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      }))
      .slice(0, 6); // Top 6 subjects
  };

  // Calculate class-wise performance
  const getClassPerformance = () => {
    const classMap: Record<string, { total: number; count: number }> = {};

    results.forEach((result) => {
      if (result.classId) {
        if (!classMap[result.classId]) {
          classMap[result.classId] = { total: 0, count: 0 };
        }
        
        const totalMarks = result.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
        const maxMarks = result.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
        const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
        
        classMap[result.classId].total += percentage;
        classMap[result.classId].count += 1;
      }
    });

    return Object.entries(classMap)
      .map(([classId, data]) => ({
        class: `Class ${classId}`,
        average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      }))
      .slice(0, 5);
  };

  // Calculate exam status distribution
  const getExamStatusData = () => {
    const completed = exams.filter((e) => e.status === 'completed').length;
    const ongoing = exams.filter((e) => e.status === 'ongoing').length;
    const upcoming = exams.filter((e) => e.status === 'upcoming').length;

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Ongoing', value: ongoing, color: '#3b82f6' },
      { name: 'Upcoming', value: upcoming, color: '#f59e0b' },
    ];
  };

  // Calculate pass/fail statistics
  const getPassFailStats = () => {
    let passed = 0;
    let failed = 0;

    results.forEach((result) => {
      const totalMarks = result.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
      const maxMarks = result.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
      const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

      if (percentage >= 40) {
        passed++;
      } else {
        failed++;
      }
    });

    return [
      { name: 'Passed', value: passed, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ];
  };

  const subjectPerformance = getSubjectPerformance();
  const classPerformance = getClassPerformance();
  const examStatusData = getExamStatusData();
  const passFailData = getPassFailStats();

  const passPercentage =
    results.length > 0
      ? Math.round(
          (results.filter((r) => {
            const totalMarks = r.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
            const maxMarks = r.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
            return maxMarks > 0 && (totalMarks / maxMarks) * 100 >= 40;
          }).length /
            results.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasNoData = stats.totalStudents === 0 && stats.totalTeachers === 0 && stats.totalExams === 0;

  return (
    <div className="space-y-6">
      {/* Run Sample Data prompt when app has no data */}
      {hasNoData && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">No data yet</h3>
              <p className="text-sm text-amber-800">
                Generate end-to-end sample data (students, teachers, exams, marks, results) to test the app.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCurrentView('settings', 'sample-data')}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate sample data
          </Button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to School Exam Management System</h2>
            <p className="text-blue-100 mb-4">
              Complete ERP-style solution for managing exams, students, results, and analytics
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="bg-white/20 px-3 py-1 rounded-full">✨ Role-based access</div>
              <div className="bg-white/20 px-3 py-1 rounded-full">📊 Real-time analytics</div>
              <div className="bg-white/20 px-3 py-1 rounded-full">📝 Report card generation</div>
              <div className="bg-white/20 px-3 py-1 rounded-full">🎯 Production-ready</div>
            </div>
          </div>
          <Info className="w-8 h-8" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={UserCog}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          icon={Calendar}
          color="bg-orange-500"
        />
        <StatCard
          title="Pass Percentage"
          value={`${passPercentage}%`}
          icon={Trophy}
          color="bg-green-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Subjects"
          value={stats.totalSubjects}
          icon={FileText}
          color="bg-cyan-500"
        />
        <StatCard
          title="Published Results"
          value={stats.publishedResults}
          icon={CheckCircle}
          color="bg-teal-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {classPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Status */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {examStatusData.some((item) => item.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={examStatusData.filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {examStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {examStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No exam data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pass/Fail Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pass/Fail Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {passFailData.some((item) => item.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={passFailData.filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {passFailData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No result data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <div className="space-y-4">
              {exams.slice(0, 5).map((exam) => (
                <div
                  key={exam.examId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{exam.examName}</h4>
                    <p className="text-sm text-gray-500">
                      {exam.startDate} - {exam.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Marks</p>
                      <p className="font-medium text-gray-900">{exam.totalMarks || '-'}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : exam.status === 'ongoing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No exams available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalExams: 0,
    avgPerformance: 0,
  });
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassExtended[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel using NestJS API
      const [classesData, studentsData, examsData] = await Promise.all([
        classesService.getAll().catch(() => []),
        studentsService.getAll().catch(() => []),
        examsService.getAll().catch(() => []),
      ]);

      // For results, we'll need to calculate from marks (since we don't have a results endpoint yet)
      const resultsData: Result[] = [];

      setClasses(classesData);
      setRecentExams(examsData.slice(0, 3));

      // Calculate average performance
      let totalPercentage = 0;
      resultsData.forEach((result: Result) => {
        const totalMarks = result.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
        const maxMarks = result.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
        if (maxMarks > 0) {
          totalPercentage += (totalMarks / maxMarks) * 100;
        }
      });

      const avgPerformance =
        resultsData.length > 0 ? Math.round(totalPercentage / resultsData.length) : 0;

      setStats({
        totalClasses: classesData.length,
        totalStudents: studentsData.length,
        totalExams: examsData.length,
        avgPerformance,
      });
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Teacher Dashboard</h2>
        <p className="text-purple-100">Manage your classes, exams, and student performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Classes" value={stats.totalClasses} icon={BookOpen} color="bg-blue-500" />
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="bg-purple-500" />
        <StatCard title="Total Exams" value={stats.totalExams} icon={Calendar} color="bg-orange-500" />
        <StatCard
          title="Avg. Performance"
          value={`${stats.avgPerformance}%`}
          icon={TrendingUp}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="space-y-3">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.classId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{cls.name}</span>
                      <p className="text-sm text-gray-500">Class Teacher: {cls.classTeacher}</p>
                    </div>
                    <span className="text-sm text-gray-500">{cls.capacity || '-'} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No classes assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div
                    key={exam.examId}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg"
                  >
                    <div
                      className={`mt-0.5 w-2 h-2 rounded-full ${
                        exam.status === 'completed'
                          ? 'bg-green-500'
                          : exam.status === 'ongoing'
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{exam.examName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {exam.startDate} - {exam.endDate}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-1">{exam.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No exams available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [myResult, setMyResult] = useState<Result | null>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch exams using NestJS API
      const examsData = await examsService.getAll().catch(() => []);

      // For results, we'll need to calculate from marks (since we don't have a results endpoint yet)
      const resultsData: Result[] = [];

      // Get first student's result for demo (in real app, filter by logged-in student)
      if (resultsData.length > 0) {
        setMyResult(resultsData[0]);
      }

      setRecentExams(examsData.slice(0, 3));
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalMarks = myResult?.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
  const maxMarks = myResult?.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
  const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : 0;
  const grade =
    Number(percentage) >= 90
      ? 'A+'
      : Number(percentage) >= 80
      ? 'A'
      : Number(percentage) >= 70
      ? 'B+'
      : Number(percentage) >= 60
      ? 'B'
      : Number(percentage) >= 50
      ? 'C'
      : Number(percentage) >= 40
      ? 'D'
      : 'F';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Student Dashboard</h2>
        <p className="text-blue-100">Track your performance and upcoming exams</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Percentage"
          value={`${percentage}%`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard title="Class Rank" value={myResult?.rank || '-'} icon={Trophy} color="bg-purple-500" />
        <StatCard title="Grade" value={grade} icon={BarChart3} color="bg-green-500" />
        <StatCard title="Subjects" value={myResult?.subjects?.length || 0} icon={BookOpen} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Marks */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Marks</CardTitle>
          </CardHeader>
          <CardContent>
            {myResult?.subjects && myResult.subjects.length > 0 ? (
              <div className="space-y-4">
                {myResult.subjects.map((subject, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{subject.subjectName}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {subject.marksObtained}/{subject.maxMarks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          subject.isPassed ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{
                          width: `${(subject.marksObtained / subject.maxMarks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No marks data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div
                    key={exam.examId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{exam.examName}</p>
                      <p className="text-sm text-gray-500">
                        {exam.startDate} - {exam.endDate}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : exam.status === 'ongoing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No upcoming exams</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [childResult, setChildResult] = useState<Result | null>(null);
  const [child, setChild] = useState<Student | null>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);

      // Fetch data using NestJS API
      const [studentsData, examsData] = await Promise.all([
        studentsService.getAll().catch(() => []),
        examsService.getAll().catch(() => []),
      ]);

      // For results, we'll need to calculate from marks (since we don't have a results endpoint yet)
      const resultsData: Result[] = [];

      // Get first student for demo (in real app, filter by parent's child)
      if (studentsData.length > 0) {
        setChild(studentsData[0]);
        const studentResult = resultsData.find((r: Result) => r.studentId === studentsData[0].studentId);
        setChildResult(studentResult || null);
      }

      setRecentExams(examsData.slice(0, 3));
    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalMarks = childResult?.subjects?.reduce((sum, s) => sum + s.marksObtained, 0) || 0;
  const maxMarks = childResult?.subjects?.reduce((sum, s) => sum + s.maxMarks, 0) || 0;
  const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : 0;
  const grade =
    Number(percentage) >= 90
      ? 'A+'
      : Number(percentage) >= 80
      ? 'A'
      : Number(percentage) >= 70
      ? 'B+'
      : Number(percentage) >= 60
      ? 'B'
      : Number(percentage) >= 50
      ? 'C'
      : Number(percentage) >= 40
      ? 'D'
      : 'F';

  return (
    <div className="space-y-6">
      {/* Child Info Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{child?.name || 'Student Name'}</h3>
              <p className="text-blue-100 mt-1">
                Class {child?.classId || '-'} - Roll No. {child?.rollNo || '-'}
              </p>
            </div>
            <Users className="w-12 h-12" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Percentage"
          value={`${percentage}%`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard title="Class Rank" value={childResult?.rank || '-'} icon={Trophy} color="bg-purple-500" />
        <StatCard title="Grade" value={grade} icon={BarChart3} color="bg-green-500" />
        <StatCard title="Attendance" value="94.5%" icon={Calendar} color="bg-orange-500" />
      </div>

      {/* Recent Exam Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exam Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {childResult?.subjects && childResult.subjects.length > 0 ? (
            <div className="space-y-4">
              {childResult.subjects.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{subject.subjectName}</p>
                    <p className="text-sm text-gray-500">Grade: {subject.grade || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {subject.marksObtained}/{subject.maxMarks}
                    </p>
                    <p className={`text-sm ${subject.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {subject.isPassed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
