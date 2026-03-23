import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resultsService } from '../../services/results.service';
import { examsService } from '../../services/exams.service';
import { studentsService } from '../../services/students.service';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Trophy, TrendingUp, Calendar, FileText, Award, Loader2, ExternalLink, User } from 'lucide-react';
import type { Result, Exam, Student } from '../../types';
import { toast } from 'sonner';

export function ParentPortal() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [childResults, setChildResults] = useState<Result[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [myChildren, setMyChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  useEffect(() => {
    fetchParentData();
  }, [currentUser]);

  const fetchParentData = async () => {
    try {
      setLoading(true);

      // Get student ID from current user context (parent's linked child)
      // Also try stored user as fallback
      const storedUser = authService.getStoredUser();
      const childStudentId = currentUser?.studentId || storedUser?.studentId || null;

      if (childStudentId) {
        // Parent has one linked child
        const child = await studentsService.getById(childStudentId).catch(() => null);
        if (child) {
          setMyChildren([child]);
          setSelectedChild(child);
          
          // Fetch child's results
          const results = await resultsService.getByStudent(childStudentId).catch(() => []);
          const publishedResults = results.filter(r => r.status === 'Published');
          setChildResults(publishedResults);
        }
      } else {
        // Parent might have multiple children - fetch all students and filter by parent email
        // For now, show message if no child linked
        toast.info('No child linked to your account. Please contact administrator.');
      }

      // Fetch upcoming exams
      const exams = await examsService.getAll();
      const today = new Date();
      const upcoming = exams.filter(exam => {
        const examDate = new Date(exam.startDate);
        return examDate >= today;
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setUpcomingExams(upcoming.slice(0, 5));

    } catch (error: any) {
      console.error('Error fetching parent data:', error);
      toast.error('Failed to load parent data');
    } finally {
      setLoading(false);
    }
  };

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

  if (myChildren.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Parent Portal</h2>
          <p className="text-purple-100">Welcome, {currentUser?.name || 'Parent'}!</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Child Linked</h3>
            <p className="text-gray-600 mb-4">
              Your account is not currently linked to any student. Please contact the school administration to link your child's account.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const child = selectedChild || myChildren[0];
  const childResultsForSelected = selectedChild
    ? childResults.filter(r => r.studentId === selectedChild.studentId)
    : childResults;

  // Calculate stats for selected child
  const totalResults = childResultsForSelected.length;
  const passedResults = childResultsForSelected.filter(r => r.isPassed).length;
  const avgPercentage = childResultsForSelected.length > 0
    ? (childResultsForSelected.reduce((sum, r) => sum + r.percentage, 0) / childResultsForSelected.length).toFixed(1)
    : '0';
  const bestResult = childResultsForSelected.length > 0
    ? childResultsForSelected.reduce((best, current) => current.percentage > best.percentage ? current : best)
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Parent Portal</h2>
        <p className="text-purple-100">
          Welcome, {currentUser?.name || 'Parent'}!
          {child && (
            <span> Viewing results for {child.name}</span>
          )}
        </p>
      </div>

      {/* Child Selector (if multiple children) */}
      {myChildren.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              {myChildren.map((child) => (
                <Button
                  key={child.studentId}
                  variant={selectedChild?.studentId === child.studentId ? 'default' : 'outline'}
                  onClick={() => setSelectedChild(child)}
                >
                  <User className="w-4 h-4 mr-2" />
                  {child.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Published Results"
          value={totalResults}
          icon={FileText}
          color="bg-purple-500"
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
          color="bg-blue-500"
        />
        <StatCard
          title="Best Grade"
          value={bestResult?.grade || '-'}
          icon={Trophy}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Child's Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {child?.name}'s Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {childResultsForSelected.length > 0 ? (
              <div className="space-y-3">
                {childResultsForSelected.map((result) => (
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
                <p className="text-xs mt-1">Results will appear here once published</p>
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
          childName={child?.name || 'Child'}
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

function ResultDetailsModal({ result, childName, onClose }: { result: Result; childName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{childName}'s Result - {result.examName}</CardTitle>
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
