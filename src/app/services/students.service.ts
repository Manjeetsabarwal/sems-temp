import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Student } from '../types';

/**
 * Students Service - REST API Access
 * All operations call NestJS backend
 */
export class StudentsService {
  /**
   * Get all students with optional filters
   */
  async getAll(filters?: {
    classId?: string;
    sectionId?: string;
    search?: string;
    status?: string;
  }): Promise<Student[]> {
    try {
      const queryString = buildQueryString({
        classId: filters?.classId,
        sectionId: filters?.sectionId,
        search: filters?.search,
        status: filters?.status,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.students}${queryString}`);

      // Map API response to UI format
      return data.map((row) => ({
        studentId: row.studentId,
        name: row.name,
        classId: row.classId,
        sectionId: row.sectionId,
        section: row.sectionId,
        rollNo: row.rollNo,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        email: row.email,
        phone: row.phone,
        parentName: row.parentName,
        fatherName: row.fatherName,
        motherName: row.motherName,
        parentPhone: row.parentPhone,
        parentEmail: row.parentEmail,
        parentContact: row.parentPhone || '',
        address: row.address,
        admissionDate: row.admissionDate,
        examRegistrationFees: row.examRegistrationFees ? parseFloat(row.examRegistrationFees) : null,
        status: row.status as any || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching students:', error);
      throw new Error(`Failed to fetch students: ${error.message}`);
    }
  }

  /**
   * Get a single student by ID
   */
  async getById(studentId: string): Promise<Student> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.students}/${studentId}`);

      return {
        studentId: data.studentId,
        name: data.name,
        classId: data.classId,
        sectionId: data.sectionId,
        section: data.sectionId,
        rollNo: data.rollNo,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        parentName: data.parentName,
        fatherName: data.fatherName,
        motherName: data.motherName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        parentContact: data.parentPhone || '',
        address: data.address,
        admissionDate: data.admissionDate,
        examRegistrationFees: data.examRegistrationFees ? parseFloat(data.examRegistrationFees) : null,
        status: data.status as any || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching student:', error);
      throw new Error(`Failed to fetch student: ${error.message}`);
    }
  }

  /**
   * Create a new student
   */
  async create(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<Student> {
    try {
      // Convert empty strings to null/undefined for optional fields
      const classId = student.classId && student.classId.trim() !== '' ? student.classId : undefined;
      const sectionId = student.sectionId && student.sectionId.trim() !== '' 
        ? student.sectionId 
        : (student.section && student.section.trim() !== '' ? student.section : undefined);
      const rollNo = student.rollNo !== undefined && student.rollNo !== null ? student.rollNo : undefined;

      const payload: any = this.normalizeData({
        studentId: student.studentId,
        name: student.name,
        classId: classId,
        sectionId: sectionId,
        rollNo: rollNo,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        email: student.email,
        phone: student.phone,
        parentName: student.parentName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        parentPhone: student.parentContact || student.parentPhone,
        parentEmail: student.parentEmail,
        address: student.address,
        admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
        examRegistrationFees: student.examRegistrationFees,
        status: student.status || 'Active',
      });

      console.log('📤 Creating student with payload:', JSON.stringify(payload, null, 2));

      const data = await apiCall<any>(API_ENDPOINTS.students, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        studentId: data.studentId,
        name: data.name,
        classId: data.classId,
        sectionId: data.sectionId,
        section: data.sectionId,
        rollNo: data.rollNo,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        parentName: data.parentName,
        fatherName: data.fatherName,
        motherName: data.motherName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        parentContact: data.parentPhone || '',
        address: data.address,
        admissionDate: data.admissionDate,
        examRegistrationFees: data.examRegistrationFees ? parseFloat(data.examRegistrationFees) : null,
        status: data.status as any || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error creating student:', error);
      throw new Error(error.message || 'Failed to create student');
    }
  }

  /**
   * Update an existing student
   */
  async update(studentId: string, updates: Partial<Student>): Promise<Student> {
    try {
      const rawPayload: any = {};
      if (updates.name !== undefined) rawPayload.name = updates.name;
      if (updates.classId !== undefined) rawPayload.classId = updates.classId;
      if (updates.sectionId !== undefined) rawPayload.sectionId = updates.sectionId;
      if (updates.section !== undefined) rawPayload.sectionId = updates.section;
      if (updates.rollNo !== undefined) rawPayload.rollNo = updates.rollNo;
      if (updates.dateOfBirth !== undefined) rawPayload.dateOfBirth = updates.dateOfBirth;
      if (updates.gender !== undefined) rawPayload.gender = updates.gender;
      if (updates.email !== undefined) rawPayload.email = updates.email;
      if (updates.phone !== undefined) rawPayload.phone = updates.phone;
      if (updates.parentName !== undefined) rawPayload.parentName = updates.parentName;
      if (updates.fatherName !== undefined) rawPayload.fatherName = updates.fatherName;
      if (updates.motherName !== undefined) rawPayload.motherName = updates.motherName;
      if (updates.parentContact !== undefined || updates.parentPhone !== undefined) {
        rawPayload.parentPhone = updates.parentContact || updates.parentPhone;
      }
      if (updates.parentEmail !== undefined) rawPayload.parentEmail = updates.parentEmail;
      if (updates.address !== undefined) rawPayload.address = updates.address;
      if (updates.admissionDate !== undefined) rawPayload.admissionDate = updates.admissionDate;
      if (updates.status !== undefined) rawPayload.status = updates.status;

      const payload = this.normalizeData(rawPayload);

      const data = await apiCall<any>(`${API_ENDPOINTS.students}/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      return {
        studentId: data.studentId,
        name: data.name,
        classId: data.classId,
        sectionId: data.sectionId,
        section: data.sectionId,
        rollNo: data.rollNo,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        parentName: data.parentName,
        fatherName: data.fatherName,
        motherName: data.motherName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        parentContact: data.parentPhone || '',
        address: data.address,
        admissionDate: data.admissionDate,
        status: data.status as any,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error updating student:', error);
      throw new Error(error.message || 'Failed to update student');
    }
  }

  /**
   * Delete a student
   */
  async delete(studentId: string): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.students}/${studentId}`, {
        method: 'DELETE',
      });

      return { message: 'Student deleted successfully' };
    } catch (error: any) {
      console.error('❌ Error deleting student:', error);
      throw new Error(error.message || 'Failed to delete student');
    }
  }

  /**
   * Bulk delete students
   */
  async bulkDelete(studentIds: string[]): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.students}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ studentIds }),
      });

      return { message: `Successfully deleted ${studentIds.length} students` };
    } catch (error: any) {
      console.error('❌ Error bulk deleting students:', error);
      throw new Error(error.message || 'Failed to delete students');
    }
  }

  /**
   * Rename a student ID (critical operation - updates all related records)
   */
  async rename(oldId: string, newId: string): Promise<Student> {
    try {
      console.log(`🔄 Renaming student ID: ${oldId} -> ${newId}`);

      const data = await apiCall<any>(`${API_ENDPOINTS.students}/${oldId}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ newId }),
      });

      return {
        studentId: data.studentId,
        name: data.name,
        classId: data.classId,
        sectionId: data.sectionId,
        section: data.sectionId,
        rollNo: data.rollNo,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        parentName: data.parentName,
        fatherName: data.fatherName,
        motherName: data.motherName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        parentContact: data.parentPhone || '',
        address: data.address,
        admissionDate: data.admissionDate,
        status: data.status as any,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in rename:', error);
      throw new Error(error.message || 'Failed to rename student ID');
    }
  }

  /**
   * Normalize data to convert empty strings to null
   */
  private normalizeData(data: any): any {
    const normalized = { ...data };
    for (const key in normalized) {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = null;
      }
    }
    return normalized;
  }
}

export const studentsService = new StudentsService();
