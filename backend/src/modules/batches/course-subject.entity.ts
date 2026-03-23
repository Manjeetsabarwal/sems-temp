import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Course } from '../courses/course.entity';

@Entity('course_subjects')
@Unique(['courseId', 'subjectId'])
export class CourseSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Course, (course) => course.courseSubjects)
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
