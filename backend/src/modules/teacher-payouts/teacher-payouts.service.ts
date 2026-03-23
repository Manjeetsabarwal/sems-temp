import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { TeacherPayout } from './teacher-payout.entity';
import { CreateTeacherPayoutDto } from './dto/create-teacher-payout.dto';
import { UpdateTeacherPayoutDto } from './dto/update-teacher-payout.dto';

export class TeacherPayoutsService {
  private readonly payoutRepository: Repository<TeacherPayout>;

  constructor(dataSource: DataSource) {
    this.payoutRepository = dataSource.getRepository(TeacherPayout);
  }

  async findAll(filters?: { batchId?: number; teacherId?: string; status?: string }): Promise<TeacherPayout[]> {
    const qb = this.payoutRepository.createQueryBuilder('p');
    if (filters?.batchId) qb.andWhere('p.batchId = :batchId', { batchId: filters.batchId });
    if (filters?.teacherId) qb.andWhere('p.teacherId = :teacherId', { teacherId: filters.teacherId });
    if (filters?.status) qb.andWhere('p.status = :status', { status: filters.status });
    return qb.orderBy('p.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<TeacherPayout> {
    const payout = await this.payoutRepository.findOne({ where: { id } });
    if (!payout) throw new NotFoundException(`Payout ${id} not found`);
    return payout;
  }

  async create(dto: CreateTeacherPayoutDto): Promise<TeacherPayout> {
    const payout = this.payoutRepository.create(dto);
    return this.payoutRepository.save(payout);
  }

  async update(id: number, dto: UpdateTeacherPayoutDto): Promise<TeacherPayout> {
    const payout = await this.findOne(id);
    Object.assign(payout, dto);
    return this.payoutRepository.save(payout);
  }

  async remove(id: number): Promise<void> {
    const payout = await this.findOne(id);
    await this.payoutRepository.remove(payout);
  }

  async getByBatch(batchId: number): Promise<TeacherPayout[]> {
    return this.findAll({ batchId });
  }

  async getByTeacher(teacherId: string): Promise<TeacherPayout[]> {
    return this.findAll({ teacherId });
  }
}
