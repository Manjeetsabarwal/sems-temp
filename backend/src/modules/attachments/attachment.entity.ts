import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  // The entity this file belongs to (e.g. 'student', 'teacher', 'exam', 'class')
  @Column({ name: 'entity_type' })
  entityType: string;

  // The ID of the entity record (e.g. student_id, teacher_id)
  @Column({ name: 'entity_id' })
  entityId: string;

  // Original file name
  @Column({ name: 'original_name' })
  originalName: string;

  // Stored file name (UUID-based to avoid conflicts)
  @Column({ name: 'stored_name' })
  storedName: string;

  // MIME type
  @Column({ name: 'mime_type' })
  mimeType: string;

  // File size in bytes
  @Column({ type: 'bigint' })
  size: number;

  // Storage backend: 's3' or 'local'
  @Column({ name: 'storage_type', default: 'local' })
  storageType: string;

  // S3 bucket name or local directory path
  @Column({ name: 'storage_path' })
  storagePath: string;

  // Optional label/category (e.g. 'id_proof', 'photo', 'certificate')
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  // Optional description
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Who uploaded it
  @Column({ name: 'uploaded_by', type: 'varchar', length: 100, nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
