import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { Mark } from '../types';

export interface MarkFilters {
  studentId?: string;
  examId?: string;
  subjectId?: string;
  classId?: string;
  status?: string;
  search?: string;
}

// Grade calculation based on percentage
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

/**
 * Marks Service - REST API Access
 * All operations call NestJS backend
 */
class MarksService {
  /**
   * Get all marks with optional filters
   */
  async getAll(filters?: MarkFilters): Promise<Mark[]> {
    try {
      const queryString = buildQueryString({
        studentId: filters?.studentId,
        examId: filters?.examId,
        subjectId: filters?.subjectId,
        status: filters?.status,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.marks}${queryString}`);

      // Debug: Log first few marks with V2 fields
      if (data.length > 0) {
        console.log('📥 MarksService.getAll - Sample marks from backend:', 
          data.slice(0, 3).map(r => ({
            markId: r.markId,
            internalMarks: r.internalMarks,
            externalMarks: r.externalMarks,
            marksObtained: r.marksObtained,
          }))
        );
      }

      return data.map((row) => ({
        markId: row.markId,
        studentId: row.studentId,
        studentName: row.student?.name,
        examId: row.examId,
        examName: row.exam?.examName,
        subjectId: row.subjectId,
        subjectName: row.subject?.subjectName,
        subjectCode: row.subject?.subjectCode,
        classId: row.classId,
        marksObtained: parseFloat(row.marksObtained),
        totalMarks: row.totalMarks,
        percentage: parseFloat(row.percentage),
        grade: row.grade,
        remarks: row.remarks,
        isAbsent: row.isAbsent,
        status: row.status,
        enteredBy: row.enteredBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        // V2: Internal/External Marks Breakdown
        internalMarks: row.internalMarks !== undefined ? parseFloat(row.internalMarks) : undefined,
        externalMarks: row.externalMarks !== undefined ? parseFloat(row.externalMarks) : undefined,
        unitTestMarks: row.unitTestMarks !== undefined ? parseFloat(row.unitTestMarks) : undefined,
        assignmentMarks: row.assignmentMarks !== undefined ? parseFloat(row.assignmentMarks) : undefined,
        attendanceMarks: row.attendanceMarks !== undefined ? parseFloat(row.attendanceMarks) : undefined,
        marksType: row.marksType,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching marks:', error);
      throw new Error(`Failed to fetch marks: ${error.message}`);
    }
  }

  /**
   * Get a single mark by ID
   */
  async getById(markId: string): Promise<Mark> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.marks}/${markId}`);

      return {
        markId: data.markId,
        studentId: data.studentId,
        studentName: data.student?.name,
        examId: data.examId,
        examName: data.exam?.examName,
        subjectId: data.subjectId,
        subjectName: data.subject?.subjectName,
        subjectCode: data.subject?.subjectCode,
        classId: data.classId,
        marksObtained: parseFloat(data.marksObtained),
        totalMarks: data.totalMarks,
        percentage: parseFloat(data.percentage),
        grade: data.grade,
        remarks: data.remarks,
        isAbsent: data.isAbsent,
        status: data.status,
        enteredBy: data.enteredBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // V2: Internal/External Marks Breakdown
        internalMarks: data.internalMarks !== undefined ? parseFloat(data.internalMarks) : undefined,
        externalMarks: data.externalMarks !== undefined ? parseFloat(data.externalMarks) : undefined,
        unitTestMarks: data.unitTestMarks !== undefined ? parseFloat(data.unitTestMarks) : undefined,
        assignmentMarks: data.assignmentMarks !== undefined ? parseFloat(data.assignmentMarks) : undefined,
        attendanceMarks: data.attendanceMarks !== undefined ? parseFloat(data.attendanceMarks) : undefined,
        marksType: data.marksType,
      };
    } catch (error: any) {
      console.error('❌ Error fetching mark:', error);
      throw new Error(`Failed to fetch mark: ${error.message}`);
    }
  }

