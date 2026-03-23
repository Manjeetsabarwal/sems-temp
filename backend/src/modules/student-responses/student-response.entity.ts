import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentAttempt } from '../student-attempts/student-attempt.entity';
import { Question } from '../questions/question.entity';
import { QuestionOption } from '../question-options/question-option.entity';

@Entity('student_response')
export class StudentResponse {
  @PrimaryColumn({ name: 'response_id' })
  responseId: string;

  @Column({ name: 'attempt_id' })
  attemptId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'selected_option_id', nullable: true })
  selectedOptionId?: string;

  @Column({ name: 'answer_text', nullable: true, type: 'text' })
  answerText?: string;

  @Column({ name: 'answer_image_url', nullable: true })
  answerImageUrl?: string;

  @Column({ name: 'marks_awarded', type: 'decimal', precision: 5, scale: 2, default: 0 })
  marksAwarded: number;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect?: boolean;

  @Column({ name: 'is_evaluated', default: false })
  isEvaluated: boolean;

  @Column({ name: 'evaluated_by', nullable: true })
  evaluatedBy?: string;

  @Column({ name: 'evaluated_at', type: 'timestamp', nullable: true })
  evaluatedAt?: Date;

  @Column({ nullable: true, type: 'text' })
  feedback?: string;

  @Column({ name: 'time_spent_seconds', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => StudentAttempt)
  @JoinColumn({ name: 'attempt_id' })
  attempt: StudentAttempt;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => QuestionOption)
  @JoinColumn({ name: 'selected_option_id' })
  selectedOption?: QuestionOption;
}
