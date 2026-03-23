
export class CreateClassDto {
  classId: string;

  className: string;

  academicYearId?: string;

  classTeacherId?: string;

  description?: string;

  capacity?: number;

  totalStudents?: number;

  // Multiple sections (new - for many-to-many relationship)
  sectionIds?: string[];

  status?: string;
}
