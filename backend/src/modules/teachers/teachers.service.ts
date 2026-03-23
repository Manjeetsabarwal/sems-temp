import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Teacher } from './teacher.entity';
import { SubjectTeacher } from '../subjects/subject-teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherAssignment } from './teacher-assignment.entity';

export class TeachersService {
  private readonly teacherRepository: Repository<Teacher>;
  private readonly subjectTeacherRepository: Repository<SubjectTeacher>;

  constructor(private readonly dataSource: DataSource) {
    this.teacherRepository = dataSource.getRepository(Teacher);
    this.subjectTeacherRepository = dataSource.getRepository(SubjectTeacher);
  }

  async findAll(filters?: { status?: string; search?: string }): Promise<any[]> {
    const queryBuilder = this.teacherRepository.createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.subjectTeachers', 'subjectTeachers')
      .leftJoinAndSelect('subjectTeachers.subject', 'subject');

    if (filters?.status) {
      queryBuilder.andWhere('teacher.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(teacher.name ILIKE :search OR teacher.email ILIKE :search OR teacher.teacherId ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const teachers = await queryBuilder
      .orderBy('teacher.name', 'ASC')
      .getMany();

    // Transform to include subjects from subject_teachers table
    return teachers.map((teacher) => {
      const subjects = teacher.subjectTeachers?.map((st) => ({
        subjectId: st.subject?.subjectId,
        subjectName: st.subject?.subjectName,
        subjectCode: st.subject?.subjectCode,
        isPrimary: st.isPrimary,
      })) || [];

      return {
        ...teacher,
        subjects: subjects.map(s => s.subjectId).filter(Boolean), // Keep backward compatibility
        subjectDetails: subjects, // New field with full details
      };
    });
  }

  async findOne(teacherId: string): Promise<any> {
    const teacher = await this.teacherRepository.findOne({
      where: { teacherId },
      relations: ['subjectTeachers', 'subjectTeachers.subject'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher ${teacherId} not found`);
    }

    // Get subjects from subject_teachers table
    const subjects = teacher.subjectTeachers?.map((st) => ({
      subjectId: st.subject?.subjectId,
      subjectName: st.subject?.subjectName,
      subjectCode: st.subject?.subjectCode,
      isPrimary: st.isPrimary,
    })) || [];

    return {
      ...teacher,
      subjects: subjects.map(s => s.subjectId).filter(Boolean), // Keep backward compatibility
      subjectDetails: subjects, // New field with full details
    };
  }

  async create(createDto: CreateTeacherDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const teacher = this.teacherRepository.create({
        teacherId: createDto.teacherId,
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone,
        qualification: createDto.qualification,
        experience: createDto.experience,
        joiningDate: createDto.joiningDate ? new Date(createDto.joiningDate) : undefined,
        address: createDto.address,
        status: createDto.status || 'Active',
        subjects: createDto.subjects || [], // Keep for backward compatibility
        classes: createDto.classes || [],
      });
      
      await queryRunner.manager.save(teacher);

      // Sync subject relationships if subjects are provided
      const primarySubject = (createDto as any).primarySubject || '';
      const additionalSubjects = (createDto as any).additionalSubjects || [];
      const allSubjects = createDto.subjects || [];
      
      // If primarySubject is specified, use it; otherwise use first subject in array
      const primarySubjectId = primarySubject || (allSubjects.length > 0 ? allSubjects[0] : '');
      const additionalSubjectIds = primarySubject 
        ? additionalSubjects 
        : (allSubjects.length > 1 ? allSubjects.slice(1) : []);
      
      // Create primary subject relationship
      if (primarySubjectId) {
        // Unset any existing primary for this subject
        await queryRunner.manager.update(SubjectTeacher, 
          { subjectId: primarySubjectId },
          { isPrimary: false }
        );
        
        const primarySubjectTeacher = queryRunner.manager.create(SubjectTeacher, {
          subjectId: primarySubjectId,
          teacherId: teacher.teacherId,
          isPrimary: true,
        });
        await queryRunner.manager.save(primarySubjectTeacher);
      }
      
      // Create additional subject relationships
      for (const subjectId of additionalSubjectIds) {
        if (subjectId === primarySubjectId) continue; // Skip if already added as primary
        
        const subjectTeacher = queryRunner.manager.create(SubjectTeacher, {
          subjectId,
          teacherId: teacher.teacherId,
          isPrimary: false, // Additional subjects are never primary
        });
        await queryRunner.manager.save(subjectTeacher);
      }

      await queryRunner.commitTransaction();
      return this.findOne(teacher.teacherId);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === '23505') {
        throw new ConflictException('A teacher with this ID or email already exists');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(teacherId: string, updateDto: UpdateTeacherDto): Promise<any> {
    const teacher = await this.teacherRepository.findOne({
      where: { teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher ${teacherId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update basic teacher fields
      if (updateDto.name !== undefined) teacher.name = updateDto.name;
      if (updateDto.email !== undefined) teacher.email = updateDto.email;
      if (updateDto.phone !== undefined) teacher.phone = updateDto.phone;
      if (updateDto.qualification !== undefined) teacher.qualification = updateDto.qualification;
      if (updateDto.experience !== undefined) teacher.experience = updateDto.experience;
      if (updateDto.joiningDate !== undefined) {
        teacher.joiningDate = new Date(updateDto.joiningDate);
      }
      if (updateDto.address !== undefined) teacher.address = updateDto.address;
      if (updateDto.status !== undefined) teacher.status = updateDto.status;
      if (updateDto.classes !== undefined) teacher.classes = updateDto.classes; // Keep for backward compatibility

      await queryRunner.manager.save(teacher);

      // Sync subject relationships if subjects are provided
      if (updateDto.subjects !== undefined) {
        // Remove existing subject-teacher relationships for this teacher
        await queryRunner.manager.delete(SubjectTeacher, { teacherId });

        // Get primary and additional subjects
        const primarySubject = (updateDto as any).primarySubject || '';
        const additionalSubjects = (updateDto as any).additionalSubjects || [];
        const allSubjects = updateDto.subjects || [];
        
        // If primarySubject is specified, use it; otherwise use first subject in array
        const primarySubjectId = primarySubject || (allSubjects.length > 0 ? allSubjects[0] : '');
        const additionalSubjectIds = primarySubject 
          ? additionalSubjects 
          : (allSubjects.length > 1 ? allSubjects.slice(1) : []);
        
        // Create primary subject relationship
        if (primarySubjectId) {
          // Unset any existing primary for this subject
          await queryRunner.manager.update(SubjectTeacher, 
            { subjectId: primarySubjectId },
            { isPrimary: false }
          );
          
          const primarySubjectTeacher = queryRunner.manager.create(SubjectTeacher, {
            subjectId: primarySubjectId,
            teacherId,
            isPrimary: true,
          });
          await queryRunner.manager.save(primarySubjectTeacher);
        }
        
        // Create additional subject relationships
        for (const subjectId of additionalSubjectIds) {
          if (subjectId === primarySubjectId) continue; // Skip if already added as primary
          
          // Check if this subject already has a primary teacher
          const existingPrimary = await queryRunner.manager.findOne(SubjectTeacher, {
            where: { subjectId, isPrimary: true },
          });

          const subjectTeacher = queryRunner.manager.create(SubjectTeacher, {
            subjectId,
            teacherId,
            isPrimary: false, // Additional subjects are never primary
          });
          await queryRunner.manager.save(subjectTeacher);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(teacherId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(teacherId: string): Promise<void> {
    const teacher = await this.findOne(teacherId);
    await this.teacherRepository.remove(teacher);
  }

  async bulkDelete(teacherIds: string[]): Promise<void> {
    if (!teacherIds || teacherIds.length === 0) {
      throw new NotFoundException('No teacher IDs provided for deletion');
    }

    // Verify all teachers exist
    const existingTeachers = await this.teacherRepository.find({
      where: teacherIds.map((id) => ({ teacherId: id })),
    });

    if (existingTeachers.length !== teacherIds.length) {
      const foundIds = existingTeachers.map((t) => t.teacherId);
      const missingIds = teacherIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Teachers not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.teacherRepository.delete(teacherIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete teachers that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getForDropdown(): Promise<Array<{ teacherId: string; name: string }>> {
    const teachers = await this.findAll({ status: 'Active' });
    return teachers.map((t) => ({
      teacherId: t.teacherId,
      name: t.name,
    }));
  }

  async rename(oldId: string, newId: string): Promise<any> {
    const teacher = await this.findOne(oldId);

    if (!teacher) {
      throw new NotFoundException(`Teacher ${oldId} not found`);
    }

    // Check if new ID already exists
    const existing = await this.teacherRepository.findOne({
      where: { teacherId: newId },
    });
    if (existing) {
      throw new ConflictException(`A teacher with ID ${newId} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update subject_teachers table
      await queryRunner.manager
        .createQueryBuilder()
        .update(SubjectTeacher)
        .set({ teacherId: newId })
        .where('teacherId = :oldId', { oldId })
        .execute();

      // Update teacher_assignments table
      await queryRunner.manager
        .createQueryBuilder()
        .update('teacher_assignments')
        .set({ teacherId: newId })
        .where('teacher_id = :oldId', { oldId })
        .execute();

      // Update subjects table (backward compatibility - teacherId field)
      await queryRunner.manager
        .createQueryBuilder()
        .update('subjects')
        .set({ teacherId: newId })
        .where('teacher_id = :oldId', { oldId })
        .execute();

      // Update users table
      await queryRunner.manager
        .createQueryBuilder()
        .update('users')
        .set({ teacherId: newId })
        .where('teacher_id = :oldId', { oldId })
        .execute();

      // Delete old teacher and create new one with updated ID
      await queryRunner.manager.remove(teacher);
      
      const updatedTeacher = this.teacherRepository.create({
        ...teacher,
        teacherId: newId,
      });
      
      await queryRunner.manager.save(updatedTeacher);

      await queryRunner.commitTransaction();
      return this.findOne(newId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
