import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { Teacher } from './teacher.entity';
import { TeacherAssignment } from './teacher-assignment.entity';
import { Class } from '../classes/class.entity';
import { Section } from '../sections/section.entity';
import { Subject } from '../subjects/subject.entity';
import { SubjectTeacher } from '../subjects/subject-teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, TeacherAssignment, Class, Section, Subject, SubjectTeacher])],
  controllers: [TeachersController, TeacherAssignmentsController],
  providers: [TeachersService, TeacherAssignmentsService],
  exports: [TeachersService, TeacherAssignmentsService],
})
export class TeachersModule {}