  /**
   * Create a new mark
   */
  async create(mark: Omit<Mark, 'createdAt' | 'updatedAt' | 'percentage'>): Promise<Mark> {
    try {
      const percentage = (mark.marksObtained / mark.totalMarks) * 100;
      const grade = mark.grade || calculateGrade(percentage);

      const payload: any = {
        markId: mark.markId,
        studentId: mark.studentId,
        examId: mark.examId,
        subjectId: mark.subjectId,
        marksObtained: mark.marksObtained,
        totalMarks: mark.totalMarks,
        grade: grade,
        remarks: mark.remarks,
        isAbsent: mark.isAbsent,
        status: mark.status,
        enteredBy: mark.enteredBy,
      };

      // Include classId if provided (backend might require it)
      if ((mark as any).classId !== undefined) {
        payload.classId = (mark as any).classId;
      }

      // V2: Include internal/external marks breakdown if provided
      if (mark.internalMarks !== undefined) payload.internalMarks = mark.internalMarks;
      if (mark.externalMarks !== undefined) payload.externalMarks = mark.externalMarks;
      if (mark.unitTestMarks !== undefined) payload.unitTestMarks = mark.unitTestMarks;
      if (mark.assignmentMarks !== undefined) payload.assignmentMarks = mark.assignmentMarks;
      if (mark.attendanceMarks !== undefined) payload.attendanceMarks = mark.attendanceMarks;
      if (mark.marksType !== undefined) payload.marksType = mark.marksType;

      console.log('📤 MarksService.create - Sending payload:', {
        internalMarks: payload.internalMarks,
        externalMarks: payload.externalMarks,
        marksObtained: payload.marksObtained,
      });

      const data = await apiCall<any>(API_ENDPOINTS.marks, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('📥 MarksService.create - Backend response:', {
        internalMarks: data.internalMarks,
        externalMarks: data.externalMarks,
        marksObtained: data.marksObtained,
      });

      return {
        markId: data.markId,
        studentId: data.studentId,
        studentName: data.student?.name,
        examId: data.examId,
        examName: data.exam?.examName,
        subjectId: data.subjectId,
        subjectName: data.subject?.subjectName,
        subjectCode: data.subject?.subjectCode,
        classId: data.classId,
        marksObtained: parseFloat(data.marksObtained),
        totalMarks: data.totalMarks,
        percentage: parseFloat(data.percentage),
        grade: data.grade,
        remarks: data.remarks,
        isAbsent: data.isAbsent,
        status: data.status,
        enteredBy: data.enteredBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // V2: Internal/External Marks Breakdown
        internalMarks: data.internalMarks !== undefined ? parseFloat(data.internalMarks) : undefined,
        externalMarks: data.externalMarks !== undefined ? parseFloat(data.externalMarks) : undefined,
        unitTestMarks: data.unitTestMarks !== undefined ? parseFloat(data.unitTestMarks) : undefined,
        assignmentMarks: data.assignmentMarks !== undefined ? parseFloat(data.assignmentMarks) : undefined,
        attendanceMarks: data.attendanceMarks !== undefined ? parseFloat(data.attendanceMarks) : undefined,
        marksType: data.marksType,
      };
    } catch (error: any) {
      console.error('❌ Error creating mark:', error);
      throw new Error(error.message || 'Failed to create mark');
    }
  }

  /**
   * Update an existing mark
   */
  async update(markId: string, updates: Partial<Mark>): Promise<Mark> {
    try {
      const { markId: _, ...updateData } = updates as any;

      // Recalculate grade if marks changed
      if (updateData.marksObtained !== undefined || updateData.totalMarks !== undefined) {
        const currentMark = await this.getById(markId);
        const newMarks = updateData.marksObtained ?? currentMark.marksObtained;
        const newTotal = updateData.totalMarks ?? currentMark.totalMarks;
        const percentage = (newMarks / newTotal) * 100;
        updateData.grade = calculateGrade(percentage);
      }

      const data = await apiCall<any>(`${API_ENDPOINTS.marks}/${markId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      return {
        markId: data.markId,
        studentId: data.studentId,
        studentName: data.student?.name,
        examId: data.examId,
        examName: data.exam?.examName,
        subjectId: data.subjectId,
        subjectName: data.subject?.subjectName,
        subjectCode: data.subject?.subjectCode,
        classId: data.classId,
        marksObtained: parseFloat(data.marksObtained),
        totalMarks: data.totalMarks,
        percentage: parseFloat(data.percentage),
        grade: data.grade,
        remarks: data.remarks,
        isAbsent: data.isAbsent,
        status: data.status,
        enteredBy: data.enteredBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // V2: Internal/External Marks Breakdown
        internalMarks: data.internalMarks !== undefined ? parseFloat(data.internalMarks) : undefined,
        externalMarks: data.externalMarks !== undefined ? parseFloat(data.externalMarks) : undefined,
        unitTestMarks: data.unitTestMarks !== undefined ? parseFloat(data.unitTestMarks) : undefined,
        assignmentMarks: data.assignmentMarks !== undefined ? parseFloat(data.assignmentMarks) : undefined,
        attendanceMarks: data.attendanceMarks !== undefined ? parseFloat(data.attendanceMarks) : undefined,
        marksType: data.marksType,
      };
    } catch (error: any) {
      console.error('❌ Error updating mark:', error);
      throw new Error(error.message || 'Failed to update mark');
    }
  }

  /**
   * Delete a mark
   */
  async delete(markId: string): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.marks}/${markId}`, {
        method: 'DELETE',
      });

      return { message: 'Mark deleted successfully' };
    } catch (error: any) {
      console.error('❌ Error deleting mark:', error);
      throw new Error(error.message || 'Failed to delete mark');
    }
  }

  /**
   * Bulk delete marks
   */
  async bulkDelete(markIds: string[]): Promise<{ message: string }> {
    try {
      await apiCall(`${API_ENDPOINTS.marks}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ markIds }),
      });

      return { message: `Successfully deleted ${markIds.length} marks` };
    } catch (error: any) {
      console.error('❌ Error bulk deleting marks:', error);
      throw new Error(error.message || 'Failed to delete marks');
    }
  }

  /**
   * Get marks by student and exam
   */
  async getByStudentAndExam(studentId: string, examId: string): Promise<Mark[]> {
    return this.getAll({ studentId, examId });
  }

  /**
   * Get all marks for a specific exam
   */
  async getByExam(examId: string): Promise<Mark[]> {
    return this.getAll({ examId });
  }

  /**
   * Get all marks for a specific student
   */
  async getByStudent(studentId: string): Promise<Mark[]> {
    return this.getAll({ studentId });
  }

  /**
   * Check if a duplicate mark entry exists (same student, exam, and subject)
   */
  async checkDuplicate(studentId: string, examId: string, subjectId: string): Promise<boolean> {
    try {
      const marks = await this.getAll({ studentId, examId, subjectId });
      return marks.length > 0;
    } catch (error: any) {
      console.error('❌ Error checking duplicate:', error);
      // If there's an error, assume no duplicate to allow the operation to proceed
      // The backend will catch actual duplicates via unique constraints
      return false;
    }
  }
}

export const marksService = new MarksService();
