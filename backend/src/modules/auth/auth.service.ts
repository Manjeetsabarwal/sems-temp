import { UnauthorizedException } from '../../common/app-error';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';

export interface AuthResponse {
  access_token: string;
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
    studentId?: string | null;
    teacherId?: string | null;
  };
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;

  constructor(private usersService: UsersService) {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '7d';
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.userId);

    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const access_token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiration } as jwt.SignOptions);

    return {
      access_token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(registerDto);
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  async validateUser(userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }
}
