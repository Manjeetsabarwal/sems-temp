import { useState, useEffect, useCallback } from 'react';
import { examsService, ExamFilters } from '../services/exams.service';
import type { Exam } from '../types';

export function useExams(filters: ExamFilters = {}) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsService.getAll(filters);
      setExams(data);
    } catch (err: any) {
      console.error('Error loading exams:', err);
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.examType, filters.status, filters.academicYear, filters.search]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const createExam = async (exam: Omit<Exam, 'createdAt' | 'updatedAt'>) => {
    try {
      await examsService.create(exam);
      await loadExams();
    } catch (err: any) {
      console.error('Error creating exam:', err);
      throw err;
    }
  };

  const updateExam = async (examId: string, updates: Partial<Exam>) => {
    try {
      await examsService.update(examId, updates);
      await loadExams();
    } catch (err: any) {
      console.error('Error updating exam:', err);
      throw err;
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      await examsService.delete(examId);
      await loadExams();
    } catch (err: any) {
      console.error('Error deleting exam:', err);
      throw err;
    }
  };

  const refresh = () => {
    loadExams();
  };

  return {
    exams,
    loading,
    error,
    createExam,
    updateExam,
    deleteExam,
    refresh,
  };
}
