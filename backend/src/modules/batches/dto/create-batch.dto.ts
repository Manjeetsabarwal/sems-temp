
export class CreateBatchDto {
  courseId: number;

  classId?: string;

  sectionId?: string;

  title: string;

  description?: string;

  durationDays: number;

  startDate: string;

  endDate: string;

  totalRevenue?: number;

  teacherSharePercent?: number;

  institutionSharePercent?: number;
}

export class AddBatchTeacherDto {
  teacherId: string;

  shareAmount?: number;
}

export class AddBatchStudentDto {
  studentId: string;
}
