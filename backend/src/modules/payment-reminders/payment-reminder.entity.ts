import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payment_reminders')
export class PaymentReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'enrollment_id' })
  enrollmentId: number;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'student_name' })
  studentName: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'due_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  dueAmount: number;

  @Column({ name: 'payment_link_id', type: 'varchar', nullable: true })
  paymentLinkId: string | null;

  @Column({ name: 'payment_link_url', type: 'text', nullable: true })
  paymentLinkUrl: string | null;

  @Column({ name: 'reminder_type', type: 'varchar', length: 50, default: 'first_reminder' })
  reminderType: string;

  @Column({ type: 'varchar', length: 50, default: 'whatsapp' })
  channel: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'whatsapp_message_id', type: 'varchar', nullable: true })
  whatsappMessageId: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
