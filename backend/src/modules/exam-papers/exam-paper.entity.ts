import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exam } from '../exams/exam.entity';

@Entity('exam_paper')
export class ExamPaper {
  @PrimaryColumn({ name: 'paper_id' })
  paperId: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'paper_title' })
  paperTitle: string;

  @Column({ name: 'paper_code', nullable: true })
  paperCode?: string;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ name: 'total_marks', type: 'decimal', precision: 5, scale: 2 })
  totalMarks: number;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ name: 'display_order', default: 1 })
  displayOrder: number;

  @Column({ nullable: true })
  instructions?: string;

  @Column({ default: 'Draft' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;
}
