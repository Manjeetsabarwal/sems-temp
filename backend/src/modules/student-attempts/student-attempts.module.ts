import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAttemptsService } from './student-attempts.service';
import { StudentAttemptsController } from './student-attempts.controller';
import { StudentAttempt } from './student-attempt.entity';
import { StudentsModule } from '../students/students.module';
import { ExamPapersModule } from '../exam-papers/exam-papers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentAttempt]),
    StudentsModule,
    ExamPapersModule,
  ],
  controllers: [StudentAttemptsController],
  providers: [StudentAttemptsService],
  exports: [StudentAttemptsService],
})
export class StudentAttemptsModule {}
