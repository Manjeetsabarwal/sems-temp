import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { CourseBatch } from './course-batch.entity';
import { BatchTeacher } from './batch-teacher.entity';
import { BatchStudent } from './batch-student.entity';
import { CreateBatchDto, AddBatchTeacherDto, AddBatchStudentDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

export class BatchesService {
  private readonly batchRepository: Repository<CourseBatch>;
  private readonly batchTeacherRepository: Repository<BatchTeacher>;
  private readonly batchStudentRepository: Repository<BatchStudent>;

  constructor(dataSource: DataSource) {
    this.batchRepository = dataSource.getRepository(CourseBatch);
    this.batchTeacherRepository = dataSource.getRepository(BatchTeacher);
    this.batchStudentRepository = dataSource.getRepository(BatchStudent);
  }

  async findAll(filters?: {
    courseId?: number;
    classId?: string;
    isCompleted?: boolean;
    search?: string;
  }): Promise<CourseBatch[]> {
    const queryBuilder = this.batchRepository.createQueryBuilder('batch');
    queryBuilder.where('batch.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.courseId) {
      queryBuilder.andWhere('batch.courseId = :courseId', { courseId: filters.courseId });
    }

    if (filters?.classId) {
      queryBuilder.andWhere('batch.classId = :classId', { classId: filters.classId });
    }

    if (filters?.isCompleted !== undefined) {
      queryBuilder.andWhere('batch.isCompleted = :isCompleted', { isCompleted: filters.isCompleted });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(batch.title ILIKE :search OR batch.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder
      .leftJoinAndSelect('batch.course', 'course')
      .leftJoinAndSelect('batch.batchTeachers', 'batchTeachers')
      .leftJoinAndSelect('batch.batchStudents', 'batchStudents')
      .orderBy('batch.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<CourseBatch> {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: ['course', 'batchTeachers', 'batchStudents', 'lectures'],
    });
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }
    return batch;
  }

  async create(createDto: CreateBatchDto): Promise<CourseBatch> {
    const batch = this.batchRepository.create(createDto);
    const saved = await this.batchRepository.save(batch);
    return this.findOne(saved.id);
  }

  async update(id: number, updateDto: UpdateBatchDto): Promise<CourseBatch> {
    const batch = await this.findOne(id);
    Object.assign(batch, updateDto);
    await this.batchRepository.save(batch);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const batch = await this.findOne(id);
    batch.isDeleted = true;
    await this.batchRepository.save(batch);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new NotFoundException('No batch IDs provided for deletion');
    }
    await this.batchRepository
      .createQueryBuilder()
      .update(CourseBatch)
      .set({ isDeleted: true })
      .whereInIds(ids)
      .execute();
  }

  // --- Teacher Management ---

  async addTeacher(batchId: number, dto: AddBatchTeacherDto): Promise<BatchTeacher> {
    await this.findOne(batchId); // Ensure batch exists
    try {
      const batchTeacher = this.batchTeacherRepository.create({
        batchId,
        teacherId: dto.teacherId,
        shareAmount: dto.shareAmount || null,
      });
      return await this.batchTeacherRepository.save(batchTeacher);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Teacher already assigned to this batch');
      }
      throw error;
    }
  }

  async removeTeacher(batchId: number, teacherId: string): Promise<void> {
    const result = await this.batchTeacherRepository.delete({ batchId, teacherId });
    if (result.affected === 0) {
      throw new NotFoundException('Teacher not found in this batch');
    }
  }

  async getTeachers(batchId: number): Promise<BatchTeacher[]> {
    return this.batchTeacherRepository.find({ where: { batchId } });
  }

  // --- Student Management ---

  async addStudent(batchId: number, dto: AddBatchStudentDto): Promise<BatchStudent> {
    await this.findOne(batchId); // Ensure batch exists
    try {
      const batchStudent = this.batchStudentRepository.create({
        batchId,
        studentId: dto.studentId,
      });
      return await this.batchStudentRepository.save(batchStudent);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Student already enrolled in this batch');
      }
      throw error;
    }
  }

  async removeStudent(batchId: number, studentId: string): Promise<void> {
    const result = await this.batchStudentRepository.delete({ batchId, studentId });
    if (result.affected === 0) {
      throw new NotFoundException('Student not found in this batch');
    }
  }

  async getStudents(batchId: number): Promise<BatchStudent[]> {
    return this.batchStudentRepository.find({ where: { batchId } });
  }

  async getForDropdown(): Promise<Array<{ id: number; title: string; courseId: number }>> {
    const batches = await this.findAll();
    return batches.map((b) => ({
      id: b.id,
      title: b.title,
      courseId: b.courseId,
    }));
  }

  async findByCourse(courseId: number): Promise<CourseBatch[]> {
    return this.findAll({ courseId });
  }
}
