import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { examPapersService } from '../../services/exam-papers.service';
import { questionsService } from '../../services/questions.service';
import { questionOptionsService } from '../../services/question-options.service';
import { studentAttemptsService } from '../../services/student-attempts.service';
import { studentResponsesService } from '../../services/student-responses.service';
import type { ExamPaper, Question, QuestionOption, StudentAttempt, StudentResponse } from '../../types';
import { toast } from 'sonner';

interface StudentExamInterfaceProps {
  paperId: string;
  studentId: string;
  onComplete: (attemptId: string) => void;
  onBack: () => void;
}

interface QuestionWithOptions extends Question {
  options?: QuestionOption[];
}

export function StudentExamInterface({ paperId, studentId, onComplete, onBack }: StudentExamInterfaceProps) {
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [responses, setResponses] = useState<Map<string, StudentResponse>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Load exam data
  const loadExamData = useCallback(async () => {
    try {
      setLoading(true);

      // Load paper
      const paperData = await examPapersService.getById(paperId);
      setPaper(paperData);
      setTimeRemaining(paperData.durationMinutes * 60);

      // Load questions
      const questionsData = await questionsService.getByPaperId(paperId);
      
      // Load options for MCQ questions
      const questionsWithOptions: QuestionWithOptions[] = await Promise.all(
        questionsData.map(async (q) => {
          if (q.questionType === 'MCQ') {
            const options = await questionOptionsService.getByQuestionId(q.questionId);
            return { ...q, options };
          }
          return q;
        })
      );
      setQuestions(questionsWithOptions);

      // Check for existing attempt
      let existingAttempt = await studentAttemptsService.getActiveAttempt(studentId, paperId);
      
      if (!existingAttempt) {
        // Create new attempt
        existingAttempt = await studentAttemptsService.create({
          attemptId: `ATT-${Date.now()}`,
          studentId,
          paperId,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString(),
          timeSpentMinutes: 0,
          totalMarksObtained: 0,
          autoSubmitted: false,
        });
      } else {
        // Resume existing attempt - adjust time remaining
        const startTime = new Date(existingAttempt.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, paperData.durationMinutes * 60 - elapsed);
        setTimeRemaining(remaining);

        // Load existing responses
        const existingResponses = await studentResponsesService.getByAttemptId(existingAttempt.attemptId);
        const responseMap = new Map<string, StudentResponse>();
        existingResponses.forEach(r => {
          responseMap.set(r.questionId, r);
        });
        setResponses(responseMap);
      }

      setAttempt(existingAttempt);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  }, [paperId, studentId]);

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  // Timer
  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, timeRemaining]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save response
  const saveResponse = async (questionId: string, data: Partial<StudentResponse>) => {
    if (!attempt) return;

    try {
      const existingResponse = responses.get(questionId);
      const responseData = {
        responseId: existingResponse?.responseId || `RESP-${Date.now()}`,
        attemptId: attempt.attemptId,
        questionId,
        selectedOptionId: data.selectedOptionId,
        answerText: data.answerText,
        marksAwarded: 0,
        isEvaluated: false,
        timeSpentSeconds: 0,
      };

      const savedResponse = await studentResponsesService.createOrUpdate(responseData);
      
      setResponses(prev => {
        const newMap = new Map(prev);
        newMap.set(questionId, savedResponse);
        return newMap;
      });
    } catch (err: any) {
      toast.error('Failed to save answer');
    }
  };

  // Handle MCQ selection
  const handleMcqSelect = (optionId: string) => {
    const question = questions[currentIndex];
    saveResponse(question.questionId, { selectedOptionId: optionId });
  };

  // Handle text answer
  const handleTextAnswer = (text: string) => {
    const question = questions[currentIndex];
    saveResponse(question.questionId, { answerText: text });
  };

  // Auto submit when time runs out
  const handleAutoSubmit = async () => {
    if (!attempt) return;
    
    try {
      await studentAttemptsService.update(attempt.attemptId, {
        status: 'SUBMITTED',
        autoSubmitted: true,
      });
      toast.warning('Time is up! Your exam has been auto-submitted.');
      onComplete(attempt.attemptId);
    } catch (err: any) {
      toast.error('Failed to submit exam');
    }
  };

  // Manual submit
  const handleSubmit = async () => {
    if (!attempt) return;

    setSubmitting(true);
    try {
      await studentAttemptsService.submit(attempt.attemptId);
      toast.success('Exam submitted successfully');
      onComplete(attempt.attemptId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  // Get current response
  const getCurrentResponse = () => {
    const question = questions[currentIndex];
    return question ? responses.get(question.questionId) : undefined;
  };

  // Count answered questions
  const getAnsweredCount = () => {
    return questions.filter(q => {
      const response = responses.get(q.questionId);
      return response && (response.selectedOptionId || response.answerText);
    }).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!paper || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Exam</h2>
            <p className="text-gray-600 mb-4">The exam could not be loaded. Please try again.</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentResponse = getCurrentResponse();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{paper.paperTitle}</h1>
            <p className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Exam
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">Q{currentIndex + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentQuestion.questionType}</Badge>
                    <Badge className={
                      currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      currentQuestion.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{currentQuestion.marks} marks</span>
                  {currentQuestion.negativeMarks > 0 && (
                    <span className="text-red-500 ml-2">(-{currentQuestion.negativeMarks})</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div className="text-lg">{currentQuestion.questionText}</div>

              {/* Question Image */}
              {currentQuestion.questionImageUrl && (
                <img
                  src={currentQuestion.questionImageUrl}
                  alt="Question"
                  className="max-w-full h-auto rounded-lg border"
                />
              )}

              {/* MCQ Options */}
              {currentQuestion.questionType === 'MCQ' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={option.optionId}
                      onClick={() => handleMcqSelect(option.optionId)}
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        currentResponse?.selectedOptionId === option.optionId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                        currentResponse?.selectedOptionId === option.optionId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option.optionText}</span>
                      {currentResponse?.selectedOptionId === option.optionId && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Theory/Descriptive Answer */}
              {(currentQuestion.questionType === 'THEORY' || currentQuestion.questionType === 'DESCRIPTIVE') && (
                <div>
                  <Textarea
                    value={currentResponse?.answerText || ''}
                    onChange={(e) => handleTextAnswer(e.target.value)}
                    placeholder={currentQuestion.questionType === 'THEORY' ? 'Enter your short answer...' : 'Enter your detailed answer...'}
                    rows={currentQuestion.questionType === 'THEORY' ? 4 : 8}
                    className="text-base"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {currentResponse?.answerText?.length || 0} characters
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} / {questions.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Navigator */}
        <div className="w-64 flex-shrink-0">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((q, index) => {
                  const response = responses.get(q.questionId);
                  const isAnswered = response && (response.selectedOptionId || response.answerText);
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span>Answered ({getAnsweredCount()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
                  <span>Not Answered ({questions.length - getAnsweredCount()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600" />
                  <span>Current</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle>Submit Exam?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Are you sure you want to submit your exam?</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Questions Answered:</strong> {getAnsweredCount()} / {questions.length}
                </p>
                <p className="text-sm">
                  <strong>Time Remaining:</strong> {formatTime(timeRemaining)}
                </p>
              </div>
              {getAnsweredCount() < questions.length && (
                <p className="text-amber-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  You have {questions.length - getAnsweredCount()} unanswered questions
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1"
                >
                  Continue Exam
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
