import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentResponsesService } from './student-responses.service';
import { StudentResponsesController } from './student-responses.controller';
import { StudentResponse } from './student-response.entity';
import { StudentAttemptsModule } from '../student-attempts/student-attempts.module';
import { QuestionsModule } from '../questions/questions.module';
import { QuestionOptionsModule } from '../question-options/question-options.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentResponse]),
    StudentAttemptsModule,
    QuestionsModule,
    QuestionOptionsModule,
  ],
  controllers: [StudentResponsesController],
  providers: [StudentResponsesService],
  exports: [StudentResponsesService],
})
export class StudentResponsesModule {}
