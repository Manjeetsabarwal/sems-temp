import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, XCircle, Image, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { questionsService } from '../../services/questions.service';
import { questionOptionsService } from '../../services/question-options.service';
import type { Question, QuestionOption } from '../../types';
import { toast } from 'sonner';

interface QuestionFormProps {
  mode: 'create' | 'edit' | 'view';
  paperId: string;
  question?: Question | null;
  onBack: () => void;
  onSuccess: () => void;
}

interface OptionData {
  optionId: string;
  optionText: string;
  isCorrect: boolean;
  explanation?: string;
  displayOrder: number;
  isNew?: boolean;
}

export function QuestionForm({ mode, paperId, question, onBack, onSuccess }: QuestionFormProps) {
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Omit<Question, 'createdAt' | 'updatedAt' | 'paper'>>({
    questionId: '',
    paperId: paperId,
    questionType: 'MCQ',
    questionText: '',
    questionImageUrl: '',
    marks: 1,
    negativeMarks: 0,
    difficulty: 'Medium',
    displayOrder: 1,
    isRequired: true,
    correctAnswerText: '',
    solutionText: '',
    solutionImageUrl: '',
    meta: {},
  });

  const [options, setOptions] = useState<OptionData[]>([]);
  const [optionsToDelete, setOptionsToDelete] = useState<string[]>([]);

  // Generate question ID
  const generateQuestionId = async () => {
    try {
      const questions = await questionsService.getByPaperId(paperId);
      const existingIds = questions.map(q => q.questionId);
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/Q-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      return `${paperId}-Q-${String(maxNum + 1).padStart(3, '0')}`;
    } catch {
      return `${paperId}-Q-${Date.now()}`;
    }
  };

  // Generate option ID
  const generateOptionId = () => {
    return `OPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load question data
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'create') {
        const questionId = await generateQuestionId();
        setFormData(prev => ({ ...prev, questionId }));
        // Add default options for MCQ
        setOptions([
          { optionId: generateOptionId(), optionText: '', isCorrect: true, displayOrder: 1, isNew: true },
          { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 2, isNew: true },
          { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 3, isNew: true },
          { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 4, isNew: true },
        ]);
      } else if (question) {
        setLoading(true);
        try {
          setFormData({
            questionId: question.questionId,
            paperId: question.paperId,
            questionType: question.questionType,
            questionText: question.questionText,
            questionImageUrl: question.questionImageUrl || '',
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            difficulty: question.difficulty,
            displayOrder: question.displayOrder,
            isRequired: question.isRequired,
            correctAnswerText: question.correctAnswerText || '',
            solutionText: question.solutionText || '',
            solutionImageUrl: question.solutionImageUrl || '',
            meta: question.meta || {},
          });

          // Load options for MCQ
          if (question.questionType === 'MCQ') {
            const optionsData = await questionOptionsService.getByQuestionId(question.questionId);
            setOptions(optionsData.map(opt => ({
              optionId: opt.optionId,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation,
              displayOrder: opt.displayOrder,
              isNew: false,
            })));
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to load question');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, question, paperId]);

  // Handle question type change
  const handleTypeChange = (type: 'MCQ' | 'THEORY' | 'DESCRIPTIVE') => {
    setFormData({ ...formData, questionType: type });
    if (type === 'MCQ' && options.length === 0) {
      setOptions([
        { optionId: generateOptionId(), optionText: '', isCorrect: true, displayOrder: 1, isNew: true },
        { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 2, isNew: true },
        { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 3, isNew: true },
        { optionId: generateOptionId(), optionText: '', isCorrect: false, displayOrder: 4, isNew: true },
      ]);
    }
  };

  // Handle option change
  const handleOptionChange = (index: number, field: keyof OptionData, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting correct, unset others
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setOptions(newOptions);
  };

  // Add option
  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        optionId: generateOptionId(),
        optionText: '',
        isCorrect: false,
        displayOrder: options.length + 1,
        isNew: true,
      },
    ]);
  };

  // Remove option
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('MCQ must have at least 2 options');
      return;
    }
    
    const option = options[index];
    if (!option.isNew && option.optionId) {
      setOptionsToDelete([...optionsToDelete, option.optionId]);
    }
    
    const newOptions = options.filter((_, i) => i !== index);
    // Reorder
    newOptions.forEach((opt, i) => {
      opt.displayOrder = i + 1;
    });
    setOptions(newOptions);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.questionText.trim()) {
      toast.error('Please enter question text');
      return false;
    }
    if (formData.marks <= 0) {
      toast.error('Marks must be greater than 0');
      return false;
    }

    if (formData.questionType === 'MCQ') {
      if (options.length < 2) {
        toast.error('MCQ must have at least 2 options');
        return false;
      }
      const emptyOptions = options.filter(opt => !opt.optionText.trim());
      if (emptyOptions.length > 0) {
        toast.error('All options must have text');
        return false;
      }
      const correctCount = options.filter(opt => opt.isCorrect).length;
      if (correctCount !== 1) {
        toast.error('MCQ must have exactly one correct option');
        return false;
      }
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (mode === 'create') {
        // Create question
        await questionsService.create(formData);

        // Create options for MCQ
        if (formData.questionType === 'MCQ' && options.length > 0) {
          await questionOptionsService.createBulk(
            formData.questionId,
            options.map(opt => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation,
              displayOrder: opt.displayOrder,
            }))
          );
        }

        toast.success('Question created successfully');
      } else {
        // Update question
        await questionsService.update(formData.questionId, {
          questionType: formData.questionType,
          questionText: formData.questionText,
          questionImageUrl: formData.questionImageUrl || undefined,
          marks: formData.marks,
          negativeMarks: formData.negativeMarks,
          difficulty: formData.difficulty,
          displayOrder: formData.displayOrder,
          isRequired: formData.isRequired,
          correctAnswerText: formData.correctAnswerText || undefined,
          solutionText: formData.solutionText || undefined,
          solutionImageUrl: formData.solutionImageUrl || undefined,
        });

        // Handle MCQ options
        if (formData.questionType === 'MCQ') {
          // Delete removed options
          for (const optionId of optionsToDelete) {
            try {
              await questionOptionsService.delete(optionId);
            } catch (e) {
              // Option might already be deleted
            }
          }

          // Update existing / create new options
          for (const opt of options) {
            if (opt.isNew) {
              await questionOptionsService.create({
                optionId: opt.optionId,
                questionId: formData.questionId,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
                displayOrder: opt.displayOrder,
              });
            } else {
              await questionOptionsService.update(opt.optionId, {
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
                displayOrder: opt.displayOrder,
              });
            }
          }
        }

        toast.success('Question updated successfully');
      }

      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add Question' : mode === 'edit' ? 'Edit Question' : 'View Question'}
            </h1>
            {mode !== 'create' && (
              <p className="text-gray-500">{formData.questionId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && mode !== 'create' && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => mode === 'create' ? onBack() : setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Type *</Label>
                <div className="flex gap-4 mt-2">
                  {(['MCQ', 'THEORY', 'DESCRIPTIVE'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.questionType === type}
                        onChange={() => handleTypeChange(type)}
                        disabled={!isEditing}
                        className="w-4 h-4"
                      />
                      <span>{type === 'MCQ' ? 'Multiple Choice' : type === 'THEORY' ? 'Short Answer' : 'Long Answer'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Question Text *</Label>
                <Textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your question here..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Question Image URL (Optional)</Label>
                <Input
                  value={formData.questionImageUrl}
                  onChange={(e) => setFormData({ ...formData, questionImageUrl: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://..."
                />
              </div>

              {/* MCQ Options */}
              {formData.questionType === 'MCQ' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Answer Options *</Label>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={handleAddOption}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={option.optionId} className="flex items-start gap-3">
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => isEditing && handleOptionChange(index, 'isCorrect', true)}
                            disabled={!isEditing}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                              option.isCorrect
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle className="w-4 h-4" />}
                          </button>
                          <span className="text-sm font-medium text-gray-500">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={option.optionText}
                            onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                            disabled={!isEditing}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                        {isEditing && options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click the circle to mark the correct answer
                  </p>
                </div>
              )}

              {/* Theory/Descriptive Answer */}
              {(formData.questionType === 'THEORY' || formData.questionType === 'DESCRIPTIVE') && (
                <div>
                  <Label>Expected Answer / Rubric (Optional)</Label>
                  <Textarea
                    value={formData.correctAnswerText}
                    onChange={(e) => setFormData({ ...formData, correctAnswerText: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter expected answer or marking rubric..."
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label>Solution / Explanation (Optional)</Label>
                <Textarea
                  value={formData.solutionText}
                  onChange={(e) => setFormData({ ...formData, solutionText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter solution or explanation..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Marks *</Label>
                <Input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0.01}
                  step="0.01"
                />
              </div>

              {formData.questionType === 'MCQ' && (
                <div>
                  <Label>Negative Marks</Label>
                  <Input
                    type="number"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: parseFloat(e.target.value) || 0 })}
                    disabled={!isEditing}
                    min={0}
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Marks deducted for wrong answer</p>
                </div>
              )}

              <div>
                <Label>Difficulty</Label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                  disabled={!isEditing}
                  min={1}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4"
                />
                <Label htmlFor="isRequired" className="cursor-pointer">
                  Required Question
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formData.questionType}</Badge>
                  <Badge
                    className={
                      formData.difficulty === 'Easy'
                        ? 'bg-green-100 text-green-800'
                        : formData.difficulty === 'Hard'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {formData.difficulty}
                  </Badge>
                </div>
                <p className="font-medium">{formData.questionText || 'Question text...'}</p>
                <div className="text-sm text-gray-600">
                  <span className="text-green-600 font-medium">+{formData.marks} marks</span>
                  {formData.negativeMarks > 0 && (
                    <span className="text-red-600 ml-2">-{formData.negativeMarks} for wrong</span>
                  )}
                </div>
                {formData.questionType === 'MCQ' && options.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {options.map((opt, i) => (
                      <div
                        key={opt.optionId}
                        className={`flex items-center gap-2 ${opt.isCorrect ? 'text-green-600 font-medium' : ''}`}
                      >
                        <span>{String.fromCharCode(65 + i)}.</span>
                        <span>{opt.optionText || `Option ${String.fromCharCode(65 + i)}`}</span>
                        {opt.isCorrect && <CheckCircle className="w-3 h-3" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
