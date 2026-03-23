
export class CreateTeacherAssignmentDto {
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
