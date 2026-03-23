import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  email: string;

  password: string;

  role: UserRole;

  name: string;

  phone?: string;

  studentId?: string;

  teacherId?: string;
}
