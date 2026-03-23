import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { StudentHabit } from './student-habit.entity';
import { CreateStudentHabitDto } from './dto/create-student-habit.dto';
import { UpdateStudentHabitDto } from './dto/update-student-habit.dto';

export class StudentHabitsService {
  private readonly habitRepository: Repository<StudentHabit>;

  constructor(dataSource: DataSource) {
    this.habitRepository = dataSource.getRepository(StudentHabit);
  }

  async findAll(filters?: {
    studentId?: string;
    academicYear?: string;
    habitName?: string;
  }): Promise<StudentHabit[]> {
    try {
      const queryBuilder = this.habitRepository.createQueryBuilder('habit')
        .leftJoinAndSelect('habit.student', 'student');

      if (filters?.studentId) {
        queryBuilder.andWhere('habit.studentId = :studentId', { studentId: filters.studentId });
      }

      if (filters?.academicYear) {
        queryBuilder.andWhere('habit.academicYear = :academicYear', { academicYear: filters.academicYear });
      }

      if (filters?.habitName) {
        queryBuilder.andWhere('habit.habitName = :habitName', { habitName: filters.habitName });
      }

      return await queryBuilder
        .orderBy('habit.habitName', 'ASC')
        .getMany();
    } catch (error: any) {
      console.error('Error in findAll student habits:', error);
      throw error;
    }
  }

  async findOne(habitId: string): Promise<StudentHabit> {
    const habit = await this.habitRepository.findOne({
      where: { habitId },
      relations: ['student'],
    });

    if (!habit) {
      throw new NotFoundException(`Student habit ${habitId} not found`);
    }

    return habit;
  }

  async findByStudentAndYear(studentId: string, academicYear: string): Promise<StudentHabit[]> {
    return await this.habitRepository.find({
      where: { studentId, academicYear },
      relations: ['student'],
      order: { habitName: 'ASC' },
    });
  }

  async create(createDto: CreateStudentHabitDto): Promise<StudentHabit> {
    try {
      // Check for existing habit for same student, year, and habit name
      const existing = await this.habitRepository.findOne({
        where: {
          studentId: createDto.studentId,
          academicYear: createDto.academicYear,
          habitName: createDto.habitName,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Habit ${createDto.habitName} already exists for student ${createDto.studentId} in academic year ${createDto.academicYear}`,
        );
      }

      const habit = this.habitRepository.create(createDto);
      return await this.habitRepository.save(habit);
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error creating student habit:', error);
      throw error;
    }
  }

  async bulkCreate(createDtos: CreateStudentHabitDto[]): Promise<StudentHabit[]> {
    const habits: StudentHabit[] = [];
    
    for (const dto of createDtos) {
      try {
        // Check if exists, if not create
        const existing = await this.habitRepository.findOne({
          where: {
            studentId: dto.studentId,
            academicYear: dto.academicYear,
            habitName: dto.habitName,
          },
        });

        if (!existing) {
          const habit = this.habitRepository.create(dto);
          const saved = await this.habitRepository.save(habit);
          habits.push(saved);
        } else {
          // Update existing
          Object.assign(existing, dto);
          const updated = await this.habitRepository.save(existing);
          habits.push(updated);
        }
      } catch (error: any) {
        console.error(`Error creating/updating habit ${dto.habitName} for student ${dto.studentId}:`, error);
        // Continue with next habit
      }
    }

    return habits;
  }

  async update(habitId: string, updateDto: UpdateStudentHabitDto): Promise<StudentHabit> {
    const habit = await this.findOne(habitId);
    Object.assign(habit, updateDto);
    return await this.habitRepository.save(habit);
  }

  async remove(habitId: string): Promise<void> {
    const habit = await this.findOne(habitId);
    await this.habitRepository.remove(habit);
  }

  async bulkDelete(habitIds: string[]): Promise<void> {
    if (!habitIds || habitIds.length === 0) {
      throw new NotFoundException('No habit IDs provided for deletion');
    }

    await this.habitRepository.delete(habitIds);
  }
}
