import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Teacher } from '../types';

export interface TeacherFilters {
  department?: string;
  status?: string;
  search?: string;
}

// Extended teacher type for UI
export interface TeacherExtended extends Teacher {
  department?: string;
}

/**
 * Teachers Service - REST API Access
 * All operations call NestJS backend
 */
class TeachersService {
  /**
   * Get all teachers with optional filters
   */
  async getAll(filters: TeacherFilters = {}): Promise<TeacherExtended[]> {
    try {
      console.log('📖 Reading teachers from server...', filters);

      const queryString = buildQueryString({
        status: filters.status,
        search: filters.search,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.teachers}${queryString}`);

      // Map API response to UI format
      const teachers = data.map((row) => ({
        teacherId: row.teacherId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        subjects: row.subjects || [],
        subjectDetails: row.subjectDetails || [], // Add this line
        classes: row.classes || [],
        qualification: row.qualification,
        experience: row.experience,
        joiningDate: row.joiningDate,
        address: row.address || '',
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log(`✅ Found ${teachers.length} teachers`);
      return teachers;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch teachers: ${error.message}`);
    }
  }

  /**
   * Get a single teacher by ID
   */
  async getById(teacherId: string): Promise<TeacherExtended> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.teachers}/${teacherId}`);
      
      return {
        teacherId: data.teacherId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subjects: data.subjects || [],
        subjectDetails: data.subjectDetails || [], // Add this line to include subject details
        classes: data.classes || [],
        qualification: data.qualification,
        experience: data.experience,
        joiningDate: data.joiningDate,
        address: data.address || '',
        status: data.status || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch teacher: ${error.message}`);
    }
  }

  /**
   * Create a new teacher
   */
  async create(teacherData: Omit<TeacherExtended, 'createdAt' | 'updatedAt'>): Promise<TeacherExtended> {
    try {
      console.log('📝 Creating teacher:', teacherData);

      const payload = {
        teacherId: teacherData.teacherId,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        subjects: teacherData.subjects || [],
        classes: teacherData.classes || [],
        qualification: teacherData.qualification,
        experience: teacherData.experience,
        joiningDate: teacherData.joiningDate,
        address: teacherData.address || '',
        status: teacherData.status || 'Active',
      };

      const data = await apiCall<any>(API_ENDPOINTS.teachers, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const teacher = {
        teacherId: data.teacherId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subjects: data.subjects || [],
        classes: data.classes || [],
        qualification: data.qualification,
        experience: data.experience,
        joiningDate: data.joiningDate,
        address: data.address || '',
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Teacher created:', teacher);
      return teacher;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create teacher');
    }
  }

  /**
   * Update an existing teacher
   */
  async update(teacherId: string, updates: Partial<TeacherExtended>): Promise<TeacherExtended> {
    try {
      console.log('📝 Updating teacher:', teacherId, updates);

      const data = await apiCall<any>(`${API_ENDPOINTS.teachers}/${teacherId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      const updated = {
        teacherId: data.teacherId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subjects: data.subjects || [],
        classes: data.classes || [],
        qualification: data.qualification,
        experience: data.experience,
        joiningDate: data.joiningDate,
        address: data.address || '',
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Teacher updated:', updated);
      return updated;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update teacher');
    }
  }

  /**
   * Delete a teacher
   */
  async delete(teacherId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting teacher:', teacherId);

      await apiCall(`${API_ENDPOINTS.teachers}/${teacherId}`, {
        method: 'DELETE',
      });

      console.log('✅ Teacher deleted:', teacherId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete teacher');
    }
  }

  /**
   * Bulk delete teachers
   */
  async bulkDelete(teacherIds: string[]): Promise<void> {
    try {
      console.log('🗑️ Bulk deleting teachers:', teacherIds);

      await apiCall(`${API_ENDPOINTS.teachers}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ teacherIds }),
      });

      console.log('✅ Bulk delete successful');
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete teachers');
    }
  }

  /**
   * Get teachers for dropdown (lightweight)
   */
  async getForDropdown(): Promise<Array<{ teacherId: string; name: string }>> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.teachersDropdown);
      return data.map((t) => ({
        teacherId: t.teacherId || '',
        name: t.name || '',
      }));
    } catch (error: any) {
      console.error('❌ Exception in getForDropdown:', error);
      return [];
    }
  }

  /**
   * Rename a teacher ID (critical operation - updates all related records)
   */
  async rename(oldId: string, newId: string): Promise<TeacherExtended> {
    try {
      console.log(`🔄 Renaming teacher ID: ${oldId} -> ${newId}`);

      const data = await apiCall<any>(`${API_ENDPOINTS.teachers}/${oldId}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ newId }),
      });

      const teacher = {
        teacherId: data.teacherId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subjects: data.subjects || [],
        classes: data.classes || [],
        qualification: data.qualification,
        experience: data.experience,
        joiningDate: data.joiningDate,
        address: data.address || '',
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Teacher ID renamed successfully:', teacher);
      return teacher;
    } catch (error: any) {
      console.error('❌ Exception in rename:', error);
      throw new Error(error.message || 'Failed to rename teacher ID');
    }
  }
}

export const teachersService = new TeachersService();
