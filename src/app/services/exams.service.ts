import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Exam } from '../types';

export interface ExamFilters {
  classId?: string;
  examType?: string;
  status?: string;
  academicYear?: string;
  search?: string;
}

/**
 * Exams Service - REST API Access
 * All operations call NestJS backend
 */
export class ExamsService {
  /**
   * Get all exams with optional filters
   */
  async getAll(filters?: ExamFilters): Promise<Exam[]> {
    try {
      const queryString = buildQueryString({
        classId: filters?.classId,
        examType: filters?.examType,
        status: filters?.status,
        academicYear: filters?.academicYear,
        search: filters?.search,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.exams}${queryString}`);

      return data.map((row) => ({
        examId: row.examId,
        examName: row.examName,
        examType: row.examType,
        academicYear: row.academicYear,
        classId: row.classId,
        term: row.term,
        startDate: row.startDate,
        endDate: row.endDate,
        totalMarks: row.totalMarks,
        passingMarks: row.passingMarks,
        subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : (row.subjects || []),
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching exams:', error);
      throw new Error(`Failed to fetch exams: ${error.message}`);
    }
  }

  /**
   * Get a single exam by ID
   */
  async getById(examId: string): Promise<Exam> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.exams}/${examId}`);

      return {
        examId: data.examId,
        examName: data.examName,
        examType: data.examType,
        academicYear: data.academicYear,
        classId: data.classId,
        term: data.term,
        startDate: data.startDate,
        endDate: data.endDate,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        subjects: typeof data.subjects === 'string' ? JSON.parse(data.subjects) : (data.subjects || []),
        description: data.description,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching exam:', error);
      throw new Error(`Failed to fetch exam: ${error.message}`);
    }
  }

  /**
   * Create a new exam
   */
  async create(exam: Omit<Exam, 'createdAt' | 'updatedAt'>): Promise<Exam> {
    try {
      const payload = {
        examId: exam.examId,
        examName: exam.examName,
        examType: exam.examType,
        academicYear: exam.academicYear,
        classId: exam.classId,
        term: exam.term,
        startDate: exam.startDate,
        endDate: exam.endDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        subjects: exam.subjects || [],
        description: exam.description,
        status: exam.status,
      };

      const data = await apiCall<any>(API_ENDPOINTS.exams, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        examId: data.examId,
        examName: data.examName,
        examType: data.examType,
        academicYear: data.academicYear,
        classId: data.classId,
        term: data.term,
        startDate: data.startDate,
        endDate: data.endDate,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        subjects: typeof data.subjects === 'string' ? JSON.parse(data.subjects) : (data.subjects || []),
        description: data.description,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error creating exam:', error);
      throw new Error(error.message || 'Failed to create exam');
    }
  }

  /**
   * Update an existing exam
   */
  async update(examId: string, updates: Partial<Exam>): Promise<Exam> {
    try {
      const { examId: _, ...updateData } = updates as any;

      const data = await apiCall<any>(`${API_ENDPOINTS.exams}/${examId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      return {
        examId: data.examId,
        examName: data.examName,
        examType: data.examType,
        academicYear: data.academicYear,
        classId: data.classId,
        term: data.term,
        startDate: data.startDate,
        endDate: data.endDate,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        subjects: typeof data.subjects === 'string' ? JSON.parse(data.subjects) : (data.subjects || []),
        description: data.description,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error updating exam:', error);
      throw new Error(error.message || 'Failed to update exam');
    }
  }

  /**
   * Delete an exam
   */
  async delete(examId: string): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.exams}/${examId}`, {
        method: 'DELETE',
      });

      return { message: 'Exam deleted successfully' };
    } catch (error: any) {
      console.error('❌ Error deleting exam:', error);
      throw new Error(error.message || 'Failed to delete exam');
    }
  }

  /**
   * Bulk delete exams
   */
  async bulkDelete(examIds: string[]): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.exams}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ examIds }),
      });

      return { message: `Successfully deleted ${examIds.length} exams` };
    } catch (error: any) {
      console.error('❌ Error bulk deleting exams:', error);
      throw new Error(error.message || 'Failed to delete exams');
    }
  }
}

export const examsService = new ExamsService();
