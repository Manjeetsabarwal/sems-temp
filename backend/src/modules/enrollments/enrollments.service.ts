import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { StudentEnrollment } from './student-enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

export class EnrollmentsService {
  private readonly enrollmentRepository: Repository<StudentEnrollment>;

  constructor(dataSource: DataSource) {
    this.enrollmentRepository = dataSource.getRepository(StudentEnrollment);
  }

  async findAll(filters?: {
    studentId?: string;
    batchId?: number;
    courseId?: number;
    paymentStatus?: string;
  }): Promise<StudentEnrollment[]> {
    const qb = this.enrollmentRepository.createQueryBuilder('e');
    if (filters?.studentId) qb.andWhere('e.studentId = :studentId', { studentId: filters.studentId });
    if (filters?.batchId) qb.andWhere('e.batchId = :batchId', { batchId: filters.batchId });
    if (filters?.courseId) qb.andWhere('e.courseId = :courseId', { courseId: filters.courseId });
    if (filters?.paymentStatus) qb.andWhere('e.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
    return qb
      .leftJoinAndSelect('e.batch', 'batch')
      .leftJoinAndSelect('e.course', 'course')
      .leftJoinAndSelect('e.payments', 'payments')
      .orderBy('e.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<StudentEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['batch', 'course', 'payments'],
    });
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    return enrollment;
  }

  async create(dto: CreateEnrollmentDto): Promise<StudentEnrollment> {
    const totalAmount = Number(dto.courseFee) + Number(dto.registrationFee) - Number(dto.discount || 0);
    const enrollment = this.enrollmentRepository.create({
      ...dto,
      totalAmount,
    });
    try {
      const saved = await this.enrollmentRepository.save(enrollment);
      return this.findOne(saved.id);
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictException('Student already enrolled in this batch');
      throw error;
    }
  }

  async update(id: number, dto: UpdateEnrollmentDto): Promise<StudentEnrollment> {
    const enrollment = await this.findOne(id);
    if (dto.courseFee !== undefined || dto.registrationFee !== undefined || dto.discount !== undefined) {
      const courseFee = dto.courseFee ?? enrollment.courseFee;
      const registrationFee = dto.registrationFee ?? enrollment.registrationFee;
      const discount = dto.discount ?? enrollment.discount;
      (enrollment as any).totalAmount = Number(courseFee) + Number(registrationFee) - Number(discount);
    }
    Object.assign(enrollment, dto);
    await this.enrollmentRepository.save(enrollment);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const enrollment = await this.findOne(id);
    await this.enrollmentRepository.remove(enrollment);
  }
}
