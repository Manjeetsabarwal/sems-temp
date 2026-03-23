import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resultsService } from '../../services/results.service';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';
import { studentsService } from '../../services/students.service';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BookOpen, Users, TrendingUp, Calendar, FileText, Award, Loader2, BarChart3, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { Result, Exam, ClassExtended, Student } from '../../types';
import { toast } from 'sonner';

export function TeacherPortal() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [classResults, setClassResults] = useState<Result[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [myClasses, setMyClasses] = useState<ClassExtended[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassExtended | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, [currentUser]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // Fetch all classes (teachers can see all classes for now)
      const classes = await classesService.getAll().catch(() => []);
      setMyClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }

      // Fetch all results (filtered by selected class later)
      const allResults = await resultsService.getAll({ status: 'Published' }).catch(() => []);
      setClassResults(allResults);

      // Fetch upcoming exams
      const exams = await examsService.getAll().catch(() => []);
      const today = new Date();
      const upcoming = exams.filter(exam => {
        const examDate = new Date(exam.startDate);
        return examDate >= today;
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setUpcomingExams(upcoming.slice(0, 5));

      // Fetch students for selected class
      if (selectedClass) {
        const students = await studentsService.getAll().catch(() => []);
        const classStudentsList = students.filter(s => s.classId === selectedClass.classId);
        setClassStudents(classStudentsList);
      }

    } catch (error: any) {
      console.error('Error fetching teacher data:', error);
      toast.error('Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      // Fetch students for selected class
      studentsService.getAll().then(students => {
        const classStudentsList = students.filter(s => s.classId === selectedClass.classId);
        setClassStudents(classStudentsList);
      });
    }
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Filter results by selected class
  const filteredResults = selectedClass
    ? classResults.filter(r => r.classId === selectedClass.classId)
    : classResults;

  // Calculate class statistics
  const totalStudents = classStudents.length;
  const studentsWithResults = new Set(filteredResults.map(r => r.studentId)).size;
  const avgPercentage = filteredResults.length > 0
    ? (filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)
    : '0';
  const passRate = filteredResults.length > 0
    ? ((filteredResults.filter(r => r.isPassed).length / filteredResults.length) * 100).toFixed(1)
    : '0';

  // Prepare chart data
  const gradeDistribution = filteredResults.reduce((acc: any, result) => {
    const grade = result.grade;
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Teacher Portal</h2>
        <p className="text-purple-100">
          Welcome, {currentUser?.name || 'Teacher'}! Manage your classes and track student performance
        </p>
      </div>

      {/* Class Selector */}
      {myClasses.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {myClasses.map((cls) => (
                <Button
                  key={cls.classId}
                  variant={selectedClass?.classId === cls.classId ? 'default' : 'outline'}
                  onClick={() => setSelectedClass(cls)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {cls.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Results Published"
          value={studentsWithResults}
          icon={FileText}
          color="bg-purple-500"
        />
        <StatCard
          title="Average %"
          value={`${avgPercentage}%`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Pass Rate"
          value={`${passRate}%`}
          icon={Award}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {selectedClass?.name || 'All Classes'} - Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredResults.map((result) => (
                  <div
                    key={result.resultId}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.studentName}</h3>
                        <p className="text-sm text-gray-500">{result.examName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-gray-500">Percentage</p>
                        <p className="font-semibold text-gray-900">{result.percentage.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Grade</p>
                        <p className="font-semibold text-gray-900">{result.grade}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rank</p>
                        <p className="font-semibold text-gray-900">{result.rank || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No published results available</p>
                <p className="text-xs mt-1">Results will appear here once published</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No data available for chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.examId}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{exam.examName}</h3>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {exam.examType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 Start: {new Date(exam.startDate).toLocaleDateString()}</p>
                    <p>📅 End: {new Date(exam.endDate).toLocaleDateString()}</p>
                    {exam.totalMarks && (
                      <p>📊 Total Marks: {exam.totalMarks}</p>
                    )}
                  </div>
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
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
