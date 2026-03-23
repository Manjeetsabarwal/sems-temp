import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { Subject } from './subject.entity';
import { SubjectTeacher } from './subject-teacher.entity';
import { Teacher } from '../teachers/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, SubjectTeacher, Teacher])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
