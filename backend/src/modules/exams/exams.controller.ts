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
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('api/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('examType') examType?: string,
    @Query('status') status?: string,
    @Query('academicYear') academicYear?: string,
    @Query('search') search?: string,
  ) {
    return this.examsService.findAll({ classId, examType, status, academicYear, search });
  }

  @Get('dropdown')
  getForDropdown() {
    return this.examsService.getForDropdown();
  }

  @Get('by-class/:classId')
  getByClass(@Param('classId') classId: string) {
    return this.examsService.getByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateExamDto) {
    return this.examsService.create(createDto);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { examIds: string[] }) {
    if (!body || !body.examIds || !Array.isArray(body.examIds)) {
      throw new Error('examIds array is required');
    }
    return this.examsService.bulkDelete(body.examIds);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateExamDto) {
    return this.examsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
