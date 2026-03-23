# 📝 Complete CRUD Example - Students Module

## Step-by-Step Implementation with Code

This guide shows you EXACTLY how to implement full CRUD (Create, Read, Update, Delete) operations for the Students module, which you can replicate for all other modules.

---

## Backend Implementation (NestJS)

### 1. Entity Definition

**File: `src/modules/students/entities/student.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'student_id' })
  studentId: string;

  @Column()
  name: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @Column({ name: 'roll_no' })
  rollNo: number;

  @Column({ name: 'parent_contact', nullable: true })
  parentContact: string;

  @Column({ name: 'parent_email', nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

### 2. DTOs (Data Transfer Objects)

**File: `src/modules/students/dto/create-student.dto.ts`**

```typescript
import { IsString, IsNotEmpty, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsNumber()
  @IsNotEmpty()
  rollNo: number;

  @IsString()
  @IsOptional()
  parentContact?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
```

**File: `src/modules/students/dto/update-student.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
// This makes all fields optional
```

---

### 3. Service Layer (Business Logic)

**File: `src/modules/students/students.service.ts`**

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  /**
   * CREATE - Add new student
   */
  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check if student ID already exists
    const existing = await this.studentsRepository.findOne({
      where: { studentId: createStudentDto.studentId },
    });

    if (existing) {
      throw new ConflictException('Student ID already exists');
    }

    // Create and save
    const student = this.studentsRepository.create(createStudentDto);
    return await this.studentsRepository.save(student);
  }

  /**
   * READ - Get all students with optional filters
   */
  async findAll(filters?: {
    classId?: string;
    sectionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Student[]; total: number; page: number; limit: number }> {
    const query = this.studentsRepository.createQueryBuilder('student');

    // Apply filters
    if (filters?.classId) {
      query.andWhere('student.classId = :classId', { classId: filters.classId });
    }

    if (filters?.sectionId) {
      query.andWhere('student.sectionId = :sectionId', {
        sectionId: filters.sectionId,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(student.name ILIKE :search OR student.studentId ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Order by
    query.orderBy('student.classId', 'ASC')
      .addOrderBy('student.sectionId', 'ASC')
      .addOrderBy('student.rollNo', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * READ - Get single student by ID
   */
  async findOne(studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return student;
  }

  /**
   * UPDATE - Update student details
   */
  async update(
    studentId: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(studentId);

    // Merge updates
    Object.assign(student, updateStudentDto);

    // Save
    return await this.studentsRepository.save(student);
  }

  /**
   * DELETE - Remove student
   */
  async remove(studentId: string): Promise<{ message: string }> {
    const student = await this.findOne(studentId);
    await this.studentsRepository.remove(student);

    return {
      message: `Student ${studentId} deleted successfully`,
    };
  }

  /**
   * BULK CREATE - Create multiple students
   */
  async bulkCreate(students: CreateStudentDto[]): Promise<Student[]> {
    const entities = this.studentsRepository.create(students);
    return await this.studentsRepository.save(entities);
  }

  /**
   * COUNT - Get total students
   */
  async count(filters?: { classId?: string; sectionId?: string }): Promise<number> {
    const query = this.studentsRepository.createQueryBuilder('student');

    if (filters?.classId) {
      query.andWhere('student.classId = :classId', { classId: filters.classId });
    }

    if (filters?.sectionId) {
      query.andWhere('student.sectionId = :sectionId', {
        sectionId: filters.sectionId,
      });
    }

    return await query.getCount();
  }
}
```

---

### 4. Controller Layer (API Endpoints)

**File: `src/modules/students/students.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * CREATE - POST /api/students
   * Create a new student
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStudentDto: CreateStudentDto) {
    return await this.studentsService.create(createStudentDto);
  }

  /**
   * READ LIST - GET /api/students
   * Get all students with filters and pagination
   * 
   * Query params:
   * - classId: Filter by class
   * - sectionId: Filter by section
   * - search: Search by name or ID
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10)
   */
  @Get()
  async findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.studentsService.findAll({
      classId,
      sectionId,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * READ ONE - GET /api/students/:id
   * Get single student details
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.studentsService.findOne(id);
  }

  /**
   * UPDATE - PATCH /api/students/:id
   * Update student details
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return await this.studentsService.update(id, updateStudentDto);
  }

  /**
   * DELETE - DELETE /api/students/:id
   * Delete a student
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.studentsService.remove(id);
  }

  /**
   * COUNT - GET /api/students/count
   * Get total count with filters
   */
  @Get('count')
  async count(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    const total = await this.studentsService.count({ classId, sectionId });
    return { total };
  }

  /**
   * BULK CREATE - POST /api/students/bulk
   * Create multiple students at once
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(@Body() students: CreateStudentDto[]) {
    return await this.studentsService.bulkCreate(students);
  }
}
```

---

### 5. Module Configuration

**File: `src/modules/students/students.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService], // Export if other modules need it
})
export class StudentsModule {}
```

---

## Frontend Implementation (React + TypeScript)

### 1. API Service

**File: `src/app/services/students.service.ts`**

```typescript
import { apiService } from './api';
import { Student } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export class StudentsService {
  private readonly baseUrl = '/students';

  // GET /api/students
  async getAll(filters?: {
    classId?: string;
    sectionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Student>> {
    return apiService.get<PaginatedResponse<Student>>(this.baseUrl, filters);
  }

  // GET /api/students/:id
  async getById(studentId: string): Promise<Student> {
    return apiService.get<Student>(`${this.baseUrl}/${studentId}`);
  }

  // POST /api/students
  async create(data: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<Student> {
    return apiService.post<Student>(this.baseUrl, data);
  }

  // PATCH /api/students/:id
  async update(studentId: string, data: Partial<Student>): Promise<Student> {
    return apiService.patch<Student>(`${this.baseUrl}/${studentId}`, data);
  }

  // DELETE /api/students/:id
  async delete(studentId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`${this.baseUrl}/${studentId}`);
  }

  // POST /api/students/bulk
  async bulkCreate(students: Omit<Student, 'createdAt' | 'updatedAt'>[]): Promise<Student[]> {
    return apiService.post<Student[]>(`${this.baseUrl}/bulk`, students);
  }

  // GET /api/students/count
  async count(filters?: { classId?: string; sectionId?: string }): Promise<{ total: number }> {
    return apiService.get<{ total: number }>(`${this.baseUrl}/count`, filters);
  }
}

export const studentsService = new StudentsService();
```

---

### 2. Custom Hook

**File: `src/app/hooks/useStudents.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { studentsService } from '../services/students.service';
import { Student } from '../types';

interface UseStudentsOptions {
  classId?: string;
  sectionId?: string;
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(options.page || 1);

  const { autoFetch = true, ...filters } = options;

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentsService.getAll({
        ...filters,
        page: currentPage,
      });
      setStudents(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.sectionId, filters.search, currentPage, filters.limit]);

  // Create student
  const createStudent = async (data: Omit<Student, 'createdAt' | 'updatedAt'>) => {
    try {
      const newStudent = await studentsService.create(data);
      await fetchStudents(); // Refresh list
      return newStudent;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create student');
    }
  };

  // Update student
  const updateStudent = async (studentId: string, data: Partial<Student>) => {
    try {
      const updated = await studentsService.update(studentId, data);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? updated : s))
      );
      return updated;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update student');
    }
  };

  // Delete student
  const deleteStudent = async (studentId: string) => {
    try {
      await studentsService.delete(studentId);
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
      setTotal((prev) => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchStudents();
    }
  }, [fetchStudents, autoFetch]);

  return {
    students,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    refresh: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
```

---

### 3. Complete Students Component with CRUD

**File: `src/app/components/views/StudentsComplete.tsx`**

```typescript
import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useStudents } from '../../hooks/useStudents';
import { StudentModal } from '../modals/StudentModal';
import { Student } from '../../types';
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

export function StudentsComplete() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const {
    students,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    createStudent,
    updateStudent,
    deleteStudent,
    refresh,
  } = useStudents({
    classId: selectedClass === 'all' ? undefined : selectedClass,
    search: searchTerm,
    page: 1,
    limit: 10,
  });

  // Handlers
  const handleCreate = () => {
    setModalMode('create');
    setSelectedStudent(null);
    setModalOpen(true);
  };

  const handleView = (student: Student) => {
    setModalMode('view');
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleDelete = async (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await deleteStudent(student.studentId);
        alert('Student deleted successfully!');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSave = async (data: Partial<Student>) => {
    try {
      if (modalMode === 'create') {
        await createStudent(data as Omit<Student, 'createdAt' | 'updatedAt'>);
        alert('Student created successfully!');
      } else if (modalMode === 'edit' && selectedStudent) {
        await updateStudent(selectedStudent.studentId, data);
        alert('Student updated successfully!');
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-500 mt-1">
            Manage student records ({total} total)
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students</CardTitle>
            <div className="flex gap-3">
              {/* Search */}
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

              {/* Class Filter */}
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
          {/* Table */}
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
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
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
                    <TableCell>{student.parentContact || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(student)}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(student)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(student)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {students.length} of {total} students
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={students.length < 10}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <StudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        student={selectedStudent}
        onSave={handleSave}
        mode={modalMode}
      />
    </div>
  );
}
```

---

## API Testing Examples

### Using curl

```bash
# CREATE
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STU999",
    "name": "Test Student",
    "classId": "10",
    "sectionId": "10-A",
    "rollNo": 99,
    "parentContact": "1234567890",
    "parentEmail": "parent@test.com"
  }'

# READ LIST
curl http://localhost:3000/api/students?classId=10&page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"

# READ ONE
curl http://localhost:3000/api/students/STU999 \
  -H "Authorization: Bearer YOUR_TOKEN"

# UPDATE
curl -X PATCH http://localhost:3000/api/students/STU999 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Updated Name"}'

# DELETE
curl -X DELETE http://localhost:3000/api/students/STU999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

This complete example shows:

✅ **Backend:**
- Entity with TypeORM
- DTOs for validation
- Service with all CRUD methods
- Controller with RESTful endpoints
- Proper error handling
- Pagination support

✅ **Frontend:**
- API service layer
- Custom React hook
- Complete component with all CRUD operations
- Modal for Create/Edit/View
- Loading and error states
- Search and filters
- Pagination

**Repeat this pattern for all other modules:**
- Exams
- Teachers
- Subjects
- Marks
- Results
- etc.

🎉 **You now have a complete, production-ready CRUD system!**
