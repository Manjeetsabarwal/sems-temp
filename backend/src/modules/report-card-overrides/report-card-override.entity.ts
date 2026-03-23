import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../students/student.entity';

@Entity('report_card_overrides')
@Unique(['studentId', 'academicYear', 'templateId'])
export class ReportCardOverride {
  @PrimaryGeneratedColumn('uuid', { name: 'override_id' })
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ type: 'jsonb', default: {} })
  overrides: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
