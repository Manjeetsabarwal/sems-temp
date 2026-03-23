import React, { useState, useEffect } from 'react';
import { FileText, Users, ClipboardCheck, BarChart3, Loader2, Eye, PlayCircle, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { examPapersService } from '../../services/exam-papers.service';
import { studentAttemptsService } from '../../services/student-attempts.service';
import { studentsService } from '../../services/students.service';
import { ExamPapersAPI } from './ExamPapersAPI';
import { StudentExamInterface } from './StudentExamInterface';
import { EvaluationInterface } from './EvaluationInterface';
import type { ExamPaper, StudentAttempt, Student } from '../../types';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

type ViewMode = 'dashboard' | 'papers' | 'take-exam' | 'evaluate' | 'attempts';

export function OnlineExamsHub() {
  const { currentUser } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine user role
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  const studentId = currentUser?.studentId || 'STU001'; // Demo fallback

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [papersData, studentsData] = await Promise.all([
        examPapersService.getAll({}),
        studentsService.getAll({}),
      ]);
      setPapers(papersData);
      setStudents(studentsData);

      // Load attempts for admin/teacher or specific student
      if (isStudent) {
        const studentAttempts = await studentAttemptsService.getAll({ studentId });
        setAttempts(studentAttempts);
      } else {
        // Load all attempts for admin/teacher
        const allAttempts = await studentAttemptsService.getAll({});
        setAttempts(allAttempts);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'dashboard') {
      loadDashboardData();
    }
  }, [viewMode]);

  // Handle starting an exam
  const handleStartExam = (paperId: string) => {
    setSelectedPaperId(paperId);
    setViewMode('take-exam');
  };

  // Handle evaluating an attempt
  const handleEvaluate = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setViewMode('evaluate');
  };

  // Get student name
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    return student?.name || studentId;
  };

  // Get paper title
  const getPaperTitle = (paperId: string) => {
    const paper = papers.find(p => p.paperId === paperId);
    return paper?.paperTitle || paperId;
  };

  // Render based on view mode
  if (viewMode === 'papers') {
    return <ExamPapersAPI />;
  }

  if (viewMode === 'take-exam' && selectedPaperId) {
    return (
      <StudentExamInterface
        paperId={selectedPaperId}
        studentId={studentId}
        onComplete={(attemptId) => {
          toast.success('Exam submitted successfully');
          setViewMode('dashboard');
          setSelectedPaperId(null);
        }}
        onBack={() => {
          setViewMode('dashboard');
          setSelectedPaperId(null);
        }}
      />
    );
  }

  if (viewMode === 'evaluate' && selectedAttemptId) {
    return (
      <EvaluationInterface
        attemptId={selectedAttemptId}
        evaluatorId={currentUser?.id || 'admin'}
        onComplete={() => {
          setViewMode('dashboard');
          setSelectedAttemptId(null);
          loadDashboardData();
        }}
        onBack={() => {
          setViewMode('dashboard');
          setSelectedAttemptId(null);
        }}
      />
    );
  }

  // Dashboard View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Online Exams</h1>
          <p className="text-gray-600 mt-1">
            {isStudent ? 'Take exams and view your results' : 'Manage exam papers, conduct exams, and evaluate responses'}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <Button onClick={() => setViewMode('papers')}>
            <FileText className="w-4 h-4 mr-2" />
            Manage Papers
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{papers.filter(p => p.isOnline && p.status === 'Published').length}</p>
                    <p className="text-sm text-gray-500">Active Papers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attempts.length}</p>
                    <p className="text-sm text-gray-500">Total Attempts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attempts.filter(a => a.status === 'SUBMITTED').length}</p>
                    <p className="text-sm text-gray-500">Pending Evaluation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attempts.filter(a => a.status === 'EVALUATED').length}</p>
                    <p className="text-sm text-gray-500">Evaluated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Exams (for students) */}
          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Available Exams</CardTitle>
              </CardHeader>
              <CardContent>
                {papers.filter(p => p.isOnline && p.status === 'Published').length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No exams available at the moment</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {papers.filter(p => p.isOnline && p.status === 'Published').map(paper => {
                      const hasAttempted = attempts.some(a => a.paperId === paper.paperId);
                      const activeAttempt = attempts.find(a => a.paperId === paper.paperId && a.status === 'IN_PROGRESS');

                      return (
                        <Card key={paper.paperId} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <h3 className="font-medium text-lg">{paper.paperTitle}</h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-500">
                              <p>Duration: {paper.durationMinutes} minutes</p>
                              <p>Total Marks: {paper.totalMarks}</p>
                            </div>
                            {hasAttempted && !activeAttempt && (
                              <Badge className="mt-2" variant="secondary">Already Attempted</Badge>
                            )}
                            {activeAttempt && (
                              <Badge className="mt-2" variant="default">In Progress</Badge>
                            )}
                            <Button
                              className="w-full mt-4"
                              onClick={() => handleStartExam(paper.paperId)}
                              disabled={hasAttempted && !activeAttempt}
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {activeAttempt ? 'Resume Exam' : hasAttempted ? 'Attempted' : 'Start Exam'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Evaluations (for admin/teacher) */}
          {(isAdmin || isTeacher) && attempts.filter(a => a.status === 'SUBMITTED').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-yellow-600" />
                  Pending Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Paper</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.filter(a => a.status === 'SUBMITTED').map(attempt => (
                      <TableRow key={attempt.attemptId}>
                        <TableCell>{getStudentName(attempt.studentId)}</TableCell>
                        <TableCell>{getPaperTitle(attempt.paperId)}</TableCell>
                        <TableCell>
                          {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{attempt.timeSpentMinutes} min</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleEvaluate(attempt.attemptId)}>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Evaluate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Attempts */}
          <Card>
            <CardHeader>
              <CardTitle>{isStudent ? 'My Attempts' : 'Recent Attempts'}</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attempts yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!isStudent && <TableHead>Student</TableHead>}
                      <TableHead>Paper</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.slice(0, 10).map(attempt => (
                      <TableRow key={attempt.attemptId}>
                        {!isStudent && <TableCell>{getStudentName(attempt.studentId)}</TableCell>}
                        <TableCell>{getPaperTitle(attempt.paperId)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            attempt.status === 'EVALUATED' ? 'default' :
                            attempt.status === 'SUBMITTED' ? 'secondary' :
                            attempt.status === 'IN_PROGRESS' ? 'outline' : 'destructive'
                          }>
                            {attempt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(attempt.startedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {attempt.status === 'EVALUATED' 
                            ? `${attempt.totalMarksObtained} / ${attempt.totalMarksAvailable}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {attempt.status === 'EVALUATED' && (
                            <Badge variant={attempt.isPassed ? 'default' : 'destructive'}>
                              {attempt.isPassed ? 'PASS' : 'FAIL'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {attempt.status === 'SUBMITTED' && (isAdmin || isTeacher) && (
                            <Button size="sm" variant="outline" onClick={() => handleEvaluate(attempt.attemptId)}>
                              Evaluate
                            </Button>
                          )}
                          {attempt.status === 'IN_PROGRESS' && isStudent && (
                            <Button size="sm" onClick={() => handleStartExam(attempt.paperId)}>
                              Resume
                            </Button>
                          )}
                          {attempt.status === 'EVALUATED' && (
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
