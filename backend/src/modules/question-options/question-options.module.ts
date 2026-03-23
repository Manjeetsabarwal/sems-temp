import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionOptionsService } from './question-options.service';
import { QuestionOptionsController } from './question-options.controller';
import { QuestionOption } from './question-option.entity';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionOption]), QuestionsModule],
  controllers: [QuestionOptionsController],
  providers: [QuestionOptionsService],
  exports: [QuestionOptionsService],
})
export class QuestionOptionsModule {}
