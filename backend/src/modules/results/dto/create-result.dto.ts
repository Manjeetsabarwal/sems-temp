
export class SubjectResultDto {
  subjectId: string;

  subjectName: string;

  maxMarks: number;

  marksObtained: number;

  grade: string;

  isPassed: boolean;
}

export class CreateResultDto {
  resultId: string;

  studentId: string;

  examId: string;

  classId: string;

  totalMarksObtained: number;

  totalMaxMarks: number;

  percentage: number;

  grade: string;

  isPassed: boolean;

  subjects?: SubjectResultDto[];

  rank?: number;

  status?: string;

  remarks?: string;
}
