import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { Teacher } from '../teachers/teacher.entity';

@Entity('subject_teachers')
export class SubjectTeacher {
  @PrimaryColumn({ name: 'subject_id' })
  subjectId: string;

  @PrimaryColumn({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Subject, (subject) => subject.subjectTeachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => Teacher, (teacher) => teacher.subjectTeachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;
}
