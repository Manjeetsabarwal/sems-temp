import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { StudentEnrollment } from '../types';

export class EnrollmentsService {
  async getAll(filters?: { studentId?: string; batchId?: number; courseId?: number; paymentStatus?: string }): Promise<StudentEnrollment[]> {
    const qs = buildQueryString({
      studentId: filters?.studentId,
      batchId: filters?.batchId?.toString(),
      courseId: filters?.courseId?.toString(),
      paymentStatus: filters?.paymentStatus,
    });
    const data = await apiCall<any[]>(`${API_ENDPOINTS.enrollments}${qs}`);
    return data.map((r) => ({ ...r, totalAmount: r.totalAmount != null ? parseFloat(r.totalAmount) : 0 }));
  }

  async getById(id: number): Promise<StudentEnrollment> {
    const data = await apiCall<any>(`${API_ENDPOINTS.enrollments}/${id}`);
    return { ...data, totalAmount: data.totalAmount != null ? parseFloat(data.totalAmount) : 0 };
  }

  async create(dto: Partial<StudentEnrollment>): Promise<StudentEnrollment> {
    return apiCall<StudentEnrollment>(API_ENDPOINTS.enrollments, { method: 'POST', body: JSON.stringify(dto) });
  }

  async update(id: number, dto: Partial<StudentEnrollment>): Promise<StudentEnrollment> {
    return apiCall<StudentEnrollment>(`${API_ENDPOINTS.enrollments}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  async delete(id: number): Promise<void> {
    await apiCall(`${API_ENDPOINTS.enrollments}/${id}`, { method: 'DELETE' });
  }
}

export const enrollmentsService = new EnrollmentsService();
