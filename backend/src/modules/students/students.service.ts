import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

export class StudentsService {
  private readonly studentRepository: Repository<Student>;

  constructor(private readonly dataSource: DataSource) {
    this.studentRepository = dataSource.getRepository(Student);
  }

  private normalizeData<T>(data: T): T {
    const normalized = { ...data } as any;
    for (const key in normalized) {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = null;
      }
    }
    return normalized as T;
  }

  async findAll(filters?: {
    classId?: string;
    sectionId?: string;
    status?: string;
    search?: string;
  }): Promise<Student[]> {
    try {
      const queryBuilder = this.studentRepository.createQueryBuilder('student');

      if (filters?.classId) {
        queryBuilder.andWhere('student.classId = :classId', { classId: filters.classId });
      }

      if (filters?.sectionId) {
        queryBuilder.andWhere('student.sectionId = :sectionId', { sectionId: filters.sectionId });
      }

      if (filters?.status) {
        queryBuilder.andWhere('student.status = :status', { status: filters.status });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(student.name ILIKE :search OR student.studentId ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      return await queryBuilder
        .orderBy('student.classId', 'ASC', 'NULLS LAST')
        .addOrderBy('student.sectionId', 'ASC', 'NULLS LAST')
        .addOrderBy('student.rollNo', 'ASC', 'NULLS LAST')
        .getMany();
    } catch (error: any) {
      console.error('Error in findAll students:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  }

  async findOne(studentId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    return student;
  }

  async create(createDto: CreateStudentDto): Promise<Student> {
    try {
      console.log('Creating student with data:', JSON.stringify(createDto, null, 2));
      
      // If classId, sectionId, and rollNo are all provided, check for uniqueness
      if (createDto.classId && createDto.sectionId && createDto.rollNo !== undefined) {
        const existing = await this.studentRepository.findOne({
          where: {
            classId: createDto.classId,
            sectionId: createDto.sectionId,
            rollNo: createDto.rollNo,
          },
        });
        if (existing) {
          throw new ConflictException(
            `A student with class ${createDto.classId}, section ${createDto.sectionId}, and roll number ${createDto.rollNo} already exists`,
          );
        }
      }

      // Normalize and convert empty strings to null for optional fields
      const studentData = this.normalizeData(createDto);

      console.log('Student data after processing:', JSON.stringify(studentData, null, 2));

      const student = this.studentRepository.create(studentData);
      const saved = await this.studentRepository.save(student);
      console.log('Student created successfully:', (saved as Student).studentId);
      return saved as Student;
    } catch (error: any) {
      console.error('Error creating student:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error detail:', error.detail);
      console.error('Error stack:', error.stack);
      
      if (error.code === '23505') {
        if (error.detail?.includes('student_id')) {
          throw new ConflictException('A student with this Student ID already exists');
        }
        throw new ConflictException('A student with this Class, Section, and Roll Number combination already exists');
      }
      
      if (error.code === '23502') {
        throw new ConflictException('Required field is missing. Please ensure all required fields are filled.');
      }
      
      if (error.code === '23503') {
        throw new ConflictException('Invalid class or section reference. Please check that the class and section exist.');
      }
      
      throw error;
    }
  }

  async update(studentId: string, updateDto: UpdateStudentDto): Promise<Student> {
    try {
      const student = await this.findOne(studentId);
      
      // Determine the final values after update
      const finalClassId = updateDto.classId !== undefined ? updateDto.classId : student.classId;
      const finalSectionId = updateDto.sectionId !== undefined ? updateDto.sectionId : student.sectionId;
      const finalRollNo = updateDto.rollNo !== undefined ? updateDto.rollNo : student.rollNo;

      // If classId, sectionId, and rollNo are all provided, check for uniqueness (excluding current student)
      if (finalClassId && finalSectionId && finalRollNo !== undefined && finalRollNo !== null) {
        const existing = await this.studentRepository.findOne({
          where: {
            classId: finalClassId,
            sectionId: finalSectionId,
            rollNo: finalRollNo,
          },
        });
        if (existing && existing.studentId !== studentId) {
          throw new ConflictException(
            `A student with class ${finalClassId}, section ${finalSectionId}, and roll number ${finalRollNo} already exists`,
          );
        }
      }

      const normalizedUpdates = this.normalizeData(updateDto);
      Object.assign(student, normalizedUpdates);
      return await this.studentRepository.save(student);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A student with this Class, Section, and Roll Number combination already exists');
      }
      throw error;
    }
  }

  async remove(studentId: string): Promise<void> {
    const student = await this.findOne(studentId);
    await this.studentRepository.remove(student);
  }

  async bulkDelete(studentIds: string[]): Promise<void> {
    if (!studentIds || studentIds.length === 0) {
      throw new NotFoundException('No student IDs provided for deletion');
    }

    // Verify all students exist
    const existingStudents = await this.studentRepository.find({
      where: studentIds.map((id) => ({ studentId: id })),
    });

    if (existingStudents.length !== studentIds.length) {
      const foundIds = existingStudents.map((s) => s.studentId);
      const missingIds = studentIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Students not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.studentRepository.delete(studentIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete students that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getByClassAndSection(classId: string, sectionId: string): Promise<Student[]> {
    return this.findAll({ classId, sectionId });
  }

  async rename(oldId: string, newId: string): Promise<Student> {
    const student = await this.findOne(oldId);

    if (!student) {
      throw new NotFoundException(`Student ${oldId} not found`);
    }

    // Check if new ID already exists
    const existing = await this.studentRepository.findOne({
      where: { studentId: newId },
    });
    if (existing) {
      throw new ConflictException(`A student with ID ${newId} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update marks table
      await queryRunner.manager
        .createQueryBuilder()
        .update('marks')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update results table
      await queryRunner.manager
        .createQueryBuilder()
        .update('results')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update student_attempts table
      await queryRunner.manager
        .createQueryBuilder()
        .update('student_attempt')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update student_habits table
      await queryRunner.manager
        .createQueryBuilder()
        .update('student_habits')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update users table
      await queryRunner.manager
        .createQueryBuilder()
        .update('users')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update student_enrollments table
      await queryRunner.manager
        .createQueryBuilder()
        .update('student_enrollments')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update batch_students table
      await queryRunner.manager
        .createQueryBuilder()
        .update('batch_students')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update attendance table
      await queryRunner.manager
        .createQueryBuilder()
        .update('attendance')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update broadcast_messages table
      await queryRunner.manager
        .createQueryBuilder()
        .update('broadcast_messages')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Update payment_reminders table
      await queryRunner.manager
        .createQueryBuilder()
        .update('payment_reminders')
        .set({ studentId: newId })
        .where('student_id = :oldId', { oldId })
        .execute();

      // Delete old student and create new one with updated ID
      await queryRunner.manager.remove(student);
      
      const updatedStudent = this.studentRepository.create({
        ...student,
        studentId: newId,
      });
      
      await queryRunner.manager.save(updatedStudent);

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
