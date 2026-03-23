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
import { StudentAttemptsService } from './student-attempts.service';
import { CreateStudentAttemptDto } from './dto/create-student-attempt.dto';
import { UpdateStudentAttemptDto } from './dto/update-student-attempt.dto';

@Controller('api/student-attempts')
export class StudentAttemptsController {
  constructor(private readonly studentAttemptsService: StudentAttemptsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateStudentAttemptDto) {
    return this.studentAttemptsService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('studentId') studentId?: string,
    @Query('paperId') paperId?: string,
    @Query('status') status?: string,
  ) {
    return this.studentAttemptsService.findAll({
      studentId,
      paperId,
      status,
    });
  }

  @Get(':attemptId')
  async findOne(@Param('attemptId') attemptId: string) {
    return this.studentAttemptsService.findOne(attemptId);
  }

  @Get('by-student/:studentId/paper/:paperId')
  async findByStudentAndPaper(
    @Param('studentId') studentId: string,
    @Param('paperId') paperId: string,
  ) {
    return this.studentAttemptsService.findByStudentAndPaper(studentId, paperId);
  }

  @Get('active/:studentId/:paperId')
  async getActiveAttempt(
    @Param('studentId') studentId: string,
    @Param('paperId') paperId: string,
  ) {
    const attempt = await this.studentAttemptsService.getActiveAttempt(studentId, paperId);
    if (!attempt) {
      return { message: 'No active attempt found' };
    }
    return attempt;
  }

  @Put(':attemptId')
  async update(
    @Param('attemptId') attemptId: string,
    @Body() updateDto: UpdateStudentAttemptDto,
  ) {
    return this.studentAttemptsService.update(attemptId, updateDto);
  }

  @Post(':attemptId/submit')
  @HttpCode(HttpStatus.OK)
  async submitAttempt(@Param('attemptId') attemptId: string) {
    return this.studentAttemptsService.submitAttempt(attemptId);
  }

  @Post(':attemptId/abandon')
  @HttpCode(HttpStatus.OK)
  async abandonAttempt(@Param('attemptId') attemptId: string) {
    return this.studentAttemptsService.abandonAttempt(attemptId);
  }

  @Put(':attemptId/time')
  @HttpCode(HttpStatus.OK)
  async updateTimeSpent(
    @Param('attemptId') attemptId: string,
    @Body() body: { minutes: number },
  ) {
    return this.studentAttemptsService.updateTimeSpent(attemptId, body.minutes);
  }

  @Delete(':attemptId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('attemptId') attemptId: string) {
    await this.studentAttemptsService.remove(attemptId);
  }

  @Get('statistics/:paperId')
  async getAttemptStatistics(@Param('paperId') paperId: string) {
    return this.studentAttemptsService.getAttemptStatistics(paperId);
  }
}
