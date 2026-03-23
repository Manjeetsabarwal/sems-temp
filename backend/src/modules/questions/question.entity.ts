import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExamPaper } from '../exam-papers/exam-paper.entity';

@Entity('question')
export class Question {
  @PrimaryColumn({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'paper_id' })
  paperId: string;

  @Column({ name: 'section_id', nullable: true })
  sectionId?: string;

  @Column({ name: 'question_type' })
  questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE';

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'question_image_url', nullable: true })
  questionImageUrl?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  marks: number;

  @Column({ name: 'negative_marks', type: 'decimal', precision: 5, scale: 2, default: 0 })
  negativeMarks: number;

  @Column({ default: 'Medium' })
  difficulty: 'Easy' | 'Medium' | 'Hard';

  @Column({ name: 'display_order', default: 1 })
  displayOrder: number;

  @Column({ name: 'is_required', default: true })
  isRequired: boolean;

  @Column({ name: 'correct_answer_text', nullable: true, type: 'text' })
  correctAnswerText?: string;

  @Column({ name: 'solution_text', nullable: true, type: 'text' })
  solutionText?: string;

  @Column({ name: 'solution_image_url', nullable: true })
  solutionImageUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ExamPaper)
  @JoinColumn({ name: 'paper_id' })
  paper: ExamPaper;
}
