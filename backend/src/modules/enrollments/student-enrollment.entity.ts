import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CourseBatch } from '../batches/course-batch.entity';
import { Course } from '../courses/course.entity';
import { PaidStudentFee } from '../paid-student-fees/paid-student-fee.entity';

@Entity('student_enrollments')
@Unique(['studentId', 'batchId'])
export class StudentEnrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'batch_id' })
  batchId: number;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'course_fee', type: 'numeric', precision: 12, scale: 2, default: 0 })
  courseFee: number;

  @Column({ name: 'registration_fee', type: 'numeric', precision: 12, scale: 2, default: 0 })
  registrationFee: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'enrollment_status', length: 50, default: 'Active' })
  enrollmentStatus: string;

  @Column({ name: 'payment_status', length: 50, default: 'Pending' })
  paymentStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CourseBatch)
  @JoinColumn({ name: 'batch_id' })
  batch: CourseBatch;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => PaidStudentFee, (p) => p.enrollment)
  payments: PaidStudentFee[];
}
