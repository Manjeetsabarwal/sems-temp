import { apiCall, API_ENDPOINTS } from '../config/api.config';
import { studentsService } from './students.service';
import { examsService } from './exams.service';
import { subjectsService } from './subjects.service';

/**
 * Validation Service
 * Validates that foreign key references exist in the database
 * Uses NestJS backend API instead of Supabase
 */
export class ValidationService {
  /**
   * Check if a student exists in the database
   */
  async studentExists(studentId: string): Promise<boolean> {
    try {
      const student = await studentsService.getById(studentId);
      return !!student;
    } catch (error: any) {
      // If 404 or not found, return false
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return false;
      }
      console.error('Exception checking student:', error);
      return false;
    }
  }

  /**
   * Check if an exam exists in the database
   */
  async examExists(examId: string): Promise<boolean> {
    try {
      const exam = await examsService.getById(examId);
      return !!exam;
    } catch (error: any) {
      // If 404 or not found, return false
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return false;
      }
      console.error('Exception checking exam:', error);
      return false;
    }
  }

  /**
   * Check if a subject exists in the database
   */
  async subjectExists(subjectId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if subject "${subjectId}" exists...`);
      const subject = await subjectsService.getById(subjectId);
      console.log(`✅ Subject "${subjectId}" found:`, subject);
      return !!subject && !!subject.subjectId;
    } catch (error: any) {
      // If 404 or not found, return false
      if (error.message?.includes('not found') || error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
        console.log(`❌ Subject "${subjectId}" not found in database`);
        return false;
      }
      console.error(`❌ Exception checking subject "${subjectId}":`, error);
      return false;
    }
  }

  /**
   * Validate all foreign key references before creating/updating a mark
   */
  async validateMarkReferences(
    studentId: string,
    examId: string,
    subjectId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    console.log('🔍 Validating references in database...');
    console.log('  Student ID:', studentId);
    console.log('  Exam ID:', examId);
    console.log('  Subject ID:', subjectId);

    // Check all three in parallel
    const [studentValid, examValid, subjectValid] = await Promise.all([
      this.studentExists(studentId),
      this.examExists(examId),
      this.subjectExists(subjectId),
    ]);

    if (!studentValid) {
      errors.push(`Student "${studentId}" does not exist in the database`);
      console.error('❌ Student not found in database:', studentId);
    } else {
      console.log('✅ Student exists in database');
    }

    if (!examValid) {
      errors.push(`Exam "${examId}" does not exist in the database`);
      console.error('❌ Exam not found in database:', examId);
    } else {
      console.log('✅ Exam exists in database');
    }

    if (!subjectValid) {
      errors.push(`Subject "${subjectId}" does not exist in the database`);
      console.error('❌ Subject not found in database:', subjectId);
    } else {
      console.log('✅ Subject exists in database');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all students from the database (for debugging)
   */
  async getAllStudentIds(): Promise<string[]> {
    try {
      const students = await studentsService.getAll();
      return students.map(s => s.studentId);
    } catch (error) {
      console.error('Exception fetching student IDs:', error);
      return [];
    }
  }

  /**
   * Get all subject IDs from the database (for debugging)
   */
  async getAllSubjectIds(): Promise<string[]> {
    try {
      const subjects = await subjectsService.getAll();
      return subjects.map(s => s.subjectId);
    } catch (error) {
      console.error('Exception fetching subject IDs:', error);
      return [];
    }
  }

  /**
   * Get all exam IDs from the database (for debugging)
   */
  async getAllExamIds(): Promise<string[]> {
    try {
      const exams = await examsService.getAll({});
      return exams.map(e => e.examId);
    } catch (error) {
      console.error('Exception fetching exam IDs:', error);
      return [];
    }
  }
}

export const validationService = new ValidationService();
