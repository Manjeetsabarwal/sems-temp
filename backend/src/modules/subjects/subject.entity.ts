import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubjectTeacher } from './subject-teacher.entity';

@Entity('subjects')
export class Subject {
  @PrimaryColumn({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'subject_name' })
  subjectName: string;

  @Column({ name: 'subject_code', unique: true })
  subjectCode: string;

  // Kept for backward compatibility - nullable now
  @Column({ name: 'class_id', nullable: true })
  classId: string;

  // Kept for backward compatibility - nullable now (primary teacher)
  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  credits: number;

  @Column({ name: 'hours_per_week', default: 4 })
  hoursPerWeek: number;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Many-to-many relationship with teachers via junction table
  @OneToMany(() => SubjectTeacher, (st) => st.subject)
  subjectTeachers: SubjectTeacher[];
}
