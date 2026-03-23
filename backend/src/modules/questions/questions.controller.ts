import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateQuestionDto) {
    return this.questionsService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('paperId') paperId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('questionType') questionType?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.questionsService.findAll({
      paperId,
      sectionId,
      questionType,
      difficulty,
    });
  }

  @Get(':questionId')
  async findOne(@Param('questionId') questionId: string) {
    return this.questionsService.findOne(questionId);
  }

  @Get('by-paper/:paperId')
  async findByPaperId(@Param('paperId') paperId: string) {
    return this.questionsService.findByPaperId(paperId);
  }

  @Get('by-paper/:paperId/by-type/:questionType')
  async findByPaperIdAndType(
    @Param('paperId') paperId: string,
    @Param('questionType') questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE',
  ) {
    return this.questionsService.findByPaperIdAndType(paperId, questionType);
  }

  @Put(':questionId')
  async update(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(questionId, updateDto);
  }

  @Delete(':questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('questionId') questionId: string) {
    await this.questionsService.remove(questionId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() body: { questionIds: string[] }) {
    return this.questionsService.bulkDelete(body.questionIds);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorderQuestions(
    @Body() body: { paperId: string; questionOrders: { questionId: string; displayOrder: number }[] },
  ) {
    await this.questionsService.reorderQuestions(body.paperId, body.questionOrders);
    return { message: 'Questions reordered successfully' };
  }

  @Get('statistics/:paperId')
  async getQuestionStatistics(@Param('paperId') paperId: string) {
    return this.questionsService.getQuestionStatistics(paperId);
  }
}
