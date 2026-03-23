import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Teacher } from './teacher.entity';
import { Class } from '../classes/class.entity';
import { Section } from '../sections/section.entity';
import { Subject } from '../subjects/subject.entity';

@Entity('teacher_assignments')
@Unique(['teacherId', 'classId', 'sectionId', 'subjectId', 'academicYear'])
export class TeacherAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'is_default', default: true })
  isDefault: boolean;

  @Column({ name: 'academic_year', nullable: true })
  academicYear: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Teacher, (teacher) => teacher.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;
}
