import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiInteraction } from './ai-interaction.entity';

@Entity('ai_feedback')
export class AiFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  interactionId: number;

  @Column()
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'star_rating' | 'detailed';

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  accuracyRating: number;

  @Column({ nullable: true })
  usefulnessRating: number;

  @Column({ nullable: true })
  clarityRating: number;

  @Column('text', { nullable: true })
  feedbackComment: string;

  @Column('text', { nullable: true })
  whatWasGood: string;

  @Column('text', { nullable: true })
  whatCouldBeBetter: string;

  @Column('text', { nullable: true })
  additionalContext: string;

  @Column({ default: false })
  didUserFollowUp: boolean;

  @Column({ default: false })
  didUserModifyQuery: boolean;

  @Column({ nullable: true })
  timeSpentOnResponse: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => AiInteraction, interaction => interaction.feedback)
  @JoinColumn({ name: 'interactionId' })
  interaction: AiInteraction;
}
