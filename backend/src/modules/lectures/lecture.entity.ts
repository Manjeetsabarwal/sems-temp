import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CourseBatch } from '../batches/course-batch.entity';
import { Attendance } from '../attendance/attendance.entity';

@Entity('lectures')
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id' })
  batchId: number;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'date_time', type: 'timestamp' })
  dateTime: Date;

  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @Column()
  topic: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CourseBatch, (batch) => batch.lectures)
  @JoinColumn({ name: 'batch_id' })
  batch: CourseBatch;

  @OneToMany(() => Attendance, (attendance) => attendance.lecture)
  attendance: Attendance[];
}
