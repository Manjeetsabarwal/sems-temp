import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Broadcast, BroadcastMessage } from '../types';

export class BroadcastsService {
  async getAll(status?: string): Promise<Broadcast[]> {
    const qs = buildQueryString({ status });
    return apiCall<Broadcast[]>(`${API_ENDPOINTS.broadcasts}${qs}`);
  }

  async getById(id: number): Promise<Broadcast> {
    return apiCall<Broadcast>(`${API_ENDPOINTS.broadcasts}/${id}`);
  }

  async getMessages(id: number): Promise<BroadcastMessage[]> {
    return apiCall<BroadcastMessage[]>(API_ENDPOINTS.broadcastMessages(id));
  }

  async getStats(id: number): Promise<{ total: number; sent: number; delivered: number; failed: number; pending: number }> {
    return apiCall(API_ENDPOINTS.broadcastStats(id));
  }

  async create(dto: Partial<Broadcast>): Promise<Broadcast> {
    return apiCall<Broadcast>(API_ENDPOINTS.broadcasts, { method: 'POST', body: JSON.stringify(dto) });
  }

  async update(id: number, dto: Partial<Broadcast>): Promise<Broadcast> {
    return apiCall<Broadcast>(`${API_ENDPOINTS.broadcasts}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  async delete(id: number): Promise<void> {
    await apiCall(`${API_ENDPOINTS.broadcasts}/${id}`, { method: 'DELETE' });
  }

  async addMessage(broadcastId: number, dto: Omit<Partial<BroadcastMessage>, 'broadcastId'>): Promise<BroadcastMessage> {
    return apiCall<BroadcastMessage>(API_ENDPOINTS.broadcastMessages(broadcastId), {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async createWithRecipients(
    broadcast: Partial<Broadcast>,
    filters?: { targetType: string; classId?: string; sectionId?: string; studentIds?: string[] },
  ): Promise<Broadcast> {
    return apiCall<Broadcast>(API_ENDPOINTS.broadcastWithRecipients, {
      method: 'POST',
      body: JSON.stringify({ ...broadcast, filters }),
    });
  }

  async getWhatsAppTemplatesMeta(): Promise<any[]> {
    return apiCall(API_ENDPOINTS.whatsappTemplatesMeta);
  }

  async sendBroadcast(id: number): Promise<{ sent: number; failed: number }> {
    // Note: Send is now automatic on backend, but we keep this for manual trigger if needed
    return apiCall(API_ENDPOINTS.broadcastSend(id), { method: 'POST' });
  }

  async retryFailed(id: number): Promise<{ sent: number; failed: number }> {
    return apiCall(API_ENDPOINTS.broadcastRetry(id), { method: 'POST' });
  }
}

export const broadcastsService = new BroadcastsService();
