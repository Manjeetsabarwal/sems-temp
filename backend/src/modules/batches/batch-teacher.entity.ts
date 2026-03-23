import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CourseBatch } from './course-batch.entity';

@Entity('batch_teachers')
@Unique(['batchId', 'teacherId'])
export class BatchTeacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id' })
  batchId: number;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'share_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  shareAmount: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CourseBatch, (batch) => batch.batchTeachers)
  @JoinColumn({ name: 'batch_id' })
  batch: CourseBatch;
}
