
export class CreateExamPaperDto {
  paperId: string;

  examId: string;

  paperTitle: string;

  paperCode?: string;

  durationMinutes: number;

  totalMarks: number;

  isOnline: boolean;

  displayOrder?: number;

  instructions?: string;

  status?: string;
}
