import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { StudentResponse } from '../types';

export interface StudentResponseFilters {
  attemptId?: string;
  questionId?: string;
  isEvaluated?: boolean;
}

/**
 * Student Responses Service - REST API Access
 * Version 3: Student Responses Module (Step 6)
 * All operations call NestJS backend
 */
class StudentResponsesService {
  /**
   * Get all responses with optional filters
   */
  async getAll(filters: StudentResponseFilters = {}): Promise<StudentResponse[]> {
    try {
      const queryString = buildQueryString({
        attemptId: filters.attemptId,
        questionId: filters.questionId,
        isEvaluated:
          filters.isEvaluated !== undefined ? String(filters.isEvaluated) : undefined,
      });

      const data = await apiCall<StudentResponse[]>(`${API_ENDPOINTS.studentResponses}${queryString}`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch student responses: ${error.message}`);
    }
  }

  /**
   * Get a single response by ID
   */
  async getById(responseId: string): Promise<StudentResponse> {
    try {
      return await apiCall<StudentResponse>(API_ENDPOINTS.studentResponseById(responseId));
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch student response: ${error.message}`);
    }
  }

  /**
   * Get all responses for an attempt
   */
  async getByAttemptId(attemptId: string): Promise<StudentResponse[]> {
    try {
      return await apiCall<StudentResponse[]>(
        API_ENDPOINTS.studentResponsesByAttempt(attemptId),
      );
    } catch (error: any) {
      console.error('❌ Exception in getByAttemptId:', error);
      throw new Error(`Failed to fetch student responses: ${error.message}`);
    }
  }

  /**
   * Get all responses for a question
   */
  async getByQuestionId(questionId: string): Promise<StudentResponse[]> {
    try {
      return await apiCall<StudentResponse[]>(
        API_ENDPOINTS.studentResponsesByQuestion(questionId),
      );
    } catch (error: any) {
      console.error('❌ Exception in getByQuestionId:', error);
      throw new Error(`Failed to fetch student responses: ${error.message}`);
    }
  }

  /**
   * Create a new response
   */
  async create(
    responseData: Omit<StudentResponse, 'createdAt' | 'updatedAt' | 'attempt' | 'question' | 'selectedOption'>,
  ): Promise<StudentResponse> {
    try {
      return await apiCall<StudentResponse>(API_ENDPOINTS.studentResponses, {
        method: 'POST',
        body: JSON.stringify(responseData),
      });
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create student response');
    }
  }

  /**
   * Create or update a response (upsert)
   */
  async createOrUpdate(
    responseData: Omit<StudentResponse, 'createdAt' | 'updatedAt' | 'attempt' | 'question' | 'selectedOption'>,
  ): Promise<StudentResponse> {
    try {
      return await apiCall<StudentResponse>(API_ENDPOINTS.studentResponseCreateOrUpdate, {
        method: 'POST',
        body: JSON.stringify(responseData),
      });
    } catch (error: any) {
      console.error('❌ Exception in createOrUpdate:', error);
      throw new Error(error.message || 'Failed to create or update student response');
    }
  }

  /**
   * Update a response
   */
  async update(responseId: string, updates: Partial<StudentResponse>): Promise<StudentResponse> {
    try {
      return await apiCall<StudentResponse>(API_ENDPOINTS.studentResponseById(responseId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update student response');
    }
  }

  /**
   * Evaluate a response
   */
  async evaluate(
    responseId: string,
    marksAwarded: number,
    evaluatedBy: string,
    feedback?: string,
  ): Promise<StudentResponse> {
    try {
      return await apiCall<StudentResponse>(API_ENDPOINTS.studentResponseEvaluate(responseId), {
        method: 'POST',
        body: JSON.stringify({ marksAwarded, evaluatedBy, feedback }),
      });
    } catch (error: any) {
      console.error('❌ Exception in evaluate:', error);
      throw new Error(error.message || 'Failed to evaluate student response');
    }
  }

  /**
   * Bulk evaluate responses
   */
  async bulkEvaluate(
    attemptId: string,
    evaluations: {
      responseId: string;
      marksAwarded: number;
      evaluatedBy: string;
      feedback?: string;
    }[],
  ): Promise<StudentResponse[]> {
    try {
      return await apiCall<StudentResponse[]>(API_ENDPOINTS.studentResponsesBulkEvaluate, {
        method: 'POST',
        body: JSON.stringify({ attemptId, evaluations }),
      });
    } catch (error: any) {
      console.error('❌ Exception in bulkEvaluate:', error);
      throw new Error(error.message || 'Failed to bulk evaluate responses');
    }
  }

  /**
   * Delete a response
   */
  async delete(responseId: string): Promise<void> {
    try {
      await apiCall(API_ENDPOINTS.studentResponseById(responseId), {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete student response');
    }
  }

  /**
   * Delete all responses for an attempt
   */
  async deleteByAttemptId(attemptId: string): Promise<{ deleted: number }> {
    try {
      return await apiCall<{ deleted: number }>(
        API_ENDPOINTS.studentResponsesByAttempt(attemptId),
        {
          method: 'DELETE',
        },
      );
    } catch (error: any) {
      console.error('❌ Exception in deleteByAttemptId:', error);
      throw new Error(error.message || 'Failed to delete student responses');
    }
  }

  /**
   * Get response statistics for an attempt
   */
  async getStatistics(attemptId: string): Promise<{
    total: number;
    answered: number;
    evaluated: number;
    totalMarksObtained: number;
    totalMarksAvailable: number;
    byCorrectness: { correct: number; incorrect: number; notEvaluated: number };
  }> {
    try {
      return await apiCall(API_ENDPOINTS.studentResponseStatistics(attemptId));
    } catch (error: any) {
      console.error('❌ Exception in getStatistics:', error);
      throw new Error(error.message || 'Failed to fetch response statistics');
    }
  }
}

export const studentResponsesService = new StudentResponsesService();
