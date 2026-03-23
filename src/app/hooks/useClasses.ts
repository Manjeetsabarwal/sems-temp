import { useState, useEffect, useCallback } from 'react';
import { classesService, type ClassFilters } from '../services/classes.service';
import type { ClassExtended } from '../types';
import { toast } from 'sonner';

interface UseClassesOptions extends ClassFilters {}

export function useClasses(options: UseClassesOptions = {}) {
  const [classes, setClasses] = useState<ClassExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes from database
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classesService.getAll(options);
      setClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to load classes');
      toast.error(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.search]);

  // Create class
  const createClass = useCallback(async (classData: Omit<ClassExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>) => {
    try {
      const newClass = await classesService.create(classData);
      setClasses(prev => [...prev, newClass]);
      toast.success('Class created successfully');
      return newClass;
    } catch (err: any) {
      console.error('Error creating class:', err);
      toast.error(err.message || 'Failed to create class');
      throw err;
    }
  }, []);

  // Update class
  const updateClass = useCallback(async (classId: string, updates: Partial<ClassExtended>) => {
    try {
      const updatedClass = await classesService.update(classId, updates);
      setClasses(prev => 
        prev.map(c => c.classId === classId ? updatedClass : c)
      );
      toast.success('Class updated successfully');
      return updatedClass;
    } catch (err: any) {
      console.error('Error updating class:', err);
      toast.error(err.message || 'Failed to update class');
      throw err;
    }
  }, []);

  // Delete class
  const deleteClass = useCallback(async (classId: string) => {
    try {
      await classesService.delete(classId);
      setClasses(prev => prev.filter(c => c.classId !== classId));
      toast.success('Class deleted successfully');
    } catch (err: any) {
      console.error('Error deleting class:', err);
      toast.error(err.message || 'Failed to delete class');
      throw err;
    }
  }, []);

  // Bulk delete classes
  const bulkDeleteClasses = useCallback(async (classIds: string[]) => {
    try {
      await classesService.bulkDelete(classIds);
      setClasses(prev => prev.filter(c => !classIds.includes(c.classId)));
      toast.success(`${classIds.length} classes deleted successfully`);
    } catch (err: any) {
      console.error('Error bulk deleting classes:', err);
      toast.error(err.message || 'Failed to delete classes');
      throw err;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    loading,
    error,
    createClass,
    updateClass,
    deleteClass,
    bulkDeleteClasses,
    refresh,
  };
}
