import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resultsService } from '../../services/results.service';
import { examsService } from '../../services/exams.service';
import { studentsService } from '../../services/students.service';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Trophy, BookOpen, TrendingUp, Calendar, FileText, Award, Loader2, ExternalLink } from 'lucide-react';
import type { Result, Exam, Student } from '../../types';
import { toast } from 'sonner';

export function StudentPortal() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [myStudent, setMyStudent] = useState<Student | null>(null);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Get student ID from current user context (already loaded during login)
      // Also try stored user as fallback
      const storedUser = authService.getStoredUser();
      const studentId = currentUser?.studentId || storedUser?.studentId || null;

      if (!studentId) {
        toast.warning('Student ID not linked to your account. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Fetch student details
      const student = await studentsService.getById(studentId).catch(() => null);
      setMyStudent(student);

      // Fetch student's results (only published)
      const results = await resultsService.getByStudent(studentId).catch(() => []);
      const publishedResults = results.filter(r => r.status === 'Published');
      setMyResults(publishedResults);

      // Fetch upcoming exams
      const exams = await examsService.getAll().catch(() => []);
      const today = new Date();
      const upcoming = exams.filter(exam => {
        const examDate = new Date(exam.startDate);
        return examDate >= today;
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setUpcomingExams(upcoming.slice(0, 5));

    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalResults = myResults.length;
  const passedResults = myResults.filter(r => r.isPassed).length;
  const avgPercentage = myResults.length > 0
    ? (myResults.reduce((sum, r) => sum + r.percentage, 0) / myResults.length).toFixed(1)
    : '0';
  const bestResult = myResults.length > 0
    ? myResults.reduce((best, current) => current.percentage > best.percentage ? current : best)
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Student Portal</h2>
        <p className="text-blue-100">
          Welcome, {myStudent?.name || currentUser?.name || 'Student'}! 
          {myStudent?.classId && myStudent?.sectionId && (
            <span> Class {myStudent.classId} - Section {myStudent.sectionId}</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Published Results"
          value={totalResults}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Passed Exams"
          value={passedResults}
          icon={Award}
          color="bg-green-500"
        />
        <StatCard
          title="Average %"
          value={`${avgPercentage}%`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Best Grade"
          value={bestResult?.grade || '-'}
          icon={Trophy}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              My Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myResults.length > 0 ? (
              <div className="space-y-3">
                {myResults.map((result) => (
                  <div
                    key={result.resultId}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{result.examName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
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
                    <div className="mt-2 text-xs text-gray-500">
                      Marks: {result.totalMarksObtained} / {result.totalMaxMarks}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No published results available</p>
                <p className="text-xs mt-1">Results will appear here once published by your teachers</p>
              </div>
            )}
          </CardContent>
        </Card>

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
              <div className="space-y-3">
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

      {/* Result Details Modal */}
      {selectedResult && (
        <ResultDetailsModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
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

function ResultDetailsModal({ result, onClose }: { result: Result; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Result Details - {result.examName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Percentage</p>
                <p className="text-2xl font-bold">{result.percentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-2xl font-bold">{result.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Marks</p>
                <p className="text-lg font-semibold">{result.totalMarksObtained} / {result.totalMaxMarks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rank</p>
                <p className="text-lg font-semibold">{result.rank || 'N/A'}</p>
              </div>
            </div>

            {result.subjects && result.subjects.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Subject-wise Marks</h3>
                <div className="space-y-2">
                  {result.subjects.map((subject: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{subject.subjectName}</p>
                        <p className="text-sm text-gray-500">
                          {subject.marksObtained} / {subject.maxMarks} marks
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{subject.grade}</p>
                        <p className={`text-xs ${subject.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                          {subject.isPassed ? 'PASS' : 'FAIL'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.remarks && (
              <div>
                <h3 className="font-semibold mb-2">Remarks</h3>
                <p className="text-gray-700">{result.remarks}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={onClose} className="flex-1">Close</Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Navigate to report card view
                  window.location.href = `/report-cards?studentId=${result.studentId}&examId=${result.examId}`;
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Report Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
