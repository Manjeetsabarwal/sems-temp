import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { WhatsAppTemplate } from '../types';

export class WhatsAppTemplatesService {
  async getAll(filters?: { status?: string; language?: string }): Promise<WhatsAppTemplate[]> {
    const qs = buildQueryString(filters);
    return apiCall<WhatsAppTemplate[]>(`${API_ENDPOINTS.whatsappTemplates}${qs}`);
  }

  async getById(id: number): Promise<WhatsAppTemplate> {
    return apiCall<WhatsAppTemplate>(`${API_ENDPOINTS.whatsappTemplates}/${id}`);
  }

  async getDropdown(): Promise<Array<{ id: number; templateId: string; name: string }>> {
    return apiCall(API_ENDPOINTS.whatsappTemplatesDropdown);
  }

  async create(dto: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    return apiCall<WhatsAppTemplate>(API_ENDPOINTS.whatsappTemplates, { method: 'POST', body: JSON.stringify(dto) });
  }

  async update(id: number, dto: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    return apiCall<WhatsAppTemplate>(`${API_ENDPOINTS.whatsappTemplates}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  async delete(id: number): Promise<void> {
    await apiCall(`${API_ENDPOINTS.whatsappTemplates}/${id}`, { method: 'DELETE' });
  }
}

export const whatsappTemplatesService = new WhatsAppTemplatesService();
