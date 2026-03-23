import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Lecture } from '../types';

export class LecturesService {
  async getAll(filters?: {
    batchId?: number;
    teacherId?: string;
    subjectId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Lecture[]> {
    try {
      const queryString = buildQueryString({
        batchId: filters?.batchId?.toString(),
        teacherId: filters?.teacherId,
        subjectId: filters?.subjectId,
        search: filters?.search,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
      });
      const data = await apiCall<any[]>(`${API_ENDPOINTS.lectures}${queryString}`);
      return data.map((row) => ({
        id: row.id,
        batchId: row.batchId,
        teacherId: row.teacherId,
        subjectId: row.subjectId,
        dateTime: row.dateTime,
        durationMinutes: row.durationMinutes,
        topic: row.topic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        batch: row.batch,
      }));
    } catch (error: any) {
      console.error('Error fetching lectures:', error);
      throw new Error(`Failed to fetch lectures: ${error.message}`);
    }
  }

  async getById(id: number): Promise<Lecture> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.lectures}/${id}`);
      return {
        id: data.id,
        batchId: data.batchId,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        dateTime: data.dateTime,
        durationMinutes: data.durationMinutes,
        topic: data.topic,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        batch: data.batch,
        attendance: data.attendance || [],
      };
    } catch (error: any) {
      console.error('Error fetching lecture:', error);
      throw new Error(`Failed to fetch lecture: ${error.message}`);
    }
  }

  async create(lecture: Partial<Lecture>): Promise<Lecture> {
    try {
      return await apiCall<Lecture>(API_ENDPOINTS.lectures, {
        method: 'POST',
        body: JSON.stringify(lecture),
      });
    } catch (error: any) {
      console.error('Error creating lecture:', error);
      throw new Error(`Failed to create lecture: ${error.message}`);
    }
  }

  async update(id: number, lecture: Partial<Lecture>): Promise<Lecture> {
    try {
      return await apiCall<Lecture>(`${API_ENDPOINTS.lectures}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(lecture),
      });
    } catch (error: any) {
      console.error('Error updating lecture:', error);
      throw new Error(`Failed to update lecture: ${error.message}`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.lectures}/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error deleting lecture:', error);
      throw new Error(`Failed to delete lecture: ${error.message}`);
    }
  }

  async bulkDelete(ids: number[]): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.lectures}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    } catch (error: any) {
      console.error('Error bulk deleting lectures:', error);
      throw new Error(`Failed to bulk delete lectures: ${error.message}`);
    }
  }

  async getByBatch(batchId: number): Promise<Lecture[]> {
    try {
      return await apiCall<Lecture[]>(API_ENDPOINTS.lecturesByBatch(batchId));
    } catch (error: any) {
      console.error('Error fetching lectures by batch:', error);
      throw new Error(`Failed to fetch lectures by batch: ${error.message}`);
    }
  }

  async getByTeacher(teacherId: string): Promise<Lecture[]> {
    try {
      return await apiCall<Lecture[]>(API_ENDPOINTS.lecturesByTeacher(teacherId));
    } catch (error: any) {
      console.error('Error fetching lectures by teacher:', error);
      throw new Error(`Failed to fetch lectures by teacher: ${error.message}`);
    }
  }
}

export const lecturesService = new LecturesService();
