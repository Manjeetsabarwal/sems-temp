import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from '../questions/question.entity';

@Entity('question_option')
export class QuestionOption {
  @PrimaryColumn({ name: 'option_id' })
  optionId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'option_text', type: 'text' })
  optionText: string;

  @Column({ name: 'option_image_url', nullable: true })
  optionImageUrl?: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ name: 'display_order', default: 1 })
  displayOrder: number;

  @Column({ nullable: true, type: 'text' })
  explanation?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
