import { API_ENDPOINTS, apiCall } from '../config/api.config';
import type { PaidStudentFee } from '../types';

export class PaidStudentFeesService {
  async getAll(): Promise<PaidStudentFee[]> {
    const data = await apiCall<any[]>(API_ENDPOINTS.paidStudentFees);
    return data.map((r) => ({ ...r, amount: parseFloat(r.amount || 0) }));
  }

  async getByEnrollment(enrollmentId: number): Promise<PaidStudentFee[]> {
    const data = await apiCall<any[]>(API_ENDPOINTS.paidStudentFeesByEnrollment(enrollmentId));
    return data.map((r) => ({ ...r, amount: parseFloat(r.amount || 0) }));
  }

  async create(dto: Partial<PaidStudentFee>): Promise<PaidStudentFee> {
    return apiCall<PaidStudentFee>(API_ENDPOINTS.paidStudentFees, { method: 'POST', body: JSON.stringify(dto) });
  }

  async update(id: number, dto: Partial<PaidStudentFee>): Promise<PaidStudentFee> {
    return apiCall<PaidStudentFee>(`${API_ENDPOINTS.paidStudentFees}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  async findOne(id: number): Promise<PaidStudentFee> {
    return apiCall<PaidStudentFee>(`${API_ENDPOINTS.paidStudentFees}/${id}`);
  }

  async delete(id: number): Promise<void> {
    await apiCall(`${API_ENDPOINTS.paidStudentFees}/${id}`, { method: 'DELETE' });
  }
}

export const paidStudentFeesService = new PaidStudentFeesService();
