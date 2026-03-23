import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { TeacherAssignment } from './teacher-assignment.entity';
import { Teacher } from './teacher.entity';
import { Class } from '../classes/class.entity';
import { Section } from '../sections/section.entity';
import { Subject } from '../subjects/subject.entity';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

export class TeacherAssignmentsService {
  private readonly assignmentRepository: Repository<TeacherAssignment>;
  private readonly teacherRepository: Repository<Teacher>;
  private readonly classRepository: Repository<Class>;
  private readonly sectionRepository: Repository<Section>;
  private readonly subjectRepository: Repository<Subject>;

  constructor(dataSource: DataSource) {
    this.assignmentRepository = dataSource.getRepository(TeacherAssignment);
    this.teacherRepository = dataSource.getRepository(Teacher);
    this.classRepository = dataSource.getRepository(Class);
    this.sectionRepository = dataSource.getRepository(Section);
    this.subjectRepository = dataSource.getRepository(Subject);
  }

  async findAll(filters?: {
    teacherId?: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    academicYear?: string;
    status?: string;
  }): Promise<any[]> {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.teacher', 'teacher')
      .leftJoinAndSelect('assignment.class', 'class')
      .leftJoinAndSelect('assignment.section', 'section')
      .leftJoinAndSelect('assignment.subject', 'subject');

    if (filters?.teacherId) {
      queryBuilder.andWhere('assignment.teacherId = :teacherId', { teacherId: filters.teacherId });
    }

    if (filters?.classId) {
      queryBuilder.andWhere('assignment.classId = :classId', { classId: filters.classId });
    }

    if (filters?.sectionId) {
      queryBuilder.andWhere('assignment.sectionId = :sectionId', { sectionId: filters.sectionId });
    }

    if (filters?.subjectId) {
      queryBuilder.andWhere('assignment.subjectId = :subjectId', { subjectId: filters.subjectId });
    }

    if (filters?.academicYear) {
      queryBuilder.andWhere('assignment.academicYear = :academicYear', { academicYear: filters.academicYear });
    }

    if (filters?.status) {
      queryBuilder.andWhere('assignment.status = :status', { status: filters.status });
    }

    const assignments = await queryBuilder
      .orderBy('assignment.createdAt', 'DESC')
      .getMany();

    return assignments.map((a) => ({
      id: a.id,
      teacherId: a.teacherId,
      teacherName: a.teacher?.name,
      classId: a.classId,
      className: a.class?.className,
      sectionId: a.sectionId,
      sectionName: a.section?.sectionName,
      subjectId: a.subjectId,
      subjectName: a.subject?.subjectName,
      isDefault: a.isDefault,
      academicYear: a.academicYear,
      startDate: a.startDate,
      endDate: a.endDate,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  async findOne(id: number): Promise<any> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['teacher', 'class', 'section', 'subject'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    return {
      id: assignment.id,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacher?.name,
      classId: assignment.classId,
      className: assignment.class?.className,
      sectionId: assignment.sectionId,
      sectionName: assignment.section?.sectionName,
      subjectId: assignment.subjectId,
      subjectName: assignment.subject?.subjectName,
      isDefault: assignment.isDefault,
      academicYear: assignment.academicYear,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  async create(createDto: CreateTeacherAssignmentDto): Promise<any> {
    // Validate teacher exists
    const teacher = await this.teacherRepository.findOne({
      where: { teacherId: createDto.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher ${createDto.teacherId} not found`);
    }

    // Validate class exists
    const classEntity = await this.classRepository.findOne({
      where: { classId: createDto.classId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class ${createDto.classId} not found`);
    }

    // Validate section exists
    const section = await this.sectionRepository.findOne({
      where: { sectionId: createDto.sectionId },
    });
    if (!section) {
      throw new NotFoundException(`Section ${createDto.sectionId} not found`);
    }

    // Validate subject exists
    const subject = await this.subjectRepository.findOne({
      where: { subjectId: createDto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${createDto.subjectId} not found`);
    }

    try {
      const assignment = this.assignmentRepository.create({
        ...createDto,
        status: createDto.status || 'Active',
      });
      const saved = await this.assignmentRepository.save(assignment);
      return this.findOne(saved.id);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('This assignment already exists');
      }
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateTeacherAssignmentDto): Promise<any> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    Object.assign(assignment, updateDto);
    await this.assignmentRepository.save(assignment);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    await this.assignmentRepository.remove(assignment);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    await this.assignmentRepository.delete(ids);
  }

  // ============================================
  // Specialized Query Methods
  // ============================================

  async getTeacherForClassSectionSubject(
    classId: string,
    sectionId: string,
    subjectId: string,
    academicYear?: string,
  ): Promise<any | null> {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.teacher', 'teacher')
      .where('assignment.classId = :classId', { classId })
      .andWhere('assignment.sectionId = :sectionId', { sectionId })
      .andWhere('assignment.subjectId = :subjectId', { subjectId })
      .andWhere('assignment.status = :status', { status: 'Active' });

    if (academicYear) {
      queryBuilder.andWhere('assignment.academicYear = :academicYear', { academicYear });
    }

    // Prefer default assignment
    queryBuilder.orderBy('assignment.isDefault', 'DESC');

    const assignment = await queryBuilder.getOne();

    if (!assignment) {
      return null;
    }

    return {
      teacherId: assignment.teacherId,
      teacherName: assignment.teacher?.name,
      isDefault: assignment.isDefault,
    };
  }

  async getSubjectsForClassSection(
    classId: string,
    sectionId: string,
    academicYear?: string,
  ): Promise<any[]> {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.subject', 'subject')
      .leftJoinAndSelect('assignment.teacher', 'teacher')
      .where('assignment.classId = :classId', { classId })
      .andWhere('assignment.sectionId = :sectionId', { sectionId })
      .andWhere('assignment.status = :status', { status: 'Active' });

    if (academicYear) {
      queryBuilder.andWhere('assignment.academicYear = :academicYear', { academicYear });
    }

    const assignments = await queryBuilder.getMany();

    // Group by subject
    const subjectMap = new Map();
    assignments.forEach((a) => {
      if (!subjectMap.has(a.subjectId)) {
        subjectMap.set(a.subjectId, {
          subjectId: a.subjectId,
          subjectName: a.subject?.subjectName,
          subjectCode: a.subject?.subjectCode,
          teachers: [],
        });
      }
      subjectMap.get(a.subjectId).teachers.push({
        teacherId: a.teacherId,
        teacherName: a.teacher?.name,
        isDefault: a.isDefault,
      });
    });

    return Array.from(subjectMap.values());
  }

  async getAssignmentsForTeacher(teacherId: string, academicYear?: string): Promise<any[]> {
    return this.findAll({ teacherId, academicYear, status: 'Active' });
  }

  async getTeachersForSubject(subjectId: string): Promise<any[]> {
    const assignments = await this.findAll({ subjectId, status: 'Active' });

    // Group by teacher
    const teacherMap = new Map();
    assignments.forEach((a) => {
      if (!teacherMap.has(a.teacherId)) {
        teacherMap.set(a.teacherId, {
          teacherId: a.teacherId,
          teacherName: a.teacherName,
          classSections: [],
        });
      }
      teacherMap.get(a.teacherId).classSections.push({
        classId: a.classId,
        className: a.className,
        sectionId: a.sectionId,
        sectionName: a.sectionName,
      });
    });

    return Array.from(teacherMap.values());
  }
}
