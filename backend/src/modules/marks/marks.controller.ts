import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MarksService } from './marks.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';

@Controller('api/marks')
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('examId') examId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: string,
  ) {
    return this.marksService.findAll({ studentId, examId, subjectId, status });
  }

  @Get('by-student/:studentId')
  getByStudent(@Param('studentId') studentId: string) {
    return this.marksService.getByStudent(studentId);
  }

  @Get('by-exam/:examId')
  getByExam(@Param('examId') examId: string) {
    return this.marksService.getByExam(examId);
  }

  @Get('by-student-exam')
  getByStudentAndExam(
    @Query('studentId') studentId: string,
    @Query('examId') examId: string,
  ) {
    return this.marksService.getByStudentAndExam(studentId, examId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marksService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateMarkDto) {
    return this.marksService.create(createDto);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { markIds: string[] }) {
    if (!body || !body.markIds || !Array.isArray(body.markIds)) {
      throw new Error('markIds array is required');
    }
    return this.marksService.bulkDelete(body.markIds);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMarkDto) {
    return this.marksService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.marksService.remove(id);
  }
}
