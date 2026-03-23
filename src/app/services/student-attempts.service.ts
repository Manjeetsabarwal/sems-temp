import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { StudentAttempt } from '../types';

export interface StudentAttemptFilters {
  studentId?: string;
  paperId?: string;
  status?: string;
}

/**
 * Student Attempts Service - REST API Access
 * Version 3: Student Attempts Module (Step 5)
 * All operations call NestJS backend
 */
class StudentAttemptsService {
  /**
   * Get all student attempts with optional filters
   */
  async getAll(filters: StudentAttemptFilters = {}): Promise<StudentAttempt[]> {
    try {
      const queryString = buildQueryString({
        studentId: filters.studentId,
        paperId: filters.paperId,
        status: filters.status,
      });

      const data = await apiCall<StudentAttempt[]>(`${API_ENDPOINTS.studentAttempts}${queryString}`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch student attempts: ${error.message}`);
    }
  }

  /**
   * Get a single attempt by ID
   */
  async getById(attemptId: string): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttemptById(attemptId));
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch student attempt: ${error.message}`);
    }
  }

  /**
   * Get attempts by student and paper
   */
  async getByStudentAndPaper(studentId: string, paperId: string): Promise<StudentAttempt[]> {
    try {
      return await apiCall<StudentAttempt[]>(
        API_ENDPOINTS.studentAttemptsByStudentAndPaper(studentId, paperId),
      );
    } catch (error: any) {
      console.error('❌ Exception in getByStudentAndPaper:', error);
      throw new Error(`Failed to fetch student attempts: ${error.message}`);
    }
  }

  /**
   * Get active attempt for a student and paper
   */
  async getActiveAttempt(studentId: string, paperId: string): Promise<StudentAttempt | null> {
    try {
      const data = await apiCall<StudentAttempt | { message: string }>(
        API_ENDPOINTS.studentAttemptActive(studentId, paperId),
      );
      if ('message' in data) {
        return null;
      }
      return data as StudentAttempt;
    } catch (error: any) {
      console.error('❌ Exception in getActiveAttempt:', error);
      throw new Error(`Failed to fetch active attempt: ${error.message}`);
    }
  }

  /**
   * Create a new attempt
   */
  async create(
    attemptData: Omit<StudentAttempt, 'createdAt' | 'updatedAt' | 'student' | 'paper'>,
  ): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttempts, {
        method: 'POST',
        body: JSON.stringify(attemptData),
      });
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create student attempt');
    }
  }

  /**
   * Update an attempt
   */
  async update(attemptId: string, updates: Partial<StudentAttempt>): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttemptById(attemptId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update student attempt');
    }
  }

  /**
   * Submit an attempt
   */
  async submit(attemptId: string): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttemptSubmit(attemptId), {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('❌ Exception in submit:', error);
      throw new Error(error.message || 'Failed to submit attempt');
    }
  }

  /**
   * Abandon an attempt
   */
  async abandon(attemptId: string): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttemptAbandon(attemptId), {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('❌ Exception in abandon:', error);
      throw new Error(error.message || 'Failed to abandon attempt');
    }
  }

  /**
   * Update time spent
   */
  async updateTimeSpent(attemptId: string, minutes: number): Promise<StudentAttempt> {
    try {
      return await apiCall<StudentAttempt>(API_ENDPOINTS.studentAttemptUpdateTime(attemptId), {
        method: 'PUT',
        body: JSON.stringify({ minutes }),
      });
    } catch (error: any) {
      console.error('❌ Exception in updateTimeSpent:', error);
      throw new Error(error.message || 'Failed to update time spent');
    }
  }

  /**
   * Delete an attempt
   */
  async delete(attemptId: string): Promise<void> {
    try {
      await apiCall(API_ENDPOINTS.studentAttemptById(attemptId), {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete student attempt');
    }
  }

  /**
   * Get attempt statistics for a paper
   */
  async getStatistics(paperId: string): Promise<{
    total: number;
    byStatus: { status: string; count: number }[];
    averageTime: number;
    averageMarks: number;
    passRate: number;
  }> {
    try {
      return await apiCall(API_ENDPOINTS.studentAttemptStatistics(paperId));
    } catch (error: any) {
      console.error('❌ Exception in getStatistics:', error);
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  }
}

export const studentAttemptsService = new StudentAttemptsService();
