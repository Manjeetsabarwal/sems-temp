
export class CreateQuestionOptionDto {
  optionId: string;

  questionId: string;

  optionText: string;

  optionImageUrl?: string;

  isCorrect: boolean;

  displayOrder?: number;

  explanation?: string;
}
