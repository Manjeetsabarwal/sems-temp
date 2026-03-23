import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

export class AcademicYearsService {
  private readonly academicYearRepository: Repository<AcademicYear>;

  constructor(dataSource: DataSource) {
    this.academicYearRepository = dataSource.getRepository(AcademicYear);
  }

  async findAll(filters?: { status?: string }): Promise<AcademicYear[]> {
    const queryBuilder = this.academicYearRepository.createQueryBuilder('ay');

    if (filters?.status) {
      queryBuilder.andWhere('ay.status = :status', { status: filters.status });
    }

    return queryBuilder.orderBy('ay.startDate', 'DESC').getMany();
  }

  async findOne(id: string): Promise<AcademicYear> {
    const academicYear = await this.academicYearRepository.findOne({
      where: { id },
    });

    if (!academicYear) {
      throw new NotFoundException(`Academic Year ${id} not found`);
    }

    return academicYear;
  }

  async findCurrent(): Promise<AcademicYear | null> {
    return this.academicYearRepository.findOne({
      where: { isCurrent: true },
    });
  }

  async create(createDto: CreateAcademicYearDto): Promise<AcademicYear> {
    try {
      const academicYear = this.academicYearRepository.create(createDto);
      return await this.academicYearRepository.save(academicYear);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('An academic year with this ID or name already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = await this.findOne(id);
    Object.assign(academicYear, updateDto);
    return await this.academicYearRepository.save(academicYear);
  }

  async remove(id: string): Promise<void> {
    const academicYear = await this.findOne(id);
    await this.academicYearRepository.remove(academicYear);
  }

  async setAsCurrent(id: string): Promise<AcademicYear> {
    // First, unset all current academic years
    await this.academicYearRepository.update({}, { isCurrent: false });
    
    // Then set the specified one as current
    const academicYear = await this.findOne(id);
    academicYear.isCurrent = true;
    return await this.academicYearRepository.save(academicYear);
  }
}
