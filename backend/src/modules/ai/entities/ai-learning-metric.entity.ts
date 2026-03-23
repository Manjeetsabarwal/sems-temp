import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_learning_metrics')
export class AiLearningMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  metricDate: Date;

  @Column({ default: 0 })
  totalInteractions: number;

  @Column({ default: 0 })
  successfulInteractions: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  averageFeedbackScore: number;

  @Column({ default: 0 })
  newPatternsDiscovered: number;

  @Column({ default: 0 })
  templatesGenerated: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  accuracyImprovement: number;

  @Column({ nullable: true })
  responseTimeImprovement: number;

  @Column({ default: 0 })
  uniqueQueries: number;

  @Column({ default: 0 })
  repeatQueries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
