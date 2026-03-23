import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarksService } from './marks.service';
import { MarksController } from './marks.controller';
import { Mark } from './mark.entity';
import { Exam } from '../exams/exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mark, Exam])],
  controllers: [MarksController],
  providers: [MarksService],
  exports: [MarksService],
})
export class MarksModule {}
