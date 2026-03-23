
export class ExamSubjectDto {
  subjectId: string;

  subjectName: string;

  subjectCode: string;

  maxMarks: number;

  passingMarks: number;

  examDate: string;

  duration: number;
}

export class CreateExamDto {
  examId: string;

  examName: string;

  examType: string;

  academicYear: string;

  classId: string;

  term: string;

  startDate: string;

  endDate: string;

  totalMarks?: number;

  passingMarks?: number;

  subjects?: ExamSubjectDto[];

  description?: string;

  status?: string;
}
