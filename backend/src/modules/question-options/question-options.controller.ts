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
import { QuestionOptionsService } from './question-options.service';
import { CreateQuestionOptionDto } from './dto/create-question-option.dto';
import { UpdateQuestionOptionDto } from './dto/update-question-option.dto';

@Controller('api/question-options')
export class QuestionOptionsController {
  constructor(private readonly questionOptionsService: QuestionOptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateQuestionOptionDto) {
    return this.questionOptionsService.create(createDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @Body() body: {
      questionId: string;
      options: Omit<CreateQuestionOptionDto, 'questionId' | 'optionId'>[];
    },
  ) {
    return this.questionOptionsService.createBulk(body.questionId, body.options);
  }

  @Get()
  async findAll(
    @Query('questionId') questionId?: string,
    @Query('isCorrect') isCorrect?: string,
  ) {
    return this.questionOptionsService.findAll({
      questionId,
      isCorrect: isCorrect === 'true' ? true : isCorrect === 'false' ? false : undefined,
    });
  }

  @Get(':optionId')
  async findOne(@Param('optionId') optionId: string) {
    return this.questionOptionsService.findOne(optionId);
  }

  @Get('by-question/:questionId')
  async findByQuestionId(@Param('questionId') questionId: string) {
    return this.questionOptionsService.findByQuestionId(questionId);
  }

  @Get('by-question/:questionId/correct')
  async getCorrectOption(@Param('questionId') questionId: string) {
    const option = await this.questionOptionsService.getCorrectOption(questionId);
    if (!option) {
      return { message: 'No correct option found for this question' };
    }
    return option;
  }

  @Put(':optionId')
  async update(
    @Param('optionId') optionId: string,
    @Body() updateDto: UpdateQuestionOptionDto,
  ) {
    return this.questionOptionsService.update(optionId, updateDto);
  }

  @Delete(':optionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('optionId') optionId: string) {
    await this.questionOptionsService.remove(optionId);
  }

  @Delete('by-question/:questionId')
  @HttpCode(HttpStatus.OK)
  async removeByQuestionId(@Param('questionId') questionId: string) {
    return this.questionOptionsService.removeByQuestionId(questionId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() body: { optionIds: string[] }) {
    return this.questionOptionsService.bulkDelete(body.optionIds);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorderOptions(
    @Body() body: {
      questionId: string;
      optionOrders: { optionId: string; displayOrder: number }[];
    },
  ) {
    await this.questionOptionsService.reorderOptions(body.questionId, body.optionOrders);
    return { message: 'Options reordered successfully' };
  }

  @Get('validate/:questionId')
  async validateMcqOptions(@Param('questionId') questionId: string) {
    return this.questionOptionsService.validateMcqOptions(questionId);
  }
}
