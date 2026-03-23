import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CourseBatch } from '../batches/course-batch.entity';
import { CourseSubject } from '../batches/course-subject.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_days', type: 'int', nullable: true })
  durationDays: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  class: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sem: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stream: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  year: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  semester: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  education: string | null;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CourseBatch, (batch) => batch.course)
  batches: CourseBatch[];

  @OneToMany(() => CourseSubject, (cs) => cs.course)
  courseSubjects: CourseSubject[];
}
