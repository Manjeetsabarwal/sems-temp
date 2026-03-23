import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Result } from './result.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { Mark } from '../marks/mark.entity';
import { Student } from '../students/student.entity';
import { Exam } from '../exams/exam.entity';
import { Class } from '../classes/class.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MarksModule } from '../marks/marks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Result, Mark, Student, Exam, Class, User]),
    NotificationsModule,
    forwardRef(() => MarksModule),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
