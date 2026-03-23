import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Attendance } from './attendance.entity';
import { CreateAttendanceDto, BulkMarkAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

export class AttendanceService {
  private readonly attendanceRepository: Repository<Attendance>;

  constructor(dataSource: DataSource) {
    this.attendanceRepository = dataSource.getRepository(Attendance);
  }

  async findAll(filters?: {
    lectureId?: number;
    studentId?: string;
    status?: string;
  }): Promise<Attendance[]> {
    const queryBuilder = this.attendanceRepository.createQueryBuilder('attendance');

    if (filters?.lectureId) {
      queryBuilder.andWhere('attendance.lectureId = :lectureId', { lectureId: filters.lectureId });
    }

    if (filters?.studentId) {
      queryBuilder.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('attendance.status = :status', { status: filters.status });
    }

    return queryBuilder
      .leftJoinAndSelect('attendance.lecture', 'lecture')
      .orderBy('attendance.date', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['lecture'],
    });
    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    const attendance = this.attendanceRepository.create(createDto);
    return await this.attendanceRepository.save(attendance);
  }

  async update(id: number, updateDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);
    Object.assign(attendance, updateDto);
    return await this.attendanceRepository.save(attendance);
  }

  async remove(id: number): Promise<void> {
    const attendance = await this.findOne(id);
    await this.attendanceRepository.remove(attendance);
  }

  async getByLecture(lectureId: number): Promise<Attendance[]> {
    return this.findAll({ lectureId });
  }

  async getByStudent(studentId: string): Promise<Attendance[]> {
    return this.findAll({ studentId });
  }

  async bulkMark(dto: BulkMarkAttendanceDto): Promise<Attendance[]> {
    const results: Attendance[] = [];

    for (const record of dto.records) {
      // Upsert: update if exists, create if not
      const existing = await this.attendanceRepository.findOne({
        where: { lectureId: dto.lectureId, studentId: record.studentId },
      });

      if (existing) {
        existing.status = record.status;
        existing.notes = record.notes || null;
        results.push(await this.attendanceRepository.save(existing));
      } else {
        const attendance = this.attendanceRepository.create({
          lectureId: dto.lectureId,
          studentId: record.studentId,
          status: record.status,
          notes: record.notes || null,
        });
        results.push(await this.attendanceRepository.save(attendance));
      }
    }

    return results;
  }

  async getAttendanceReport(filters: {
    batchId?: number;
    studentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.lecture', 'lecture');

    if (filters.batchId) {
      queryBuilder.andWhere('lecture.batchId = :batchId', { batchId: filters.batchId });
    }

    if (filters.studentId) {
      queryBuilder.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('attendance.date >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('attendance.date <= :dateTo', { dateTo: filters.dateTo });
    }

    const records = await queryBuilder.getMany();

    // Build summary
    const summary: Record<string, { total: number; present: number; absent: number; late: number; excused: number }> = {};

    for (const record of records) {
      if (!summary[record.studentId]) {
        summary[record.studentId] = { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      }
      summary[record.studentId].total++;
      summary[record.studentId][record.status]++;
    }

    return {
      records,
      summary: Object.entries(summary).map(([studentId, stats]) => ({
        studentId,
        ...stats,
        percentage: stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(2) : '0.00',
      })),
    };
  }
}
