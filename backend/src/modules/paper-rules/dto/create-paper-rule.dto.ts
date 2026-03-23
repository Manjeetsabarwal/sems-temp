
export class CreatePaperRuleDto {
  ruleId: string;

  paperId: string;

  minMarksToPass: number;

  minPercentage: number;

  sectionWisePassRequired?: boolean;

  mustAttemptPercentage?: number;

  evaluationMode?: 'AUTO' | 'MANUAL' | 'MIXED';

  negativeMarkingEnabled?: boolean;

  negativeMarkingPerQuestion?: number;

  graceMarks?: number;
}
