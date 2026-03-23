import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Subject } from '../types';

export interface SubjectFilters {
  classId?: string;
  teacherId?: string;
  status?: string;
  search?: string;
}

export interface SubjectTeacher {
  teacherId: string;
  name: string;
  email?: string;
  isPrimary: boolean;
}

/**
 * Subjects Service - REST API Access
 * All operations call NestJS backend
 * Supports normalized schema with many-to-many teacher relationships
 */
class SubjectsService {
  /**
   * Get all subjects with optional filters
   */
  async getAll(filters: SubjectFilters = {}): Promise<Subject[]> {
    try {
      console.log('📖 Reading subjects from server...', filters);

      const queryString = buildQueryString({
        classId: filters.classId,
        teacherId: filters.teacherId,
        status: filters.status,
        search: filters.search,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.subjects}${queryString}`);

      // Map API response to UI format
      const subjects = data.map((row) => ({
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        subjectCode: row.subjectCode,
        classId: row.classId || null, // Now optional
        description: row.description,
        credits: row.credits,
        hoursPerWeek: row.hoursPerWeek,
        // Support both old and new teacher format
        teacherId: row.teacherId || row.primaryTeacher?.teacherId || null,
        teacherName: row.teacherName || row.primaryTeacher?.name || null,
        teachers: row.teachers || [],
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log(`✅ Found ${subjects.length} subjects`);
      return subjects;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
  }

  /**
   * Get a single subject by ID
   */
  async getById(subjectId: string): Promise<Subject> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.subjects}/${subjectId}`);
      
      return {
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        classId: data.classId || null,
        description: data.description,
        credits: data.credits,
        hoursPerWeek: data.hoursPerWeek,
        teacherId: data.teacherId || data.primaryTeacher?.teacherId || null,
        teacherName: data.teacherName || data.primaryTeacher?.name || null,
        teachers: data.teachers || [],
        status: data.status || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch subject: ${error.message}`);
    }
  }

  /**
   * Get subjects by class ID
   */
  async getByClass(classId: string): Promise<Subject[]> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.subjectsByClass(classId));
      
      return data.map((row) => ({
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        subjectCode: row.subjectCode,
        classId: row.classId || null,
        description: row.description,
        credits: row.credits,
        hoursPerWeek: row.hoursPerWeek,
        teacherId: row.teacherId || row.primaryTeacher?.teacherId || null,
        teacherName: row.teacherName || row.primaryTeacher?.name || null,
        teachers: row.teachers || [],
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('❌ Exception in getByClass:', error);
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
  }

  /**
   * Create a new subject
   */
  async create(subjectData: Omit<Subject, 'createdAt' | 'updatedAt'>): Promise<Subject> {
    try {
      console.log('📝 Creating subject:', subjectData);

      const payload: any = {
        subjectId: subjectData.subjectId,
        subjectName: subjectData.subjectName,
        subjectCode: subjectData.subjectCode,
        description: subjectData.description,
        credits: subjectData.credits,
        hoursPerWeek: subjectData.hoursPerWeek,
        status: subjectData.status || 'Active',
      };

      // Optional classId (normalized schema)
      if (subjectData.classId) {
        payload.classId = subjectData.classId;
      }

      // Handle teacher assignment
      if (subjectData.teacherId) {
        payload.teacherId = subjectData.teacherId;
      }

      // Handle multiple teachers
      if ((subjectData as any).teacherIds && (subjectData as any).teacherIds.length > 0) {
        payload.teacherIds = (subjectData as any).teacherIds;
      }

      const data = await apiCall<any>(API_ENDPOINTS.subjects, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newSubject = {
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        classId: data.classId || null,
        description: data.description,
        credits: data.credits,
        hoursPerWeek: data.hoursPerWeek,
        teacherId: data.teacherId || data.primaryTeacher?.teacherId || null,
        teacherName: data.teacherName || data.primaryTeacher?.name || null,
        teachers: data.teachers || [],
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Subject created:', newSubject);
      return newSubject;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create subject');
    }
  }

  /**
   * Update an existing subject
   */
  async update(subjectId: string, updates: Partial<Subject>): Promise<Subject> {
    try {
      console.log('📝 Updating subject:', subjectId, updates);

      const payload: any = {};
      if (updates.subjectName !== undefined) payload.subjectName = updates.subjectName;
      if (updates.subjectCode !== undefined) payload.subjectCode = updates.subjectCode;
      if (updates.classId !== undefined) payload.classId = updates.classId;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.credits !== undefined) payload.credits = updates.credits;
      if (updates.hoursPerWeek !== undefined) payload.hoursPerWeek = updates.hoursPerWeek;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.teacherId !== undefined) payload.teacherId = updates.teacherId;
      if ((updates as any).teacherIds !== undefined) payload.teacherIds = (updates as any).teacherIds;

      const data = await apiCall<any>(`${API_ENDPOINTS.subjects}/${subjectId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updated = {
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        classId: data.classId || null,
        description: data.description,
        credits: data.credits,
        hoursPerWeek: data.hoursPerWeek,
        teacherId: data.teacherId || data.primaryTeacher?.teacherId || null,
        teacherName: data.teacherName || data.primaryTeacher?.name || null,
        teachers: data.teachers || [],
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Subject updated:', updated);
      return updated;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update subject');
    }
  }

  /**
   * Delete a subject
   */
  async delete(subjectId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting subject:', subjectId);

      await apiCall(`${API_ENDPOINTS.subjects}/${subjectId}`, {
        method: 'DELETE',
      });

      console.log('✅ Subject deleted:', subjectId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete subject');
    }
  }

  /**
   * Bulk delete subjects
   */
  async bulkDelete(subjectIds: string[]): Promise<void> {
    try {
      console.log('🗑️ Bulk deleting subjects:', subjectIds);

      await apiCall(`${API_ENDPOINTS.subjects}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ subjectIds }),
      });

      console.log('✅ Bulk delete successful');
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete subjects');
    }
  }

  /**
   * Get subjects for dropdown
   */
  async getForDropdown(classId?: string): Promise<Array<{ subjectId: string; subjectName: string; subjectCode: string }>> {
    try {
      const queryString = classId ? `?classId=${classId}` : '';
      const data = await apiCall<any[]>(`${API_ENDPOINTS.subjectsDropdown}${queryString}`);
      
      return data.map((s) => ({
        subjectId: s.subjectId || '',
        subjectName: s.subjectName || '',
        subjectCode: s.subjectCode || '',
      }));
    } catch (error: any) {
      console.error('❌ Exception in getForDropdown:', error);
      return [];
    }
  }

  // ============================================
  // Subject-Teacher Association Methods
  // ============================================

  /**
   * Get all teachers assigned to a subject
   */
  async getSubjectTeachers(subjectId: string): Promise<SubjectTeacher[]> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.subjects}/${subjectId}/teachers`);
      return data.map((t) => ({
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        isPrimary: t.isPrimary,
      }));
    } catch (error: any) {
      console.error('❌ Exception in getSubjectTeachers:', error);
      return [];
    }
  }

  /**
   * Add a teacher to a subject
   */
  async addTeacherToSubject(subjectId: string, teacherId: string, isPrimary: boolean = false): Promise<SubjectTeacher[]> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.subjects}/${subjectId}/teachers`, {
        method: 'POST',
        body: JSON.stringify({ teacherId, isPrimary }),
      });
      return data.map((t) => ({
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        isPrimary: t.isPrimary,
      }));
    } catch (error: any) {
      console.error('❌ Exception in addTeacherToSubject:', error);
      throw new Error(error.message || 'Failed to add teacher to subject');
    }
  }

  /**
   * Remove a teacher from a subject
   */
  async removeTeacherFromSubject(subjectId: string, teacherId: string): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.subjects}/${subjectId}/teachers/${teacherId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Exception in removeTeacherFromSubject:', error);
      throw new Error(error.message || 'Failed to remove teacher from subject');
    }
  }

  /**
   * Set a teacher as the primary teacher for a subject
   */
  async setPrimaryTeacher(subjectId: string, teacherId: string): Promise<SubjectTeacher[]> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.subjects}/${subjectId}/teachers/${teacherId}/primary`, {
        method: 'PATCH',
      });
      return data.map((t) => ({
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        isPrimary: t.isPrimary,
      }));
    } catch (error: any) {
      console.error('❌ Exception in setPrimaryTeacher:', error);
      throw new Error(error.message || 'Failed to set primary teacher');
    }
  }
}

export const subjectsService = new SubjectsService();
