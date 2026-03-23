import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamPapersService } from './exam-papers.service';
import { ExamPapersController } from './exam-papers.controller';
import { ExamPaper } from './exam-paper.entity';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExamPaper]), ExamsModule],
  controllers: [ExamPapersController],
  providers: [ExamPapersService],
  exports: [ExamPapersService],
})
export class ExamPapersModule {}
