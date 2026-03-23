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
import { StudentResponsesService } from './student-responses.service';
import { CreateStudentResponseDto } from './dto/create-student-response.dto';
import { UpdateStudentResponseDto } from './dto/update-student-response.dto';

@Controller('api/student-responses')
export class StudentResponsesController {
  constructor(private readonly studentResponsesService: StudentResponsesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateStudentResponseDto) {
    return this.studentResponsesService.create(createDto);
  }

  @Post('create-or-update')
  @HttpCode(HttpStatus.OK)
  async createOrUpdate(@Body() createDto: CreateStudentResponseDto) {
    return this.studentResponsesService.createOrUpdate(createDto);
  }

  @Get()
  async findAll(
    @Query('attemptId') attemptId?: string,
    @Query('questionId') questionId?: string,
    @Query('isEvaluated') isEvaluated?: string,
  ) {
    return this.studentResponsesService.findAll({
      attemptId,
      questionId,
      isEvaluated: isEvaluated === 'true' ? true : isEvaluated === 'false' ? false : undefined,
    });
  }

  @Get(':responseId')
  async findOne(@Param('responseId') responseId: string) {
    return this.studentResponsesService.findOne(responseId);
  }

  @Get('by-attempt/:attemptId')
  async findByAttemptId(@Param('attemptId') attemptId: string) {
    return this.studentResponsesService.findByAttemptId(attemptId);
  }

  @Get('by-question/:questionId')
  async findByQuestionId(@Param('questionId') questionId: string) {
    return this.studentResponsesService.findByQuestionId(questionId);
  }

  @Put(':responseId')
  async update(
    @Param('responseId') responseId: string,
    @Body() updateDto: UpdateStudentResponseDto,
  ) {
    return this.studentResponsesService.update(responseId, updateDto);
  }

  @Post(':responseId/evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateResponse(
    @Param('responseId') responseId: string,
    @Body() body: { marksAwarded: number; evaluatedBy: string; feedback?: string },
  ) {
    return this.studentResponsesService.evaluateResponse(
      responseId,
      body.marksAwarded,
      body.evaluatedBy,
      body.feedback,
    );
  }

  @Post('bulk-evaluate')
  @HttpCode(HttpStatus.OK)
  async bulkEvaluate(
    @Body() body: {
      attemptId: string;
      evaluations: {
        responseId: string;
        marksAwarded: number;
        evaluatedBy: string;
        feedback?: string;
      }[];
    },
  ) {
    return this.studentResponsesService.bulkEvaluate(body.attemptId, body.evaluations);
  }

  @Delete(':responseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('responseId') responseId: string) {
    await this.studentResponsesService.remove(responseId);
  }

  @Delete('by-attempt/:attemptId')
  @HttpCode(HttpStatus.OK)
  async removeByAttemptId(@Param('attemptId') attemptId: string) {
    return this.studentResponsesService.removeByAttemptId(attemptId);
  }

  @Get('statistics/:attemptId')
  async getResponseStatistics(@Param('attemptId') attemptId: string) {
    return this.studentResponsesService.getResponseStatistics(attemptId);
  }
}
