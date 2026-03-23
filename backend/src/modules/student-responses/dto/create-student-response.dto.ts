export class CreateStudentResponseDto {
  responseId: string;

  attemptId: string;

  questionId: string;

  selectedOptionId?: string;

  answerText?: string;

  answerImageUrl?: string;

  marksAwarded?: number;

  isCorrect?: boolean;

  timeSpentSeconds?: number;

  meta?: Record<string, any>;

  isEvaluated?: boolean;

  evaluatedAt?: Date;
}
