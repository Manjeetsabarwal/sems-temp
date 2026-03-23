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
import { StudentHabitsService } from './student-habits.service';
import { CreateStudentHabitDto } from './dto/create-student-habit.dto';
import { UpdateStudentHabitDto } from './dto/update-student-habit.dto';

@Controller('api/student-habits')
export class StudentHabitsController {
  constructor(private readonly habitsService: StudentHabitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateStudentHabitDto) {
    return this.habitsService.create(createDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() createDtos: CreateStudentHabitDto[]) {
    return this.habitsService.bulkCreate(createDtos);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('habitName') habitName?: string,
  ) {
    return this.habitsService.findAll({ studentId, academicYear, habitName });
  }

  @Get('student/:studentId/year/:academicYear')
  findByStudentAndYear(
    @Param('studentId') studentId: string,
    @Param('academicYear') academicYear: string,
  ) {
    return this.habitsService.findByStudentAndYear(studentId, academicYear);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.habitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentHabitDto) {
    return this.habitsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.habitsService.remove(id);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  bulkDelete(@Body() body: { habitIds: string[] }) {
    return this.habitsService.bulkDelete(body.habitIds);
  }
}
