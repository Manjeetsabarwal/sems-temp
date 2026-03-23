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
import { Exam } from '../exams/exam.entity';
import { Class } from '../classes/class.entity';

@Entity('results')
export class Result {
  @PrimaryColumn({ name: 'result_id' })
  resultId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'total_marks_obtained', type: 'decimal', precision: 10, scale: 2 })
  totalMarksObtained: number;

  @Column({ name: 'total_max_marks', type: 'decimal', precision: 10, scale: 2 })
  totalMaxMarks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column()
  grade: string;

  @Column({ name: 'is_passed', type: 'boolean' })
  isPassed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  subjects: any[]; // Array of SubjectResult

  @Column({ type: 'integer', nullable: true })
  rank: number;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

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

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;
}
