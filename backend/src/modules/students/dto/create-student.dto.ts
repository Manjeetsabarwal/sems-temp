
export class CreateStudentDto {
  studentId: string;

  name: string;

  classId?: string;

  sectionId?: string;

  rollNo?: number;

  dateOfBirth?: string;

  fatherName?: string;

  motherName?: string;

  gender?: string;

  email?: string;

  phone?: string;

  parentName?: string;

  parentPhone?: string;

  parentEmail?: string;

  address?: string;

  admissionDate?: string;

  examRegistrationFees?: number;

  status?: string;
}
