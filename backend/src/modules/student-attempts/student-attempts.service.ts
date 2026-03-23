import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { StudentAttempt } from './student-attempt.entity';
import { CreateStudentAttemptDto } from './dto/create-student-attempt.dto';
import { UpdateStudentAttemptDto } from './dto/update-student-attempt.dto';

export class StudentAttemptsService {
  private readonly attemptRepository: Repository<StudentAttempt>;

  constructor(dataSource: DataSource) {
    this.attemptRepository = dataSource.getRepository(StudentAttempt);
  }

  async create(createDto: CreateStudentAttemptDto): Promise<StudentAttempt> {
    // Check if there's already an active attempt
    const existing = await this.attemptRepository.findOne({
      where: {
        studentId: createDto.studentId,
        paperId: createDto.paperId,
        status: 'IN_PROGRESS',
      },
    });

    if (existing) {
      throw new ConflictException(
        `Student already has an active attempt for this paper. Attempt ID: ${existing.attemptId}`,
      );
    }

    const attempt = this.attemptRepository.create({
      ...createDto,
      startedAt: new Date(),
      status: createDto.status || 'IN_PROGRESS',
    });

    return await this.attemptRepository.save(attempt);
  }

  async findAll(filters?: {
    studentId?: string;
    paperId?: string;
    status?: string;
  }): Promise<StudentAttempt[]> {
    const queryBuilder = this.attemptRepository.createQueryBuilder('attempt');

    if (filters?.studentId) {
      queryBuilder.andWhere('attempt.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.paperId) {
      queryBuilder.andWhere('attempt.paperId = :paperId', { paperId: filters.paperId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('attempt.status = :status', { status: filters.status });
    }

    return queryBuilder
      .orderBy('attempt.startedAt', 'DESC')
      .getMany();
  }

  async findOne(attemptId: string): Promise<StudentAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { attemptId },
      relations: ['student', 'paper'],
    });

    if (!attempt) {
      throw new NotFoundException(`Student attempt with ID "${attemptId}" not found`);
    }

    return attempt;
  }

  async findByStudentAndPaper(
    studentId: string,
    paperId: string,
  ): Promise<StudentAttempt[]> {
    return this.attemptRepository.find({
      where: { studentId, paperId },
      order: { startedAt: 'DESC' },
      relations: ['student', 'paper'],
    });
  }

  async getActiveAttempt(studentId: string, paperId: string): Promise<StudentAttempt | null> {
    return this.attemptRepository.findOne({
      where: {
        studentId,
        paperId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async update(attemptId: string, updateDto: UpdateStudentAttemptDto): Promise<StudentAttempt> {
    const attempt = await this.findOne(attemptId);

    // If submitting, set submittedAt
    if (updateDto.status === 'SUBMITTED' && !attempt.submittedAt) {
      updateDto.submittedAt = new Date();
    }

    // If evaluating, set completedAt
    if (updateDto.status === 'EVALUATED' && !attempt.completedAt) {
      updateDto.completedAt = new Date();
    }

    Object.assign(attempt, updateDto);
    return await this.attemptRepository.save(attempt);
  }

  async submitAttempt(attemptId: string): Promise<StudentAttempt> {
    const attempt = await this.findOne(attemptId);

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException(`Attempt is already ${attempt.status}`);
    }

    attempt.status = 'SUBMITTED';
    attempt.submittedAt = new Date();
    attempt.timeSpentMinutes = Math.floor(
      (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 60000,
    );

    return await this.attemptRepository.save(attempt);
  }

  async abandonAttempt(attemptId: string): Promise<StudentAttempt> {
    const attempt = await this.findOne(attemptId);

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException(`Cannot abandon attempt with status ${attempt.status}`);
    }

    attempt.status = 'ABANDONED';
    return await this.attemptRepository.save(attempt);
  }

  async updateTimeSpent(attemptId: string, minutes: number): Promise<StudentAttempt> {
    const attempt = await this.findOne(attemptId);
    attempt.timeSpentMinutes = minutes;
    return await this.attemptRepository.save(attempt);
  }

  async remove(attemptId: string): Promise<void> {
    const attempt = await this.findOne(attemptId);
    await this.attemptRepository.remove(attempt);
  }

  async getAttemptStatistics(paperId: string): Promise<{
    total: number;
    byStatus: { status: string; count: number }[];
    averageTime: number;
    averageMarks: number;
    passRate: number;
  }> {
    const attempts = await this.findAll({ paperId });

    const byStatus = attempts.reduce((acc, attempt) => {
      const existing = acc.find((item) => item.status === attempt.status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: attempt.status, count: 1 });
      }
      return acc;
    }, [] as { status: string; count: number }[]);

    const evaluatedAttempts = attempts.filter((a) => a.status === 'EVALUATED');
    const averageTime =
      evaluatedAttempts.length > 0
        ? evaluatedAttempts.reduce((sum, a) => sum + a.timeSpentMinutes, 0) /
          evaluatedAttempts.length
        : 0;

    const averageMarks =
      evaluatedAttempts.length > 0
        ? evaluatedAttempts.reduce((sum, a) => sum + Number(a.totalMarksObtained), 0) /
          evaluatedAttempts.length
        : 0;

    const passedCount = evaluatedAttempts.filter((a) => a.isPassed === true).length;
    const passRate =
      evaluatedAttempts.length > 0 ? (passedCount / evaluatedAttempts.length) * 100 : 0;

    return {
      total: attempts.length,
      byStatus,
      averageTime: Math.round(averageTime),
      averageMarks: Number(averageMarks.toFixed(2)),
      passRate: Number(passRate.toFixed(2)),
    };
  }
}
