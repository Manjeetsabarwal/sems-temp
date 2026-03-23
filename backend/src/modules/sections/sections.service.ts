import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Section } from './section.entity';
import { ClassSection } from '../classes/class-section.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

export class SectionsService {
  private roomNumberColumnChecked = false;
  private readonly sectionRepository: Repository<Section>;
  private readonly classSectionRepository: Repository<ClassSection>;
  private readonly classRepository: Repository<Class>;
  private readonly studentRepository: Repository<Student>;

  constructor(private readonly dataSource: DataSource) {
    this.sectionRepository = dataSource.getRepository(Section);
    this.classSectionRepository = dataSource.getRepository(ClassSection);
    this.classRepository = dataSource.getRepository(Class);
    this.studentRepository = dataSource.getRepository(Student);
    // Check and add room_number column on service initialization
    this.ensureRoomNumberColumn();
  }

  private async ensureRoomNumberColumn(): Promise<void> {
    if (this.roomNumberColumnChecked) return;
    
    try {
      // Check if column exists
      const result = await this.sectionRepository.manager.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'sections' AND column_name = 'room_number'`
      );
      
      if (result.length === 0) {
        // Column doesn't exist, add it
        await this.sectionRepository.manager.query(
          `ALTER TABLE sections ADD COLUMN room_number TEXT`
        );
        console.log('✅ Added room_number column to sections table');
      }
      
      this.roomNumberColumnChecked = true;
    } catch (error: any) {
      // If we can't check/add the column, that's okay - the code will handle it gracefully
      console.warn('Could not ensure room_number column exists:', error.message);
      this.roomNumberColumnChecked = true; // Don't retry on every call
    }
  }

  async findAll(filters?: { classId?: string; status?: string }): Promise<any[]> {
    const queryBuilder = this.sectionRepository.createQueryBuilder('section')
      .leftJoinAndSelect('section.classSections', 'classSections')
      .leftJoinAndSelect('classSections.class', 'class')
      .select([
        'section.sectionId',
        'section.sectionName',
        'section.classId',
        'section.capacity',
        'section.currentStrength',
        'section.roomNumber',
        'section.status',
        'section.createdAt',
        'section.updatedAt',
        'classSections.id',
        'classSections.classId',
        'classSections.status',
        'class.classId',
        'class.className',
      ]);

    // Filter by classId - check both legacy classId and class_sections
    if (filters?.classId) {
      queryBuilder.andWhere(
        '(section.classId = :classId OR classSections.classId = :classId)',
        { classId: filters.classId }
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('section.status = :status', { status: filters.status });
    }

    const sections = await queryBuilder
      .orderBy('section.sectionName', 'ASC')
      .getMany();

    // Transform to include classes array and calculate current strength
    return Promise.all(sections.map(async (section) => {
      const classes = section.classSections?.map((cs) => ({
        classId: cs.classId,
        className: cs.class?.className,
        status: cs.status,
      })) || [];

      // Calculate actual student count for this section
      const studentCount = await this.studentRepository.count({
        where: { sectionId: section.sectionId, status: 'Active' },
      });

      return {
        ...section,
        classes,
        // Keep backward compatibility - use first class or legacy classId
        classId: section.classId || classes[0]?.classId || null,
        className: classes[0]?.className || null,
        // Override stored currentStrength with actual count
        currentStrength: studentCount,
      };
    }));
  }

  async findOne(sectionId: string): Promise<any> {
    const section = await this.sectionRepository.findOne({
      where: { sectionId },
      relations: ['classSections', 'classSections.class'],
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const classes = section.classSections?.map((cs) => ({
      classId: cs.classId,
      className: cs.class?.className,
      status: cs.status,
    })) || [];

    // Calculate actual student count for this section
    const studentCount = await this.studentRepository.count({
      where: { sectionId: section.sectionId, status: 'Active' },
    });

    return {
      ...section,
      classes,
      classId: section.classId || classes[0]?.classId || null,
      className: classes[0]?.className || null,
      // Override stored currentStrength with actual count
      currentStrength: studentCount,
    };
  }

  async findByClass(classId: string): Promise<any[]> {
    return this.findAll({ classId });
  }

  async create(createDto: CreateSectionDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Ensure room_number column exists
      await this.ensureRoomNumberColumn();
      
      // Create section
      const sectionData: any = {
        sectionId: createDto.sectionId,
        sectionName: createDto.sectionName,
        classId: createDto.classId || undefined, // Keep for backward compatibility
        capacity: createDto.capacity || 40,
        currentStrength: createDto.currentStrength || 0,
        roomNumber: createDto.roomNumber || undefined,
        status: createDto.status || 'Active',
      };

      const section = this.sectionRepository.create(sectionData);
      await queryRunner.manager.save(section);
      const sectionId = createDto.sectionId;

      // Handle class assignments
      const classIds = createDto.classIds || [];
      if (createDto.classId && !classIds.includes(createDto.classId)) {
        classIds.push(createDto.classId);
      }

      // Create class-section relationships
      for (const classId of classIds) {
        const classSection = this.classSectionRepository.create({
          classId,
          sectionId: sectionId,
          status: 'Active',
        });
        await queryRunner.manager.save(classSection);
      }

      await queryRunner.commitTransaction();

      // Return the complete section with classes
      return this.findOne(sectionId);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === '23505') {
        throw new ConflictException('A section with this ID or name in the same class already exists');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(sectionId: string, updateDto: UpdateSectionDto): Promise<any> {
    const section = await this.sectionRepository.findOne({
      where: { sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update section fields
      if (updateDto.sectionName !== undefined) section.sectionName = updateDto.sectionName;
      if (updateDto.classId !== undefined) section.classId = updateDto.classId;
      if (updateDto.capacity !== undefined) section.capacity = updateDto.capacity;
      if (updateDto.currentStrength !== undefined) section.currentStrength = updateDto.currentStrength;
      if (updateDto.roomNumber !== undefined) section.roomNumber = updateDto.roomNumber;
      if (updateDto.status !== undefined) section.status = updateDto.status;

      await queryRunner.manager.save(section);

      // Update class relationships if provided
      if (updateDto.classIds !== undefined) {
        // Remove existing relationships
        await queryRunner.manager.delete(ClassSection, { sectionId });

        // Create new relationships
        const classIds = updateDto.classIds || [];
        if (updateDto.classId && !classIds.includes(updateDto.classId)) {
          classIds.push(updateDto.classId);
        }

        for (const classId of classIds) {
          const classSection = this.classSectionRepository.create({
            classId,
            sectionId,
            status: 'Active',
          });
          await queryRunner.manager.save(classSection);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(sectionId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(sectionId: string): Promise<void> {
    const section = await this.sectionRepository.findOne({
      where: { sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    await this.sectionRepository.remove(section);
  }

  async bulkDelete(sectionIds: string[]): Promise<void> {
    if (!sectionIds || sectionIds.length === 0) {
      throw new NotFoundException('No section IDs provided for deletion');
    }

    // Verify all sections exist
    const existingSections = await this.sectionRepository.find({
      where: sectionIds.map((id) => ({ sectionId: id })),
    });

    if (existingSections.length !== sectionIds.length) {
      const foundIds = existingSections.map((s) => s.sectionId);
      const missingIds = sectionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Sections not found: ${missingIds.join(', ')}`,
      );
    }

