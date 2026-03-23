import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ClassSection } from '../classes/class-section.entity';

@Entity('sections')
export class Section {
  @PrimaryColumn({ name: 'section_id' })
  sectionId: string;

  @Column({ name: 'section_name' })
  sectionName: string;

  // Kept for backward compatibility - nullable now
  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @Column({ default: 40 })
  capacity: number;

  @Column({ name: 'current_strength', default: 0 })
  currentStrength: number;

  @Column({ name: 'room_number', nullable: true })
  roomNumber: string;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Many-to-many relationship with classes via junction table
  @OneToMany(() => ClassSection, (cs) => cs.section)
  classSections: ClassSection[];
}
