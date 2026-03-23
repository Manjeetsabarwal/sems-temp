import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

@Controller('api/teacher-assignments')
export class TeacherAssignmentsController {
  constructor(private readonly assignmentsService: TeacherAssignmentsService) {}

  @Get()
  async findAll(
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('status') status?: string,
  ) {
    return this.assignmentsService.findAll({
      teacherId,
      classId,
      sectionId,
      subjectId,
      academicYear,
      status,
    });
  }

  @Get('teacher/:classId/:sectionId/:subjectId')
  async getTeacherForClassSectionSubject(
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @Param('subjectId') subjectId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.assignmentsService.getTeacherForClassSectionSubject(
      classId,
      sectionId,
      subjectId,
      academicYear,
    );
  }

  @Get('subjects/:classId/:sectionId')
  async getSubjectsForClassSection(
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.assignmentsService.getSubjectsForClassSection(classId, sectionId, academicYear);
  }

  @Get('by-teacher/:teacherId')
  async getAssignmentsForTeacher(
    @Param('teacherId') teacherId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.assignmentsService.getAssignmentsForTeacher(teacherId, academicYear);
  }

  @Get('by-subject/:subjectId')
  async getTeachersForSubject(@Param('subjectId') subjectId: string) {
    return this.assignmentsService.getTeachersForSubject(subjectId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateTeacherAssignmentDto) {
    return this.assignmentsService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTeacherAssignmentDto,
  ) {
    return this.assignmentsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.assignmentsService.remove(id);
    return { message: 'Assignment deleted successfully' };
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() body: { ids: number[] }) {
    await this.assignmentsService.bulkDelete(body.ids);
    return { message: 'Assignments deleted successfully' };
  }
}
