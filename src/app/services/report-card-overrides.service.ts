import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';

export interface ReportCardOverride {
  id?: string;
  studentId: string;
  academicYear: string;
  templateId: string;
  overrides: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export class ReportCardOverridesService {
  /**
   * Get override for a specific student, year and template
   */
  async getOverride(studentId: string, academicYear: string, templateId: string): Promise<ReportCardOverride | null> {
    try {
      const queryString = buildQueryString({
        studentId,
        academicYear,
        templateId,
      });

      return await apiCall<ReportCardOverride | null>(`${API_ENDPOINTS.reportCardOverrides}${queryString}`);
    } catch (error) {
      console.error('Error fetching report card override:', error);
      return null;
    }
  }

  /**
   * Create or update an override
   */
  async upsertOverride(data: ReportCardOverride): Promise<ReportCardOverride> {
    try {
      return await apiCall<ReportCardOverride>(API_ENDPOINTS.reportCardOverrides, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error saving report card override:', error);
      throw error;
    }
  }

  /**
   * Delete an override
   */
  async deleteOverride(id: string): Promise<void> {
    try {
      await apiCall<void>(`${API_ENDPOINTS.reportCardOverrides}/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting report card override:', error);
      throw error;
    }
  }
}

export const reportCardOverridesService = new ReportCardOverridesService();
