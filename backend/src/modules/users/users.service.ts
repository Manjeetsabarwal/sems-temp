import { ConflictException, NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

export class UsersService {
  private readonly userRepository: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  async create(createDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createDto.password, saltRounds);

    // Generate user ID
    const userId = `USR-${Date.now().toString(36).toUpperCase()}`;

    const user = this.userRepository.create({
      userId,
      email: createDto.email,
      passwordHash,
      role: createDto.role,
      name: createDto.name,
      phone: createDto.phone,
      studentId: createDto.studentId || null,
      teacherId: createDto.teacherId || null,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['student', 'teacher'],
    });
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['student', 'teacher'],
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['student', 'teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(
      { userId },
      { lastLogin: new Date() },
    );
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await this.userRepository.update({ userId }, { passwordHash });
  }

  async deactivate(userId: string): Promise<void> {
    await this.userRepository.update({ userId }, { isActive: false });
  }

  async activate(userId: string): Promise<void> {
    await this.userRepository.update({ userId }, { isActive: true });
  }
}
