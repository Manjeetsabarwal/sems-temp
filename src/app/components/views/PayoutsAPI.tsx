import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { teacherPayoutsService } from '../../services/teacher-payouts.service';
import { batchesService } from '../../services/batches.service';
import { teachersService } from '../../services/teachers.service';
import { toast } from 'sonner';
import type { TeacherPayout } from '../../types';
import { useApp } from '../../context/AppContext';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function PayoutsAPI() {
  const { goBack, canGoBack, getPendingRecordId, clearPendingRecordId } = useApp();
  const [payouts, setPayouts] = useState<TeacherPayout[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batches, setBatches] = useState<Array<{ id: number; title: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ teacherId: string; name: string }>>([]);
  // Generate sample payout data
  const fillSampleData = () => {
    const amounts = [5000, 8000, 10000, 12000, 15000, 20000, 25000];
    const cycles = ['Monthly', 'Weekly', 'Per Session'] as const;
    setFormData({
      batchId: batches.length > 0 ? batches[Math.floor(Math.random() * batches.length)].id : 0,
      teacherId: teachers.length > 0 ? teachers[Math.floor(Math.random() * teachers.length)].teacherId : '',
      payoutAmount: amounts[Math.floor(Math.random() * amounts.length)],
      payoutCycle: cycles[Math.floor(Math.random() * cycles.length)] as string,
      status: 'Pending',
    });
    setViewMode('create');
    setSelectedId(null);
    toast.success('Sample payout data filled! Review and save.');
  };

  const [formData, setFormData] = useState<Partial<TeacherPayout>>({
    batchId: 0,
    teacherId: '',
    payoutAmount: 0,
    payoutCycle: 'Monthly',
    status: 'Pending',
  });

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const data = await teacherPayoutsService.getAll({
        batchId: batchFilter && batchFilter !== 'all' ? parseInt(batchFilter, 10) : undefined,
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      });
      setPayouts(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [batchFilter, statusFilter]);

  useEffect(() => {
    batchesService.getDropdown().then(setBatches).catch(() => { });
    teachersService.getAll().then((t) => setTeachers(t.map((x) => ({ teacherId: x.teacherId, name: x.name })))).catch(() => { });
  }, []);

  useEffect(() => {
    const pending = getPendingRecordId('payouts');
    if (pending) {
      const id = parseInt(pending, 10);
      if (!isNaN(id)) {
        setSelectedId(id);
        setViewMode('view');
        clearPendingRecordId('payouts');
      }
    }
  }, []);

  const handleBack = () => {
    if (viewMode !== 'list' && canGoBack()) goBack();
    setViewMode('list');
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!formData.batchId || !formData.teacherId || formData.payoutAmount == null) {
      toast.error('Batch, Teacher and Amount are required');
      return;
    }
    setLoading(true);
    try {
      if (viewMode === 'create') {
        await teacherPayoutsService.create(formData);
        toast.success('Payout created');
      } else if (selectedId) {
        await teacherPayoutsService.update(selectedId, formData);
        toast.success('Payout updated');
      }
      loadPayouts();
      setViewMode('list');
      setSelectedId(null);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payout?')) return;
    try {
      await teacherPayoutsService.delete(id);
      toast.success('Payout deleted');
      loadPayouts();
      if (selectedId === id) handleBack();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const selected = payouts.find((e) => e.id === selectedId);

  if (viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>← Back</Button>
          <h2 className="text-xl font-semibold">{viewMode === 'create' ? 'New Payout' : viewMode === 'edit' ? 'Edit Payout' : 'Payout Details'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch</Label>
              <Select value={formData.batchId?.toString() || ''} onValueChange={(v) => setFormData((p) => ({ ...p, batchId: parseInt(v, 10) }))} disabled={viewMode === 'view'}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={formData.teacherId || ''} onValueChange={(v) => setFormData((p) => ({ ...p, teacherId: v }))} disabled={viewMode === 'view'}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter((t) => t.teacherId != null && String(t.teacherId).trim() !== '')
                    .map((t) => (
                      <SelectItem key={t.teacherId} value={String(t.teacherId)}>{t.name} ({t.teacherId})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={formData.payoutAmount ?? ''} onChange={(e) => setFormData((p) => ({ ...p, payoutAmount: parseFloat(e.target.value) || 0 }))} disabled={viewMode === 'view'} />
            </div>
            <div>
              <Label>Cycle</Label>
              <Select value={formData.payoutCycle || 'Monthly'} onValueChange={(v) => setFormData((p) => ({ ...p, payoutCycle: v }))} disabled={viewMode === 'view'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Per Lecture">Per Lecture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status || 'Pending'} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))} disabled={viewMode === 'view'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Teacher Payouts</h1>
        <Button onClick={() => { setViewMode('create'); setSelectedId(null); setFormData({ batchId: 0, teacherId: '', payoutAmount: 0, payoutCycle: 'Monthly', status: 'Pending' }); }}><Plus className="w-4 h-4 mr-2" /> New Payout</Button>
        {/* <Button variant="outline" onClick={fillSampleData}><Sparkles className="w-4 h-4 mr-2" /> Fill Sample Data</Button> */}
        <Button variant="outline" size="icon" onClick={loadPayouts}><RefreshCw className="w-4 h-4" /></Button>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <p className="p-4 text-gray-500">Loading...</p> : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Batch</th>
                  <th className="text-left p-2">Teacher</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-left p-2">Cycle</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.batchId}</td>
                    <td className="p-2">{p.teacherId}</td>
                    <td className="p-2 text-right">₹{Number(p.payoutAmount).toFixed(2)}</td>
                    <td className="p-2">{p.payoutCycle}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${p.status === 'Paid' ? 'bg-green-100' : 'bg-gray-100'}`}>{p.status}</span></td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(p.id); setFormData(p); setViewMode('view'); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(p.id); setFormData(p); setViewMode('edit'); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && payouts.length === 0 && <p className="p-4 text-gray-500">No payouts found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
