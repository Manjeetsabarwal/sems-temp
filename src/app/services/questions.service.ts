import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Question } from '../types';

export interface QuestionFilters {
  paperId?: string;
  sectionId?: string;
  questionType?: string;
  difficulty?: string;
}

/**
 * Questions Service - REST API Access
 * Version 3: Questions Module (Step 3)
 * All operations call NestJS backend
 */
class QuestionsService {
  /**
   * Get all questions with optional filters
   */
  async getAll(filters: QuestionFilters = {}): Promise<Question[]> {
    try {
      console.log('📖 Reading questions from server...', filters);

      const queryString = buildQueryString({
        paperId: filters.paperId,
        sectionId: filters.sectionId,
        questionType: filters.questionType,
        difficulty: filters.difficulty,
      });

      const data = await apiCall<Question[]>(`${API_ENDPOINTS.questions}${queryString}`);

      console.log(`✅ Found ${data.length} questions`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  /**
   * Get a single question by ID
   */
  async getById(questionId: string): Promise<Question> {
    try {
      const data = await apiCall<Question>(API_ENDPOINTS.questionById(questionId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch question: ${error.message}`);
    }
  }

  /**
   * Get all questions for a specific paper
   */
  async getByPaperId(paperId: string): Promise<Question[]> {
    try {
      const data = await apiCall<Question[]>(API_ENDPOINTS.questionsByPaper(paperId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getByPaperId:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  /**
   * Get questions by paper ID and type
   */
  async getByPaperIdAndType(
    paperId: string,
    questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE',
  ): Promise<Question[]> {
    try {
      const data = await apiCall<Question[]>(
        API_ENDPOINTS.questionsByPaperAndType(paperId, questionType),
      );
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getByPaperIdAndType:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  /**
   * Create a new question
   */
  async create(questionData: Omit<Question, 'createdAt' | 'updatedAt' | 'paper'>): Promise<Question> {
    try {
      console.log('📝 Creating question:', questionData);

      const data = await apiCall<Question>(API_ENDPOINTS.questions, {
        method: 'POST',
        body: JSON.stringify(questionData),
      });

      console.log('✅ Question created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create question');
    }
  }

  /**
   * Update an existing question
   */
  async update(questionId: string, updates: Partial<Question>): Promise<Question> {
    try {
      console.log('📝 Updating question:', questionId, updates);

      const data = await apiCall<Question>(API_ENDPOINTS.questionById(questionId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Question updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update question');
    }
  }

  /**
   * Delete a question
   */
  async delete(questionId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting question:', questionId);

      await apiCall(API_ENDPOINTS.questionById(questionId), {
        method: 'DELETE',
      });

      console.log('✅ Question deleted:', questionId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete question');
    }
  }

  /**
   * Bulk delete questions
   */
  async bulkDelete(questionIds: string[]): Promise<{ deleted: number }> {
    try {
      console.log('🗑️ Bulk deleting questions:', questionIds);

      const data = await apiCall<{ deleted: number }>(API_ENDPOINTS.questionsBulkDelete, {
        method: 'POST',
        body: JSON.stringify({ questionIds }),
      });

      console.log(`✅ Deleted ${data.deleted} questions`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete questions');
    }
  }

  /**
   * Reorder questions within a paper
   */
  async reorderQuestions(
    paperId: string,
    questionOrders: { questionId: string; displayOrder: number }[],
  ): Promise<void> {
    try {
      console.log('🔄 Reordering questions for paper:', paperId);

      await apiCall(API_ENDPOINTS.questionsReorder, {
        method: 'POST',
        body: JSON.stringify({ paperId, questionOrders }),
      });

      console.log('✅ Questions reordered successfully');
    } catch (error: any) {
      console.error('❌ Exception in reorderQuestions:', error);
      throw new Error(error.message || 'Failed to reorder questions');
    }
  }

  /**
   * Get question statistics for a paper
   */
  async getStatistics(paperId: string): Promise<{
    total: number;
    byType: { type: string; count: number }[];
    byDifficulty: { difficulty: string; count: number }[];
    totalMarks: number;
  }> {
    try {
      const data = await apiCall<{
        total: number;
        byType: { type: string; count: number }[];
        byDifficulty: { difficulty: string; count: number }[];
        totalMarks: number;
      }>(API_ENDPOINTS.questionsStatistics(paperId));

      return data;
    } catch (error: any) {
      console.error('❌ Exception in getStatistics:', error);
      throw new Error(error.message || 'Failed to fetch question statistics');
    }
  }
}

export const questionsService = new QuestionsService();
