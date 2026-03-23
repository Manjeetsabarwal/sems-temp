import { useState, useEffect, useCallback } from 'react';
import { studentsService } from '../services/students.service';
import type { Student } from '../types';

interface UseStudentsOptions {
  classId?: string;
  sectionId?: string;
  search?: string;
  autoFetch?: boolean;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, ...filters } = options;

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentsService.getAll(filters);
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.sectionId, filters.search]);

  // Create student
  const createStudent = async (data: Omit<Student, 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const newStudent = await studentsService.create(data);
      setStudents((prev) => [...prev, newStudent]);
      return newStudent;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create student';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Update student
  const updateStudent = async (studentId: string, data: Partial<Student>) => {
    try {
      setError(null);
      const updated = await studentsService.update(studentId, data);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? updated : s))
      );
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update student';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Delete student
  const deleteStudent = async (studentId: string) => {
    try {
      setError(null);
      await studentsService.delete(studentId);
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete student';
      setError(errorMsg);
      throw new Error(errorMsg);
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
    refresh: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
