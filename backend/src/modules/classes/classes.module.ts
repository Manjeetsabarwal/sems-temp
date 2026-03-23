import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './class.entity';
import { ClassSection } from './class-section.entity';
import { Student } from '../students/student.entity';
import { Section } from '../sections/section.entity';
import { Subject } from '../subjects/subject.entity';
import { Exam } from '../exams/exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, ClassSection, Student, Section, Subject, Exam])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
