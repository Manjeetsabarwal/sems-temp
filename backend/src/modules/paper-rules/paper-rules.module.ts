import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperRulesService } from './paper-rules.service';
import { PaperRulesController } from './paper-rules.controller';
import { PaperRule } from './paper-rule.entity';
import { ExamPapersModule } from '../exam-papers/exam-papers.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaperRule]), ExamPapersModule],
  controllers: [PaperRulesController],
  providers: [PaperRulesService],
  exports: [PaperRulesService],
})
export class PaperRulesModule {}
