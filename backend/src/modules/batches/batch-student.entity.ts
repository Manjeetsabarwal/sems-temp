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

@Entity('batch_students')
@Unique(['batchId', 'studentId'])
export class BatchStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id' })
  batchId: number;

  @Column({ name: 'student_id' })
  studentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CourseBatch, (batch) => batch.batchStudents)
  @JoinColumn({ name: 'batch_id' })
  batch: CourseBatch;
}
