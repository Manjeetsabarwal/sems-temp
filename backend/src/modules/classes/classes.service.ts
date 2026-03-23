import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Class } from './class.entity';
import { ClassSection } from './class-section.entity';
import { Student } from '../students/student.entity';
import { Section } from '../sections/section.entity';
import { Subject } from '../subjects/subject.entity';
import { Exam } from '../exams/exam.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

export class ClassesService {
  private readonly classRepository: Repository<Class>;
  private readonly classSectionRepository: Repository<ClassSection>;
  private readonly studentRepository: Repository<Student>;
  private readonly sectionRepository: Repository<Section>;
  private readonly subjectRepository: Repository<Subject>;
  private readonly examRepository: Repository<Exam>;

  constructor(private readonly dataSource: DataSource) {
    this.classRepository = dataSource.getRepository(Class);
    this.classSectionRepository = dataSource.getRepository(ClassSection);
    this.studentRepository = dataSource.getRepository(Student);
    this.sectionRepository = dataSource.getRepository(Section);
    this.subjectRepository = dataSource.getRepository(Subject);
    this.examRepository = dataSource.getRepository(Exam);
  }

  async findAll(filters?: { status?: string; search?: string }): Promise<any[]> {
    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.classSections', 'classSections')
      .leftJoinAndSelect('classSections.section', 'section')
      .select([
        'class.classId',
        'class.className',
        'class.academicYearId',
        'class.classTeacherId',
        'class.description',
        'class.capacity',
        'class.totalStudents',
        'class.status',
        'class.createdAt',
        'class.updatedAt',
        'classSections.id',
        'classSections.sectionId',
        'classSections.status',
        'section.sectionId',
        'section.sectionName',
      ]);

    if (filters?.status) {
      queryBuilder.andWhere('class.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(class.className ILIKE :search OR class.classId ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const classes = await queryBuilder.orderBy('class.className', 'ASC').getMany();

    // Calculate actual student count for each class and transform
    const classesWithCounts = await Promise.all(
      classes.map(async (classEntity) => {
        const studentCount = await this.studentRepository.count({
          where: { classId: classEntity.classId, status: 'Active' },
        });

        const sections = classEntity.classSections?.map((cs) => ({
          sectionId: cs.sectionId,
          sectionName: cs.section?.sectionName,
          status: cs.status,
        })) || [];

        return {
          ...classEntity,
          sections,
          currentStrength: studentCount,
        };
      }),
    );

    return classesWithCounts;
  }

  async findOne(classId: string): Promise<any> {
    const classEntity = await this.classRepository.findOne({
      where: { classId },
      relations: ['classSections', 'classSections.section'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    // Calculate actual student count
    const studentCount = await this.studentRepository.count({
      where: { classId: classEntity.classId, status: 'Active' },
    });

    const sections = classEntity.classSections?.map((cs) => ({
      sectionId: cs.sectionId,
      sectionName: cs.section?.sectionName,
      status: cs.status,
    })) || [];

    return {
      ...classEntity,
      sections,
      currentStrength: studentCount,
    };
  }

  async create(createDto: CreateClassDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const classData = {
        classId: createDto.classId,
        className: createDto.className,
        academicYearId: createDto.academicYearId,
        classTeacherId: createDto.classTeacherId,
        description: createDto.description,
        capacity: createDto.capacity,
        totalStudents: createDto.totalStudents || 0,
        status: createDto.status || 'Active',
      };

      const classEntity = this.classRepository.create(classData);
      const savedClass = await queryRunner.manager.save(classEntity);

      // Handle section assignments
      const sectionIds = createDto.sectionIds || [];
      for (const sectionId of sectionIds) {
        const classSection = this.classSectionRepository.create({
          classId: savedClass.classId,
          sectionId,
          status: 'Active',
        });
        await queryRunner.manager.save(classSection);
      }

      await queryRunner.commitTransaction();

      // Return the complete class with sections
      return this.findOne(savedClass.classId);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === '23505') {
        throw new ConflictException('A class with this ID already exists');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(classId: string, updateDto: UpdateClassDto): Promise<any> {
    // Get the class entity directly
    const classEntity = await this.classRepository.findOne({
      where: { classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }
    
    // If classId is being changed, we need to cascade update all related records
    if (updateDto.classId && updateDto.classId !== classId) {
      const newClassId = updateDto.classId;
      
      // Check if new classId already exists
      const existingClass = await this.classRepository.findOne({
        where: { classId: newClassId },
      });
      
      if (existingClass) {
        throw new ConflictException(`A class with ID "${newClassId}" already exists`);
      }

      // Use a transaction to update all related records
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update all students
        await queryRunner.manager
          .createQueryBuilder()
          .update(Student)
          .set({ classId: newClassId })
          .where('classId = :oldClassId', { oldClassId: classId })
          .execute();

        // Update all sections (legacy classId)
        await queryRunner.manager
          .createQueryBuilder()
          .update(Section)
          .set({ classId: newClassId })
          .where('classId = :oldClassId', { oldClassId: classId })
          .execute();

        // Update class_sections
        await queryRunner.manager
          .createQueryBuilder()
          .update(ClassSection)
          .set({ classId: newClassId })
          .where('classId = :oldClassId', { oldClassId: classId })
          .execute();

        // Update all subjects (legacy classId)
        await queryRunner.manager
          .createQueryBuilder()
          .update(Subject)
          .set({ classId: newClassId })
          .where('classId = :oldClassId', { oldClassId: classId })
          .execute();

        // Update all exams
        await queryRunner.manager
          .createQueryBuilder()
          .update(Exam)
          .set({ classId: newClassId })
          .where('classId = :oldClassId', { oldClassId: classId })
          .execute();

        // Delete old class and create new one with updated data
        await queryRunner.manager.remove(classEntity);
        
        const updatedClass = this.classRepository.create({
          ...classEntity,
          ...updateDto,
          classId: newClassId,
        });
        
        await queryRunner.manager.save(updatedClass);
        
        await queryRunner.commitTransaction();
        return this.findOne(newClassId);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      // Normal update without classId change
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update class fields
        if (updateDto.className !== undefined) classEntity.className = updateDto.className;
        if (updateDto.academicYearId !== undefined) classEntity.academicYearId = updateDto.academicYearId;
        if (updateDto.classTeacherId !== undefined) classEntity.classTeacherId = updateDto.classTeacherId;
        if (updateDto.description !== undefined) classEntity.description = updateDto.description;
        if (updateDto.capacity !== undefined) classEntity.capacity = updateDto.capacity;
        if (updateDto.totalStudents !== undefined) classEntity.totalStudents = updateDto.totalStudents;
        if (updateDto.status !== undefined) classEntity.status = updateDto.status;

        await queryRunner.manager.save(classEntity);

        // Update section relationships if provided
        if (updateDto.sectionIds !== undefined) {
          // Remove existing relationships
          await queryRunner.manager.delete(ClassSection, { classId });

          // Create new relationships
          for (const sectionId of updateDto.sectionIds) {
            const classSection = this.classSectionRepository.create({
              classId,
              sectionId,
              status: 'Active',
            });
            await queryRunner.manager.save(classSection);
          }
        }

        await queryRunner.commitTransaction();
        return this.findOne(classId);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  async remove(classId: string): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    await this.classRepository.remove(classEntity);
  }

  async bulkDelete(classIds: string[]): Promise<void> {
    if (!classIds || classIds.length === 0) {
      throw new NotFoundException('No class IDs provided for deletion');
    }

    // Verify all classes exist
    const existingClasses = await this.classRepository.find({
      where: classIds.map((id) => ({ classId: id })),
    });

    if (existingClasses.length !== classIds.length) {
      const foundIds = existingClasses.map((c) => c.classId);
      const missingIds = classIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Classes not found: ${missingIds.join(', ')}`,
      );
    }

    // Use transaction for consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete all classes (cascading will handle related records)
      await queryRunner.manager.delete(Class, classIds);
      await queryRunner.commitTransaction();
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete classes that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getForDropdown(): Promise<Array<{ classId: string; className: string }>> {
    const classes = await this.findAll({ status: 'Active' });
    return classes.map((c) => ({
      classId: c.classId,
      className: c.className,
    }));
  }

  // ============================================
  // Class-Section Association Methods
  // ============================================

  async getClassSections(classId: string): Promise<any[]> {
    const classSections = await this.classSectionRepository.find({
      where: { classId },
      relations: ['section'],
    });

    return classSections.map((cs) => ({
      sectionId: cs.sectionId,
      sectionName: cs.section?.sectionName,
      capacity: cs.section?.capacity,
      status: cs.status,
    }));
  }

  async addSectionToClass(classId: string, sectionId: string): Promise<any[]> {
    // Check if class exists
    const classEntity = await this.classRepository.findOne({
      where: { classId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    // Check if section exists
    const section = await this.sectionRepository.findOne({
      where: { sectionId },
    });
    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    // Check if relationship already exists
    const existing = await this.classSectionRepository.findOne({
      where: { classId, sectionId },
    });
    if (existing) {
      throw new ConflictException('This section is already assigned to this class');
    }

    const classSection = this.classSectionRepository.create({
      classId,
      sectionId,
      status: 'Active',
    });
    await this.classSectionRepository.save(classSection);

    return this.getClassSections(classId);
  }

  async removeSectionFromClass(classId: string, sectionId: string): Promise<void> {
    const classSection = await this.classSectionRepository.findOne({
      where: { classId, sectionId },
    });

    if (!classSection) {
      throw new NotFoundException('Section is not assigned to this class');
    }

    await this.classSectionRepository.remove(classSection);
  }
}
