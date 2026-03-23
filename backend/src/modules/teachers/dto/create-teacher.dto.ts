
export class CreateTeacherDto {
  teacherId: string;

  name: string;

  email: string;

  phone?: string;

  subjects?: string[];

  classes?: string[];

  qualification?: string;

  experience?: number;

  joiningDate?: string;

  status?: string;

  address?: string;
}
