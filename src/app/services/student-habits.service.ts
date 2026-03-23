/**
 * Student Habits Service - REST API Access
 * For Template 3 Personal/Social/Work Habits
 */
import { apiCall, buildQueryString } from '../config/api.config';
import { API_ENDPOINTS } from '../config/api.config';

export interface StudentHabit {
  habitId: string;
  studentId: string;
  academicYear: string;
  habitName: 'Courteous' | 'Art/Craft' | 'Responsibility' | 'Systematic' | 'Sports' | 'Elocution' | 'Gen.Knowledge' | 'Cultural Activities' | 'Cleanliness' | 'Hindi Oral' | 'English Oral';
  term1Grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  term2Grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentHabitDto {
  habitId: string;
  studentId: string;
  academicYear: string;
  habitName: 'Courteous' | 'Art/Craft' | 'Responsibility' | 'Systematic' | 'Sports' | 'Elocution' | 'Gen.Knowledge' | 'Cultural Activities' | 'Cleanliness' | 'Hindi Oral' | 'English Oral';
  term1Grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  term2Grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  remarks?: string;
}

class StudentHabitsService {
  /**
   * Get all habits with optional filters
   */
  async getAll(filters?: {
    studentId?: string;
    academicYear?: string;
    habitName?: string;
  }): Promise<StudentHabit[]> {
    try {
      const queryString = buildQueryString({
        studentId: filters?.studentId,
        academicYear: filters?.academicYear,
        habitName: filters?.habitName,
      });

      const data = await apiCall<StudentHabit[]>(`${API_ENDPOINTS.studentHabits}${queryString}`);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching student habits:', error);
      throw new Error(`Failed to fetch student habits: ${error.message}`);
    }
  }

  /**
   * Get habits for a specific student and academic year
   */
  async getByStudentAndYear(studentId: string, academicYear: string): Promise<StudentHabit[]> {
    try {
      const data = await apiCall<StudentHabit[]>(
        `${API_ENDPOINTS.studentHabits}/student/${studentId}/year/${academicYear}`
      );
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching student habits:', error);
      throw new Error(`Failed to fetch student habits: ${error.message}`);
    }
  }

  /**
   * Get a single habit by ID
   */
  async getById(habitId: string): Promise<StudentHabit> {
    try {
      const data = await apiCall<StudentHabit>(`${API_ENDPOINTS.studentHabits}/${habitId}`);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching student habit:', error);
      throw new Error(`Failed to fetch student habit: ${error.message}`);
    }
  }

  /**
   * Create a new habit
   */
  async create(createDto: CreateStudentHabitDto): Promise<StudentHabit> {
    try {
      const data = await apiCall<StudentHabit>(API_ENDPOINTS.studentHabits, {
        method: 'POST',
        body: JSON.stringify(createDto),
      });
      return data;
    } catch (error: any) {
      console.error('❌ Error creating student habit:', error);
      throw new Error(`Failed to create student habit: ${error.message}`);
    }
  }

  /**
   * Bulk create habits
   */
  async bulkCreate(createDtos: CreateStudentHabitDto[]): Promise<StudentHabit[]> {
    try {
      const data = await apiCall<StudentHabit[]>(`${API_ENDPOINTS.studentHabits}/bulk`, {
        method: 'POST',
        body: JSON.stringify(createDtos),
      });
      return data;
    } catch (error: any) {
      console.error('❌ Error bulk creating student habits:', error);
      throw new Error(`Failed to bulk create student habits: ${error.message}`);
    }
  }

  /**
   * Update a habit
   */
  async update(habitId: string, updateDto: Partial<CreateStudentHabitDto>): Promise<StudentHabit> {
    try {
      const data = await apiCall<StudentHabit>(`${API_ENDPOINTS.studentHabits}/${habitId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateDto),
      });
      return data;
    } catch (error: any) {
      console.error('❌ Error updating student habit:', error);
      throw new Error(`Failed to update student habit: ${error.message}`);
    }
  }

  /**
   * Delete a habit
   */
  async delete(habitId: string): Promise<void> {
    try {
      await apiCall<void>(`${API_ENDPOINTS.studentHabits}/${habitId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Error deleting student habit:', error);
      throw new Error(`Failed to delete student habit: ${error.message}`);
    }
  }

  /**
   * Bulk delete habits
   */
  async bulkDelete(habitIds: string[]): Promise<void> {
    try {
      await apiCall<void>(`${API_ENDPOINTS.studentHabits}/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ habitIds }),
      });
    } catch (error: any) {
      console.error('❌ Error bulk deleting student habits:', error);
      throw new Error(`Failed to bulk delete student habits: ${error.message}`);
    }
  }
}

export const studentHabitsService = new StudentHabitsService();
