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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('api/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.classesService.findAll({ status, search });
  }

  @Get('dropdown')
  getForDropdown() {
    return this.classesService.getForDropdown();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/sections')
  getClassSections(@Param('id') id: string) {
    return this.classesService.getClassSections(id);
  }

  @Post()
  create(@Body() createDto: CreateClassDto) {
    return this.classesService.create(createDto);
  }

  @Post(':id/sections')
  addSectionToClass(
    @Param('id') classId: string,
    @Body() body: { sectionId: string },
  ) {
    return this.classesService.addSectionToClass(classId, body.sectionId);
  }

  @Delete(':id/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSectionFromClass(
    @Param('id') classId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.classesService.removeSectionFromClass(classId, sectionId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { classIds: string[] }) {
    if (!body || !body.classIds || !Array.isArray(body.classIds)) {
      throw new Error('classIds array is required');
    }
    return this.classesService.bulkDelete(body.classIds);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateClassDto) {
    return this.classesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
