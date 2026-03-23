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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    try {
      return await this.studentsService.findAll({ classId, sectionId, status, search });
    } catch (error: any) {
      console.error('Error in findAll students:', error);
      throw error;
    }
  }

  @Get('by-class-section')
  getByClassAndSection(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
  ) {
    return this.studentsService.getByClassAndSection(classId, sectionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateStudentDto) {
    try {
      return await this.studentsService.create(createDto);
    } catch (error: any) {
      console.error('Error in create student controller:', error);
      throw error;
    }
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { studentIds: string[] }) {
    if (!body || !body.studentIds || !Array.isArray(body.studentIds)) {
      throw new Error('studentIds array is required');
    }
    return this.studentsService.bulkDelete(body.studentIds);
  }

  @Patch(':id/rename')
  rename(@Param('id') id: string, @Body() body: { newId: string }) {
    if (!body || !body.newId) {
      throw new Error('newId is required');
    }
    return this.studentsService.rename(id, body.newId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
