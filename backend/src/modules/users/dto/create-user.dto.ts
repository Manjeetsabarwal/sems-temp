import { UserRole } from '../user.entity';

export class CreateUserDto {
  email: string;

  password: string;

  role: UserRole;

  name: string;

  phone?: string;

  studentId?: string;

  teacherId?: string;
}
