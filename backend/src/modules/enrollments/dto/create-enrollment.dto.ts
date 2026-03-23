
export class CreateEnrollmentDto {
  studentId: string;

  batchId: number;

  courseId: number;

  courseFee: number;

  registrationFee: number;

  discount?: number;

  enrollmentStatus?: string;

  paymentStatus?: string;

  notes?: string;
}
