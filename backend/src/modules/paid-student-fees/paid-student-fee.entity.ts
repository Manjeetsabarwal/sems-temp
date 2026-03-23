import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentEnrollment } from '../enrollments/student-enrollment.entity';

@Entity('paid_student_fees')
export class PaidStudentFee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'enrollment_id' })
  enrollmentId: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'pay_type', length: 50 })
  payType: string;

  @Column({ name: 'pay_mode', length: 50 })
  payMode: string;

  @Column({ name: 'upi_id', type: 'text', nullable: true })
  upiId: string | null;

  @Column({ name: 'ac_number', type: 'text', nullable: true })
  acNumber: string | null;

  @Column({ name: 'transaction_id', type: 'text', nullable: true })
  transactionId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => StudentEnrollment, (e) => e.payments)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: StudentEnrollment;
}
