import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AcademicYear } from '../academic-years/academic-year.entity';
import { ClassSection } from './class-section.entity';

@Entity('classes')
export class Class {
  @PrimaryColumn({ name: 'class_id' })
  classId: string;

  @Column({ name: 'class_name' })
  className: string;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @Column({ name: 'class_teacher_id', nullable: true })
  classTeacherId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ name: 'total_students', default: 0 })
  totalStudents: number;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  // Many-to-many relationship with sections via junction table
  @OneToMany(() => ClassSection, (cs) => cs.class)
  classSections: ClassSection[];
}
