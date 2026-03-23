# 🔗 Frontend API Integration Guide

## Connecting React Frontend to NestJS Backend

---

## Step 1: Install Axios

```bash
npm install axios
```

---

## Step 2: Create API Service Layer

Create `src/app/services/api.ts`:

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor (add auth token)
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (handle errors)
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

---

## Step 3: Create Resource-Specific Services

### Students Service

Create `src/app/services/students.service.ts`:

```typescript
import { apiService } from './api';
import { Student } from '../types';

export class StudentsService {
  private readonly baseUrl = '/students';

  // List all students with optional filters
  async getAll(filters?: {
    classId?: string;
    sectionId?: string;
    search?: string;
  }): Promise<Student[]> {
    return apiService.get<Student[]>(this.baseUrl, filters);
  }

  // Get single student
  async getById(studentId: string): Promise<Student> {
    return apiService.get<Student>(`${this.baseUrl}/${studentId}`);
  }

  // Create new student
  async create(data: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<Student> {
    return apiService.post<Student>(this.baseUrl, data);
  }

  // Update student
  async update(studentId: string, data: Partial<Student>): Promise<Student> {
    return apiService.patch<Student>(`${this.baseUrl}/${studentId}`, data);
  }

  // Delete student
  async delete(studentId: string): Promise<void> {
    return apiService.delete<void>(`${this.baseUrl}/${studentId}`);
  }
}

export const studentsService = new StudentsService();
```

### Exams Service

Create `src/app/services/exams.service.ts`:

```typescript
import { apiService } from './api';
import { Exam } from '../types';

export class ExamsService {
  private readonly baseUrl = '/exams';

  async getAll(): Promise<Exam[]> {
    return apiService.get<Exam[]>(this.baseUrl);
  }

  async getById(examId: string): Promise<Exam> {
    return apiService.get<Exam>(`${this.baseUrl}/${examId}`);
  }

  async create(data: Omit<Exam, 'createdAt' | 'updatedAt'>): Promise<Exam> {
    return apiService.post<Exam>(this.baseUrl, data);
  }

  async update(examId: string, data: Partial<Exam>): Promise<Exam> {
    return apiService.patch<Exam>(`${this.baseUrl}/${examId}`, data);
  }

  async delete(examId: string): Promise<void> {
    return apiService.delete<void>(`${this.baseUrl}/${examId}`);
  }
}

export const examsService = new ExamsService();
```

### Marks Service

Create `src/app/services/marks.service.ts`:

```typescript
import { apiService } from './api';
import { Marks } from '../types';

export class MarksService {
  private readonly baseUrl = '/marks';

  async getByExamAndClass(examId: string, classId: string): Promise<Marks[]> {
    return apiService.get<Marks[]>(this.baseUrl, { examId, classId });
  }

  async getByStudent(studentId: string): Promise<Marks[]> {
    return apiService.get<Marks[]>(this.baseUrl, { studentId });
  }

  async create(data: Omit<Marks, 'id'>): Promise<Marks> {
    return apiService.post<Marks>(this.baseUrl, data);
  }

  async bulkCreate(marks: Omit<Marks, 'id'>[]): Promise<Marks[]> {
    return apiService.post<Marks[]>(`${this.baseUrl}/bulk`, { marks });
  }

  async update(id: number, data: Partial<Marks>): Promise<Marks> {
    return apiService.patch<Marks>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const marksService = new MarksService();
```

### Results Service

Create `src/app/services/results.service.ts`:

```typescript
import { apiService } from './api';
import { StudentResult } from '../types';

export class ResultsService {
  private readonly baseUrl = '/results';

  async getByExamAndClass(examId: string, classId: string): Promise<StudentResult[]> {
    return apiService.get<StudentResult[]>(this.baseUrl, { examId, classId });
  }

  async getByStudent(studentId: string, examId: string): Promise<StudentResult> {
    return apiService.get<StudentResult>(`${this.baseUrl}/student/${studentId}/exam/${examId}`);
  }

  async generateReportCard(studentId: string, examId: string): Promise<Blob> {
    // Returns PDF blob
    const response = await apiService.get<Blob>(
      `${this.baseUrl}/report-card/${studentId}/${examId}`,
      { responseType: 'blob' }
    );
    return response;
  }
}

export const resultsService = new ResultsService();
```

### Auth Service

Create `src/app/services/auth.service.ts`:

