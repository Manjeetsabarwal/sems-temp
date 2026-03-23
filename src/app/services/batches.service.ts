import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { CourseBatch, BatchTeacher, BatchStudent } from '../types';

export class BatchesService {
  async getAll(filters?: {
    courseId?: number;
    classId?: string;
    isCompleted?: boolean;
    search?: string;
  }): Promise<CourseBatch[]> {
    try {
      const queryString = buildQueryString({
        courseId: filters?.courseId?.toString(),
        classId: filters?.classId,
        isCompleted: filters?.isCompleted?.toString(),
        search: filters?.search,
      });
      const data = await apiCall<any[]>(`${API_ENDPOINTS.batches}${queryString}`);
      return data.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        classId: row.classId,
        sectionId: row.sectionId,
        title: row.title,
        description: row.description,
        durationDays: row.durationDays,
        startDate: row.startDate,
        endDate: row.endDate,
        totalRevenue: row.totalRevenue ? parseFloat(row.totalRevenue) : 0,
        teacherSharePercent: row.teacherSharePercent ? parseFloat(row.teacherSharePercent) : 0,
        institutionSharePercent: row.institutionSharePercent ? parseFloat(row.institutionSharePercent) : 0,
        isCompleted: row.isCompleted,
        isDeleted: row.isDeleted,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        course: row.course,
        batchTeachers: row.batchTeachers || [],
        batchStudents: row.batchStudents || [],
      }));
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }
  }

  async getById(id: number): Promise<CourseBatch> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.batches}/${id}`);
      return {
        id: data.id,
        courseId: data.courseId,
        classId: data.classId,
        sectionId: data.sectionId,
        title: data.title,
        description: data.description,
        durationDays: data.durationDays,
        startDate: data.startDate,
        endDate: data.endDate,
        totalRevenue: data.totalRevenue ? parseFloat(data.totalRevenue) : 0,
        teacherSharePercent: data.teacherSharePercent ? parseFloat(data.teacherSharePercent) : 0,
        institutionSharePercent: data.institutionSharePercent ? parseFloat(data.institutionSharePercent) : 0,
        isCompleted: data.isCompleted,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        course: data.course,
        batchTeachers: data.batchTeachers || [],
        batchStudents: data.batchStudents || [],
        lectures: data.lectures || [],
      };
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      throw new Error(`Failed to fetch batch: ${error.message}`);
    }
  }

  async create(batch: Partial<CourseBatch>): Promise<CourseBatch> {
    try {
      return await apiCall<CourseBatch>(API_ENDPOINTS.batches, {
        method: 'POST',
        body: JSON.stringify(batch),
      });
    } catch (error: any) {
      console.error('Error creating batch:', error);
      throw new Error(`Failed to create batch: ${error.message}`);
    }
  }

  async update(id: number, batch: Partial<CourseBatch>): Promise<CourseBatch> {
    try {
      return await apiCall<CourseBatch>(`${API_ENDPOINTS.batches}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(batch),
      });
    } catch (error: any) {
      console.error('Error updating batch:', error);
      throw new Error(`Failed to update batch: ${error.message}`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.batches}/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      throw new Error(`Failed to delete batch: ${error.message}`);
    }
  }

  async bulkDelete(ids: number[]): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.batches}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    } catch (error: any) {
      console.error('Error bulk deleting batches:', error);
      throw new Error(`Failed to bulk delete batches: ${error.message}`);
    }
  }

  async getDropdown(): Promise<Array<{ id: number; title: string; courseId: number }>> {
    try {
      return await apiCall(API_ENDPOINTS.batchesDropdown);
    } catch (error: any) {
      console.error('Error fetching batches dropdown:', error);
      throw new Error(`Failed to fetch batches dropdown: ${error.message}`);
    }
  }

  async getByCourse(courseId: number): Promise<CourseBatch[]> {
    try {
      return await apiCall<CourseBatch[]>(API_ENDPOINTS.batchesByCourse(courseId));
    } catch (error: any) {
      console.error('Error fetching batches by course:', error);
      throw new Error(`Failed to fetch batches by course: ${error.message}`);
    }
  }

  // --- Teacher Management ---

  async getTeachers(batchId: number): Promise<BatchTeacher[]> {
    try {
      return await apiCall<BatchTeacher[]>(API_ENDPOINTS.batchTeachers(batchId));
    } catch (error: any) {
      console.error('Error fetching batch teachers:', error);
      throw new Error(`Failed to fetch batch teachers: ${error.message}`);
    }
  }

  async addTeacher(batchId: number, teacherId: string, shareAmount?: number): Promise<BatchTeacher> {
    try {
      return await apiCall<BatchTeacher>(API_ENDPOINTS.batchTeachers(batchId), {
        method: 'POST',
        body: JSON.stringify({ teacherId, shareAmount }),
      });
    } catch (error: any) {
      console.error('Error adding teacher to batch:', error);
      throw new Error(`Failed to add teacher to batch: ${error.message}`);
    }
  }

  async removeTeacher(batchId: number, teacherId: string): Promise<void> {
    try {
      await apiCall(API_ENDPOINTS.batchRemoveTeacher(batchId, teacherId), { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error removing teacher from batch:', error);
      throw new Error(`Failed to remove teacher from batch: ${error.message}`);
    }
  }

  // --- Student Management ---

  async getStudents(batchId: number): Promise<BatchStudent[]> {
    try {
      return await apiCall<BatchStudent[]>(API_ENDPOINTS.batchStudents(batchId));
    } catch (error: any) {
      console.error('Error fetching batch students:', error);
      throw new Error(`Failed to fetch batch students: ${error.message}`);
    }
  }

  async addStudent(batchId: number, studentId: string): Promise<BatchStudent> {
    try {
      return await apiCall<BatchStudent>(API_ENDPOINTS.batchStudents(batchId), {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
    } catch (error: any) {
      console.error('Error adding student to batch:', error);
      throw new Error(`Failed to add student to batch: ${error.message}`);
    }
  }

  async removeStudent(batchId: number, studentId: string): Promise<void> {
    try {
      await apiCall(API_ENDPOINTS.batchRemoveStudent(batchId, studentId), { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error removing student from batch:', error);
      throw new Error(`Failed to remove student from batch: ${error.message}`);
    }
  }
}

export const batchesService = new BatchesService();
