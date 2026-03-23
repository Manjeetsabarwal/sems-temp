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
import { Class } from '../classes/class.entity';
import { Section } from '../sections/section.entity';

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'student_id' })
  studentId: string;

  @Column()
  name: string;

  @Column({ name: 'class_id', nullable: true })
  classId: string | null;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string | null;

  @Column({ name: 'roll_no', type: 'int', nullable: true })
  rollNo: number | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'father_name', nullable: true })
  fatherName: string;

  @Column({ name: 'mother_name', nullable: true })
  motherName: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'parent_name', nullable: true })
  parentName: string;

  @Column({ name: 'parent_phone', nullable: true })
  parentPhone: string;

  @Column({ name: 'parent_email', nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'admission_date', type: 'date', nullable: true })
  admissionDate: Date;

  @Column({ name: 'exam_registration_fees', type: 'decimal', precision: 10, scale: 2, nullable: true })
  examRegistrationFees: number | null;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
