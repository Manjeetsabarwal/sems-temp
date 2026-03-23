import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Result, SubjectResult } from '../types';

export interface ResultFilters {
  studentId?: string;
  examId?: string;
  classId?: string;
  status?: string;
  search?: string;
}

/**
 * Results Service - REST API Access
 * All operations call NestJS backend
 */
class ResultsService {
  /**
   * Get all results with optional filters
   */
  async getAll(filters?: ResultFilters): Promise<Result[]> {
    try {
      const queryString = buildQueryString({
        studentId: filters?.studentId,
        examId: filters?.examId,
        classId: filters?.classId,
        status: filters?.status,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.results}${queryString}`);

      return data.map((row) => ({
        resultId: row.resultId,
        studentId: row.studentId,
        studentName: row.student?.name || row.studentName,
        examId: row.examId,
        examName: row.exam?.examName || row.examName,
        classId: row.classId,
        totalMarksObtained: parseFloat(row.totalMarksObtained || row.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(row.totalMaxMarks || row.totalMaxMarks || 0),
        percentage: parseFloat(row.percentage || 0),
        grade: row.grade || '',
        isPassed: row.isPassed || false,
        subjects: row.subjects || [],
        rank: row.rank || null,
        status: row.status || 'Draft',
        remarks: row.remarks || '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching results:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  /**
   * Get a single result by ID
   */
  async getById(resultId: string): Promise<Result> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.results}/${resultId}`);

      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Draft',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching result:', error);
      throw new Error(`Failed to fetch result: ${error.message}`);
    }
  }

  /**
   * Create a new result
   */
  async create(result: Omit<Result, 'createdAt' | 'updatedAt'>): Promise<Result> {
    try {
      const payload = {
        resultId: result.resultId,
        studentId: result.studentId,
        examId: result.examId,
        classId: result.classId,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        grade: result.grade,
        isPassed: result.isPassed,
        subjects: result.subjects,
        rank: result.rank,
        status: result.status || 'Draft',
        remarks: result.remarks,
      };

      const data = await apiCall<any>(API_ENDPOINTS.results, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Draft',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error creating result:', error);
      throw new Error(error.message || 'Failed to create result');
    }
  }

  /**
   * Update an existing result
   */
  async update(resultId: string, updates: Partial<Result>): Promise<Result> {
    try {
      const { resultId: _, ...updateData } = updates as any;

      const data = await apiCall<any>(`${API_ENDPOINTS.results}/${resultId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Draft',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error updating result:', error);
      // Provide more specific error message for 404
      if (error.message && error.message.includes('404') || error.message && error.message.includes('Not Found')) {
        throw new Error(`Result with ID "${resultId}" not found. Please check if the result exists or create it first.`);
      }
      throw new Error(error.message || 'Failed to update result');
    }
  }

  /**
   * Delete a result
   */
  async delete(resultId: string): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.results}/${resultId}`, {
        method: 'DELETE',
      });

      return { message: 'Result deleted successfully' };
    } catch (error: any) {
      console.error('❌ Error deleting result:', error);
      throw new Error(error.message || 'Failed to delete result');
    }
  }

  /**
   * Bulk delete results
   */
  async bulkDelete(resultIds: string[]): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.results}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ resultIds }),
      });

      return { message: `Successfully deleted ${resultIds.length} results` };
    } catch (error: any) {
      console.error('❌ Error bulk deleting results:', error);
      throw new Error(error.message || 'Failed to delete results');
    }
  }

  /**
   * Get results by student
   */
  async getByStudent(studentId: string): Promise<Result[]> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.resultsByStudent(studentId));
      return this.mapResults(data);
    } catch (error: any) {
      console.error('❌ Error fetching results by student:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  /**
   * Get results by exam
   */
  async getByExam(examId: string): Promise<Result[]> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.resultsByExam(examId));
      return this.mapResults(data);
    } catch (error: any) {
      console.error('❌ Error fetching results by exam:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  /**
   * Helper method to map API response to Result type
   */
  private mapResults(data: any[]): Result[] {
    return data.map((row) => ({
      resultId: row.resultId,
      studentId: row.studentId,
      studentName: row.student?.name || row.studentName,
      examId: row.examId,
      examName: row.exam?.examName || row.examName,
      classId: row.classId,
      totalMarksObtained: parseFloat(row.totalMarksObtained || 0),
      totalMaxMarks: parseFloat(row.totalMaxMarks || 0),
      percentage: parseFloat(row.percentage || 0),
      grade: row.grade || '',
      isPassed: row.isPassed || false,
      subjects: row.subjects || [],
      rank: row.rank || null,
      status: row.status || 'Draft',
      remarks: row.remarks || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Calculate result from marks for a student/exam
   */
  async calculateFromMarks(
    studentId: string,
    examId: string,
    classId: string,
    useVersion2: boolean = false,
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<Result> {
    try {
      const data = await apiCall<any>(API_ENDPOINTS.calculateResult(studentId, examId), {
        method: 'POST',
        body: JSON.stringify({ classId, useVersion2, unitTestMethod }),
      });

      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Draft',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error calculating result:', error);
      throw new Error(error.message || 'Failed to calculate result');
    }
  }

  /**
   * Calculate ranks for all results in an exam
   */
  async calculateRanks(examId: string): Promise<Result[]> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.calculateRanks(examId), {
        method: 'POST',
      });
      return this.mapResults(data);
    } catch (error: any) {
      console.error('❌ Error calculating ranks:', error);
      throw new Error(error.message || 'Failed to calculate ranks');
    }
  }

  /**
   * Publish a result
   */
  async publish(resultId: string, sendEmail: boolean = true): Promise<Result> {
    try {
      const data = await apiCall<any>(API_ENDPOINTS.publishResult(resultId), {
        method: 'PUT',
        body: JSON.stringify({ sendEmail }),
      });
      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Published',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error publishing result:', error);
      throw new Error(error.message || 'Failed to publish result');
    }
  }

  /**
   * Unpublish a result
   */
  async unpublish(resultId: string): Promise<Result> {
    try {
      const data = await apiCall<any>(API_ENDPOINTS.unpublishResult(resultId), {
        method: 'PUT',
      });
      return {
        resultId: data.resultId,
        studentId: data.studentId,
        studentName: data.student?.name || data.studentName,
        examId: data.examId,
        examName: data.exam?.examName || data.examName,
        classId: data.classId,
        totalMarksObtained: parseFloat(data.totalMarksObtained || 0),
        totalMaxMarks: parseFloat(data.totalMaxMarks || 0),
        percentage: parseFloat(data.percentage || 0),
        grade: data.grade || '',
        isPassed: data.isPassed || false,
        subjects: data.subjects || [],
        rank: data.rank || null,
        status: data.status || 'Draft',
        remarks: data.remarks || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error unpublishing result:', error);
      throw new Error(error.message || 'Failed to unpublish result');
    }
  }

  /**
   * Get report cards list
   */
  async getReportCardsList(filters?: { examId?: string; classId?: string; studentId?: string }): Promise<any[]> {
    try {
      const queryString = buildQueryString({
        examId: filters?.examId,
        classId: filters?.classId,
        studentId: filters?.studentId,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.reportCards}${queryString}`);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching report cards list:', error);
      throw new Error(error.message || 'Failed to fetch report cards');
    }
  }

  /**
   * Get a single report card
   * Version 2: Supports internal/external marks breakdown
   */
  async getReportCard(
    studentId: string,
    examId: string,
    version: 'v1' | 'v2' = 'v1',
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<any> {
    try {
      const queryString = buildQueryString({
        version,
        unitTestMethod,
      });
      const data = await apiCall<any>(`${API_ENDPOINTS.reportCard(studentId, examId)}${queryString}`);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching report card:', error);
      throw new Error(error.message || 'Failed to fetch report card');
    }
  }

  /**
   * Send notification for a published result
   */
  async sendNotification(resultId: string): Promise<{ message: string; emailsSent: number }> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.results}/${resultId}/send-notification`, {
        method: 'PUT',
      });
      return data;
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      throw new Error(error.message || 'Failed to send notification');
    }
  }
}

export const resultsService = new ResultsService();
