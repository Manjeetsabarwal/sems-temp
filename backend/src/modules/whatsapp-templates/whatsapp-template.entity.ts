import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('whatsapp_templates')
export class WhatsAppTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'template_id', unique: true })
  templateId: string;

  @Column()
  name: string;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ length: 50, default: 'utility' })
  category: string;

  @Column({ type: 'jsonb', default: {} })
  components: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
