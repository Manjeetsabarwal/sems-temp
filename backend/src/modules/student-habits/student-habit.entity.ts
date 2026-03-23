import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';

@Entity('student_habits')
export class StudentHabit {
  @PrimaryColumn({ name: 'habit_id' })
  habitId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column({ name: 'habit_name' })
  habitName: 'Courteous' | 'Art/Craft' | 'Responsibility' | 'Systematic' | 'Sports' | 'Elocution' | 'Gen.Knowledge' | 'Cultural Activities' | 'Cleanliness' | 'Hindi Oral' | 'English Oral';

  @Column({ name: 'term1_grade', nullable: true })
  term1Grade?: 'A' | 'B' | 'C' | 'D' | 'E';

  @Column({ name: 'term2_grade', nullable: true })
  term2Grade?: 'A' | 'B' | 'C' | 'D' | 'E';

  @Column({ nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
