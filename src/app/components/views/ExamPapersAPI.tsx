import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, FileText, Monitor, Clipboard, Settings, PlayCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { examPapersService } from '../../services/exam-papers.service';
import { examsService } from '../../services/exams.service';
import { ExamPaperDetails } from './ExamPaperDetails';
import { QuestionsManager } from './QuestionsManager';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import type { ExamPaper, Exam } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n';

type ViewMode = 'list' | 'details' | 'questions';

export function ExamPapersAPI() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>(''); // online/manual filter
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedPaperId, setSelectedPaperId] = useState<string | undefined>();
  
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    paper?: ExamPaper;
  }>({ open: false });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [papersData, examsData] = await Promise.all([
        examPapersService.getAll({
          examId: selectedExamId || undefined,
          isOnline: selectedMode === 'online' ? true : selectedMode === 'manual' ? false : undefined,
          status: selectedStatus || undefined,
        }),
        examsService.getAll({}),
      ]);
      
      setPapers(papersData);
      setExams(examsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam papers');
      toast.error('Failed to load exam papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId, selectedStatus, selectedMode]);

  // Filter papers by search
  const filteredPapers = papers.filter(paper => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      paper.paperTitle.toLowerCase().includes(search) ||
      paper.paperId.toLowerCase().includes(search) ||
      (paper.paperCode?.toLowerCase().includes(search))
    );
  });

  // Get exam name by ID
  const getExamName = (examId: string) => {
    const exam = exams.find(e => e.examId === examId);
    return exam?.examName || examId;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.paper) return;
    
    try {
      await examPapersService.delete(deleteDialog.paper.paperId);
      toast.success('Exam paper deleted successfully');
      setDeleteDialog({ open: false });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exam paper');
    }
  };

  // Handle view change
  const handleViewPaper = (paperId: string, mode: 'view' | 'edit') => {
    setSelectedPaperId(paperId);
    setDetailsMode(mode);
    setViewMode('details');
  };

  const handleManageQuestions = (paperId: string) => {
    setSelectedPaperId(paperId);
    setViewMode('questions');
  };

  const handleCreatePaper = () => {
    setSelectedPaperId(undefined);
    setDetailsMode('create');
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPaperId(undefined);
    loadData();
  };

  // Render based on view mode
  if (viewMode === 'details') {
    return (
      <ExamPaperDetails
        mode={detailsMode}
        paperId={selectedPaperId}
        onBack={handleBackToList}
        onSuccess={() => {
          handleBackToList();
          toast.success(detailsMode === 'create' ? 'Paper created successfully' : 'Paper updated successfully');
        }}
        onManageQuestions={(paperId) => {
          setSelectedPaperId(paperId);
          setViewMode('questions');
        }}
      />
    );
  }

  if (viewMode === 'questions') {
    return (
      <QuestionsManager
        paperId={selectedPaperId!}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Papers</h1>
          <p className="text-gray-600 mt-1">Manage exam papers for online and manual exams</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreatePaper} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Paper
          </Button>
          <Button variant="outline" onClick={handleCreatePaper} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Fill Sample Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search papers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[200px]"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.examId} value={exam.examId}>
                  {exam.examName}
                </option>
              ))}
            </select>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="manual">Manual</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={loadData} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Papers Table */}
      {!loading && !error && (
        <Card>
          <CardContent className="pt-6">
            {filteredPapers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No exam papers found</h3>
                <p className="text-gray-500 mt-1">Create your first exam paper to get started</p>
                <Button onClick={handleCreatePaper} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Paper
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paper ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPapers.map((paper) => (
                    <TableRow key={paper.paperId}>
                      <TableCell className="font-mono text-sm">{paper.paperId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{paper.paperTitle}</p>
                          {paper.paperCode && (
                            <p className="text-xs text-gray-500">{paper.paperCode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getExamName(paper.examId)}</TableCell>
                      <TableCell>
                        <Badge variant={paper.isOnline ? 'default' : 'secondary'}>
                          {paper.isOnline ? (
                            <><Monitor className="w-3 h-3 mr-1" /> Online</>
                          ) : (
                            <><Clipboard className="w-3 h-3 mr-1" /> Manual</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{paper.durationMinutes} min</TableCell>
                      <TableCell>{paper.totalMarks}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paper.status === 'Published' ? 'default' :
                            paper.status === 'Draft' ? 'secondary' : 'outline'
                          }
                        >
                          {paper.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPaper(paper.paperId, 'view')}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPaper(paper.paperId, 'edit')}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {paper.isOnline && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageQuestions(paper.paperId)}
                              title="Manage Questions"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, paper })}
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {!loading && !error && papers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{papers.length}</p>
                  <p className="text-sm text-gray-500">Total Papers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Monitor className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{papers.filter(p => p.isOnline).length}</p>
                  <p className="text-sm text-gray-500">Online Papers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clipboard className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{papers.filter(p => !p.isOnline).length}</p>
                  <p className="text-sm text-gray-500">Manual Papers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{papers.filter(p => p.status === 'Published').length}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="Delete Exam Paper"
        description={`Are you sure you want to delete "${deleteDialog.paper?.paperTitle}"? This will also delete all associated questions and cannot be undone.`}
      />
    </div>
  );
}
