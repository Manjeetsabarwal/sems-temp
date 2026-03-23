import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, RefreshCw, DollarSign, Download, Calendar, Filter, Sparkles, Send, MessageSquare, Loader2, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { paidStudentFeesService } from '../../services/paid-student-fees.service';
import { enrollmentsService } from '../../services/enrollments.service';
import { studentsService } from '../../services/students.service';
import { batchesService } from '../../services/batches.service';
import { coursesService } from '../../services/courses.service';
import { toast } from 'sonner';
import type { PaidStudentFee, StudentEnrollment } from '../../types';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n';
import { format } from 'date-fns';
import { paymentRemindersService, type PaymentReminder, type ReminderStats } from '../../services/payment-reminders.service';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function FeesAPI() {
  const { goBack, canGoBack } = useApp();
  const { t } = useLanguage();
  const [fees, setFees] = useState<PaidStudentFee[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [batches, setBatches] = useState<Array<{ id: number; title: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [students, setStudents] = useState<Array<{ studentId: string; name: string }>>([]);
  const [statistics, setStatistics] = useState({
    totalCollected: 0,
    totalFees: 0,
    pendingAmount: 0,
    feeCount: 0,
  });
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [reminderStats, setReminderStats] = useState<ReminderStats | null>(null);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);

  const [formData, setFormData] = useState<Partial<PaidStudentFee>>({
    enrollmentId: 0,
    amount: 0,
    payType: 'Fee',
    payMode: 'Cash',
    upiId: '',
    acNumber: '',
    transactionId: '',
    notes: '',
  });

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await paidStudentFeesService.getAll();
      let filteredData = data;

      // Apply filters
      if (search) {
        filteredData = filteredData.filter((fee) => {
          const student = students.find((s) => s.studentId === fee.enrollment?.studentId);
          return (
            fee.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
            fee.notes?.toLowerCase().includes(search.toLowerCase()) ||
            student?.name.toLowerCase().includes(search.toLowerCase())
          );
        });
      }

      if (paymentModeFilter && paymentModeFilter !== 'all') {
        filteredData = filteredData.filter((fee) => fee.payMode === paymentModeFilter);
      }

      if (dateFilter) {
        filteredData = filteredData.filter((fee) => {
          const feeDate = new Date(fee.createdAt || '').toISOString().split('T')[0];
          return feeDate === dateFilter;
        });
      }

      setFees(filteredData);

      // Calculate statistics
      const totalCollected = filteredData.reduce((sum, fee) => sum + fee.amount, 0);
      setStatistics({
        totalCollected,
        totalFees: totalCollected,
        pendingAmount: 0,
        feeCount: filteredData.length,
      });
    } catch (error) {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const data = await enrollmentsService.getAll();
      setEnrollments(data);
    } catch (error) {
      toast.error('Failed to load enrollments');
    }
  };

  const loadBatches = async () => {
    try {
      const data = await batchesService.getAll();
      setBatches(data);
    } catch (error) {
      toast.error('Failed to load batches');
    }
  };

  const loadCourses = async () => {
    try {
      const data = await coursesService.getAll();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentsService.getAll();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    loadFees();
    loadEnrollments();
    loadBatches();
    loadCourses();
    loadStudents();
  }, []);

  useEffect(() => {
    loadFees();
  }, [search, paymentModeFilter, dateFilter]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await paidStudentFeesService.create(formData);
      toast.success('Fee payment added successfully');
      setViewMode('list');
      loadFees();
      setFormData({
        enrollmentId: 0,
        amount: 0,
        payType: 'Fee',
        payMode: 'Cash',
        upiId: '',
        acNumber: '',
        transactionId: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add fee payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await paidStudentFeesService.update(selectedId, formData);
      toast.success('Fee payment updated successfully');
      setViewMode('list');
      loadFees();
    } catch (error) {
      toast.error('Failed to update fee payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee payment?')) return;
    setLoading(true);
    try {
      await paidStudentFeesService.delete(id);
      toast.success('Fee payment deleted successfully');
      loadFees();
    } catch (error) {
      toast.error('Failed to delete fee payment');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.studentId === studentId);
    return student?.name || 'Unknown';
  };

  const getEnrollmentDetails = (enrollmentId: number) => {
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return { studentName: 'Unknown', batchName: 'Unknown', courseName: 'Unknown' };

    const studentName = getStudentName(enrollment.studentId);
    const batch = batches.find((b) => b.id === enrollment.batchId);
    const course = courses.find((c) => c.id === enrollment.courseId);

    return {
      studentName,
      batchName: batch?.title || 'Unknown',
      courseName: course?.title || 'Unknown',
    };
  };

  const exportReport = () => {
    const csvContent = [
      ['Date', 'Student', 'Batch', 'Course', 'Amount', 'Payment Mode', 'Transaction ID', 'Notes'],
      ...fees.map((fee) => {
        const details = getEnrollmentDetails(fee.enrollmentId);
        return [
          fee.createdAt ? format(new Date(fee.createdAt), 'yyyy-MM-dd') : '',
          details.studentName,
          details.batchName,
          details.courseName,
          fee.amount.toString(),
          fee.payMode,
          fee.transactionId || '',
          fee.notes || '',
        ];
      }),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const handleSendReminder = async (enrollmentId: number) => {
    setSendingReminder(enrollmentId);
    try {
      await paymentRemindersService.sendReminder(enrollmentId, 'first_reminder', 'whatsapp');
      toast.success('Payment reminder sent via WhatsApp');
      loadReminderData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const handleSendBulkReminders = async () => {
    if (!confirm('Send payment reminders to all students with pending/partial payments via WhatsApp?')) return;
    setSendingBulk(true);
    try {
      const result = await paymentRemindersService.sendBulkReminders(
        { paymentStatus: undefined },
        'first_reminder',
      );
      toast.success(`Bulk reminders: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);
      loadReminderData();
    } catch (e: any) {
      toast.error(e.message || 'Bulk send failed');
    } finally {
      setSendingBulk(false);
    }
  };

  const loadReminderData = async () => {
    try {
      const [list, stats] = await Promise.all([
        paymentRemindersService.getAll(),
        paymentRemindersService.getStats(),
      ]);
      setReminders(list);
      setReminderStats(stats);
    } catch { /* ignore */ }
  };

  const getReminderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      paid: 'bg-green-200 text-green-900',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Generate sample data for quick fee creation
  const fillSampleData = () => {
    const payModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'] as const;
    const payTypes = ['Fee', 'Fine', 'Transport', 'Library', 'Hostel'] as const;
    const payMode = payModes[Math.floor(Math.random() * payModes.length)];
    const payType = payTypes[Math.floor(Math.random() * payTypes.length)];
    const amount = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000][Math.floor(Math.random() * 9)];
    const txnId = `TXN-${Date.now().toString().slice(-8)}`;
    const notes = [
      'Monthly tuition fee', 'Annual fee payment', 'Lab fee', 'Sports fee',
      'Library membership', 'Transport fee Q1', 'Hostel deposit', 'Examination fee'
    ][Math.floor(Math.random() * 8)];

    setFormData({
      enrollmentId: enrollments.length > 0 ? enrollments[Math.floor(Math.random() * enrollments.length)].id : 0,
      amount,
      payType: payType as string,
      payMode: payMode as string,
      upiId: payMode === 'UPI' ? `student${Math.floor(Math.random() * 100)}@upi` : '',
      acNumber: payMode === 'Bank Transfer' ? `ACCT${String(Math.floor(Math.random() * 1000000)).padStart(8, '0')}` : '',
      transactionId: txnId,
      notes,
    });
    setViewMode('create');
    toast.success('Sample fee data filled! Review and save.');
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {viewMode === 'create' ? t('fees.addFee') : t('fees.editFee')}
          </h1>
          <Button variant="outline" onClick={() => setViewMode('list')}>
            {t('common.back')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('fees.feeDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="enrollmentId">{t('fees.student')}</Label>
              <Select
                value={formData.enrollmentId?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, enrollmentId: parseInt(value, 10) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('fees.student')} />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No enrollments found. Enroll students first in the Enrollments tab.</div>
                  ) : (
                    enrollments.map((enrollment) => {
                      const details = getEnrollmentDetails(enrollment.id);
                      return (
                        <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                          {details.studentName} - {details.courseName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">{t('fees.amount')}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="payType">{t('fees.paymentType')}</Label>
              <Select
                value={formData.payType || 'Fee'}
                onValueChange={(value) => setFormData({ ...formData, payType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fee">Fee</SelectItem>
                  <SelectItem value="Registration">Registration</SelectItem>
                  <SelectItem value="Exam">Exam Fee</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payMode">{t('fees.paymentMode')}</Label>
              <Select
                value={formData.payMode || 'Cash'}
                onValueChange={(value) => setFormData({ ...formData, payMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.payMode === 'UPI' || formData.payMode === 'Bank Transfer') && (
              <div>
                <Label htmlFor="upiId">{t('fees.upiId')}</Label>
                <Input
                  id="upiId"
                  value={formData.upiId || ''}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>
            )}

            {formData.payMode === 'Bank Transfer' && (
              <div>
                <Label htmlFor="acNumber">{t('fees.accountNumber')}</Label>
                <Input
                  id="acNumber"
                  value={formData.acNumber || ''}
                  onChange={(e) => setFormData({ ...formData, acNumber: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="transactionId">{t('fees.transactionId')}</Label>
              <Input
                id="transactionId"
                value={formData.transactionId || ''}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('fees.notes')}</Label>
              <Input
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={viewMode === 'create' ? handleCreate : handleUpdate} disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('fees.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            {t('fees.exportReport')}
          </Button>
          <Button onClick={() => setViewMode('create')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('fees.addFee')}
          </Button>
          {/* <Button variant="outline" onClick={fillSampleData}>
            <Sparkles className="w-4 h-4 mr-2" />
            Fill Sample Data
          </Button> */}
          {/* <Button variant="outline" onClick={() => { setShowReminders(!showReminders); if (!showReminders) loadReminderData(); }}>
            <Bell className="w-4 h-4 mr-2" />
            {showReminders ? 'Hide Reminders' : 'Payment Reminders'}
          </Button> */}
          {/* <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSendBulkReminders}
            disabled={sendingBulk}
          >
            {sendingBulk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Bulk Reminders
          </Button> */}
        </div>
      </div>

      {/* Payment Reminders Panel */}
      {showReminders && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> WhatsApp Payment Reminders
              </CardTitle>
              {reminderStats && (
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-600">Sent: {reminderStats.totalSent}</span>
                  <span className="text-green-600">Paid: {reminderStats.totalPaid}</span>
                  <span className="text-yellow-600">Pending: {reminderStats.totalPending}</span>
                  <span className="text-red-600">Failed: {reminderStats.totalFailed}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-sm">No reminders sent yet. Use the &quot;Send Bulk Reminders&quot; button or send individual reminders from the enrollments below.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Link</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.slice(0, 20).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.studentName}</TableCell>
                      <TableCell>{r.phoneNumber}</TableCell>
                      <TableCell className="font-semibold">₹{Number(r.dueAmount).toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{r.reminderType}</Badge></TableCell>
                      <TableCell><span className={`px-2 py-0.5 rounded text-xs ${getReminderStatusColor(r.status)}`}>{r.status}</span></TableCell>
                      <TableCell>
                        {r.paymentLinkUrl ? (
                          <a href={r.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Pay Link</a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{r.sentAt ? format(new Date(r.sentAt), 'dd MMM HH:mm') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('fees.totalCollected')}</p>
                <p className="text-2xl font-bold">₹{statistics.totalCollected.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('fees.feeCount')}</p>
                <p className="text-2xl font-bold">{statistics.feeCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('fees.paymentMode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Button variant="outline" onClick={() => {
              setSearch('');
              setPaymentModeFilter('all');
              setDateFilter('');
            }}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments with Pending Payments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Payment Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.filter((e) => e.paymentStatus === 'Pending' || e.paymentStatus === 'Partial').length === 0 ? (
            <p className="text-gray-500 text-sm">No pending payments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead>Reminder</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments
                  .filter((e) => e.paymentStatus === 'Pending' || e.paymentStatus === 'Partial')
                  .map((enrollment) => {
                    const details = getEnrollmentDetails(enrollment.id);
                    const paidAmount = (enrollment.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                    const dueAmount = Number(enrollment.totalAmount) - paidAmount;
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>{details.studentName}</TableCell>
                        <TableCell>{details.courseName}</TableCell>
                        <TableCell>₹{Number(enrollment.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>₹{paidAmount.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-red-600">₹{dueAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.paymentStatus === 'Partial' ? 'secondary' : 'destructive'}>
                            {enrollment.paymentStatus}
                          </Badge>
                        </TableCell>
                        {/* <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(enrollment.id)}
                            disabled={sendingReminder === enrollment.id}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            {sendingReminder === enrollment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            WhatsApp
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fees.feeDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fees.date')}</TableHead>
                <TableHead>{t('fees.student')}</TableHead>
                <TableHead>{t('fees.course')}</TableHead>
                <TableHead>{t('fees.amount')}</TableHead>
                <TableHead>{t('fees.paymentMode')}</TableHead>
                <TableHead>{t('fees.transactionId')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const details = getEnrollmentDetails(fee.enrollmentId);
                return (
                  <TableRow key={fee.id}>
                    <TableCell>
                      {fee.createdAt ? format(new Date(fee.createdAt), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>{details.studentName}</TableCell>
                    <TableCell>{details.courseName}</TableCell>
                    <TableCell className="font-semibold">₹{fee.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fee.payMode}</Badge>
                    </TableCell>
                    <TableCell>{fee.transactionId || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedId(fee.id);
                            setFormData(fee);
                            setViewMode('edit');
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(fee.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {fees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