    try {
      await this.sectionRepository.delete(sectionIds);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete sections that have dependent records. Please remove dependent records first.',
        );
      }
      throw error;
    }
  }

  async getForDropdown(classId?: string): Promise<Array<{ sectionId: string; sectionName: string; classId: string }>> {
    const sections = await this.findAll({ classId, status: 'Active' });
    return sections.map((s) => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      classId: s.classId,
    }));
  }

  // ============================================
  // Class-Section Association Methods
  // ============================================

  async getSectionClasses(sectionId: string): Promise<any[]> {
    const classSections = await this.classSectionRepository.find({
      where: { sectionId },
      relations: ['class'],
    });

    return classSections.map((cs) => ({
      classId: cs.classId,
      className: cs.class?.className,
      status: cs.status,
    }));
  }

  async addClassToSection(sectionId: string, classId: string): Promise<any[]> {
    // Check if section exists
    const section = await this.sectionRepository.findOne({
      where: { sectionId },
    });
    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    // Check if class exists
    const classEntity = await this.classRepository.findOne({
      where: { classId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    // Check if relationship already exists
    const existing = await this.classSectionRepository.findOne({
      where: { sectionId, classId },
    });
    if (existing) {
      throw new ConflictException('This class is already assigned to this section');
    }

    const classSection = this.classSectionRepository.create({
      sectionId,
      classId,
      status: 'Active',
    });
    await this.classSectionRepository.save(classSection);

    return this.getSectionClasses(sectionId);
  }

  async removeClassFromSection(sectionId: string, classId: string): Promise<void> {
    const classSection = await this.classSectionRepository.findOne({
      where: { sectionId, classId },
    });

    if (!classSection) {
      throw new NotFoundException('Class is not assigned to this section');
    }

    await this.classSectionRepository.remove(classSection);
  }
}
