
export class CreateLectureDto {
  batchId: number;

  teacherId: string;

  subjectId: string;

  dateTime: string;

  durationMinutes?: number;

  topic: string;
}
