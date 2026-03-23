import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Course } from '../types';

export class CoursesService {
  async getAll(filters?: {
    search?: string;
    class?: string;
    stream?: string;
  }): Promise<Course[]> {
    try {
      const queryString = buildQueryString({
        search: filters?.search,
        class: filters?.class,
        stream: filters?.stream,
      });
      const data = await apiCall<any[]>(`${API_ENDPOINTS.courses}${queryString}`);
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        durationDays: row.durationDays,
        class: row.class,
        sem: row.sem,
        stream: row.stream,
        year: row.year,
        semester: row.semester,
        education: row.education,
        isDeleted: row.isDeleted,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        courseSubjects: row.courseSubjects || [],
        batches: row.batches || [],
      }));
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  async getById(id: number): Promise<Course> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.courses}/${id}`);
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        durationDays: data.durationDays,
        class: data.class,
        sem: data.sem,
        stream: data.stream,
        year: data.year,
        semester: data.semester,
        education: data.education,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        courseSubjects: data.courseSubjects || [],
        batches: data.batches || [],
      };
    } catch (error: any) {
      console.error('Error fetching course:', error);
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  }

  async create(course: Partial<Course> & { subjectIds?: string[] }): Promise<Course> {
    try {
      const data = await apiCall<any>(API_ENDPOINTS.courses, {
        method: 'POST',
        body: JSON.stringify(course),
      });
      return data;
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  async update(id: number, course: Partial<Course> & { subjectIds?: string[] }): Promise<Course> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.courses}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(course),
      });
      return data;
    } catch (error: any) {
      console.error('Error updating course:', error);
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.courses}/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  async bulkDelete(ids: number[]): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.courses}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    } catch (error: any) {
      console.error('Error bulk deleting courses:', error);
      throw new Error(`Failed to bulk delete courses: ${error.message}`);
    }
  }

  async getDropdown(): Promise<Array<{ id: number; title: string }>> {
    try {
      return await apiCall<Array<{ id: number; title: string }>>(API_ENDPOINTS.coursesDropdown);
    } catch (error: any) {
      console.error('Error fetching courses dropdown:', error);
      throw new Error(`Failed to fetch courses dropdown: ${error.message}`);
    }
  }
}

export const coursesService = new CoursesService();
