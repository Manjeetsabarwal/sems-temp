import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { PaperRule } from '../types';

export interface PaperRuleFilters {
  paperId?: string;
  evaluationMode?: string;
}

/**
 * Paper Rules Service - REST API Access
 * Version 3: Paper Rules Module (Step 2)
 * All operations call NestJS backend
 */
class PaperRulesService {
  /**
   * Get all paper rules with optional filters
   */
  async getAll(filters: PaperRuleFilters = {}): Promise<PaperRule[]> {
    try {
      console.log('📖 Reading paper rules from server...', filters);

      const queryString = buildQueryString({
        paperId: filters.paperId,
        evaluationMode: filters.evaluationMode,
      });

      const data = await apiCall<PaperRule[]>(`${API_ENDPOINTS.paperRules}${queryString}`);

      console.log(`✅ Found ${data.length} paper rules`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch paper rules: ${error.message}`);
    }
  }

  /**
   * Get a single paper rule by ID
   */
  async getById(ruleId: string): Promise<PaperRule> {
    try {
      const data = await apiCall<PaperRule>(API_ENDPOINTS.paperRuleById(ruleId));
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch paper rule: ${error.message}`);
    }
  }

  /**
   * Get rule for a specific paper
   */
  async getByPaperId(paperId: string): Promise<PaperRule | null> {
    try {
      const data = await apiCall<PaperRule | { message: string }>(
        API_ENDPOINTS.paperRuleByPaper(paperId),
      );
      if ('message' in data) {
        return null; // No rule found
      }
      return data as PaperRule;
    } catch (error: any) {
      console.error('❌ Exception in getByPaperId:', error);
      throw new Error(`Failed to fetch paper rule: ${error.message}`);
    }
  }

  /**
   * Create a new paper rule
   */
  async create(ruleData: Omit<PaperRule, 'createdAt' | 'updatedAt' | 'paper'>): Promise<PaperRule> {
    try {
      console.log('📝 Creating paper rule:', ruleData);

      const data = await apiCall<PaperRule>(API_ENDPOINTS.paperRules, {
        method: 'POST',
        body: JSON.stringify(ruleData),
      });

      console.log('✅ Paper rule created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create paper rule');
    }
  }

  /**
   * Update an existing paper rule
   */
  async update(ruleId: string, updates: Partial<PaperRule>): Promise<PaperRule> {
    try {
      console.log('📝 Updating paper rule:', ruleId, updates);

      const data = await apiCall<PaperRule>(API_ENDPOINTS.paperRuleById(ruleId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Paper rule updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update paper rule');
    }
  }

  /**
   * Update rule by paper ID
   */
  async updateByPaperId(paperId: string, updates: Partial<PaperRule>): Promise<PaperRule> {
    try {
      console.log('📝 Updating paper rule by paper ID:', paperId, updates);

      const data = await apiCall<PaperRule>(API_ENDPOINTS.paperRuleByPaper(paperId), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Paper rule updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in updateByPaperId:', error);
      throw new Error(error.message || 'Failed to update paper rule');
    }
  }

  /**
   * Delete a paper rule
   */
  async delete(ruleId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting paper rule:', ruleId);

      await apiCall(API_ENDPOINTS.paperRuleById(ruleId), {
        method: 'DELETE',
      });

      console.log('✅ Paper rule deleted:', ruleId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete paper rule');
    }
  }

  /**
   * Delete rule by paper ID
   */
  async deleteByPaperId(paperId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting paper rule by paper ID:', paperId);

      await apiCall(API_ENDPOINTS.paperRuleByPaper(paperId), {
        method: 'DELETE',
      });

      console.log('✅ Paper rule deleted:', paperId);
    } catch (error: any) {
      console.error('❌ Exception in deleteByPaperId:', error);
      throw new Error(error.message || 'Failed to delete paper rule');
    }
  }

  /**
   * Evaluate pass/fail for a paper
   */
  async evaluatePassFail(
    paperId: string,
    marksObtained: number,
    totalMarks: number,
    sectionMarks?: { sectionId: string; marksObtained: number; totalMarks: number }[],
  ): Promise<{
    passed: boolean;
    percentage: number;
    reason?: string;
  }> {
    try {
      console.log('📊 Evaluating pass/fail for paper:', paperId);

      const data = await apiCall<{
        passed: boolean;
        percentage: number;
        reason?: string;
      }>(API_ENDPOINTS.paperRuleEvaluate(paperId), {
        method: 'POST',
        body: JSON.stringify({
          marksObtained,
          totalMarks,
          sectionMarks,
        }),
      });

      console.log('✅ Evaluation result:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in evaluatePassFail:', error);
      throw new Error(error.message || 'Failed to evaluate pass/fail');
    }
  }
}

export const paperRulesService = new PaperRulesService();
