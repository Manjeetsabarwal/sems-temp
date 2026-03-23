
export class CreateCourseDto {
  title: string;

  description?: string;

  durationDays?: number;

  class?: string;

  sem?: string;

  stream?: string;

  year?: string;

  semester?: string;

  education?: string;

  subjectIds?: string[];
}
