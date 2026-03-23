import { useState, useEffect, useCallback } from 'react';
import { teachersService, type TeacherFilters } from '../services/teachers.service';
import type { Teacher } from '../types';
import { toast } from 'sonner';

interface UseTeachersOptions extends TeacherFilters {}

export function useTeachers(options: UseTeachersOptions = {}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teachers from database
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teachersService.getAll(options);
      setTeachers(data);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      setError(err.message || 'Failed to load teachers');
      toast.error(err.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.search, options.classId, options.subjectId]);

  // Create teacher
  const createTeacher = useCallback(async (teacher: Omit<Teacher, 'createdAt' | 'updatedAt'>) => {
    try {
      const newTeacher = await teachersService.create(teacher);
      setTeachers(prev => [...prev, newTeacher]);
      toast.success('Teacher created successfully');
      return newTeacher;
    } catch (err: any) {
      console.error('Error creating teacher:', err);
      toast.error(err.message || 'Failed to create teacher');
      throw err;
    }
  }, []);

  // Update teacher
  const updateTeacher = useCallback(async (teacherId: string, updates: Partial<Teacher>) => {
    try {
      const updatedTeacher = await teachersService.update(teacherId, updates);
      setTeachers(prev => 
        prev.map(t => t.teacherId === teacherId ? updatedTeacher : t)
      );
      toast.success('Teacher updated successfully');
      return updatedTeacher;
    } catch (err: any) {
      console.error('Error updating teacher:', err);
      toast.error(err.message || 'Failed to update teacher');
      throw err;
    }
  }, []);

  // Delete teacher
  const deleteTeacher = useCallback(async (teacherId: string) => {
    try {
      await teachersService.delete(teacherId);
      setTeachers(prev => prev.filter(t => t.teacherId !== teacherId));
      toast.success('Teacher deleted successfully');
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      toast.error(err.message || 'Failed to delete teacher');
      throw err;
    }
  }, []);

  // Bulk delete teachers
  const bulkDeleteTeachers = useCallback(async (teacherIds: string[]) => {
    try {
      await teachersService.bulkDelete(teacherIds);
      setTeachers(prev => prev.filter(t => !teacherIds.includes(t.teacherId)));
      toast.success(`${teacherIds.length} teachers deleted successfully`);
    } catch (err: any) {
      console.error('Error bulk deleting teachers:', err);
      toast.error(err.message || 'Failed to delete teachers');
      throw err;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    bulkDeleteTeachers,
    refresh,
  };
}
