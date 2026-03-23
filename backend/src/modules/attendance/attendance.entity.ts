import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Lecture } from '../lectures/lecture.entity';

@Entity('attendance')
@Unique(['lectureId', 'studentId'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lecture_id' })
  lectureId: number;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ type: 'varchar', length: 20, default: 'present' })
  status: 'present' | 'absent' | 'late' | 'excused';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Lecture, (lecture) => lecture.attendance)
  @JoinColumn({ name: 'lecture_id' })
  lecture: Lecture;
}