```typescript
import { apiService } from './api';
import { User } from '../types';

interface LoginResponse {
  access_token: string;
  user: User;
}

export class AuthService {
  private readonly baseUrl = '/auth';

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(`${this.baseUrl}/login`, {
      email,
      password,
    });
    
    // Store token
    localStorage.setItem('access_token', response.access_token);
    
    return response;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<User> {
    return apiService.post<User>(`${this.baseUrl}/register`, data);
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>(`${this.baseUrl}/me`);
  }

  logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
}

export const authService = new AuthService();
```

---

## Step 4: Create Custom Hooks for Data Fetching

### useStudents Hook

Create `src/app/hooks/useStudents.ts`:

```typescript
import { useState, useEffect } from 'react';
import { studentsService } from '../services/students.service';
import { Student } from '../types';

export function useStudents(filters?: {
  classId?: string;
  sectionId?: string;
  search?: string;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [filters?.classId, filters?.sectionId, filters?.search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getAll(filters);
      setStudents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (data: Omit<Student, 'createdAt' | 'updatedAt'>) => {
    try {
      const newStudent = await studentsService.create(data);
      setStudents((prev) => [...prev, newStudent]);
      return newStudent;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create student');
    }
  };

  const updateStudent = async (studentId: string, data: Partial<Student>) => {
    try {
      const updated = await studentsService.update(studentId, data);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? updated : s))
      );
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update student');
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      await studentsService.delete(studentId);
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete student');
    }
  };

  return {
    students,
    loading,
    error,
    refresh: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
```

### useStudent Hook (Single Student)

Create `src/app/hooks/useStudent.ts`:

```typescript
import { useState, useEffect } from 'react';
import { studentsService } from '../services/students.service';
import { Student } from '../types';

export function useStudent(studentId: string | null) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const data = await studentsService.getById(studentId);
      setStudent(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student');
    } finally {
      setLoading(false);
    }
  };

  return { student, loading, error, refresh: fetchStudent };
}
```

---

## Step 5: Update Components to Use API

### Updated Students Component

```typescript
import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useStudents } from '../../hooks/useStudents';
import { classes } from '../../data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  
  const { students, loading, error, deleteStudent } = useStudents({
    classId: selectedClass === 'all' ? undefined : selectedClass,
    search: searchTerm,
  });

  const handleDelete = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId);
        alert('Student deleted successfully');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-500 mt-1">Manage student records and information</p>
        </div>
        <Button className="gap-2" onClick={() => {/* Open create modal */}}>
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students ({students.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      {student.name}
                    </div>
                  </TableCell>
                  <TableCell>{student.classId}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.sectionId}</Badge>
                  </TableCell>
                  <TableCell>{student.rollNo}</TableCell>
                  <TableCell>{student.parentContact}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student.studentId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 6: Create Student Details/Edit Modal

Create `src/app/components/modals/StudentModal.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Student } from '../../types';

interface StudentModalProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onSave: (data: Partial<Student>) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

export function StudentModal({ open, onClose, student, onSave, mode }: StudentModalProps) {
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData(student);
    } else {
      setFormData({});
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Add New Student'}
            {mode === 'edit' && 'Edit Student'}
            {mode === 'view' && 'Student Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Student ID</Label>
              <Input
                value={formData.studentId || ''}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={isReadOnly || mode === 'edit'}
                required
              />
            </div>

            <div>
              <Label>Name</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div>
              <Label>Class</Label>
              <Input
                value={formData.classId || ''}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div>
              <Label>Section</Label>
              <Input
                value={formData.sectionId || ''}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div>
              <Label>Roll Number</Label>
              <Input
                type="number"
                value={formData.rollNo || ''}
                onChange={(e) => setFormData({ ...formData, rollNo: Number(e.target.value) })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div>
              <Label>Parent Contact</Label>
              <Input
                value={formData.parentContact || ''}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="col-span-2">
              <Label>Parent Email</Label>
              <Input
                type="email"
                value={formData.parentEmail || ''}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Step 7: Environment Variables

Create `.env` in frontend root:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## ✅ Complete Integration Checklist

- [ ] Install axios
- [ ] Create API service layer
- [ ] Create resource-specific services (students, exams, marks, etc.)
- [ ] Create custom hooks for data fetching
- [ ] Update components to use hooks
- [ ] Create modals for CRUD operations
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test all API endpoints
- [ ] Add authentication flow

---

## 🚀 Testing the Integration

1. Start backend: `npm run start:dev` (in backend folder)
2. Start frontend: `npm run dev` (in frontend folder)
3. Test endpoints with Postman first
4. Use browser DevTools Network tab to debug
5. Check console for errors

Would you like me to:
1. Create the authentication flow?
2. Add more custom hooks for other modules?
3. Create a complete modal system for all CRUD operations?
4. Show you how to handle form validation?
