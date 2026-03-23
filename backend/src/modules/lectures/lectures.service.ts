import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Lecture } from './lecture.entity';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';

export class LecturesService {
  private readonly lectureRepository: Repository<Lecture>;

  constructor(dataSource: DataSource) {
    this.lectureRepository = dataSource.getRepository(Lecture);
  }

  async findAll(filters?: {
    batchId?: number;
    teacherId?: string;
    subjectId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Lecture[]> {
    const queryBuilder = this.lectureRepository.createQueryBuilder('lecture');

    if (filters?.batchId) {
      queryBuilder.andWhere('lecture.batchId = :batchId', { batchId: filters.batchId });
    }

    if (filters?.teacherId) {
      queryBuilder.andWhere('lecture.teacherId = :teacherId', { teacherId: filters.teacherId });
    }

    if (filters?.subjectId) {
      queryBuilder.andWhere('lecture.subjectId = :subjectId', { subjectId: filters.subjectId });
    }

    if (filters?.search) {
      queryBuilder.andWhere('lecture.topic ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('lecture.dateTime >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('lecture.dateTime <= :dateTo', { dateTo: filters.dateTo });
    }

    return queryBuilder
      .leftJoinAndSelect('lecture.batch', 'batch')
      .orderBy('lecture.dateTime', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['batch', 'attendance'],
    });
    if (!lecture) {
      throw new NotFoundException(`Lecture with ID ${id} not found`);
    }
    return lecture;
  }

  async create(createDto: CreateLectureDto): Promise<Lecture> {
    const lecture = this.lectureRepository.create(createDto);
    const saved = await this.lectureRepository.save(lecture);
    return this.findOne(saved.id);
  }

  async update(id: number, updateDto: UpdateLectureDto): Promise<Lecture> {
    const lecture = await this.findOne(id);
    Object.assign(lecture, updateDto);
    await this.lectureRepository.save(lecture);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const lecture = await this.findOne(id);
    await this.lectureRepository.remove(lecture);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new NotFoundException('No lecture IDs provided for deletion');
    }
    await this.lectureRepository.delete(ids);
  }

  async findByBatch(batchId: number): Promise<Lecture[]> {
    return this.findAll({ batchId });
  }

  async findByTeacher(teacherId: string): Promise<Lecture[]> {
    return this.findAll({ teacherId });
  }
}
