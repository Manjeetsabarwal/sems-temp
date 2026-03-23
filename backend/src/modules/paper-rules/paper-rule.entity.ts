import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ExamPaper } from '../exam-papers/exam-paper.entity';

@Entity('paper_rule')
export class PaperRule {
  @PrimaryColumn({ name: 'rule_id' })
  ruleId: string;

  @Column({ name: 'paper_id', unique: true })
  paperId: string;

  @Column({ name: 'min_marks_to_pass', type: 'decimal', precision: 5, scale: 2 })
  minMarksToPass: number;

  @Column({ name: 'min_percentage', type: 'decimal', precision: 5, scale: 2 })
  minPercentage: number;

  @Column({ name: 'section_wise_pass_required', default: false })
  sectionWisePassRequired: boolean;

  @Column({ name: 'must_attempt_percentage', type: 'decimal', precision: 5, scale: 2, default: 100 })
  mustAttemptPercentage: number;

  @Column({ name: 'evaluation_mode', default: 'MANUAL' })
  evaluationMode: 'AUTO' | 'MANUAL' | 'MIXED';

  @Column({ name: 'negative_marking_enabled', default: false })
  negativeMarkingEnabled: boolean;

  @Column({ name: 'negative_marking_per_question', type: 'decimal', precision: 5, scale: 2, default: 0 })
  negativeMarkingPerQuestion: number;

  @Column({ name: 'grace_marks', type: 'decimal', precision: 5, scale: 2, default: 0 })
  graceMarks: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => ExamPaper)
  @JoinColumn({ name: 'paper_id' })
  paper: ExamPaper;
}
