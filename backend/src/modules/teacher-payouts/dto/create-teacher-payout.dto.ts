
export class CreateTeacherPayoutDto {
  batchId: number;

  teacherId: string;

  payoutAmount: number;

  payoutCycle: string;

  status?: string;

  payoutDate?: string;
}
