import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Eye, Loader2, GripVertical, CheckCircle, HelpCircle, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { questionsService } from '../../services/questions.service';
import { examPapersService } from '../../services/exam-papers.service';
import { QuestionForm } from './QuestionForm';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import type { Question, ExamPaper } from '../../types';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface QuestionsManagerProps {
  paperId: string;
  onBack: () => void;
}

type ViewMode = 'list' | 'form';

export function QuestionsManager({ paperId, onBack }: QuestionsManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [statistics, setStatistics] = useState<{
    total: number;
    byType: { type: string; count: number }[];
    byDifficulty: { difficulty: string; count: number }[];
    totalMarks: number;
  } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    question?: Question;
  }>({ open: false });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsData, paperData, statsData] = await Promise.all([
        questionsService.getByPaperId(paperId),
        examPapersService.getById(paperId),
        questionsService.getStatistics(paperId),
      ]);
      setQuestions(questionsData);
      setPaper(paperData);
      setStatistics(statsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paperId]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.question) return;
    try {
      await questionsService.delete(deleteDialog.question.questionId);
      toast.success('Question deleted successfully');
      setDeleteDialog({ open: false });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete question');
    }
  };

  // Handle form actions
  const handleAddQuestion = () => {
    setSelectedQuestion(null);
    setFormMode('create');
    setViewMode('form');
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setFormMode('edit');
    setViewMode('form');
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setFormMode('view');
    setViewMode('form');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedQuestion(null);
    loadData();
  };

  const handleFormBack = () => {
    setViewMode('list');
    setSelectedQuestion(null);
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MCQ':
        return <CheckCircle className="w-4 h-4" />;
      case 'THEORY':
        return <HelpCircle className="w-4 h-4" />;
      case 'DESCRIPTIVE':
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'form') {
    return (
      <QuestionForm
        mode={formMode}
        paperId={paperId}
        question={selectedQuestion}
        onBack={handleFormBack}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Questions Manager</h1>
            {paper && (
              <p className="text-gray-500">{paper.paperTitle} ({paper.paperId})</p>
            )}
          </div>
        </div>
        <Button onClick={handleAddQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                  <p className="text-sm text-gray-500">Total Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statistics.byType.find(t => t.type === 'MCQ')?.count || 0}
                  </p>
                  <p className="text-sm text-gray-500">MCQ Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(statistics.byType.find(t => t.type === 'THEORY')?.count || 0) +
                     (statistics.byType.find(t => t.type === 'DESCRIPTIVE')?.count || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Theory/Descriptive</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.totalMarks}</p>
                  <p className="text-sm text-gray-500">Total Marks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paper Info */}
      {paper && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="font-medium">{paper.durationMinutes} minutes</span>
              </div>
              <div>
                <span className="text-gray-500">Total Marks:</span>{' '}
                <span className="font-medium">{paper.totalMarks}</span>
              </div>
              <div>
                <span className="text-gray-500">Questions Marks:</span>{' '}
                <span className={`font-medium ${statistics && statistics.totalMarks !== paper.totalMarks ? 'text-red-600' : 'text-green-600'}`}>
                  {statistics?.totalMarks || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant={paper.status === 'Published' ? 'default' : 'secondary'}>
                  {paper.status}
                </Badge>
              </div>
            </div>
            {statistics && statistics.totalMarks !== paper.totalMarks && (
              <p className="text-sm text-red-600 mt-2">
                Warning: Questions total marks ({statistics.totalMarks}) does not match paper total marks ({paper.totalMarks})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No questions yet</h3>
              <p className="text-gray-500 mt-1">Add your first question to this paper</p>
              <Button onClick={handleAddQuestion} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.questionId}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="w-5 h-5" />
                    <span className="text-lg font-medium">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTypeIcon(question.questionType)}
                            {question.questionType}
                          </Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {question.marks} marks
                          </span>
                          {question.negativeMarks > 0 && (
                            <span className="text-sm text-red-500">
                              (-{question.negativeMarks})
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 line-clamp-2">
                          {question.questionText}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewQuestion(question)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, question })}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="Delete Question"
        description={`Are you sure you want to delete this question? This will also delete all associated options and responses.`}
      />
    </div>
  );
}
