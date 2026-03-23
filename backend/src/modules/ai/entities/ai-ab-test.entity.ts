import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_ab_tests')
export class AiAbTest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  testName: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  templateAId: number;

  @Column({ nullable: true })
  templateBId: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0.5 })
  trafficSplit: number;

  @Column({ default: 0 })
  impressionsA: number;

  @Column({ default: 0 })
  impressionsB: number;

  @Column({ default: 0 })
  conversionsA: number;

  @Column({ default: 0 })
  conversionsB: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  successRateA: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  successRateB: number;

  @Column({ default: false })
  statisticalSignificance: boolean;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  confidenceLevel: number;

  @Column({ nullable: true })
  winner: 'A' | 'B' | 'inconclusive';

  @Column({ default: 'running' })
  status: 'running' | 'completed' | 'paused';

  @Column({ default: () => 'NOW()' })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
