import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { ExamPaper } from '../types';

export interface ExamPaperFilters {
  examId?: string;
  isOnline?: boolean;
  status?: string;
}

/**
 * Exam Papers Service - REST API Access
 * Version 3: Exam Papers Module
 * All operations call NestJS backend
 */
class ExamPapersService {
  /**
   * Get all exam papers with optional filters
   */
  async getAll(filters: ExamPaperFilters = {}): Promise<ExamPaper[]> {
    try {
      console.log('📖 Reading exam papers from server...', filters);

      const queryString = buildQueryString({
        examId: filters.examId,
        isOnline: filters.isOnline !== undefined ? String(filters.isOnline) : undefined,
        status: filters.status,
      });

      const data = await apiCall<ExamPaper[]>(`${API_ENDPOINTS.examPapers}${queryString}`);

      console.log(`✅ Found ${data.length} exam papers`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch exam papers: ${error.message}`);
    }
  }

  /**
   * Get a single exam paper by ID
   */
  async getById(paperId: string): Promise<ExamPaper> {
    try {
      const data = await apiCall<ExamPaper>(API_ENDPOINTS.examPaperById(paperId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch exam paper: ${error.message}`);
    }
  }

  /**
   * Get all papers for a specific exam
   */
  async getByExamId(examId: string): Promise<ExamPaper[]> {
    try {
      const data = await apiCall<ExamPaper[]>(API_ENDPOINTS.examPapersByExam(examId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getByExamId:', error);
      throw new Error(`Failed to fetch exam papers: ${error.message}`);
    }
  }

  /**
   * Create a new exam paper
   */
  async create(paperData: Omit<ExamPaper, 'createdAt' | 'updatedAt'>): Promise<ExamPaper> {
    try {
      console.log('📝 Creating exam paper:', paperData);

      const data = await apiCall<ExamPaper>(API_ENDPOINTS.examPapers, {
        method: 'POST',
        body: JSON.stringify(paperData),
      });

      console.log('✅ Exam paper created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create exam paper');
    }
  }

  /**
   * Update an existing exam paper
   */
  async update(paperId: string, updates: Partial<ExamPaper>): Promise<ExamPaper> {
    try {
      console.log('📝 Updating exam paper:', paperId, updates);

      const data = await apiCall<ExamPaper>(API_ENDPOINTS.examPaperById(paperId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Exam paper updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update exam paper');
    }
  }

  /**
   * Delete an exam paper
   */
  async delete(paperId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting exam paper:', paperId);

      await apiCall(API_ENDPOINTS.examPaperById(paperId), {
        method: 'DELETE',
      });

      console.log('✅ Exam paper deleted:', paperId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete exam paper');
    }
  }

  /**
   * Bulk delete exam papers
   */
  async bulkDelete(paperIds: string[]): Promise<{ deleted: number }> {
    try {
      console.log('🗑️ Bulk deleting exam papers:', paperIds);

      const data = await apiCall<{ deleted: number }>(API_ENDPOINTS.examPapersBulkDelete, {
        method: 'POST',
        body: JSON.stringify({ paperIds }),
      });

      console.log(`✅ Deleted ${data.deleted} exam papers`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete exam papers');
    }
  }
}

export const examPapersService = new ExamPapersService();
