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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';

@Controller('api/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.subjectsService.findAll({ classId, teacherId, status, search });
  }

  @Get('dropdown')
  getForDropdown(@Query('classId') classId?: string) {
    return this.subjectsService.getForDropdown(classId);
  }

  @Get('by-class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.subjectsService.findByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Get(':id/teachers')
  getSubjectTeachers(@Param('id') id: string) {
    return this.subjectsService.getSubjectTeachers(id);
  }

  @Post()
  create(@Body() createDto: CreateSubjectDto) {
    return this.subjectsService.create(createDto);
  }

  @Post(':id/teachers')
  addTeacherToSubject(
    @Param('id') subjectId: string,
    @Body() body: { teacherId: string; isPrimary?: boolean },
  ) {
    const dto: CreateSubjectTeacherDto = {
      subjectId,
      teacherId: body.teacherId,
      isPrimary: body.isPrimary,
    };
    return this.subjectsService.addTeacherToSubject(dto);
  }

  @Delete(':id/teachers/:teacherId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTeacherFromSubject(
    @Param('id') subjectId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.subjectsService.removeTeacherFromSubject(subjectId, teacherId);
  }

  @Patch(':id/teachers/:teacherId/primary')
  setPrimaryTeacher(
    @Param('id') subjectId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.subjectsService.setPrimaryTeacher(subjectId, teacherId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { subjectIds: string[] }) {
    if (!body || !body.subjectIds || !Array.isArray(body.subjectIds)) {
      throw new Error('subjectIds array is required');
    }
    return this.subjectsService.bulkDelete(body.subjectIds);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
