
export class CreateMarkDto {
  markId: string;

  studentId: string;

  examId: string;

  subjectId: string;

  marksObtained: number;

  totalMarks?: number;

  grade?: string;

  remarks?: string;

  isAbsent?: boolean;

  status?: string;

  enteredBy?: string;

  // Version 2: Internal/External Marks Breakdown
  internalMarks?: number;

  externalMarks?: number;

  unitTestMarks?: number;

  assignmentMarks?: number;

  attendanceMarks?: number;

  marksType?: 'Unit Test' | 'Final' | 'Periodic Test' | 'Notebook' | 'Subject Enrichment' | 'Mid-Term';
}
