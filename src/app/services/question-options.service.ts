import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { QuestionOption } from '../types';

export interface QuestionOptionFilters {
  questionId?: string;
  isCorrect?: boolean;
}

/**
 * Question Options Service - REST API Access
 * Version 3: Question Options Module (Step 4)
 * All operations call NestJS backend
 */
class QuestionOptionsService {
  /**
   * Get all question options with optional filters
   */
  async getAll(filters: QuestionOptionFilters = {}): Promise<QuestionOption[]> {
    try {
      console.log('📖 Reading question options from server...', filters);

      const queryString = buildQueryString({
        questionId: filters.questionId,
        isCorrect: filters.isCorrect !== undefined ? String(filters.isCorrect) : undefined,
      });

      const data = await apiCall<QuestionOption[]>(`${API_ENDPOINTS.questionOptions}${queryString}`);

      console.log(`✅ Found ${data.length} question options`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch question options: ${error.message}`);
    }
  }

  /**
   * Get a single question option by ID
   */
  async getById(optionId: string): Promise<QuestionOption> {
    try {
      const data = await apiCall<QuestionOption>(API_ENDPOINTS.questionOptionById(optionId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch question option: ${error.message}`);
    }
  }

  /**
   * Get all options for a specific question
   */
  async getByQuestionId(questionId: string): Promise<QuestionOption[]> {
    try {
      const data = await apiCall<QuestionOption[]>(
        API_ENDPOINTS.questionOptionsByQuestion(questionId),
      );
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getByQuestionId:', error);
      throw new Error(`Failed to fetch question options: ${error.message}`);
    }
  }

  /**
   * Get the correct option for a question
   */
  async getCorrectOption(questionId: string): Promise<QuestionOption | null> {
    try {
      const data = await apiCall<QuestionOption | { message: string }>(
        API_ENDPOINTS.questionOptionsCorrect(questionId),
      );
      if ('message' in data) {
        return null; // No correct option found
      }
      return data as QuestionOption;
    } catch (error: any) {
      console.error('❌ Exception in getCorrectOption:', error);
      throw new Error(`Failed to fetch correct option: ${error.message}`);
    }
  }

  /**
   * Create a new question option
   */
  async create(
    optionData: Omit<QuestionOption, 'createdAt' | 'updatedAt' | 'question'>,
  ): Promise<QuestionOption> {
    try {
      console.log('📝 Creating question option:', optionData);

      const data = await apiCall<QuestionOption>(API_ENDPOINTS.questionOptions, {
        method: 'POST',
        body: JSON.stringify(optionData),
      });

      console.log('✅ Question option created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create question option');
    }
  }

  /**
   * Create multiple options at once (bulk create)
   */
  async createBulk(
    questionId: string,
    options: Omit<QuestionOption, 'optionId' | 'questionId' | 'createdAt' | 'updatedAt' | 'question'>[],
  ): Promise<QuestionOption[]> {
    try {
      console.log('📝 Creating question options in bulk:', questionId, options);

      const data = await apiCall<QuestionOption[]>(API_ENDPOINTS.questionOptionsBulk, {
        method: 'POST',
        body: JSON.stringify({ questionId, options }),
      });

      console.log(`✅ Created ${data.length} question options`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in createBulk:', error);
      throw new Error(error.message || 'Failed to create question options');
    }
  }

  /**
   * Update an existing question option
   */
  async update(optionId: string, updates: Partial<QuestionOption>): Promise<QuestionOption> {
    try {
      console.log('📝 Updating question option:', optionId, updates);

      const data = await apiCall<QuestionOption>(API_ENDPOINTS.questionOptionById(optionId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Question option updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update question option');
    }
  }

  /**
   * Delete a question option
   */
  async delete(optionId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting question option:', optionId);

      await apiCall(API_ENDPOINTS.questionOptionById(optionId), {
        method: 'DELETE',
      });

      console.log('✅ Question option deleted:', optionId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete question option');
    }
  }

  /**
   * Delete all options for a question
   */
  async deleteByQuestionId(questionId: string): Promise<{ deleted: number }> {
    try {
      console.log('🗑️ Deleting all options for question:', questionId);

      const data = await apiCall<{ deleted: number }>(
        API_ENDPOINTS.questionOptionsByQuestion(questionId),
        {
          method: 'DELETE',
        },
      );

      console.log(`✅ Deleted ${data.deleted} question options`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in deleteByQuestionId:', error);
      throw new Error(error.message || 'Failed to delete question options');
    }
  }

  /**
   * Bulk delete question options
   */
  async bulkDelete(optionIds: string[]): Promise<{ deleted: number }> {
    try {
      console.log('🗑️ Bulk deleting question options:', optionIds);

      const data = await apiCall<{ deleted: number }>(API_ENDPOINTS.questionOptionsBulkDelete, {
        method: 'POST',
        body: JSON.stringify({ optionIds }),
      });

      console.log(`✅ Deleted ${data.deleted} question options`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete question options');
    }
  }

  /**
   * Reorder options within a question
   */
  async reorderOptions(
    questionId: string,
    optionOrders: { optionId: string; displayOrder: number }[],
  ): Promise<void> {
    try {
      console.log('🔄 Reordering options for question:', questionId);

      await apiCall(API_ENDPOINTS.questionOptionsReorder, {
        method: 'POST',
        body: JSON.stringify({ questionId, optionOrders }),
      });

      console.log('✅ Options reordered successfully');
    } catch (error: any) {
      console.error('❌ Exception in reorderOptions:', error);
      throw new Error(error.message || 'Failed to reorder options');
    }
  }

  /**
   * Validate MCQ options (check for correct count, duplicates, etc.)
   */
  async validate(questionId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      const data = await apiCall<{
        valid: boolean;
        errors: string[];
      }>(API_ENDPOINTS.questionOptionsValidate(questionId));

      return data;
    } catch (error: any) {
      console.error('❌ Exception in validate:', error);
      throw new Error(error.message || 'Failed to validate options');
    }
  }
}

export const questionOptionsService = new QuestionOptionsService();
