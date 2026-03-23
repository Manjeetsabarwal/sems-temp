import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { TeacherPayout } from '../types';

export class TeacherPayoutsService {
  async getAll(filters?: { batchId?: number; teacherId?: string; status?: string }): Promise<TeacherPayout[]> {
    const qs = buildQueryString({
      batchId: filters?.batchId?.toString(),
      teacherId: filters?.teacherId,
      status: filters?.status,
    });
    const data = await apiCall<any[]>(`${API_ENDPOINTS.teacherPayouts}${qs}`);
    return data.map((r) => ({ ...r, payoutAmount: r.payoutAmount != null ? parseFloat(r.payoutAmount) : 0 }));
  }

  async getById(id: number): Promise<TeacherPayout> {
    const data = await apiCall<any>(`${API_ENDPOINTS.teacherPayouts}/${id}`);
    return { ...data, payoutAmount: data.payoutAmount != null ? parseFloat(data.payoutAmount) : 0 };
  }

  async getByBatch(batchId: number): Promise<TeacherPayout[]> {
    return this.getAll({ batchId });
  }

  async create(dto: Partial<TeacherPayout>): Promise<TeacherPayout> {
    return apiCall<TeacherPayout>(API_ENDPOINTS.teacherPayouts, { method: 'POST', body: JSON.stringify(dto) });
  }

  async update(id: number, dto: Partial<TeacherPayout>): Promise<TeacherPayout> {
    return apiCall<TeacherPayout>(`${API_ENDPOINTS.teacherPayouts}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  async delete(id: number): Promise<void> {
    await apiCall(`${API_ENDPOINTS.teacherPayouts}/${id}`, { method: 'DELETE' });
  }
}

export const teacherPayoutsService = new TeacherPayoutsService();
