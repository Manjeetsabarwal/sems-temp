import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiInteraction } from './ai-interaction.entity';

@Entity('ai_query_vectors')
export class AiQueryVector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  interactionId: number;

  @Column('simple-array')
  queryVector: number[];

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  intent: string;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  similarityScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => AiInteraction, interaction => interaction.vectors)
  @JoinColumn({ name: 'interactionId' })
  interaction: AiInteraction;
}
