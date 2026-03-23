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
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@Controller('api/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async findAll(
    @Query('studentId') studentId?: string,
    @Query('examId') examId?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
  ) {
    return this.resultsService.findAll({ studentId, examId, classId, status });
  }

  @Get('by-student/:studentId')
  async getByStudent(@Param('studentId') studentId: string) {
    return this.resultsService.getByStudent(studentId);
  }

  @Get('by-exam/:examId')
  async getByExam(@Param('examId') examId: string) {
    return this.resultsService.getByExam(examId);
  }

  @Get('report-cards')
  async getReportCardsList(
    @Query('examId') examId?: string,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.resultsService.getReportCardsList({ examId, classId, studentId });
  }

  @Get('report-card/:studentId/:examId')
  async getReportCard(
    @Param('studentId') studentId: string,
    @Param('examId') examId: string,
    @Query('version') version?: 'v1' | 'v2',
    @Query('unitTestMethod') unitTestMethod?: 'average' | 'highest',
  ) {
    return this.resultsService.getReportCard(
      studentId,
      examId,
      version || 'v1',
      unitTestMethod || 'average',
    );
  }

  @Get(':resultId')
  async findOne(@Param('resultId') resultId: string) {
    return this.resultsService.findOne(resultId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateResultDto) {
    return this.resultsService.create(createDto);
  }

  @Post('calculate/:studentId/:examId')
  async calculateFromMarks(
    @Param('studentId') studentId: string,
    @Param('examId') examId: string,
    @Body('classId') classId: string,
    @Body('useVersion2') useVersion2?: boolean,
    @Body('unitTestMethod') unitTestMethod?: 'average' | 'highest',
  ) {
    return this.resultsService.calculateFromMarks(
      studentId,
      examId,
      classId,
      useVersion2 || false,
      unitTestMethod || 'average',
    );
  }

  @Post('calculate-ranks/:examId')
  async calculateRanks(@Param('examId') examId: string) {
    return this.resultsService.calculateRanks(examId);
  }

  @Put(':resultId')
  async update(
    @Param('resultId') resultId: string,
    @Body() updateDto: UpdateResultDto,
  ) {
    return this.resultsService.update(resultId, updateDto);
  }

  @Put(':resultId/publish')
  async publish(
    @Param('resultId') resultId: string,
    @Body() body?: { sendEmail?: boolean },
  ) {
    return this.resultsService.publish(resultId, body?.sendEmail !== false); // Default to true
  }

  @Put(':resultId/send-notification')
  async sendNotification(@Param('resultId') resultId: string) {
    return this.resultsService.sendNotification(resultId);
  }

  @Put(':resultId/unpublish')
  async unpublish(@Param('resultId') resultId: string) {
    return this.resultsService.unpublish(resultId);
  }

  @Delete('bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDelete(@Body() body: { resultIds: string[] }) {
    await this.resultsService.bulkDelete(body.resultIds);
  }

  @Delete(':resultId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('resultId') resultId: string) {
    await this.resultsService.remove(resultId);
  }
}
