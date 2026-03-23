import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BroadcastMessage } from './broadcast-message.entity';

@Entity('broadcasts')
@Index(['status', 'createdAt'])
export class Broadcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'template_id', type: 'varchar', length: 255 })
  templateId: string;

  @Column({ name: 'template_name', type: 'varchar', length: 255 })
  templateName: string;

  @Column({ name: 'template_language', type: 'varchar', length: 10, default: 'en' })
  templateLanguage: string;

  @Column({ name: 'template_params', type: 'jsonb', default: {} })
  templateParams: Record<string, any>;

  @Column({ name: 'target_type', type: 'varchar', length: 50, default: 'all' }) // all, class, section, selective
  targetType: string;

  @Column({ name: 'target_id', type: 'varchar', length: 255, nullable: true })
  targetId: string | null;

  @Column({ name: 'total_recipients', type: 'int', default: 0 })
  totalRecipients: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, processing, completed, completed_with_errors, failed

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => BroadcastMessage, (m) => m.broadcast)
  messages: BroadcastMessage[];
}
