import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Class } from '../classes/class.entity';

@Entity('exams')
export class Exam {
  @PrimaryColumn({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'exam_name' })
  examName: string;

  @Column({ name: 'exam_type' })
  examType: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column()
  term: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'total_marks', default: 100 })
  totalMarks: number;

  @Column({ name: 'passing_marks', default: 40 })
  passingMarks: number;

  @Column({ type: 'jsonb', nullable: true })
  subjects: any;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 'Scheduled' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;
}
