import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, In, DataSource } from 'typeorm';
import { Mark } from './mark.entity';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';
import { Exam } from '../exams/exam.entity';

// Grade calculation based on percentage
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const normalizeMarksType = (value: unknown): Mark['marksType'] => {
  const raw = typeof value === 'string' ? value.trim() : '';

  // Current production DB schema often enforces a CHECK constraint allowing only
  // 'Unit Test' and 'Final'. To avoid insert failures, normalize everything else
  // to 'Final'.
  if (raw === 'Unit Test') {
    return 'Unit Test';
  }

  return 'Final';
};

export class MarksService {
  private readonly markRepository: Repository<Mark>;
  private readonly examRepository: Repository<Exam>;

  constructor(dataSource: DataSource) {
    this.markRepository = dataSource.getRepository(Mark);
    this.examRepository = dataSource.getRepository(Exam);
  }

  async findAll(filters?: {
    studentId?: string;
    examId?: string;
    subjectId?: string;
    status?: string;
  }): Promise<Mark[]> {
    try {
      const queryBuilder = this.markRepository
        .createQueryBuilder('mark')
        // Explicitly select V2 fields (since they have select: false in entity)
        .addSelect('mark.internalMarks')
        .addSelect('mark.externalMarks')
        .addSelect('mark.unitTestMarks')
        .addSelect('mark.assignmentMarks')
        .addSelect('mark.attendanceMarks')
        .addSelect('mark.marksType')
        .leftJoinAndSelect('mark.student', 'student')
        .leftJoinAndSelect('mark.exam', 'exam')
        .leftJoinAndSelect('mark.subject', 'subject');

      if (filters?.studentId) {
        queryBuilder.andWhere('mark.studentId = :studentId', { studentId: filters.studentId });
      }

      if (filters?.examId) {
        queryBuilder.andWhere('mark.examId = :examId', { examId: filters.examId });
      }

      if (filters?.subjectId) {
        queryBuilder.andWhere('mark.subjectId = :subjectId', { subjectId: filters.subjectId });
      }

      if (filters?.status) {
        queryBuilder.andWhere('mark.status = :status', { status: filters.status });
      }

      return queryBuilder
        .orderBy('mark.createdAt', 'DESC')
        .getMany();
    } catch (error: any) {
      // Check if error is due to missing columns (migration not run)
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        throw new Error(
          'Database migration required. Please run the migration: backend/src/database/add-internal-external-marks-migration.sql'
        );
      }
      throw error;
    }
  }

  async findOne(markId: string): Promise<Mark> {
    // Use query builder to explicitly select V2 fields (since they have select: false)
    const mark = await this.markRepository
      .createQueryBuilder('mark')
      .addSelect('mark.internalMarks')
      .addSelect('mark.externalMarks')
      .addSelect('mark.unitTestMarks')
      .addSelect('mark.assignmentMarks')
      .addSelect('mark.attendanceMarks')
      .addSelect('mark.marksType')
      .leftJoinAndSelect('mark.student', 'student')
      .leftJoinAndSelect('mark.exam', 'exam')
      .leftJoinAndSelect('mark.subject', 'subject')
      .where('mark.markId = :markId', { markId })
      .getOne();

    if (!mark) {
      throw new NotFoundException(`Mark ${markId} not found`);
    }

    return mark;
  }

  async create(createDto: CreateMarkDto): Promise<Mark> {
    try {
      // Calculate percentage and grade
      const totalMarks = createDto.totalMarks || 100;
      const percentage = (createDto.marksObtained / totalMarks) * 100;
      const grade = createDto.grade || calculateGrade(percentage);

      const normalizedCreateDto: CreateMarkDto = {
        ...createDto,
        marksType: normalizeMarksType((createDto as any).marksType) as any,
      };

      const mark = this.markRepository.create({
        ...normalizedCreateDto,
        percentage,
        grade,
      });
      const savedMark = await this.markRepository.save(mark);
      // Re-fetch to include V2 fields (select: false fields aren't returned by save())
      return await this.findOne(savedMark.markId);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A mark for this student, exam, and subject combination already exists');
      }
      if (error.code === '23503') {
        throw new ConflictException('Invalid student, exam, or subject ID');
      }
      throw error;
    }
  }

  async update(markId: string, updateDto: UpdateMarkDto): Promise<Mark> {
    try {
      const mark = await this.findOne(markId);

      // Recalculate percentage and grade if marks changed
      if (updateDto.marksObtained !== undefined || updateDto.totalMarks !== undefined) {
        const marksObtained = updateDto.marksObtained ?? mark.marksObtained;
        const totalMarks = updateDto.totalMarks ?? mark.totalMarks;
        const percentage = (marksObtained / totalMarks) * 100;
        updateDto.grade = calculateGrade(percentage);
        (updateDto as any).percentage = percentage;
      }

      if ((updateDto as any).marksType !== undefined) {
        (updateDto as any).marksType = normalizeMarksType((updateDto as any).marksType);
      }

      Object.assign(mark, updateDto);
      const savedMark = await this.markRepository.save(mark);
      // Re-fetch to include V2 fields (select: false fields aren't returned by save())
      return await this.findOne(savedMark.markId);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A mark for this student, exam, and subject combination already exists');
      }
      throw error;
    }
  }

  async remove(markId: string): Promise<void> {
    const mark = await this.findOne(markId);
    await this.markRepository.remove(mark);
  }

  async bulkDelete(markIds: string[]): Promise<void> {
    if (!markIds || markIds.length === 0) {
      throw new NotFoundException('No mark IDs provided for deletion');
    }

    // Verify all marks exist
    const existingMarks = await this.markRepository.find({
      where: markIds.map((id) => ({ markId: id })),
    });

    if (existingMarks.length !== markIds.length) {
      const foundIds = existingMarks.map((m) => m.markId);
      const missingIds = markIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Marks not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.markRepository.delete(markIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete marks that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getByStudentAndExam(studentId: string, examId: string): Promise<Mark[]> {
    return this.findAll({ studentId, examId });
  }

  async getByExam(examId: string): Promise<Mark[]> {
    return this.findAll({ examId });
  }

  async getByStudent(studentId: string): Promise<Mark[]> {
    return this.findAll({ studentId });
  }

  /**
   * Version 2: Calculate unit test marks for a student/subject
   * Takes average or highest of all unit test marks (4-5 unit tests)
   */
  async calculateUnitTestMarks(
    studentId: string,
    subjectId: string,
    academicYear: string,
    method: 'average' | 'highest' = 'average',
  ): Promise<number> {
    // Find all unit test exams for this academic year
    const unitTestExams = await this.examRepository.find({
      where: {
        examType: 'Unit Test',
        academicYear,
      },
    });

    if (unitTestExams.length === 0) {
      return 0;
    }

    // Get all unit test marks for this student and subject
    // Note: marksType might not exist in database yet, so we'll filter by exam type instead
    const unitTestMarks = await this.markRepository
      .createQueryBuilder('mark')
      .leftJoinAndSelect('mark.exam', 'exam')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('mark.subjectId = :subjectId', { subjectId })
      .andWhere('exam.examId IN (:...examIds)', { examIds: unitTestExams.map((e) => e.examId) })
      .andWhere('exam.examType = :examType', { examType: 'Unit Test' })
      .getMany();

    if (unitTestMarks.length === 0) {
      return 0;
    }

    // Extract marks obtained
    const marks = unitTestMarks
      .map((m) => Number(m.marksObtained))
      .filter((m) => m > 0);

    if (marks.length === 0) {
      return 0;
    }

    // Calculate based on method
    if (method === 'highest') {
      return Math.max(...marks);
    } else {
      // Average
      const sum = marks.reduce((a, b) => a + b, 0);
      return sum / marks.length;
    }
  }

  /**
   * Version 2: Calculate final marks with internal/external breakdown
   * Internal: Unit Test (10) + Assignment (5) + Attendance (5) = 20 marks
   * External: Final Exam = 80 marks
   * Total: 100 marks
   */
  async calculateFinalMarks(
    studentId: string,
    examId: string,
    subjectId: string,
    academicYear: string,
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<{
    internalMarks: number;
    externalMarks: number;
    totalMarks: number;
    breakdown: {
      unitTest: number; // 10 marks (10%)
      assignment: number; // 5 marks (5%)
      attendance: number; // 5 marks (5%)
      external: number; // 80 marks (80%)
    };
  }> {
    const finalMark = await this.markRepository
      .createQueryBuilder('mark')
      .addSelect('mark.internalMarks')
      .addSelect('mark.externalMarks')
      .addSelect('mark.unitTestMarks')
      .addSelect('mark.assignmentMarks')
      .addSelect('mark.attendanceMarks')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('mark.examId = :examId', { examId })
      .andWhere('mark.subjectId = :subjectId', { subjectId })
      .getOne();

    if (finalMark) {
      const unitTest = Number((finalMark as any).unitTestMarks || 0);
      const assignment = Number((finalMark as any).assignmentMarks || 0);
      const attendance = Number((finalMark as any).attendanceMarks || 0);
      const external = Number((finalMark as any).externalMarks || 0);
      const internalFromDb = Number((finalMark as any).internalMarks || 0);

      const hasV2Values =
        internalFromDb > 0 ||
        external > 0 ||
        unitTest > 0 ||
        assignment > 0 ||
        attendance > 0;

      if (hasV2Values) {
        const internal =
          internalFromDb > 0
            ? internalFromDb
            : unitTest + assignment + attendance;

        const totalMarks = internal + external;

        return {
          internalMarks: internal,
          externalMarks: external,
          totalMarks,
          breakdown: {
            unitTest,
            assignment,
            attendance,
            external,
          },
        };
      }

      const simpleTotal = Number((finalMark as any).marksObtained || 0);
      return {
        internalMarks: 0,
        externalMarks: 0,
        totalMarks: simpleTotal,
        breakdown: {
          unitTest: 0,
          assignment: 0,
          attendance: 0,
          external: 0,
        },
      };
    }

    const unitTestScore = await this.calculateUnitTestMarks(
      studentId,
      subjectId,
      academicYear,
      unitTestMethod,
    );

    const unitTestMarks = Math.min((unitTestScore / 100) * 10, 10);
    const assignmentMarks = finalMark ? Number((finalMark as any).assignmentMarks || 0) : 0;
    const attendanceMarks = finalMark ? Number((finalMark as any).attendanceMarks || 0) : 0;
    const externalMarksRaw = finalMark ? Number((finalMark as any).marksObtained) : 0;
    const scaledExternalMarks = Math.min((externalMarksRaw / 100) * 80, 80);

    const internalMarks = unitTestMarks + assignmentMarks + attendanceMarks;
    const totalMarks = internalMarks + scaledExternalMarks;

    return {
      internalMarks,
      externalMarks: scaledExternalMarks,
      totalMarks,
      breakdown: {
        unitTest: unitTestMarks,
        assignment: assignmentMarks,
        attendance: attendanceMarks,
        external: scaledExternalMarks,
      },
    };
  }
}
