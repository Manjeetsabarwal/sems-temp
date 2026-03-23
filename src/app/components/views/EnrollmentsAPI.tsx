import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, RefreshCw, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { enrollmentsService } from '../../services/enrollments.service';
import { batchesService } from '../../services/batches.service';
import { coursesService } from '../../services/courses.service';
import { studentsService } from '../../services/students.service';
import { paidStudentFeesService } from '../../services/paid-student-fees.service';
import { toast } from 'sonner';
import type { StudentEnrollment, PaidStudentFee } from '../../types';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function EnrollmentsAPI() {
  const { goBack, canGoBack, pushNavigation, navigateToRecord, getPendingRecordId, clearPendingRecordId } = useApp();
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [batches, setBatches] = useState<Array<{ id: number; title: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [students, setStudents] = useState<Array<{ studentId: string; name: string }>>([]);
  const [formData, setFormData] = useState<Partial<StudentEnrollment>>({
    studentId: '',
    batchId: 0,
    courseId: 0,
    courseFee: 0,
    registrationFee: 0,
    discount: 0,
    enrollmentStatus: 'Active',
    paymentStatus: 'Pending',
  });
  const [payments, setPayments] = useState<PaidStudentFee[]>([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ amount: 0, payType: 'Fee', payMode: 'Cash', transactionId: '' });

  // Generate sample enrollment data
  const fillSampleData = () => {
    const courseFees = [5000, 10000, 15000, 20000, 25000, 30000];
    const regFees = [500, 1000, 1500, 2000];
    const discounts = [0, 5, 10, 15, 20];
    const courseFee = courseFees[Math.floor(Math.random() * courseFees.length)];
    const registrationFee = regFees[Math.floor(Math.random() * regFees.length)];
    const discount = discounts[Math.floor(Math.random() * discounts.length)];
    setFormData({
      studentId: students.length > 0 ? students[Math.floor(Math.random() * students.length)].studentId : '',
      batchId: batches.length > 0 ? batches[Math.floor(Math.random() * batches.length)].id : 0,
      courseId: courses.length > 0 ? courses[Math.floor(Math.random() * courses.length)].id : 0,
      courseFee,
      registrationFee,
      discount,
      enrollmentStatus: 'Active',
      paymentStatus: 'Pending',
    });
    setViewMode('create');
    setSelectedId(null);
    toast.success('Sample enrollment data filled! Review and save.');
  };

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const data = await enrollmentsService.getAll({
        batchId: batchFilter && batchFilter !== 'all' ? parseInt(batchFilter, 10) : undefined,
        paymentStatus: paymentFilter && paymentFilter !== 'all' ? paymentFilter : undefined,
      });
      setEnrollments(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [batchFilter, paymentFilter]);

  useEffect(() => {
    batchesService.getDropdown()
      .then(setBatches)
      .catch((err) => toast.error(`Failed to load batches: ${err.message}`));

    coursesService.getDropdown()
      .then(setCourses)
      .catch((err) => toast.error(`Failed to load courses: ${err.message}`));

    studentsService.getAll()
      .then((s) => setStudents(s.map((x) => ({ studentId: x.studentId, name: x.name }))))
      .catch((err) => toast.error(`Failed to load students: ${err.message}`));
  }, []);

  useEffect(() => {
    const pending = getPendingRecordId('enrollments');
    if (pending) {
      const id = parseInt(pending, 10);
      if (!isNaN(id)) {
        setSelectedId(id);
        setViewMode('view');
        clearPendingRecordId('enrollments');
        enrollmentsService.getById(id).then(setFormData).catch(() => { });
      }
    }
  }, []);

  useEffect(() => {
    if (selectedId && (viewMode === 'view' || viewMode === 'edit')) {
      enrollmentsService.getById(selectedId).then(setFormData).catch(() => { });
    }
  }, [selectedId, viewMode]);

  const filtered = enrollments.filter(
    (e) =>
      !search ||
      e.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      (e.batch as any)?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBack = () => {
    if (viewMode !== 'list' && canGoBack()) goBack();
    setViewMode('list');
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!formData.studentId || !formData.batchId || !formData.courseId) {
      toast.error('Student, Batch and Course are required');
      return;
    }
    setLoading(true);
    try {
      const total = (Number(formData.courseFee) || 0) + (Number(formData.registrationFee) || 0) - (Number(formData.discount) || 0);
      if (viewMode === 'create') {
        await enrollmentsService.create({ ...formData, totalAmount: total });
        toast.success('Enrollment created');
      } else if (selectedId) {
        await enrollmentsService.update(selectedId, { ...formData, totalAmount: total });
        toast.success('Enrollment updated');
      }
      loadEnrollments();
      setViewMode('list');
      setSelectedId(null);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this enrollment?')) return;
    try {
      await enrollmentsService.delete(id);
      toast.success('Enrollment deleted');
      loadEnrollments();
      if (selectedId === id) handleBack();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const loadPayments = (enrollmentId: number) => {
    paidStudentFeesService.getByEnrollment(enrollmentId).then(setPayments).catch(() => setPayments([]));
  };

  const handleAddPayment = async () => {
    if (!selectedId || feeForm.amount <= 0) return;
    try {
      await paidStudentFeesService.create({
        enrollmentId: selectedId,
        amount: feeForm.amount,
        payType: feeForm.payType,
        payMode: feeForm.payMode,
        transactionId: feeForm.transactionId || undefined,
      });
      toast.success('Payment recorded');
      setFeeForm({ amount: 0, payType: 'Fee', payMode: 'Cash', transactionId: '' });
      setShowFeeModal(false);
      loadPayments(selectedId);
      loadEnrollments();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add payment');
    }
  };

  const selected = enrollments.find((e) => e.id === selectedId);

  if (viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>← Back</Button>
          <CardTitle>{viewMode === 'create' ? 'New Enrollment' : viewMode === 'edit' ? 'Edit Enrollment' : 'Enrollment Details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Student</Label>
              <Select
                value={formData.studentId || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, studentId: v }))}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No students registered. Add students first.</div>
                  ) : (
                    students
                      .filter((s) => s.studentId != null && String(s.studentId).trim() !== '')
                      .map((s) => (
                        <SelectItem key={s.studentId} value={String(s.studentId)}>{s.name} ({s.studentId})</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batch</Label>
              <Select
                value={formData.batchId?.toString() || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, batchId: parseInt(v, 10) }))}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No batches available. Create batches first.</div>
                  ) : (
                    batches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course</Label>
              <Select
                value={formData.courseId?.toString() || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, courseId: parseInt(v, 10) }))}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No courses available. Create courses first.</div>
                  ) : (
                    courses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course Fee</Label>
              <Input type="number" value={formData.courseFee || ''} onChange={(e) => setFormData((p) => ({ ...p, courseFee: parseFloat(e.target.value) || 0 }))} disabled={viewMode === 'view'} />
            </div>
            <div>
              <Label>Registration Fee</Label>
              <Input type="number" value={formData.registrationFee || ''} onChange={(e) => setFormData((p) => ({ ...p, registrationFee: parseFloat(e.target.value) || 0 }))} disabled={viewMode === 'view'} />
            </div>
            <div>
              <Label>Discount</Label>
              <Input type="number" value={formData.discount || ''} onChange={(e) => setFormData((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))} disabled={viewMode === 'view'} />
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={formData.paymentStatus || 'Pending'} onValueChange={(v) => setFormData((p) => ({ ...p, paymentStatus: v }))} disabled={viewMode === 'view'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {viewMode === 'view' && selectedId && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Payments</Label>
                <Button size="sm" onClick={() => { loadPayments(selectedId); setShowFeeModal(true); }}><DollarSign className="w-4 h-4 mr-1" /> Add Payment</Button>
              </div>
              <ul className="border rounded p-2 space-y-1">
                {payments.length === 0 && <li className="text-gray-500 text-sm">No payments yet</li>}
                {payments.map((p) => (
                  <li key={p.id} className="text-sm flex justify-between">₹{p.amount} - {p.payMode} {p.transactionId && `(${p.transactionId})`}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            {viewMode !== 'view' && <Button onClick={handleSave} disabled={loading}>Save</Button>}
            {viewMode === 'view' && selectedId && (
              <>
                <Button variant="outline" onClick={() => setViewMode('edit')}>Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedId)}>Delete</Button>
              </>
            )}
            <Button variant="outline" onClick={handleBack}>Cancel</Button>
          </div>
        </CardContent>
        {showFeeModal && selectedId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Add Payment</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowFeeModal(false)}>×</Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={feeForm.amount || ''} onChange={(e) => setFeeForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
                <Label>Pay Mode</Label>
                <Select value={feeForm.payMode} onValueChange={(v) => setFeeForm((p) => ({ ...p, payMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
                <Label>Transaction ID (optional)</Label>
                <Input value={feeForm.transactionId} onChange={(e) => setFeeForm((p) => ({ ...p, transactionId: e.target.value }))} />
                <Button className="w-full" onClick={handleAddPayment}>Record Payment</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Enrollments</h1>
        <Button onClick={() => { setViewMode('create'); setSelectedId(null); setFormData({ studentId: '', batchId: 0, courseId: 0, courseFee: 0, registrationFee: 0, discount: 0, enrollmentStatus: 'Active', paymentStatus: 'Pending' }); }}><Plus className="w-4 h-4 mr-2" /> New Enrollment</Button>
        {/* <Button variant="outline" onClick={fillSampleData}><Sparkles className="w-4 h-4 mr-2" /> Fill Sample Data</Button> */}
        <Button variant="outline" size="icon" onClick={loadEnrollments}><RefreshCw className="w-4 h-4" /></Button>
        <Input placeholder="Search..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-gray-500">Loading...</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Batch</th>
                  <th className="text-left p-2">Course</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-left p-2">Payment</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{e.id}</td>
                    <td className="p-2">{e.studentId}</td>
                    <td className="p-2">{(e.batch as any)?.title || e.batchId}</td>
                    <td className="p-2">{(e.course as any)?.title || e.courseId}</td>
                    <td className="p-2 text-right">₹{Number(e.totalAmount).toFixed(2)}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${e.paymentStatus === 'Paid' ? 'bg-green-100' : e.paymentStatus === 'Partial' ? 'bg-yellow-100' : 'bg-gray-100'}`}>{e.paymentStatus}</span></td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(e.id); setFormData(e); setViewMode('view'); loadPayments(e.id); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(e.id); setFormData(e); setViewMode('edit'); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <p className="p-4 text-gray-500">No enrollments found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
