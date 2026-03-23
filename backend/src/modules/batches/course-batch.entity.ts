import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from '../courses/course.entity';
import { BatchTeacher } from './batch-teacher.entity';
import { BatchStudent } from './batch-student.entity';
import { Lecture } from '../lectures/lecture.entity';

@Entity('course_batches')
export class CourseBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'class_id', type: 'varchar', length: 255, nullable: true })
  classId: string | null;

  @Column({ name: 'section_id', type: 'varchar', length: 255, nullable: true })
  sectionId: string | null;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_days', default: 0 })
  durationDays: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'total_revenue', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ name: 'teacher_share_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  teacherSharePercent: number;

  @Column({ name: 'institution_share_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  institutionSharePercent: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.batches)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => BatchTeacher, (bt) => bt.batch)
  batchTeachers: BatchTeacher[];

  @OneToMany(() => BatchStudent, (bs) => bs.batch)
  batchStudents: BatchStudent[];

  @OneToMany(() => Lecture, (lecture) => lecture.batch)
  lectures: Lecture[];
}
