import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Subject } from './subject.entity';
import { SubjectTeacher } from './subject-teacher.entity';
import { Teacher } from '../teachers/teacher.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';

export class SubjectsService {
  private readonly subjectRepository: Repository<Subject>;
  private readonly subjectTeacherRepository: Repository<SubjectTeacher>;
  private readonly teacherRepository: Repository<Teacher>;

  constructor(private readonly dataSource: DataSource) {
    this.subjectRepository = dataSource.getRepository(Subject);
    this.subjectTeacherRepository = dataSource.getRepository(SubjectTeacher);
    this.teacherRepository = dataSource.getRepository(Teacher);
  }

  async findAll(filters?: {
    classId?: string;
    teacherId?: string;
    status?: string;
    search?: string;
  }): Promise<any[]> {
    const queryBuilder = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.subjectTeachers', 'subjectTeachers')
      .leftJoinAndSelect('subjectTeachers.teacher', 'teacher');

    // Filter by classId if provided (backward compatibility)
    if (filters?.classId) {
      queryBuilder.andWhere('subject.classId = :classId', { classId: filters.classId });
    }

    // Filter by teacherId - check in subject_teachers junction table
    if (filters?.teacherId) {
      queryBuilder.andWhere('subjectTeachers.teacherId = :teacherId', { teacherId: filters.teacherId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('subject.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(subject.subjectName ILIKE :search OR subject.subjectCode ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const subjects = await queryBuilder
      .orderBy('subject.subjectName', 'ASC')
      .getMany();

    // Transform to include teachers array and primary teacher
    return subjects.map((subject) => {
      const teachers = subject.subjectTeachers?.map((st) => ({
        teacherId: st.teacherId,
        name: st.teacher?.name,
        isPrimary: st.isPrimary,
      })) || [];

      const primaryTeacher = teachers.find((t) => t.isPrimary);

      return {
        ...subject,
        teachers,
        primaryTeacher: primaryTeacher || null,
        // Keep backward compatibility
        teacherId: subject.teacherId || primaryTeacher?.teacherId || null,
        teacherName: primaryTeacher?.name || null,
      };
    });
  }

  async findOne(subjectId: string): Promise<any> {
    const subject = await this.subjectRepository.findOne({
      where: { subjectId },
      relations: ['subjectTeachers', 'subjectTeachers.teacher'],
    });

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} not found`);
    }

    const teachers = subject.subjectTeachers?.map((st) => ({
      teacherId: st.teacherId,
      name: st.teacher?.name,
      isPrimary: st.isPrimary,
    })) || [];

    const primaryTeacher = teachers.find((t) => t.isPrimary);

    return {
      ...subject,
      teachers,
      primaryTeacher: primaryTeacher || null,
      teacherId: subject.teacherId || primaryTeacher?.teacherId || null,
      teacherName: primaryTeacher?.name || null,
    };
  }

  async findByClass(classId: string): Promise<any[]> {
    return this.findAll({ classId, status: 'Active' });
  }

  async create(createDto: CreateSubjectDto): Promise<any> {
    try {
      // Create subject - teachers are assigned from teacher side only
      const subjectData: any = {
        subjectId: createDto.subjectId,
        subjectName: createDto.subjectName,
        subjectCode: createDto.subjectCode,
        classId: createDto.classId || undefined,
        description: createDto.description,
        credits: createDto.credits,
        hoursPerWeek: createDto.hoursPerWeek,
        status: createDto.status || 'Active',
      };

      const subject = this.subjectRepository.create(subjectData);
      await this.subjectRepository.save(subject);

      // Return the complete subject with teachers (if any assigned from teacher side)
      return this.findOne(createDto.subjectId);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A subject with this ID or code already exists');
      }
      throw error;
    }
  }

  async update(subjectId: string, updateDto: UpdateSubjectDto): Promise<any> {
    const subject = await this.subjectRepository.findOne({
      where: { subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} not found`);
    }

    try {
      // Update subject fields only - teachers are assigned from teacher side only
      if (updateDto.subjectName !== undefined) subject.subjectName = updateDto.subjectName;
      if (updateDto.subjectCode !== undefined) subject.subjectCode = updateDto.subjectCode;
      if (updateDto.classId !== undefined) subject.classId = updateDto.classId;
      if (updateDto.description !== undefined) subject.description = updateDto.description;
      if (updateDto.credits !== undefined) subject.credits = updateDto.credits;
      if (updateDto.hoursPerWeek !== undefined) subject.hoursPerWeek = updateDto.hoursPerWeek;
      if (updateDto.status !== undefined) subject.status = updateDto.status;

      await this.subjectRepository.save(subject);
      return this.findOne(subjectId);
    } catch (error) {
      throw error;
    }
  }

  async remove(subjectId: string): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} not found`);
    }

    await this.subjectRepository.remove(subject);
  }

  async bulkDelete(subjectIds: string[]): Promise<void> {
    if (!subjectIds || subjectIds.length === 0) {
      throw new NotFoundException('No subject IDs provided for deletion');
    }

    // Verify all subjects exist
    const existingSubjects = await this.subjectRepository.find({
      where: subjectIds.map((id) => ({ subjectId: id })),
    });

    if (existingSubjects.length !== subjectIds.length) {
      const foundIds = existingSubjects.map((s) => s.subjectId);
      const missingIds = subjectIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Subjects not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.subjectRepository.delete(subjectIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete subjects that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getForDropdown(classId?: string): Promise<Array<{ subjectId: string; subjectName: string; subjectCode: string }>> {
    const subjects = await this.findAll({ classId, status: 'Active' });
    return subjects.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
    }));
  }

  // ============================================
  // Subject-Teacher Association Methods
  // ============================================

  async getSubjectTeachers(subjectId: string): Promise<any[]> {
    const subjectTeachers = await this.subjectTeacherRepository.find({
      where: { subjectId },
      relations: ['teacher'],
    });

    return subjectTeachers.map((st) => ({
      teacherId: st.teacherId,
      name: st.teacher?.name,
      email: st.teacher?.email,
      isPrimary: st.isPrimary,
    }));
  }

  async addTeacherToSubject(dto: CreateSubjectTeacherDto): Promise<any> {
    // Check if subject exists
    const subject = await this.subjectRepository.findOne({
      where: { subjectId: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subjectId} not found`);
    }

    // Check if teacher exists
    const teacher = await this.teacherRepository.findOne({
      where: { teacherId: dto.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher ${dto.teacherId} not found`);
    }

    // Check if relationship already exists
    const existing = await this.subjectTeacherRepository.findOne({
      where: { subjectId: dto.subjectId, teacherId: dto.teacherId },
    });
    if (existing) {
      throw new ConflictException('This teacher is already assigned to this subject');
    }

    // If setting as primary, unset other primaries
    if (dto.isPrimary) {
      await this.subjectTeacherRepository.update(
        { subjectId: dto.subjectId },
        { isPrimary: false },
      );

      // Also update the subject's teacherId for backward compatibility
      subject.teacherId = dto.teacherId;
      await this.subjectRepository.save(subject);
    }

    const subjectTeacher = this.subjectTeacherRepository.create(dto);
    await this.subjectTeacherRepository.save(subjectTeacher);

    return this.getSubjectTeachers(dto.subjectId);
  }

  async removeTeacherFromSubject(subjectId: string, teacherId: string): Promise<void> {
    const subjectTeacher = await this.subjectTeacherRepository.findOne({
      where: { subjectId, teacherId },
    });

    if (!subjectTeacher) {
      throw new NotFoundException('Teacher is not assigned to this subject');
    }

    await this.subjectTeacherRepository.remove(subjectTeacher);

    // If this was the primary teacher, clear the subject's teacherId
    if (subjectTeacher.isPrimary) {
      const subject = await this.subjectRepository.findOne({
        where: { subjectId },
      });
      if (subject) {
        (subject as any).teacherId = undefined;
        await this.subjectRepository.save(subject);
      }
    }
  }

  async setPrimaryTeacher(subjectId: string, teacherId: string): Promise<any> {
    // Unset all primaries for this subject
    await this.subjectTeacherRepository.update(
      { subjectId },
      { isPrimary: false },
    );

    // Set the new primary
    const result = await this.subjectTeacherRepository.update(
      { subjectId, teacherId },
      { isPrimary: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Teacher is not assigned to this subject');
    }

    // Update subject's teacherId for backward compatibility
    const subject = await this.subjectRepository.findOne({
      where: { subjectId },
    });
    if (subject) {
      subject.teacherId = teacherId;
      await this.subjectRepository.save(subject);
    }

    return this.getSubjectTeachers(subjectId);
  }
}
