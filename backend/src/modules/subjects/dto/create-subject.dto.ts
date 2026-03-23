
export class CreateSubjectDto {
  subjectId: string;

  subjectName: string;

  subjectCode: string;

  // Optional - kept for backward compatibility
  classId?: string;

  // Primary teacher (optional - kept for backward compatibility)
  teacherId?: string;

  // Multiple teachers (new - for many-to-many relationship)
  teacherIds?: string[];

  description?: string;

  credits?: number;

  hoursPerWeek?: number;

  status?: string;
}
