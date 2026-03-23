import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, User, FileText, Loader2, BarChart3, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { studentAttemptsService } from '../../services/student-attempts.service';
import { studentResponsesService } from '../../services/student-responses.service';
import { questionsService } from '../../services/questions.service';
import { questionOptionsService } from '../../services/question-options.service';
import { examPapersService } from '../../services/exam-papers.service';
import { paperRulesService } from '../../services/paper-rules.service';
import { studentsService } from '../../services/students.service';
import type { StudentAttempt, StudentResponse, Question, QuestionOption, ExamPaper, PaperRule, Student } from '../../types';
import { toast } from 'sonner';

interface EvaluationInterfaceProps {
  attemptId: string;
  evaluatorId: string;
  onBack: () => void;
  onComplete: () => void;
}

interface ResponseWithQuestion extends StudentResponse {
  question?: Question;
  options?: QuestionOption[];
  correctOption?: QuestionOption;
}

export function EvaluationInterface({ attemptId, evaluatorId, onBack, onComplete }: EvaluationInterfaceProps) {
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [rule, setRule] = useState<PaperRule | null>(null);
  const [responses, setResponses] = useState<ResponseWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Evaluation state for each response
  const [evaluations, setEvaluations] = useState<Map<string, { marks: number; feedback: string }>>(new Map());

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load attempt
        const attemptData = await studentAttemptsService.getById(attemptId);
        setAttempt(attemptData);

        // Load student
        const studentData = await studentsService.getById(attemptData.studentId);
        setStudent(studentData);

        // Load paper
        const paperData = await examPapersService.getById(attemptData.paperId);
        setPaper(paperData);

        // Load rule
        const ruleData = await paperRulesService.getByPaperId(attemptData.paperId);
        setRule(ruleData);

        // Load responses with questions
        const responsesData = await studentResponsesService.getByAttemptId(attemptId);
        
        // Enhance responses with question and option data
        const enhancedResponses: ResponseWithQuestion[] = await Promise.all(
          responsesData.map(async (response) => {
            const question = await questionsService.getById(response.questionId);
            let options: QuestionOption[] = [];
            let correctOption: QuestionOption | undefined;

            if (question.questionType === 'MCQ') {
              options = await questionOptionsService.getByQuestionId(response.questionId);
              correctOption = options.find(opt => opt.isCorrect);
            }

            return {
              ...response,
              question,
              options,
              correctOption,
            };
          })
        );

        setResponses(enhancedResponses);

        // Initialize evaluations from existing data
        const initialEvaluations = new Map<string, { marks: number; feedback: string }>();
        enhancedResponses.forEach(r => {
          initialEvaluations.set(r.responseId, {
            marks: Number(r.marksAwarded) || 0,
            feedback: r.feedback || '',
          });
        });
        setEvaluations(initialEvaluations);

        // Auto-evaluate MCQs if not already evaluated
        enhancedResponses.forEach(r => {
          if (r.question?.questionType === 'MCQ' && !r.isEvaluated && r.correctOption) {
            const isCorrect = r.selectedOptionId === r.correctOption.optionId;
            const marks = isCorrect ? Number(r.question.marks) : -Number(r.question.negativeMarks || 0);
            initialEvaluations.set(r.responseId, {
              marks: Math.max(0, marks),
              feedback: isCorrect ? 'Correct answer' : 'Incorrect answer',
            });
          }
        });
        setEvaluations(new Map(initialEvaluations));

      } catch (err: any) {
        toast.error(err.message || 'Failed to load evaluation data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId]);

  // Update evaluation
  const updateEvaluation = (responseId: string, field: 'marks' | 'feedback', value: any) => {
    setEvaluations(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(responseId) || { marks: 0, feedback: '' };
      newMap.set(responseId, { ...current, [field]: value });
      return newMap;
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalMarks = 0;
    let maxMarks = 0;

    responses.forEach(r => {
      const evaluation = evaluations.get(r.responseId);
      totalMarks += evaluation?.marks || 0;
      maxMarks += Number(r.question?.marks || 0);
    });

    return { totalMarks, maxMarks };
  };

  // Check pass/fail
  const checkPassFail = () => {
    if (!rule) return { passed: false, reason: 'No rules defined' };

    const { totalMarks, maxMarks } = calculateTotals();
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    if (totalMarks < rule.minMarksToPass) {
      return { passed: false, reason: `Below minimum marks (${rule.minMarksToPass})` };
    }
    if (percentage < rule.minPercentage) {
      return { passed: false, reason: `Below minimum percentage (${rule.minPercentage}%)` };
    }

    return { passed: true, reason: 'Passed' };
  };

  // Save all evaluations
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save each evaluation
      const evaluationPromises = responses.map(async (response) => {
        const evaluation = evaluations.get(response.responseId);
        if (evaluation) {
          await studentResponsesService.evaluate(
            response.responseId,
            evaluation.marks,
            evaluatorId,
            evaluation.feedback
          );
        }
      });

      await Promise.all(evaluationPromises);

      // Update attempt with final scores
      const { totalMarks, maxMarks } = calculateTotals();
      const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
      const { passed } = checkPassFail();

      await studentAttemptsService.update(attemptId, {
        status: 'EVALUATED',
        totalMarksObtained: totalMarks,
        totalMarksAvailable: maxMarks,
        percentage,
        isPassed: passed,
      });

      toast.success('Evaluation saved successfully');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!attempt || !paper || responses.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No data available for evaluation</p>
            <Button onClick={onBack} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentResponse = responses[currentIndex];
  const currentEvaluation = evaluations.get(currentResponse?.responseId || '') || { marks: 0, feedback: '' };
  const { totalMarks, maxMarks } = calculateTotals();
  const { passed, reason } = checkPassFail();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluate Responses</h1>
            <p className="text-gray-500">{paper.paperTitle}</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Evaluation</>}
        </Button>
      </div>

      {/* Student & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{student?.name || 'Student'}</p>
                <p className="text-sm text-gray-500">{student?.studentId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMarks.toFixed(1)} / {maxMarks}</p>
                <p className="text-sm text-gray-500">
                  {maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                {passed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <p className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? 'PASS' : 'FAIL'}
                </p>
                <p className="text-sm text-gray-500">{reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response Evaluation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentIndex + 1} of {responses.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentResponse.question?.questionType}</Badge>
                  <Badge className={
                    currentResponse.question?.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    currentResponse.question?.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {currentResponse.question?.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <div>
                <Label className="text-gray-500 text-xs">QUESTION</Label>
                <p className="text-lg mt-1">{currentResponse.question?.questionText}</p>
              </div>

              {/* MCQ Options */}
              {currentResponse.question?.questionType === 'MCQ' && currentResponse.options && (
                <div>
                  <Label className="text-gray-500 text-xs">OPTIONS</Label>
                  <div className="space-y-2 mt-2">
                    {currentResponse.options.map((opt, i) => {
                      const isSelected = currentResponse.selectedOptionId === opt.optionId;
                      const isCorrect = opt.isCorrect;

                      return (
                        <div
                          key={opt.optionId}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                            isCorrect
                              ? 'border-green-500 bg-green-50'
                              : isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="font-medium text-gray-500">{String.fromCharCode(65 + i)}</span>
                          <span className="flex-1">{opt.optionText}</span>
                          {isSelected && (
                            <Badge variant={isCorrect ? 'default' : 'destructive'}>
                              {isCorrect ? 'Correct' : 'Selected (Wrong)'}
                            </Badge>
                          )}
                          {isCorrect && !isSelected && (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text Answer */}
              {(currentResponse.question?.questionType === 'THEORY' || currentResponse.question?.questionType === 'DESCRIPTIVE') && (
                <div>
                  <Label className="text-gray-500 text-xs">STUDENT'S ANSWER</Label>
                  <div className="p-4 bg-gray-50 rounded-lg mt-2">
                    {currentResponse.answerText || <em className="text-gray-400">No answer provided</em>}
                  </div>
                  {currentResponse.question?.correctAnswerText && (
                    <div className="mt-4">
                      <Label className="text-gray-500 text-xs">EXPECTED ANSWER / RUBRIC</Label>
                      <div className="p-4 bg-blue-50 rounded-lg mt-2 text-blue-800">
                        {currentResponse.question.correctAnswerText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Marks Input */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Marks Awarded</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={currentEvaluation.marks}
                      onChange={(e) => updateEvaluation(currentResponse.responseId, 'marks', parseFloat(e.target.value) || 0)}
                      min={0}
                      max={currentResponse.question?.marks || 0}
                      step="0.5"
                      className="w-24"
                    />
                    <span className="text-gray-500">/ {currentResponse.question?.marks}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateEvaluation(currentResponse.responseId, 'marks', currentResponse.question?.marks || 0)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Full
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateEvaluation(currentResponse.responseId, 'marks', 0)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Zero
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Feedback (Optional)</Label>
                  <Input
                    value={currentEvaluation.feedback}
                    onChange={(e) => updateEvaluation(currentResponse.responseId, 'feedback', e.target.value)}
                    placeholder="Enter feedback..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} / {responses.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(prev => Math.min(responses.length - 1, prev + 1))}
                  disabled={currentIndex === responses.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Navigator */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm">Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {responses.map((r, index) => {
                  const evaluation = evaluations.get(r.responseId);
                  const isCurrent = index === currentIndex;
                  const isEvaluated = evaluation && evaluation.marks > 0;

                  return (
                    <button
                      key={r.responseId}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-sm ${
                        isCurrent
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : isEvaluated
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Q{index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {r.question?.questionType}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className={isEvaluated ? 'text-green-600' : 'text-gray-400'}>
                          {evaluation?.marks || 0} / {r.question?.marks}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Evaluated</span>
                  <span>{responses.filter(r => evaluations.get(r.responseId)?.marks !== undefined).length} / {responses.length}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Marks</span>
                  <span>{totalMarks.toFixed(1)} / {maxMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage</span>
                  <span>{maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className={`flex justify-between font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Result</span>
                  <span>{passed ? 'PASS' : 'FAIL'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
