
export class CreatePaidStudentFeeDto {
  enrollmentId: number;

  amount: number;

  payType: string;

  payMode: string;

  upiId?: string;

  acNumber?: string;

  transactionId?: string;

  notes?: string;
}
