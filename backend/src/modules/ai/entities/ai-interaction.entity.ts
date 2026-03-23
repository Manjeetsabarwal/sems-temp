import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AiFeedback } from './ai-feedback.entity';
import { AiQueryVector } from './ai-query-vector.entity';

@Entity('ai_interactions')
export class AiInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  userRole: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column('text')
  question: string;

  @Column('text', { nullable: true })
  sqlQuery: string;

  @Column('text', { nullable: true })
  response: string;

  @Column({ nullable: true })
  responseTimeMs: number;

  @Column('jsonb', { nullable: true })
  context: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AiFeedback, feedback => feedback.interaction)
  feedback: AiFeedback[];

  @OneToMany(() => AiQueryVector, vector => vector.interaction)
  vectors: AiQueryVector[];
}
