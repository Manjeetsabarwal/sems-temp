import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Student } from '../types';

interface StudentModalProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onSave: (data: Partial<Student>) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

export function StudentModal({ open, onClose, student, onSave, mode }: StudentModalProps) {
  const [formData, setFormData] = useState<Partial<Student>>({
    studentId: '',
    name: '',
    classId: '',
    sectionId: '',
    rollNo: 1,
    parentContact: '',
    parentEmail: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student && (mode === 'edit' || mode === 'view')) {
      setFormData({
        studentId: student.studentId,
        name: student.name,
        classId: student.classId,
        sectionId: student.sectionId,
        rollNo: student.rollNo,
        parentContact: student.parentContact || '',
        parentEmail: student.parentEmail || '',
      });
    } else if (mode === 'create') {
      setFormData({
        studentId: '',
        name: '',
        classId: '10',
        sectionId: '10-A',
        rollNo: 1,
        parentContact: '',
        parentEmail: '',
      });
    }
    setError(null);
  }, [student, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Add New Student' : mode === 'edit' ? 'Edit Student' : 'Student Details';

  const classes = ['9', '10', '11', '12'];
  const sections = ['A', 'B', 'C'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Student ID */}
            <div>
              <Label htmlFor="studentId" className="required">Student ID</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={isReadOnly || mode === 'edit'}
                required
                placeholder="STU001"
              />
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="required">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isReadOnly}
                required
                placeholder="John Doe"
              />
            </div>

            {/* Class */}
            <div>
              <Label htmlFor="classId" className="required">Class</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  classId: value,
                  sectionId: `${value}-A` // Auto-set section
                })}
                disabled={isReadOnly}
              >
                <SelectTrigger id="classId">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div>
              <Label htmlFor="sectionId" className="required">Section</Label>
              <Select
                value={formData.sectionId}
                onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger id="sectionId">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((sec) => (
                    <SelectItem key={`${formData.classId}-${sec}`} value={`${formData.classId}-${sec}`}>
                      Section {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Roll Number */}
            <div>
              <Label htmlFor="rollNo" className="required">Roll Number</Label>
              <Input
                id="rollNo"
                type="number"
                min="1"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: parseInt(e.target.value) || 1 })}
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Parent Contact */}
            <div>
              <Label htmlFor="parentContact">Parent Contact</Label>
              <Input
                id="parentContact"
                type="tel"
                value={formData.parentContact}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                disabled={isReadOnly}
                placeholder="+1234567890"
              />
            </div>

            {/* Parent Email */}
            <div className="col-span-2">
              <Label htmlFor="parentEmail">Parent Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                disabled={isReadOnly}
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
