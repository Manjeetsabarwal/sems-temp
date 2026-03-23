import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Trophy,
  CheckCircle,
  XCircle,
  BarChart3,
  Award,
  FileSpreadsheet,
  Grid3x3,
  List,
  Filter,
  FileText,
  Printer,
  Bell,
  Mail,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
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
import type { Result } from '../../types';
import { resultsService } from '../../services/results.service';
import { classesService } from '../../services/classes.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { generateResultPDF, generateBulkResultsPDF, generateNoticeBoardPDF } from '../../utils/pdfGenerator';
import { shareViaWhatsApp, shareViaEmail, downloadPDFForSharing } from '../../utils/shareUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ResultDetails } from './ResultDetails';

type SortField = 'resultId' | 'studentName' | 'examName' | 'percentage' | 'grade' | 'rank';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

export function ResultsAPI() {
  const [results, setResults] = useState<Result[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('resultId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Dialog states
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    result?: Result;
    isBulk?: boolean;
  }>({ open: false });
  const [publishDialog, setPublishDialog] = useState<{
    open: boolean;
    result?: Result;
    sendEmail: boolean;
  }>({ open: false, sendEmail: true });
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    result?: Result;
  }>({ open: false });

  // Load classes for filter dropdown
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await classesService.getAll();
        setClasses(data);
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };
    loadClasses();
  }, []);

  // Fetch results using NestJS service
  const fetchResults = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedExam) filters.examId = selectedExam;
      if (selectedClass !== 'all') filters.classId = selectedClass;
      if (selectedStatus !== 'all') filters.status = selectedStatus;

      const data = await resultsService.getAll(filters);
      setResults(data);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast.error(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExam, selectedClass, selectedStatus]);

  // Filter and sort results
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.examName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.resultId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'percentage' || sortField === 'rank') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedResults(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedResults.size === sortedResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(sortedResults.map((r) => r.resultId)));
    }
  };

  // Delete single result
  const handleDelete = async (result: Result) => {
    try {
      await resultsService.delete(result.resultId);
      toast.success('Result deleted successfully');
      fetchResults();
      setDeleteDialog({ open: false });
    } catch (error: any) {
      console.error('Error deleting result:', error);
      toast.error(error.message || 'Failed to delete result');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      await resultsService.bulkDelete(Array.from(selectedResults));
      toast.success(`Successfully deleted ${selectedResults.size} results`);
      setSelectedResults(new Set());
      fetchResults();
      setDeleteDialog({ open: false });
    } catch (error: any) {
      console.error('Error deleting results:', error);
      toast.error(error.message || 'Failed to delete results');
    }
  };

  // Publish/Unpublish result
  const handleTogglePublish = async (result: Result) => {
    if (result.status === 'Published') {
      // Unpublish directly without dialog
      try {
        await resultsService.unpublish(result.resultId);
        toast.success('Result unpublished successfully');
        fetchResults();
      } catch (error: any) {
        console.error('Error unpublishing result:', error);
        toast.error(error.message || 'Failed to unpublish result');
      }
    } else {
      // Show publish dialog with email option
      setPublishDialog({ open: true, result, sendEmail: true });
    }
  };

  // Confirm publish with email option
  const handleConfirmPublish = async () => {
    if (!publishDialog.result) return;

    try {
      await resultsService.publish(publishDialog.result.resultId, publishDialog.sendEmail);
      toast.success(
        publishDialog.sendEmail
          ? 'Result published and notifications sent successfully'
          : 'Result published successfully (no notifications sent)'
      );
      setPublishDialog({ open: false, sendEmail: true });
      fetchResults();
    } catch (error: any) {
      console.error('Error publishing result:', error);
      toast.error(error.message || 'Failed to publish result');
    }
  };

  // Send notification for published result
  const handleSendNotification = async (result: Result) => {
    try {
      const response = await resultsService.sendNotification(result.resultId);
      toast.success(`Notification sent successfully to ${response.emailsSent} recipient(s)`);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    }
  };

  // Handle share via WhatsApp
  const handleShareWhatsApp = (result: Result) => {
    try {
      downloadPDFForSharing(result);
      shareViaWhatsApp(result);
      toast.success('Opening WhatsApp... Please attach the downloaded PDF');
      setShareDialog({ open: false });
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Failed to share via WhatsApp');
    }
  };

  // Handle share via Email
  const handleShareEmail = (result: Result) => {
    try {
      downloadPDFForSharing(result);
      shareViaEmail(result);
      toast.success('Opening email client... Please attach the downloaded PDF');
      setShareDialog({ open: false });
    } catch (error: any) {
      console.error('Error sharing via email:', error);
      toast.error('Failed to share via email');
    }
  };

  // Calculate ranks for an exam
  const handleCalculateRanks = async (examId: string) => {
    try {
      await resultsService.calculateRanks(examId);
      toast.success('Ranks calculated successfully');
      fetchResults();
    } catch (error: any) {
      console.error('Error calculating ranks:', error);
      toast.error(error.message || 'Failed to calculate ranks');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = sortedResults.map((r) => ({
      'Result ID': r.resultId,
      'Student Name': r.studentName,
      'Exam Name': r.examName,
      Class: r.classId,
      'Total Marks': `${r.totalMarksObtained}/${r.totalMaxMarks}`,
      'Percentage': `${r.percentage}%`,
      Grade: r.grade,
      Rank: r.rank || 'N/A',
      Status: r.status,
      Result: r.isPassed ? 'Pass' : 'Fail',
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map((row) => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Results exported successfully');
  };

  // Download PDF for single result
  const handleDownloadPDF = (result: Result) => {
    try {
      generateResultPDF(result);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Download PDFs for selected results
  const handleDownloadBulkPDF = () => {
    try {
      const selectedResultsList = sortedResults.filter(r => selectedResults.has(r.resultId));
      const publishedResults = selectedResultsList.filter(r => r.status === 'Published');

      if (publishedResults.length === 0) {
        toast.warning('Please select published results to download');
        return;
      }

      generateBulkResultsPDF(publishedResults);
      toast.success(`Downloading ${publishedResults.length} PDF(s)...`);
    } catch (error: any) {
      console.error('Error generating PDFs:', error);
      toast.error('Failed to generate PDFs');
    }
  };

  // Generate notice board PDF for an exam/class
  const handleGenerateNoticeBoardPDF = () => {
    try {
      const publishedResults = sortedResults.filter(r => r.status === 'Published');

      if (publishedResults.length === 0) {
        toast.warning('No published results available');
        return;
      }

      // Group by exam and class
      const examName = publishedResults[0]?.examName || 'Exam';
      const className = publishedResults[0]?.classId || 'Class';

      generateNoticeBoardPDF(publishedResults, examName, className);
      toast.success('Notice board PDF generated successfully');
    } catch (error: any) {
      console.error('Error generating notice board PDF:', error);
      toast.error('Failed to generate notice board PDF');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Show Details Panel if mode is set */}
      {detailsMode ? (
        <ResultDetails
          mode={detailsMode}
          resultId={selectedResultId}
          onBack={() => {
            setDetailsMode(null);
            setSelectedResultId(undefined);
          }}
          onSuccess={() => {
            fetchResults();
            setDetailsMode(null);
            setSelectedResultId(undefined);
          }}
        />
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-blue-600" />
              Results Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and publish student exam results with automatic grade calculation
            </p>
          </div>

          {/* Sticky Action Bar - Excel Style */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
            <div className="py-3 px-4">
              {/* Top Row - Main Actions */}
              <div className="flex flex-wrap items-center gap-4 mb-3">
                {/* Database Group */}
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                  <span className="text-xs text-gray-500 font-medium">Database</span>
                  <Button
                    onClick={() => {
                      setDetailsMode('create');
                      setSelectedResultId(undefined);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Result
                  </Button>
                  <Button onClick={fetchResults} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>

                {/* Data Group */}
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                  <span className="text-xs text-gray-500 font-medium">Data</span>
                  <Button onClick={handleExport} variant="outline" size="sm" disabled={sortedResults.length === 0}>
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleGenerateNoticeBoardPDF}
                    variant="outline"
                    size="sm"
                    disabled={sortedResults.filter(r => r.status === 'Published').length === 0}
                    className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Notice Board PDF
                  </Button>
                  {selectedResults.size > 0 && (
                    <Button
                      onClick={handleDownloadBulkPDF}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Download PDFs ({selectedResults.size})
                    </Button>
                  )}
                  {selectedResults.size > 0 && (
                    <Button
                      onClick={() => setDeleteDialog({ open: true, isBulk: true })}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete ({selectedResults.size})
                    </Button>
                  )}
                </div>

                {/* View Group */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">View</span>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-none border-l border-gray-200"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Filters */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[250px] max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by student, exam, or result ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters Group */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.classId} value={cls.classId}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="ml-auto text-sm text-gray-600">
                  Showing <span className="font-semibold">{sortedResults.length}</span> of{' '}
                  <span className="font-semibold">{results.length}</span> results
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {sortedResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Trophy className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No results found</p>
                <p className="text-gray-400 text-sm mb-6">
                  {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Generate results from marks to get started'}
                </p>
                <Button
                  onClick={() => {
                    setDetailsMode('create');
                    setSelectedResultId(undefined);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Result
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            /* Table View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedResults.size === sortedResults.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead onClick={() => handleSort('resultId')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Result ID
                            <SortIcon field="resultId" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('studentName')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Student Name
                            <SortIcon field="studentName" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('examName')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Exam Name
                            <SortIcon field="examName" />
                          </div>
                        </TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead onClick={() => handleSort('percentage')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Percentage
                            <SortIcon field="percentage" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('grade')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Grade
                            <SortIcon field="grade" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('rank')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Rank
                            <SortIcon field="rank" />
                          </div>
                        </TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((result) => (
                        <TableRow key={result.resultId} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedResults.has(result.resultId)}
                              onCheckedChange={() => toggleSelection(result.resultId)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => {
                                setSelectedResultId(result.resultId);
                                setDetailsMode('view');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {result.resultId}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                setSelectedResultId(result.resultId);
                                setDetailsMode('view');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {result.studentName}
                            </button>
                          </TableCell>
                          <TableCell>{result.examName}</TableCell>
                          <TableCell>{result.classId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${result.percentage >= 75
                                    ? 'bg-green-500'
                                    : result.percentage >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                    }`}
                                  style={{ width: `${result.percentage}%` }}
                                />
                              </div>
                              <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                result.grade === 'A+' || result.grade === 'A'
                                  ? 'default'
                                  : result.grade === 'F'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.rank ? (
                              <div className="flex items-center gap-1">
                                {result.rank <= 3 && <Award className="w-4 h-4 text-yellow-500" />}
                                <span className="font-medium">#{result.rank}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.isPassed ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Pass</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">Fail</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.status === 'Published' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedResultId(result.resultId);
                                  setDetailsMode('view');
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedResultId(result.resultId);
                                  setDetailsMode('edit');
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePublish(result)}
                                className={result.status === 'Published' ? 'text-orange-600' : 'text-green-600'}
                              >
                                {result.status === 'Published' ? 'Unpublish' : 'Publish'}
                              </Button>
                              {result.status === 'Published' && (
                                <>
                                  {/* <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendNotification(result)}
                                    className="text-purple-600 hover:text-purple-700"
                                    title="Send Email Notification"
                                  >
                                    <Bell className="w-4 h-4" />
                                  </Button> */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShareDialog({ open: true, result })}
                                    className="text-green-600 hover:text-green-700"
                                    title="Share PDF"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadPDF(result)}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Download PDF"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, result })}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResults.map((result) => (
                <Card
                  key={result.resultId}
                  className="hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => {
                    setSelectedResultId(result.resultId);
                    setDetailsMode('view');
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    className="absolute top-4 left-4 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedResults.has(result.resultId)}
                      onCheckedChange={() => toggleSelection(result.resultId)}
                    />
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pl-8">
                        <CardTitle className="text-lg mb-1">{result.studentName}</CardTitle>
                        <p className="text-sm text-gray-500">{result.examName}</p>
                      </div>
                      <Badge variant={result.status === 'Published' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Percentage Circle */}
                      <div className="flex items-center justify-center py-4">
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(result.percentage / 100) * 351.86} 351.86`}
                              className={
                                result.percentage >= 75
                                  ? 'text-green-500'
                                  : result.percentage >= 50
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                              }
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-3xl font-bold">{result.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500">Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Grade</p>
                          <p className="font-bold text-xl">{result.grade}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rank</p>
                          <p className="font-bold text-xl flex items-center gap-1">
                            {result.rank ? (
                              <>
                                {result.rank <= 3 && <Award className="w-5 h-5 text-yellow-500" />}
                                #{result.rank}
                              </>
                            ) : (
                              '-'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Marks</p>
                          <p className="font-medium">
                            {result.totalMarksObtained}/{result.totalMaxMarks}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Result</p>
                          <p
                            className={`font-medium flex items-center gap-1 ${result.isPassed ? 'text-green-600' : 'text-red-600'
                              }`}
                          >
                            {result.isPassed ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Pass
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Fail
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedResultId(result.resultId);
                            setDetailsMode('view');
                          }}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResultId(result.resultId);
                              setDetailsMode('edit');
                            }}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(result)}
                            className="flex-1"
                          >
                            {result.status === 'Published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          {result.status === 'Published' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendNotification(result)}
                                className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
                                title="Send Email Notification"
                              >
                                <Bell className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShareDialog({ open: true, result })}
                                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                                title="Share PDF"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(result)}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                                title="Download PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, result })}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={deleteDialog.isBulk ? handleBulkDelete : () => deleteDialog.result && handleDelete(deleteDialog.result)}
        title={deleteDialog.isBulk ? 'Delete Multiple Results' : 'Delete Result'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedResults.size} results? This action cannot be undone.`
            : `Are you sure you want to delete the result for ${deleteDialog.result?.studentName}? This action cannot be undone.`
        }
      />

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialog.open} onOpenChange={(open) => setPublishDialog({ ...publishDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Result</DialogTitle>
            <DialogDescription>
              Publish the result for {publishDialog.result?.studentName}? You can choose to send email notifications to the student, parent, and teachers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              {/* <Checkbox
                id="send-email"
                checked={publishDialog.sendEmail}
                onCheckedChange={(checked) =>
                  setPublishDialog({ ...publishDialog, sendEmail: checked === true })
                }
              />
              <label
                htmlFor="send-email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send email notifications to student, parent, and teachers
              </label> */}
            </div>
            {/* <p className="text-xs text-gray-500 mt-2 ml-6">
              Emails will be sent to: student email, parent email (if available), and all teachers
            </p> */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialog({ open: false, sendEmail: true })}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmPublish} className="bg-green-600 hover:bg-green-700">
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog.open} onOpenChange={(open) => setShareDialog({ ...shareDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Result PDF</DialogTitle>
            <DialogDescription>
              Share the result PDF for {shareDialog.result?.studentName} via WhatsApp or Email
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button
              onClick={() => shareDialog.result && handleShareWhatsApp(shareDialog.result)}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Share via WhatsApp
            </Button>
            <Button
              onClick={() => shareDialog.result && handleShareEmail(shareDialog.result)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Mail className="w-5 h-5" />
              Share via Email
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Note: The PDF will be downloaded automatically. Please attach it when sharing.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialog({ open: false })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
