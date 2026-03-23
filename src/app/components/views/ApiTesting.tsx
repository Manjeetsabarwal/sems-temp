import React, { useState } from 'react';
import { examPapersService } from '../../services/exam-papers.service';
import type { ExamPaper } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Code2, Send, Trash2 } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export function ApiTesting() {
  const [loading, setLoading] = useState<string | null>(null);
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [formData, setFormData] = useState<Partial<ExamPaper>>({
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

  const [filters, setFilters] = useState({
    examId: '',
    isOnline: '',
    status: '',
  });

  const [paperId, setPaperId] = useState('');
  const [examId, setExamId] = useState('');

  const addResponse = (response: ApiResponse) => {
    setResponses((prev) => [response, ...prev].slice(0, 10)); // Keep last 10
  };

  const handleApiCall = async (
    name: string,
    apiCall: () => Promise<any>,
  ) => {
    setLoading(name);
    const startTime = Date.now();
    try {
      const data = await apiCall();
      const duration = Date.now() - startTime;
      addResponse({
        success: true,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
      toast.success(`${name} completed successfully (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResponse({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toLocaleTimeString(),
      });
      toast.error(`${name} failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  // API Test Functions
  const testGetAll = () => {
    handleApiCall('GET All Papers', () =>
      examPapersService.getAll({
        examId: filters.examId || undefined,
        isOnline: filters.isOnline === 'true' ? true : filters.isOnline === 'false' ? false : undefined,
        status: filters.status || undefined,
      }),
    );
  };

  const testGetById = () => {
    if (!paperId.trim()) {
      toast.error('Please enter a Paper ID');
      return;
    }
    handleApiCall('GET Paper by ID', () => examPapersService.getById(paperId.trim()));
  };

  const testGetByExamId = () => {
    if (!examId.trim()) {
      toast.error('Please enter an Exam ID');
      return;
    }
    handleApiCall('GET Papers by Exam ID', () =>
      examPapersService.getByExamId(examId.trim()),
    );
  };

  const testCreate = () => {
    if (!formData.paperId || !formData.examId || !formData.paperTitle) {
      toast.error('Please fill in required fields: Paper ID, Exam ID, Paper Title');
      return;
    }
    handleApiCall('CREATE Paper', () =>
      examPapersService.create({
        paperId: formData.paperId!,
        examId: formData.examId!,
        paperTitle: formData.paperTitle!,
        paperCode: formData.paperCode || undefined,
        durationMinutes: formData.durationMinutes || 180,
        totalMarks: formData.totalMarks || 100,
        isOnline: formData.isOnline || false,
        displayOrder: formData.displayOrder || 1,
        instructions: formData.instructions || undefined,
        status: (formData.status as any) || 'Draft',
      }),
    );
  };

  const testUpdate = () => {
    if (!paperId.trim()) {
      toast.error('Please enter a Paper ID to update');
      return;
    }
    handleApiCall('UPDATE Paper', () =>
      examPapersService.update(paperId.trim(), {
        paperTitle: formData.paperTitle,
        paperCode: formData.paperCode,
        durationMinutes: formData.durationMinutes,
        totalMarks: formData.totalMarks,
        isOnline: formData.isOnline,
        displayOrder: formData.displayOrder,
        instructions: formData.instructions,
        status: formData.status,
      }),
    );
  };

  const testDelete = () => {
    if (!paperId.trim()) {
      toast.error('Please enter a Paper ID to delete');
      return;
    }
    if (!confirm(`Are you sure you want to delete paper "${paperId}"?`)) {
      return;
    }
    handleApiCall('DELETE Paper', () => examPapersService.delete(paperId.trim()));
  };

  const testBulkDelete = () => {
    const ids = paperId.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      toast.error('Please enter Paper IDs (comma-separated)');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${ids.length} papers?`)) {
      return;
    }
    handleApiCall('BULK DELETE Papers', () => examPapersService.bulkDelete(ids));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Testing</h1>
          <p className="text-gray-600 mt-1">Test Exam Papers API Endpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-blue-600" />
          <span className="text-sm text-gray-500">Version 3 Module</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: API Tests */}
        <div className="space-y-6">
          {/* GET All Papers */}
          <Card>
            <CardHeader>
              <CardTitle>GET All Papers</CardTitle>
              <CardDescription>Fetch all exam papers with optional filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Exam ID</Label>
                  <Input
                    placeholder="Filter by exam"
                    value={filters.examId}
                    onChange={(e) => setFilters({ ...filters, examId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Is Online</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.isOnline}
                    onChange={(e) => setFilters({ ...filters, isOnline: e.target.value })}
                  >
                    <option value="">All</option>
                    <option value="true">Online</option>
                    <option value="false">Manual</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All</option>
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={testGetAll}
                disabled={loading === 'GET All Papers'}
                className="w-full"
              >
                {loading === 'GET All Papers' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Test GET All
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* GET by ID */}
          <Card>
            <CardHeader>
              <CardTitle>GET Paper by ID</CardTitle>
              <CardDescription>Fetch a single paper by its ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Paper ID</Label>
                <Input
                  placeholder="e.g., PAPER-001"
                  value={paperId}
                  onChange={(e) => setPaperId(e.target.value)}
                />
              </div>
              <Button
                onClick={testGetById}
                disabled={loading === 'GET Paper by ID'}
                className="w-full"
              >
                {loading === 'GET Paper by ID' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Test GET by ID
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* GET by Exam ID */}
          <Card>
            <CardHeader>
              <CardTitle>GET Papers by Exam ID</CardTitle>
              <CardDescription>Fetch all papers for a specific exam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam ID</Label>
                <Input
                  placeholder="e.g., EXM001"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                />
              </div>
              <Button
                onClick={testGetByExamId}
                disabled={loading === 'GET Papers by Exam ID'}
                className="w-full"
              >
                {loading === 'GET Papers by Exam ID' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Test GET by Exam ID
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* CREATE */}
          <Card>
            <CardHeader>
              <CardTitle>CREATE Paper</CardTitle>
              <CardDescription>Create a new exam paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Paper ID *</Label>
                  <Input
                    placeholder="PAPER-001"
                    value={formData.paperId}
                    onChange={(e) => setFormData({ ...formData, paperId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Exam ID *</Label>
                  <Input
                    placeholder="EXM001"
                    value={formData.examId}
                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Paper Title *</Label>
                <Input
                  placeholder="Mathematics Paper 1"
                  value={formData.paperTitle}
                  onChange={(e) => setFormData({ ...formData, paperTitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Paper Code</Label>
                  <Input
                    placeholder="P1"
                    value={formData.paperCode}
                    onChange={(e) => setFormData({ ...formData, paperCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 180 })
                    }
                  />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalMarks}
                    onChange={(e) =>
                      setFormData({ ...formData, totalMarks: parseFloat(e.target.value) || 100 })
                    }
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={formData.isOnline}
                  onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isOnline" className="cursor-pointer">
                  Is Online Exam
                </Label>
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  placeholder="Exam instructions..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                onClick={testCreate}
                disabled={loading === 'CREATE Paper'}
                className="w-full"
              >
                {loading === 'CREATE Paper' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Test CREATE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* UPDATE */}
          <Card>
            <CardHeader>
              <CardTitle>UPDATE Paper</CardTitle>
              <CardDescription>Update an existing paper (use Paper ID above)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testUpdate}
                disabled={loading === 'UPDATE Paper'}
                className="w-full"
                variant="outline"
              >
                {loading === 'UPDATE Paper' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Test UPDATE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* DELETE */}
          <Card>
            <CardHeader>
              <CardTitle>DELETE Paper</CardTitle>
              <CardDescription>Delete a paper by ID</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testDelete}
                disabled={loading === 'DELETE Paper'}
                className="w-full"
                variant="destructive"
              >
                {loading === 'DELETE Paper' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Test DELETE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* BULK DELETE */}
          <Card>
            <CardHeader>
              <CardTitle>BULK DELETE Papers</CardTitle>
              <CardDescription>Delete multiple papers (comma-separated IDs)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Paper IDs (comma-separated)</Label>
                <Input
                  placeholder="PAPER-001, PAPER-002"
                  value={paperId}
                  onChange={(e) => setPaperId(e.target.value)}
                />
              </div>
              <Button
                onClick={testBulkDelete}
                disabled={loading === 'BULK DELETE Papers'}
                className="w-full"
                variant="destructive"
              >
                {loading === 'BULK DELETE Papers' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Test BULK DELETE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Responses */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Responses</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResponses([])}
                >
                  Clear
                </Button>
              </div>
              <CardDescription>Last 10 API call responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[800px] overflow-y-auto">
                {responses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No API calls yet. Test an endpoint to see responses here.
                  </p>
                ) : (
                  responses.map((response, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {response.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {response.success ? 'Success' : 'Error'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{response.timestamp}</span>
                      </div>
                      {response.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {response.error}
                        </div>
                      )}
                      {response.data && (
                        <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-x-auto">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
