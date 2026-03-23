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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('api/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('status') status?: string,
  ) {
    return this.sectionsService.findAll({ classId, status });
  }

  @Get('dropdown')
  getForDropdown(@Query('classId') classId?: string) {
    return this.sectionsService.getForDropdown(classId);
  }

  @Get('by-class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.sectionsService.findByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Get(':id/classes')
  getSectionClasses(@Param('id') id: string) {
    return this.sectionsService.getSectionClasses(id);
  }

  @Post()
  create(@Body() createDto: CreateSectionDto) {
    return this.sectionsService.create(createDto);
  }

  @Post(':id/classes')
  addClassToSection(
    @Param('id') sectionId: string,
    @Body() body: { classId: string },
  ) {
    return this.sectionsService.addClassToSection(sectionId, body.classId);
  }

  @Delete(':id/classes/:classId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeClassFromSection(
    @Param('id') sectionId: string,
    @Param('classId') classId: string,
  ) {
    return this.sectionsService.removeClassFromSection(sectionId, classId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body() body: { sectionIds: string[] }) {
    if (!body || !body.sectionIds || !Array.isArray(body.sectionIds)) {
      throw new Error('sectionIds array is required');
    }
    return this.sectionsService.bulkDelete(body.sectionIds);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSectionDto) {
    return this.sectionsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }
}
