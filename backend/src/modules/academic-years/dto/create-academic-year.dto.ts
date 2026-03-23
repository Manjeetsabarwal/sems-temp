
export class CreateAcademicYearDto {
  id: string;

  yearName: string;

  startDate: string;

  endDate: string;

  isCurrent?: boolean;

  status?: string;
}
