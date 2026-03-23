import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubjectTeacher } from '../subjects/subject-teacher.entity';
import { TeacherAssignment } from './teacher-assignment.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryColumn({ name: 'teacher_id' })
  teacherId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  // Kept for backward compatibility - deprecated
  @Column('text', { array: true, default: '{}' })
  subjects: string[];

  // Kept for backward compatibility - deprecated
  @Column('text', { array: true, default: '{}' })
  classes: string[];

  @Column({ nullable: true })
  qualification: string;

  @Column({ default: 0 })
  experience: number;

  @Column({ name: 'joining_date', type: 'date', nullable: true })
  joiningDate: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Many-to-many relationship with subjects via junction table
  @OneToMany(() => SubjectTeacher, (st) => st.teacher)
  subjectTeachers: SubjectTeacher[];

  // Teacher assignments (class-section-subject combinations)
  @OneToMany(() => TeacherAssignment, (ta) => ta.teacher)
  assignments: TeacherAssignment[];
}
