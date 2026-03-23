import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Exam } from './exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

export class ExamsService {
  private readonly examRepository: Repository<Exam>;

  constructor(dataSource: DataSource) {
    this.examRepository = dataSource.getRepository(Exam);
  }

  async findAll(filters?: {
    classId?: string;
    examType?: string;
    status?: string;
    academicYear?: string;
    search?: string;
  }): Promise<Exam[]> {
    const queryBuilder = this.examRepository.createQueryBuilder('exam');

    if (filters?.classId) {
      queryBuilder.andWhere('exam.classId = :classId', { classId: filters.classId });
    }

    if (filters?.examType) {
      queryBuilder.andWhere('exam.examType = :examType', { examType: filters.examType });
    }

    if (filters?.status) {
      queryBuilder.andWhere('exam.status = :status', { status: filters.status });
    }

    if (filters?.academicYear) {
      queryBuilder.andWhere('exam.academicYear = :academicYear', { academicYear: filters.academicYear });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(exam.examName ILIKE :search OR exam.examId ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder
      .orderBy('exam.startDate', 'DESC')
      .getMany();
  }

  async findOne(examId: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam ${examId} not found`);
    }

    return exam;
  }

  async create(createDto: CreateExamDto): Promise<Exam> {
    try {
      const exam = this.examRepository.create({
        ...createDto,
        subjects: createDto.subjects || [],
      });
      return await this.examRepository.save(exam);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('An exam with this ID already exists');
      }
      if (error.code === '23503') {
        // Foreign key constraint violation
        if (error.message && error.message.includes('class_id')) {
          throw new ConflictException(
            `Class ID "${createDto.classId}" does not exist. Please select a valid class.`
          );
        }
        throw new ConflictException(
          'Invalid reference. Please ensure all selected values (class, subjects, etc.) exist in the database.'
        );
      }
      throw error;
    }
  }

  async update(examId: string, updateDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(examId);
    Object.assign(exam, updateDto);
    return await this.examRepository.save(exam);
  }

  async remove(examId: string): Promise<void> {
    const exam = await this.findOne(examId);
    await this.examRepository.remove(exam);
  }

  async bulkDelete(examIds: string[]): Promise<void> {
    if (!examIds || examIds.length === 0) {
      throw new NotFoundException('No exam IDs provided for deletion');
    }

    // Verify all exams exist
    const existingExams = await this.examRepository.find({
      where: examIds.map((id) => ({ examId: id })),
    });

    if (existingExams.length !== examIds.length) {
      const foundIds = existingExams.map((e) => e.examId);
      const missingIds = examIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Exams not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.examRepository.delete(examIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete exams that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getByClass(classId: string): Promise<Exam[]> {
    return this.findAll({ classId });
  }

  async getForDropdown(): Promise<Array<{ examId: string; examName: string; classId: string }>> {
    const exams = await this.findAll();
    return exams.map((e) => ({
      examId: e.examId,
      examName: e.examName,
      classId: e.classId,
    }));
  }
}
