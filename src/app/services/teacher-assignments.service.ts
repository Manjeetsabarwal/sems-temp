import { apiCall, buildQueryString } from '../config/api.config';

const API_BASE = 'http://localhost:3000/api/teacher-assignments';

export interface TeacherAssignment {
  id: number;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  isDefault: boolean;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAssignmentFilters {
  teacherId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  academicYear?: string;
  status?: string;
}

export interface CreateTeacherAssignmentDto {
  teacherId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  isDefault?: boolean;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Teacher Assignments Service - REST API Access
 * Manages teacher-class-section-subject assignments
 */
class TeacherAssignmentsService {
  /**
   * Get all teacher assignments with optional filters
   */
  async getAll(filters: TeacherAssignmentFilters = {}): Promise<TeacherAssignment[]> {
    try {
      console.log('📖 Reading teacher assignments from server...', filters);

      const queryString = buildQueryString(filters);
      const data = await apiCall<TeacherAssignment[]>(`${API_BASE}${queryString}`);

      console.log(`✅ Found ${data.length} teacher assignments`);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch teacher assignments: ${error.message}`);
    }
  }

  /**
   * Get a single assignment by ID
   */
  async getById(id: number): Promise<TeacherAssignment> {
    try {
      return await apiCall<TeacherAssignment>(`${API_BASE}/${id}`);
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch teacher assignment: ${error.message}`);
    }
  }

  /**
   * Get teacher for a specific class-section-subject combination
   */
  async getTeacherForClassSectionSubject(
    classId: string,
    sectionId: string,
    subjectId: string,
    academicYear?: string
  ): Promise<{ teacherId: string; teacherName: string; isDefault: boolean } | null> {
    try {
      const queryString = academicYear ? `?academicYear=${academicYear}` : '';
      return await apiCall<any>(`${API_BASE}/teacher/${classId}/${sectionId}/${subjectId}${queryString}`);
    } catch (error: any) {
      console.error('❌ Exception in getTeacherForClassSectionSubject:', error);
      return null;
    }
  }

  /**
   * Get all subjects for a class-section combination
   */
  async getSubjectsForClassSection(
    classId: string,
    sectionId: string,
    academicYear?: string
  ): Promise<Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    teachers: Array<{ teacherId: string; teacherName: string; isDefault: boolean }>;
  }>> {
    try {
      const queryString = academicYear ? `?academicYear=${academicYear}` : '';
      return await apiCall<any[]>(`${API_BASE}/subjects/${classId}/${sectionId}${queryString}`);
    } catch (error: any) {
      console.error('❌ Exception in getSubjectsForClassSection:', error);
      return [];
    }
  }

  /**
   * Get all assignments for a teacher
   */
  async getAssignmentsForTeacher(teacherId: string, academicYear?: string): Promise<TeacherAssignment[]> {
    try {
      const queryString = academicYear ? `?academicYear=${academicYear}` : '';
      return await apiCall<TeacherAssignment[]>(`${API_BASE}/by-teacher/${teacherId}${queryString}`);
    } catch (error: any) {
      console.error('❌ Exception in getAssignmentsForTeacher:', error);
      return [];
    }
  }

  /**
   * Get all teachers for a subject
   */
  async getTeachersForSubject(subjectId: string): Promise<Array<{
    teacherId: string;
    teacherName: string;
    classSections: Array<{ classId: string; className: string; sectionId: string; sectionName: string }>;
  }>> {
    try {
      return await apiCall<any[]>(`${API_BASE}/by-subject/${subjectId}`);
    } catch (error: any) {
      console.error('❌ Exception in getTeachersForSubject:', error);
      return [];
    }
  }

  /**
   * Create a new teacher assignment
   */
  async create(assignmentData: CreateTeacherAssignmentDto): Promise<TeacherAssignment> {
    try {
      console.log('📝 Creating teacher assignment:', assignmentData);

      const data = await apiCall<TeacherAssignment>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      });

      console.log('✅ Teacher assignment created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create teacher assignment');
    }
  }

  /**
   * Update an existing teacher assignment
   */
  async update(id: number, updates: Partial<CreateTeacherAssignmentDto>): Promise<TeacherAssignment> {
    try {
      console.log('📝 Updating teacher assignment:', id, updates);

      const data = await apiCall<TeacherAssignment>(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Teacher assignment updated:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update teacher assignment');
    }
  }

  /**
   * Delete a teacher assignment
   */
  async delete(id: number): Promise<void> {
    try {
      console.log('🗑️ Deleting teacher assignment:', id);

      await apiCall(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      console.log('✅ Teacher assignment deleted:', id);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete teacher assignment');
    }
  }

  /**
   * Bulk delete teacher assignments
   */
  async bulkDelete(ids: number[]): Promise<void> {
    try {
      console.log('🗑️ Bulk deleting teacher assignments:', ids);

      await apiCall(`${API_BASE}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });

      console.log('✅ Bulk delete successful');
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete teacher assignments');
    }
  }
}

export const teacherAssignmentsService = new TeacherAssignmentsService();
