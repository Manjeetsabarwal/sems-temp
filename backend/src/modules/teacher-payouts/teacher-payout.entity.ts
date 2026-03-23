import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('teacher_payouts')
export class TeacherPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id' })
  batchId: number;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'payout_amount', type: 'numeric', precision: 12, scale: 2 })
  payoutAmount: number;

  @Column({ name: 'payout_cycle', length: 50 })
  payoutCycle: string;

  @Column({ length: 50, default: 'Pending' })
  status: string;

  @Column({ name: 'payout_date', type: 'timestamp', nullable: true })
  payoutDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
