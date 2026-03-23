import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { PaidStudentFee } from './paid-student-fee.entity';
import { StudentEnrollment } from '../enrollments/student-enrollment.entity';
import { CreatePaidStudentFeeDto } from './dto/create-paid-student-fee.dto';
import { UpdatePaidStudentFeeDto } from './dto/update-paid-student-fee.dto';

export class PaidStudentFeesService {
  private readonly feeRepository: Repository<PaidStudentFee>;
  private readonly enrollmentRepository: Repository<StudentEnrollment>;

  constructor(dataSource: DataSource) {
    this.feeRepository = dataSource.getRepository(PaidStudentFee);
    this.enrollmentRepository = dataSource.getRepository(StudentEnrollment);
  }

  async findAll(filters?: { enrollmentId?: number }): Promise<PaidStudentFee[]> {
    const qb = this.feeRepository.createQueryBuilder('f');
    if (filters?.enrollmentId) qb.andWhere('f.enrollmentId = :enrollmentId', { enrollmentId: filters.enrollmentId });
    return qb.leftJoinAndSelect('f.enrollment', 'enrollment').orderBy('f.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<PaidStudentFee> {
    const fee = await this.feeRepository.findOne({ where: { id }, relations: ['enrollment'] });
    if (!fee) throw new NotFoundException(`Payment ${id} not found`);
    return fee;
  }

  async create(dto: CreatePaidStudentFeeDto): Promise<PaidStudentFee> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: dto.enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const fee = this.feeRepository.create(dto);
    const saved = await this.feeRepository.save(fee);
    const totalPaid = await this.feeRepository
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.amount), 0)', 'total')
      .where('f.enrollmentId = :id', { id: dto.enrollmentId })
      .getRawOne();
    const total = Number(totalPaid?.total || 0);
    enrollment.paymentStatus = total >= Number(enrollment.totalAmount) ? 'Paid' : 'Partial';
    await this.enrollmentRepository.save(enrollment);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdatePaidStudentFeeDto): Promise<PaidStudentFee> {
    const fee = await this.findOne(id);
    Object.assign(fee, dto);
    await this.feeRepository.save(fee);
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: fee.enrollmentId } });
    if (enrollment) {
      const totalPaid = await this.feeRepository
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount), 0)', 'total')
        .where('f.enrollmentId = :id', { id: fee.enrollmentId })
        .getRawOne();
      enrollment.paymentStatus = Number(totalPaid?.total || 0) >= Number(enrollment.totalAmount) ? 'Paid' : 'Partial';
      await this.enrollmentRepository.save(enrollment);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const fee = await this.findOne(id);
    const enrollmentId = fee.enrollmentId;
    await this.feeRepository.remove(fee);
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
    if (enrollment) {
      const totalPaid = await this.feeRepository
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount), 0)', 'total')
        .where('f.enrollmentId = :id', { id: enrollmentId })
        .getRawOne();
      enrollment.paymentStatus = Number(totalPaid?.total || 0) >= Number(enrollment.totalAmount) ? 'Paid' : totalPaid?.total ? 'Partial' : 'Pending';
      await this.enrollmentRepository.save(enrollment);
    }
  }

  async getByEnrollment(enrollmentId: number): Promise<PaidStudentFee[]> {
    return this.findAll({ enrollmentId });
  }
}
