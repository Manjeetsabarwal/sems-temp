export class CreateQuestionDto {
  questionId: string;

  paperId: string;

  sectionId?: string;

  questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE';

  questionText: string;

  questionImageUrl?: string;

  marks: number;

  negativeMarks?: number;

  difficulty?: 'Easy' | 'Medium' | 'Hard';

  displayOrder?: number;

  isRequired?: boolean;

  correctAnswerText?: string;

  solutionText?: string;

  solutionImageUrl?: string;

  meta?: Record<string, any>;
}
