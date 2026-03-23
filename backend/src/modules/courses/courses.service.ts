import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Course } from './course.entity';
import { CourseSubject } from '../batches/course-subject.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export class CoursesService {
  private readonly courseRepository: Repository<Course>;
  private readonly courseSubjectRepository: Repository<CourseSubject>;

  constructor(dataSource: DataSource) {
    this.courseRepository = dataSource.getRepository(Course);
    this.courseSubjectRepository = dataSource.getRepository(CourseSubject);
  }

  async findAll(filters?: {
    search?: string;
    class?: string;
    stream?: string;
  }): Promise<Course[]> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course');
    queryBuilder.where('course.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.search) {
      queryBuilder.andWhere(
        '(course.title ILIKE :search OR course.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.class) {
      queryBuilder.andWhere('course.class = :class', { class: filters.class });
    }

    if (filters?.stream) {
      queryBuilder.andWhere('course.stream = :stream', { stream: filters.stream });
    }

    return queryBuilder
      .leftJoinAndSelect('course.courseSubjects', 'courseSubjects')
      .orderBy('course.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['courseSubjects', 'batches'],
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async create(createDto: CreateCourseDto): Promise<Course> {
    const { subjectIds, ...courseData } = createDto;
    const course = this.courseRepository.create(courseData);
    const savedCourse = await this.courseRepository.save(course);

    if (subjectIds && subjectIds.length > 0) {
      const courseSubjects = subjectIds.map((subjectId) =>
        this.courseSubjectRepository.create({
          courseId: savedCourse.id,
          subjectId,
        }),
      );
      await this.courseSubjectRepository.save(courseSubjects);
    }

    return this.findOne(savedCourse.id);
  }

  async update(id: number, updateDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    const { subjectIds, ...courseData } = updateDto;

    Object.assign(course, courseData);
    await this.courseRepository.save(course);

    if (subjectIds !== undefined) {
      // Remove existing subject links
      await this.courseSubjectRepository.delete({ courseId: id });
      // Add new ones
      if (subjectIds.length > 0) {
        const courseSubjects = subjectIds.map((subjectId) =>
          this.courseSubjectRepository.create({
            courseId: id,
            subjectId,
          }),
        );
        await this.courseSubjectRepository.save(courseSubjects);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    course.isDeleted = true;
    await this.courseRepository.save(course);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new NotFoundException('No course IDs provided for deletion');
    }
    await this.courseRepository
      .createQueryBuilder()
      .update(Course)
      .set({ isDeleted: true })
      .whereInIds(ids)
      .execute();
  }

  async getForDropdown(): Promise<Array<{ id: number; title: string }>> {
    const courses = await this.findAll();
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
    }));
  }
}
