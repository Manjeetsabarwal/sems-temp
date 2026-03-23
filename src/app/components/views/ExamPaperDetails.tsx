import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Settings, FileText, Monitor, Clipboard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { examPapersService } from '../../services/exam-papers.service';
import { paperRulesService } from '../../services/paper-rules.service';
import { examsService } from '../../services/exams.service';
import { toast } from 'sonner';
import type { ExamPaper, PaperRule, Exam } from '../../types';
import { FileAttachments } from '../FileAttachments';

interface ExamPaperDetailsProps {
  mode: 'create' | 'edit' | 'view';
  paperId?: string;
  onBack: () => void;
  onSuccess: () => void;
  onManageQuestions?: (paperId: string) => void;
}

export function ExamPaperDetails({ mode, paperId, onBack, onSuccess, onManageQuestions }: ExamPaperDetailsProps) {
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  
  const [formData, setFormData] = useState<Omit<ExamPaper, 'createdAt' | 'updatedAt' | 'exam'>>({
    paperId: '',
    examId: '',
    paperTitle: '',
    paperCode: '',
    durationMinutes: 180,
    totalMarks: 100,
    isOnline: false,
    displayOrder: 1,
    instructions: '',
    status: 'Draft',
  });

  const [ruleData, setRuleData] = useState<Omit<PaperRule, 'createdAt' | 'updatedAt' | 'paper'>>({
    ruleId: '',
    paperId: '',
    minMarksToPass: 40,
    minPercentage: 40,
    sectionWisePassRequired: false,
    mustAttemptPercentage: 100,
    evaluationMode: 'MANUAL',
    negativeMarkingEnabled: false,
    negativeMarkingPerQuestion: 0,
    graceMarks: 0,
  });

  const [hasRule, setHasRule] = useState(false);

  // Generate paper ID
  const generatePaperId = async () => {
    try {
      const papers = await examPapersService.getAll({});
      const existingIds = papers.map(p => p.paperId);
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/PAPER-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      return `PAPER-${String(maxNum + 1).padStart(3, '0')}`;
    } catch {
      return `PAPER-${Date.now()}`;
    }
  };

  // Generate rule ID
  const generateRuleId = () => {
    return `RULE-${Date.now()}`;
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load exams
        const examsData = await examsService.getAll({});
        setExams(examsData);

        if (mode === 'create') {
          const newPaperId = await generatePaperId();
          setFormData(prev => ({ ...prev, paperId: newPaperId }));
          setRuleData(prev => ({
            ...prev,
            ruleId: generateRuleId(),
            paperId: newPaperId,
          }));
        } else if (paperId) {
          // Load paper
          const paper = await examPapersService.getById(paperId);
          setFormData({
            paperId: paper.paperId,
            examId: paper.examId,
            paperTitle: paper.paperTitle,
            paperCode: paper.paperCode || '',
            durationMinutes: paper.durationMinutes,
            totalMarks: paper.totalMarks,
            isOnline: paper.isOnline,
            displayOrder: paper.displayOrder,
            instructions: paper.instructions || '',
            status: paper.status,
          });

          // Load rule if exists
          const rule = await paperRulesService.getByPaperId(paperId);
          if (rule) {
            setRuleData({
              ruleId: rule.ruleId,
              paperId: rule.paperId,
              minMarksToPass: rule.minMarksToPass,
              minPercentage: rule.minPercentage,
              sectionWisePassRequired: rule.sectionWisePassRequired,
              mustAttemptPercentage: rule.mustAttemptPercentage,
              evaluationMode: rule.evaluationMode,
              negativeMarkingEnabled: rule.negativeMarkingEnabled,
              negativeMarkingPerQuestion: rule.negativeMarkingPerQuestion,
              graceMarks: rule.graceMarks,
            });
            setHasRule(true);
          } else {
            setRuleData(prev => ({
              ...prev,
              ruleId: generateRuleId(),
              paperId: paperId,
            }));
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mode, paperId]);

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.examId) {
      toast.error('Please select an exam');
      return;
    }
    if (!formData.paperTitle.trim()) {
      toast.error('Please enter paper title');
      return;
    }
    if (formData.durationMinutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }
    if (formData.totalMarks <= 0) {
      toast.error('Total marks must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        // Create paper
        await examPapersService.create(formData);
        
        // Create rule
        await paperRulesService.create({
          ...ruleData,
          paperId: formData.paperId,
        });
      } else {
        // Update paper
        await examPapersService.update(formData.paperId, {
          paperTitle: formData.paperTitle,
          paperCode: formData.paperCode || undefined,
          durationMinutes: formData.durationMinutes,
          totalMarks: formData.totalMarks,
          isOnline: formData.isOnline,
          displayOrder: formData.displayOrder,
          instructions: formData.instructions || undefined,
          status: formData.status,
        });

        // Update or create rule
        if (hasRule) {
          await paperRulesService.update(ruleData.ruleId, {
            minMarksToPass: ruleData.minMarksToPass,
            minPercentage: ruleData.minPercentage,
            sectionWisePassRequired: ruleData.sectionWisePassRequired,
            mustAttemptPercentage: ruleData.mustAttemptPercentage,
            evaluationMode: ruleData.evaluationMode,
            negativeMarkingEnabled: ruleData.negativeMarkingEnabled,
            negativeMarkingPerQuestion: ruleData.negativeMarkingPerQuestion,
            graceMarks: ruleData.graceMarks,
          });
        } else {
          await paperRulesService.create(ruleData);
        }
      }

      setIsEditing(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save paper');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
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
              {mode === 'create' ? 'Create Exam Paper' : formData.paperTitle || 'Exam Paper'}
            </h1>
            {mode !== 'create' && (
              <p className="text-gray-500">{formData.paperId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode !== 'create' && formData.isOnline && onManageQuestions && (
            <Button variant="outline" onClick={() => onManageQuestions(formData.paperId)}>
              <Settings className="w-4 h-4 mr-2" />
              Manage Questions
            </Button>
          )}
          {!isEditing && mode !== 'create' && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paper Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Paper Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paper ID</Label>
                <Input value={formData.paperId} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Paper Code (Optional)</Label>
                <Input
                  value={formData.paperCode}
                  onChange={(e) => setFormData({ ...formData, paperCode: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Paper-1, Set-A"
                />
              </div>
            </div>

            <div>
              <Label>Exam *</Label>
              <select
                value={formData.examId}
                onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                disabled={!isEditing || mode !== 'create'}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.examName} ({exam.examType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Paper Title *</Label>
              <Input
                value={formData.paperTitle}
                onChange={(e) => setFormData({ ...formData, paperTitle: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Mathematics Paper 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={1}
                />
              </div>
              <div>
                <Label>Total Marks *</Label>
                <Input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={1}
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Exam Type *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isOnline}
                    onChange={() => setFormData({ ...formData, isOnline: true })}
                    disabled={!isEditing}
                    className="w-4 h-4"
                  />
                  <Monitor className="w-4 h-4 text-blue-600" />
                  <span>Online Exam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.isOnline}
                    onChange={() => setFormData({ ...formData, isOnline: false })}
                    disabled={!isEditing}
                    className="w-4 h-4"
                  />
                  <Clipboard className="w-4 h-4 text-gray-600" />
                  <span>Manual Exam</span>
                </label>
              </div>
              {formData.isOnline && (
                <p className="text-sm text-blue-600 mt-2">
                  Online exams support MCQ, Theory, and Descriptive questions with auto/manual evaluation.
                </p>
              )}
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter exam instructions for students..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pass/Fail Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Pass/Fail Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Marks to Pass</Label>
                <Input
                  type="number"
                  value={ruleData.minMarksToPass}
                  onChange={(e) => setRuleData({ ...ruleData, minMarksToPass: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Minimum Percentage (%)</Label>
                <Input
                  type="number"
                  value={ruleData.minPercentage}
                  onChange={(e) => setRuleData({ ...ruleData, minPercentage: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Must Attempt (%)</Label>
                <Input
                  type="number"
                  value={ruleData.mustAttemptPercentage}
                  onChange={(e) => setRuleData({ ...ruleData, mustAttemptPercentage: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Grace Marks</Label>
                <Input
                  type="number"
                  value={ruleData.graceMarks}
                  onChange={(e) => setRuleData({ ...ruleData, graceMarks: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label>Evaluation Mode</Label>
              <select
                value={ruleData.evaluationMode}
                onChange={(e) => setRuleData({ ...ruleData, evaluationMode: e.target.value as any })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="AUTO">Automatic (MCQ Only)</option>
                <option value="MANUAL">Manual Evaluation</option>
                <option value="MIXED">Mixed (Auto for MCQ, Manual for Others)</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sectionWisePass"
                  checked={ruleData.sectionWisePassRequired}
                  onChange={(e) => setRuleData({ ...ruleData, sectionWisePassRequired: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4"
                />
                <Label htmlFor="sectionWisePass" className="cursor-pointer">
                  Section-wise Pass Required
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negativeMarking"
                  checked={ruleData.negativeMarkingEnabled}
                  onChange={(e) => setRuleData({ ...ruleData, negativeMarkingEnabled: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4"
                />
                <Label htmlFor="negativeMarking" className="cursor-pointer">
                  Enable Negative Marking
                </Label>
              </div>
            </div>

            {ruleData.negativeMarkingEnabled && (
              <div>
                <Label>Negative Marks per Wrong Answer</Label>
                <Input
                  type="number"
                  value={ruleData.negativeMarkingPerQuestion}
                  onChange={(e) => setRuleData({ ...ruleData, negativeMarkingPerQuestion: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  min={0}
                  step="0.01"
                />
              </div>
            )}

            {/* Rule Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Rule Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pass if: ≥{ruleData.minMarksToPass} marks OR ≥{ruleData.minPercentage}%</li>
                <li>• Must attempt: {ruleData.mustAttemptPercentage}% of questions</li>
                <li>• Evaluation: {ruleData.evaluationMode === 'AUTO' ? 'Automatic' : ruleData.evaluationMode === 'MANUAL' ? 'Manual' : 'Mixed'}</li>
                {ruleData.negativeMarkingEnabled && (
                  <li>• Negative marking: -{ruleData.negativeMarkingPerQuestion} per wrong answer</li>
                )}
                {ruleData.graceMarks > 0 && (
                  <li>• Grace marks: +{ruleData.graceMarks}</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Exam Notice */}
      {formData.isOnline && mode !== 'create' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Online Exam Configuration</h3>
                <p className="text-blue-700 text-sm mt-1">
                  This is an online exam. You can add questions (MCQ, Theory, Descriptive) using the "Manage Questions" button above.
                  Students will be able to attempt this exam online once it's published.
                </p>
                {onManageQuestions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => onManageQuestions(formData.paperId)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Questions
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments - only for existing papers (edit/view) */}
      {mode !== 'create' && paperId && (
        <FileAttachments
          entityType="exam_paper"
          entityId={paperId}
          readOnly={!isEditing}
          title="Paper Attachments"
        />
      )}
    </div>
  );
}
