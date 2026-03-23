import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Broadcast } from './broadcast.entity';

@Entity('broadcast_messages')
@Unique(['broadcastId', 'studentId'])
@Index(['broadcastId', 'status'])
@Index(['status', 'createdAt'])
@Index(['providerMessageId'])
export class BroadcastMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'broadcast_id', type: 'int' })
  broadcastId: number;

  @Column({ name: 'student_id', type: 'varchar', length: 255 })
  studentId: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 50 })
  phoneNumber: string;

  @Column({ name: 'template_id', type: 'varchar', length: 255 })
  templateId: string;

  @Column({ name: 'template_name', type: 'varchar', length: 255 })
  templateName: string;

  @Column({ name: 'template_language', type: 'varchar', length: 10, default: 'en' })
  templateLanguage: string;

  @Column({ name: 'template_params', type: 'jsonb', default: {} })
  templateParams: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, sending, sent, delivered, read, failed, cancelled

  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  max_retries: number;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Broadcast, (b) => b.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broadcast_id' })
  broadcast: Broadcast;
}
