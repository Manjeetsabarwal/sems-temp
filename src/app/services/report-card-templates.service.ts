import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { ReportCardTemplate } from '../types';

export class ReportCardTemplatesService {
  async getAll(activeOnly?: boolean): Promise<ReportCardTemplate[]> {
    const qs = buildQueryString(activeOnly ? { activeOnly: 'true' } : {});
    return apiCall<ReportCardTemplate[]>(`${API_ENDPOINTS.reportCardTemplates}${qs}`);
  }

  async getById(id: number): Promise<ReportCardTemplate> {
    return apiCall<ReportCardTemplate>(`${API_ENDPOINTS.reportCardTemplates}/${id}`);
  }

  async getDropdown(): Promise<Array<{ id: number; code: string; displayName: string }>> {
    return apiCall(API_ENDPOINTS.reportCardTemplatesDropdown);
  }
}

export const reportCardTemplatesService = new ReportCardTemplatesService();
