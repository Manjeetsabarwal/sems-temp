
export class CreateStudentAttemptDto {
  attemptId: string;

  studentId: string;

  paperId: string;

  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'ABANDONED';

  timeSpentMinutes?: number;

  ipAddress?: string;

  userAgent?: string;

  meta?: Record<string, any>;

  submittedAt?: Date;

  completedAt?: Date;
}
