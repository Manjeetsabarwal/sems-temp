import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Exam } from '../exams/exam.entity';
import { Subject } from '../subjects/subject.entity';

@Entity('marks')
@Unique(['studentId', 'examId', 'subjectId'])
export class Mark {
  @PrimaryColumn({ name: 'mark_id' })
  markId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'marks_obtained', type: 'decimal', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ name: 'total_marks', default: 100 })
  totalMarks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ name: 'is_absent', default: false })
  isAbsent: boolean;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ name: 'entered_by', nullable: true })
  enteredBy: string;

  // Version 2: Internal/External Marks Breakdown (nullable for backward compatibility)
  @Column({ name: 'internal_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  internalMarks?: number;

  @Column({ name: 'external_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  externalMarks?: number;

  @Column({ name: 'unit_test_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  unitTestMarks?: number; // 10 marks (10%)

  @Column({ name: 'assignment_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  assignmentMarks?: number; // 5 marks (5%)

  @Column({ name: 'attendance_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  attendanceMarks?: number; // 5 marks (5%)

  @Column({ name: 'marks_type', nullable: true, default: 'Final' })
  marksType?: 'Unit Test' | 'Final' | 'Periodic Test' | 'Notebook' | 'Subject Enrichment' | 'Mid-Term'; // To distinguish different types of marks

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;
}
