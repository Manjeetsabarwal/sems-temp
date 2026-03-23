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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('api/teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.teachersService.findAll({ status, search });
  }

  @Get('dropdown')
  getForDropdown() {
    return this.teachersService.getForDropdown();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateTeacherDto) {
    return this.teachersService.create(createDto);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { teacherIds: string[] }) {
    if (!body || !body.teacherIds || !Array.isArray(body.teacherIds)) {
      throw new Error('teacherIds array is required');
    }
    return this.teachersService.bulkDelete(body.teacherIds);
  }

  @Patch(':id/rename')
  rename(@Param('id') id: string, @Body() body: { newId: string }) {
    if (!body || !body.newId) {
      throw new Error('newId is required');
    }
    return this.teachersService.rename(id, body.newId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
