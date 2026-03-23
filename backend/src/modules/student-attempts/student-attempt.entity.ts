import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { ExamPaper } from '../exam-papers/exam-paper.entity';

@Entity('student_attempt')
export class StudentAttempt {
  @PrimaryColumn({ name: 'attempt_id' })
  attemptId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'paper_id' })
  paperId: string;

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ default: 'IN_PROGRESS' })
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'ABANDONED';

  @Column({ name: 'time_spent_minutes', default: 0 })
  timeSpentMinutes: number;

  @Column({ name: 'total_marks_obtained', type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalMarksObtained: number;

  @Column({ name: 'total_marks_available', type: 'decimal', precision: 5, scale: 2, nullable: true })
  totalMarksAvailable?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  @Column({ name: 'is_passed', type: 'boolean', nullable: true })
  isPassed?: boolean;

  @Column({ name: 'auto_submitted', default: false })
  autoSubmitted: boolean;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => ExamPaper)
  @JoinColumn({ name: 'paper_id' })
  paper: ExamPaper;
}
